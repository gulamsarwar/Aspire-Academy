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

  const [r2Status, setR2Status] = useState<{
    isConfigured: boolean;
    missing: string[];
    bucketName: string | null;
  } | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(currentValue);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [uploadSuccessKey, setUploadSuccessKey] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    async function checkStatus() {
      try {
        const res = await fetch('/api/r2/status');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setR2Status(data);
          }
        }
      } catch (err) {
        console.warn('Could not check R2 status:', err);
      } finally {
        if (isMounted) setCheckingStatus(false);
      }
    }
    checkStatus();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage('');
    setUploadSuccessKey('');

    // Validation
    if (type === 'thumbnail') {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type.toLowerCase())) {
        setErrorMessage('Invalid image format. Supported formats: JPG, PNG, WebP.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage('Thumbnail file size must be less than 10MB.');
        return;
      }
      setSelectedFile(file);
      const objUrl = URL.createObjectURL(file);
      setPreviewUrl(objUrl);
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

    if (!r2Status?.isConfigured) {
      setErrorMessage(
        `Cloudflare R2 is not configured. Missing: ${r2Status?.missing?.join(', ') || 'environment credentials'}.`
      );
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setErrorMessage('');

    try {
      // 1. Request presigned upload URL from backend
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

      // 2. Upload file directly to R2 using XMLHttpRequest for real-time progress
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
      onSuccess({
        key,
        url: playbackOrStreamUrl,
      });
    } catch (err: any) {
      console.error('Upload failed:', err);
      setErrorMessage(err?.message || 'Failed to upload media to Cloudflare R2.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={`space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {type === 'thumbnail' ? (
            <ImageIcon className="w-4 h-4 text-[#046BD2]" />
          ) : (
            <FileVideo className="w-4 h-4 text-[#046BD2]" />
          )}
          <span className="text-xs font-bold text-slate-800">
            {type === 'thumbnail' ? 'Upload Course Thumbnail (JPG, PNG, WebP)' : 'Upload Video to Cloudflare R2'}
          </span>
        </div>

        {checkingStatus ? (
          <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
            <Loader2 className="w-3 h-3 animate-spin" /> Checking R2
          </span>
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

      {/* R2 Not Configured Notice */}
      {!checkingStatus && !r2Status?.isConfigured && (
        <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Cloudflare R2 Storage Not Configured</span>
          </div>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            Missing environment credentials:{' '}
            <code className="font-mono font-bold bg-amber-100/80 px-1 py-0.5 rounded text-[10px]">
              {r2Status?.missing?.join(', ')}
            </code>
            . Direct file upload is disabled until R2 keys are added to environment settings.
          </p>
        </div>
      )}

      {/* File Selector & Action */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={type === 'thumbnail' ? 'image/jpeg,image/png,image/webp' : 'video/mp4,video/webm,video/quicktime'}
          disabled={!r2Status?.isConfigured || isUploading}
          onChange={handleFileChange}
          className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#046BD2] file:text-white hover:file:bg-[#0352A0] file:cursor-pointer disabled:opacity-50 text-slate-600 cursor-pointer"
        />

        {selectedFile && (
          <button
            type="button"
            disabled={!r2Status?.isConfigured || isUploading}
            onClick={handleStartUpload}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition flex items-center justify-center gap-1.5 shadow-sm"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Uploading {uploadProgress}%</span>
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                <span>Upload to R2</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Selected file preview */}
      {selectedFile && (
        <div className="flex items-center justify-between text-xs text-slate-600 bg-white p-2 rounded-xl border border-slate-200">
          <span className="font-mono text-[11px] truncate max-w-xs">{selectedFile.name}</span>
          <span className="text-[10px] text-slate-400 font-semibold">
            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
          </span>
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
            <span>Uploading to Cloudflare R2...</span>
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
            Successfully uploaded to R2: <strong className="font-mono">{uploadSuccessKey}</strong>
          </span>
        </div>
      )}

      {/* Image Thumbnail Live Preview */}
      {type === 'thumbnail' && previewUrl && (
        <div className="space-y-1 pt-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Image Preview:
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
