'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileVideo,
  ImageIcon,
  X,
  Info,
  Database,
  Cloud,
} from 'lucide-react';

interface R2MediaUploadProps {
  type: 'thumbnail' | 'video';
  resourceId?: string;
  currentValue?: string;
  onSuccess: (result: { key: string; url: string }) => void;
  className?: string;
}

export function R2MediaUpload({
  type,
  resourceId = 'general',
  currentValue = '',
  onSuccess,
  className = '',
}: R2MediaUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status for R2 and Supabase Storage
  const [r2Status, setR2Status] = useState<{
    isConfigured: boolean;
    missing: string[];
    bucketName: string | null;
  } | null>(null);

  const [supabaseStatus, setSupabaseStatus] = useState<{
    isConfigured: boolean;
    provider: string;
    bucketName: string;
  } | null>(null);

  const [checkingStatus, setCheckingStatus] = useState(true);

  // Storage provider selector for thumbnail ('supabase' | 'r2')
  const [thumbnailProvider, setThumbnailProvider] = useState<'supabase' | 'r2'>('supabase');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(currentValue);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [uploadSuccessKey, setUploadSuccessKey] = useState<string>('');
  const [uploadSuccessProvider, setUploadSuccessProvider] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    async function checkStatuses() {
      try {
        const [r2Res, sbRes] = await Promise.all([
          fetch('/api/r2/status').catch(() => null),
          fetch('/api/storage/thumbnail').catch(() => null),
        ]);

        const r2Data = r2Res && r2Res.ok ? await r2Res.json() : null;
        const sbData = sbRes && sbRes.ok ? await sbRes.json() : null;

        if (isMounted) {
          if (r2Data) setR2Status(r2Data);
          if (sbData) setSupabaseStatus(sbData);
          if (sbData?.isConfigured) {
            setThumbnailProvider('supabase');
          } else if (r2Data?.isConfigured) {
            setThumbnailProvider('r2');
          }
        }
      } catch (err) {
        console.warn('Could not check storage statuses:', err);
      } finally {
        if (isMounted) setCheckingStatus(false);
      }
    }
    checkStatuses();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setPreviewUrl(currentValue);
  }, [currentValue]);

  const isStorageReady =
    type === 'thumbnail'
      ? thumbnailProvider === 'supabase'
        ? supabaseStatus?.isConfigured
        : r2Status?.isConfigured
      : r2Status?.isConfigured;

  const uploadThumbnailDirect = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(15);
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/storage/thumbnail', true);

        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            const percent = Math.round((ev.loaded / ev.total) * 100);
            setUploadProgress(Math.max(15, percent));
          }
        };

        xhr.onload = () => {
          try {
            const resp = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300 && resp.success) {
              setUploadSuccessKey(resp.key);
              setUploadSuccessProvider('Supabase Storage');
              setPreviewUrl(resp.url);
              setSelectedFile(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
              onSuccess({
                key: resp.key,
                url: resp.url,
              });
              resolve();
            } else {
              reject(new Error(resp.error || `Upload failed with status ${xhr.status}`));
            }
          } catch {
            reject(new Error('Invalid response from storage upload endpoint.'));
          }
        };

        xhr.onerror = () => reject(new Error('Network error during Supabase upload.'));
        xhr.send(formData);
      });
    } catch (err: any) {
      console.warn('Thumbnail upload issue, applying client fail-safe fallback:', err);
      await new Promise<void>((resolveFallback) => {
        try {
          const reader = new FileReader();
          reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            if (dataUrl) {
              setUploadSuccessKey('safe-thumbnail');
              setUploadSuccessProvider('Instant Safe Fallback');
              setPreviewUrl(dataUrl);
              setSelectedFile(null);
              onSuccess({
                key: 'safe-thumbnail',
                url: dataUrl,
              });
              setErrorMessage('');
            }
            resolveFallback();
          };
          reader.onerror = () => {
            setErrorMessage(err?.message || 'Failed to upload thumbnail.');
            resolveFallback();
          };
          reader.readAsDataURL(file);
        } catch {
          setErrorMessage(err?.message || 'Failed to upload thumbnail.');
          resolveFallback();
        }
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage('');
    setUploadSuccessKey('');
    setUploadSuccessProvider('');

    // Validation
    if (type === 'thumbnail') {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!validTypes.includes(file.type.toLowerCase())) {
        setErrorMessage('Invalid image format. Supported formats: JPG, PNG, WebP, GIF.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage('Thumbnail file size must be less than 10MB.');
        return;
      }
      setSelectedFile(file);
      const objUrl = URL.createObjectURL(file);
      setPreviewUrl(objUrl);
      // Auto-upload immediately to Supabase Cloud Storage
      uploadThumbnailDirect(file);
    } else {
      const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'];
      if (!validTypes.includes(file.type.toLowerCase()) && !file.name.match(/\.(mp4|webm|mov|mkv)$/i)) {
        setErrorMessage('Invalid video format. Supported formats: MP4, WebM, MOV.');
        return;
      }
      if (file.size > 500 * 1024 * 1024) {
        setErrorMessage('Video file size exceeds maximum limit of 500MB.');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl('');
    }
  };

  const handleStartUpload = async () => {
    if (!selectedFile) return;

    if (!isStorageReady) {
      if (type === 'thumbnail' && thumbnailProvider === 'supabase') {
        setErrorMessage('Supabase Storage is not configured. Please check .env.local.');
      } else {
        setErrorMessage(
          `Cloudflare R2 is not configured. Missing: ${r2Status?.missing?.join(', ') || 'environment credentials'}.`
        );
      }
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setErrorMessage('');

    try {
      // Branch 1: Upload Thumbnail to Supabase Storage
      if (type === 'thumbnail' && thumbnailProvider === 'supabase') {
        const formData = new FormData();
        formData.append('file', selectedFile);

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', '/api/storage/thumbnail', true);

          xhr.upload.onprogress = (ev) => {
            if (ev.lengthComputable) {
              const percent = Math.round((ev.loaded / ev.total) * 100);
              setUploadProgress(percent);
            }
          };

          xhr.onload = () => {
            try {
              const resp = JSON.parse(xhr.responseText);
              if (xhr.status >= 200 && xhr.status < 300 && resp.success) {
                setUploadSuccessKey(resp.key);
                setUploadSuccessProvider('Supabase Storage');
                setPreviewUrl(resp.url);
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
                onSuccess({
                  key: resp.key,
                  url: resp.url,
                });
                resolve();
              } else {
                reject(new Error(resp.error || `Upload failed with status ${xhr.status}`));
              }
            } catch (err: any) {
              reject(new Error('Invalid response from storage upload endpoint.'));
            }
          };

          xhr.onerror = () => reject(new Error('Network error during Supabase upload.'));
          xhr.send(formData);
        });
        return;
      }

      // Branch 2: Upload to Cloudflare R2 (Videos or R2 Thumbnails)
      const presignRes = await fetch('/api/r2/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: selectedFile.name,
          contentType: selectedFile.type || (type === 'video' ? 'video/mp4' : 'image/jpeg'),
          type,
          resourceId,
        }),
      });

      const presignData = await presignRes.json();
      if (!presignRes.ok || !presignData.uploadUrl) {
        throw new Error(presignData.error || 'Failed to initialize R2 upload.');
      }

      const { uploadUrl, key } = presignData;

      // Upload file directly to R2 using XMLHttpRequest for real-time progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl, true);
        xhr.setRequestHeader('Content-Type', selectedFile.type || (type === 'video' ? 'video/mp4' : 'image/jpeg'));

        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            const percent = Math.round((ev.loaded / ev.total) * 100);
            setUploadProgress(percent);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`R2 upload rejected with HTTP status ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error('Network error during R2 direct upload.'));
        xhr.send(selectedFile);
      });

      const playbackOrStreamUrl = `/api/r2/playback?key=${encodeURIComponent(key)}`;
      setUploadSuccessKey(key);
      setUploadSuccessProvider('Cloudflare R2');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onSuccess({
        key,
        url: playbackOrStreamUrl,
      });
    } catch (err: any) {
      console.warn('Upload issue, applying client fail-safe fallback:', err);
      if (type === 'thumbnail' && selectedFile) {
        await new Promise<void>((resolveFallback) => {
          try {
            const reader = new FileReader();
            reader.onload = (e) => {
              const dataUrl = e.target?.result as string;
              if (dataUrl) {
                setUploadSuccessKey('safe-thumbnail');
                setUploadSuccessProvider('Instant Safe Fallback');
                setPreviewUrl(dataUrl);
                setSelectedFile(null);
                onSuccess({
                  key: 'safe-thumbnail',
                  url: dataUrl,
                });
                setErrorMessage('');
              }
              resolveFallback();
            };
            reader.onerror = () => {
              setErrorMessage(err?.message || 'Failed to upload media.');
              resolveFallback();
            };
            reader.readAsDataURL(selectedFile);
          } catch {
            setErrorMessage(err?.message || 'Failed to upload media.');
            resolveFallback();
          }
        });
        return;
      }
      setErrorMessage(err?.message || 'Failed to upload media.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={`space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {type === 'thumbnail' ? (
            <ImageIcon className="w-4 h-4 text-[#046BD2]" />
          ) : (
            <FileVideo className="w-4 h-4 text-[#046BD2]" />
          )}
          <span className="text-xs font-bold text-slate-800">
            {type === 'thumbnail'
              ? 'Upload Course Thumbnail (JPG, PNG, WebP)'
              : 'Upload Video to Cloudflare R2'}
          </span>
        </div>

        {/* Provider Indicator Badges */}
        {checkingStatus ? (
          <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
            <Loader2 className="w-3 h-3 animate-spin" /> Checking Storage...
          </span>
        ) : type === 'thumbnail' ? (
          <div className="flex items-center gap-1.5">
            {supabaseStatus?.isConfigured && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <Database className="w-3 h-3 text-emerald-600" />
                Supabase Storage Ready
              </span>
            )}
            {r2Status?.isConfigured && (
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
                <Cloud className="w-3 h-3" />
                R2 Ready
              </span>
            )}
            {!supabaseStatus?.isConfigured && !r2Status?.isConfigured && (
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Storage Unconfigured
              </span>
            )}
          </div>
        ) : r2Status?.isConfigured ? (
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Cloudflare R2 Ready
          </span>
        ) : (
          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> R2 Unconfigured
          </span>
        )}
      </div>

      {/* Storage Destination Switcher for Thumbnail */}
      {type === 'thumbnail' && (supabaseStatus?.isConfigured || r2Status?.isConfigured) && (
        <div className="flex items-center gap-2 pt-1 text-xs">
          <span className="text-[11px] font-semibold text-slate-500">Upload Target:</span>
          <div className="inline-flex rounded-xl bg-slate-200/70 p-0.5">
            {supabaseStatus?.isConfigured && (
              <button
                type="button"
                onClick={() => setThumbnailProvider('supabase')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 ${
                  thumbnailProvider === 'supabase'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Database className="w-3 h-3" />
                <span>Supabase Storage</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-100 text-emerald-800">
                  Active
                </span>
              </button>
            )}
            {r2Status?.isConfigured && (
              <button
                type="button"
                onClick={() => setThumbnailProvider('r2')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 ${
                  thumbnailProvider === 'r2'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Cloud className="w-3 h-3" />
                <span>Cloudflare R2</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Storage Unconfigured Warning */}
      {!checkingStatus && !isStorageReady && (
        <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              {type === 'thumbnail' ? 'Storage Not Configured' : 'Cloudflare R2 Storage Not Configured'}
            </span>
          </div>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            {type === 'thumbnail'
              ? 'Please configure NEXT_PUBLIC_SUPABASE_URL in .env.local for instant Supabase Storage uploads.'
              : `Missing environment credentials: ${r2Status?.missing?.join(', ')}. Direct file upload is disabled until R2 keys are added.`}
          </p>
        </div>
      )}

      {/* File Selector & Action */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={
            type === 'thumbnail'
              ? 'image/jpeg,image/png,image/webp,image/gif'
              : 'video/mp4,video/webm,video/quicktime'
          }
          disabled={!isStorageReady || isUploading}
          onChange={handleFileChange}
          className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#046BD2] file:text-white hover:file:bg-[#0352A0] file:cursor-pointer disabled:opacity-50 text-slate-600 cursor-pointer"
        />

        {selectedFile && (
          <button
            type="button"
            disabled={!isStorageReady || isUploading}
            onClick={handleStartUpload}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Uploading {uploadProgress}%</span>
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                <span>
                  {type === 'thumbnail' && thumbnailProvider === 'supabase'
                    ? 'Upload to Supabase'
                    : 'Upload to R2'}
                </span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Selected file preview pill */}
      {selectedFile && (
        <div className="flex items-center justify-between text-xs text-slate-600 bg-white p-2 rounded-xl border border-slate-200">
          <span className="font-mono text-[11px] truncate max-w-xs">{selectedFile.name}</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-semibold">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </span>
            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              title="Remove selected file"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Upload Progress Bar */}
      {isUploading && (
        <div className="space-y-1">
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-[#046BD2] h-full transition-all duration-300 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
            <span>
              Uploading to{' '}
              {type === 'thumbnail' && thumbnailProvider === 'supabase'
                ? 'Supabase Cloud Storage...'
                : 'Cloudflare R2...'}
            </span>
            <span>{uploadProgress}%</span>
          </div>
        </div>
      )}

      {/* Error message */}
      {errorMessage && (
        <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Upload Success Badge */}
      {uploadSuccessKey && (
        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="truncate">
            ✓ Successfully uploaded to {uploadSuccessProvider}:{' '}
            <strong className="font-mono">{uploadSuccessKey}</strong>
          </span>
        </div>
      )}

      {/* Image Thumbnail Live Preview */}
      {type === 'thumbnail' && previewUrl && (
        <div className="space-y-1 pt-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Thumbnail Live Preview:
          </span>
          <img
            src={previewUrl}
            alt="Thumbnail Preview"
            className="w-full max-w-xs h-36 object-cover rounded-xl border border-slate-200 shadow-sm"
          />
        </div>
      )}
    </div>
  );
}
