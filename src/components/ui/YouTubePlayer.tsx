'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { extractYouTubeVideoId, getYouTubeInfo } from '@/lib/youtube';
import {
  Video,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Maximize2,
  Volume2,
  VolumeX,
  ShieldCheck,
  Sparkles,
  Lock,
} from 'lucide-react';

interface YouTubePlayerProps {
  videoIdOrUrl?: string;
  url?: string;
  title?: string;
  className?: string;
  autoPlay?: boolean;
  isLive?: boolean;
  onEnded?: () => void;
}

export function YouTubePlayer({
  videoIdOrUrl,
  url,
  title = 'Educational Video Lecture',
  className = '',
  autoPlay = false,
  isLive = false,
  onEnded,
}: YouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [securityWarning, setSecurityWarning] = useState<string>('');
  const { user } = useAuth();

  // Sync state from YouTube Iframe postMessage API
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data?.event === 'infoDelivery' && data?.info) {
          if (typeof data.info.currentTime === 'number') {
            setCurrentTime(data.info.currentTime);
          }
          if (typeof data.info.duration === 'number') {
            setDuration(data.info.duration);
          }
          if (typeof data.info.playerState === 'number') {
            setIsPlaying(data.info.playerState === 1);
          }
        }
      } catch {
        // ignore non-json messages
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Dynamic Floating Anti-Piracy Watermark coordinates (8 strategic points across the screen)
  const [watermarkPos, setWatermarkPos] = useState({ top: 22, left: 25 });
  const [isScreenCaptured, setIsScreenCaptured] = useState(false);

  useEffect(() => {
    const positions = [
      { top: 20, left: 25 },
      { top: 70, left: 70 },
      { top: 28, left: 65 },
      { top: 65, left: 25 },
      { top: 45, left: 50 },
      { top: 32, left: 78 },
      { top: 58, left: 35 },
      { top: 80, left: 50 },
    ];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % positions.length;
      setWatermarkPos(positions[idx]);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Format student anti-piracy identifier (Phone, Name, and Student ID)
  const studentWatermarkText = user
    ? `🔒 ASPIRE ACADEMY • ${user.full_name || 'STUDENT'} • ${
        user.phone ? `+91 ${user.phone.replace(/[^0-9]/g, '').slice(-10)}` : user.email || 'ENROLLED'
      } • ID: ${user.id ? user.id.slice(0, 8).toUpperCase() : 'VERIFIED'}`
    : 'ASPIRE ACADEMY • COPYRIGHT PROTECTED';

  const triggerSecurityAlert = (msg?: string) => {
    setSecurityWarning(
      msg || '⚠️ Video content is DRM protected. Screen recording, downloading, and unauthorized sharing are strictly prohibited.'
    );
    setTimeout(() => setSecurityWarning(''), 4000);
  };

  // Advanced Keyboard protection against DevTools, PrintScreen, Page Save & Inspect
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Devtools shortcuts & Inspect
      if (
        (e.ctrlKey && (e.key === 's' || e.key === 'u' || e.key === 'p' || e.key === 'S' || e.key === 'U' || e.key === 'P')) ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) ||
        e.key === 'F12'
      ) {
        e.preventDefault();
        triggerSecurityAlert('⚠️ Inspect and Page Saving are disabled to protect course content.');
        return;
      }

      // Screenshot hotkey detection (PrintScreen)
      if (e.key === 'PrintScreen') {
        setIsScreenCaptured(true);
        triggerSecurityAlert('⚠️ Screenshot detected! Screen capture of paid lectures is prohibited.');
        setTimeout(() => setIsScreenCaptured(false), 2500);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const rawInput = (videoIdOrUrl || url || '').trim();

  // Detect whether this is a YouTube video or a direct video URL (MP4, WebM, etc.)
  const youtubeId = extractYouTubeVideoId(rawInput);
  const isDirectVideo =
    !youtubeId &&
    (rawInput.endsWith('.mp4') ||
      rawInput.endsWith('.webm') ||
      rawInput.endsWith('.mov') ||
      rawInput.endsWith('.m3u8') ||
      rawInput.includes('.mp4?') ||
      rawInput.includes('/video/') ||
      rawInput.includes('/api/r2/playback') ||
      rawInput.includes('/api/storage/') ||
      rawInput.includes('blob:') ||
      rawInput.startsWith('blob:') ||
      rawInput.startsWith('data:video/'));

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, [rawInput]);

  // Handle Fullscreen on container
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // If no valid input
  if (!rawInput) {
    return (
      <div
        className={`aspect-video w-full rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center p-6 text-center text-slate-300 space-y-3 ${className}`}
      >
        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-amber-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-white">Video Lecture Not Assigned</h4>
          <p className="text-xs text-slate-400 max-w-sm">
            Admin has not linked a video to this lecture yet.
          </p>
        </div>
      </div>
    );
  }

  // Engine 1: Direct HTML5 Video Player (MP4, WebM, Cloud Storage)
  if (isDirectVideo) {
    const handlePlayPause = () => {
      if (!videoRef.current) return;
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    };

    const handleSeek = (secondsDelta: number) => {
      if (!videoRef.current) return;
      videoRef.current.currentTime = Math.max(
        0,
        Math.min(videoRef.current.duration, videoRef.current.currentTime + secondsDelta)
      );
    };

    const handleSpeedChange = (speed: number) => {
      if (!videoRef.current) return;
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
      setShowSpeedMenu(false);
    };

    return (
      <div
        ref={containerRef}
        onContextMenu={(e) => {
          e.preventDefault();
          triggerSecurityAlert();
        }}
        className={`relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 shadow-2xl border border-slate-800 group select-none ${className}`}
      >
        {/* Anti-Piracy Security Alert Toast */}
        {securityWarning && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-40 px-3.5 py-2 rounded-xl bg-red-600/90 text-white text-xs font-bold shadow-xl border border-red-400 backdrop-blur-sm animate-in fade-in flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{securityWarning}</span>
          </div>
        )}

        {/* Dynamic Floating Anti-Piracy Watermark */}
        <div
          style={{
            top: `${watermarkPos.top}%`,
            left: `${watermarkPos.left}%`,
            transform: 'translate(-50%, -50%)',
          }}
          className="absolute z-20 pointer-events-none select-none transition-all duration-1000 ease-in-out flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-[2px] border border-white/10 text-[10px] sm:text-xs font-mono font-bold text-white/60 tracking-wider shadow-sm"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
          <span>{studentWatermarkText}</span>
        </div>

        {/* Corner DRM Protection Seal */}
        <div className="absolute bottom-2 right-2 z-20 pointer-events-none select-none opacity-40 text-[9px] font-mono text-white/70">
          🔒 Aspire Academy DRM Protected
        </div>

        {/* Top Aspire Academy Header */}
        <div className="absolute top-0 left-0 right-0 z-30 h-12 bg-gradient-to-b from-slate-950/90 via-slate-950/50 to-transparent px-4 flex items-center justify-between text-white pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-600/30 border border-blue-400/30 text-[10px] font-bold text-blue-300">
              <ShieldCheck className="w-3 h-3 text-blue-400" />
              <span>Aspire Smart Player</span>
            </span>
            <span className="text-xs font-semibold text-slate-200 truncate max-w-xs sm:max-w-md">
              {title}
            </span>
          </div>
          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Protected Stream
          </span>
        </div>

        {/* Video Element */}
        <video
          ref={videoRef}
          src={rawInput}
          playsInline
          autoPlay={autoPlay}
          controlsList="nodownload noplaybackrate nofullscreen"
          disablePictureInPicture
          onContextMenu={(e) => {
            e.preventDefault();
            triggerSecurityAlert();
          }}
          onTimeUpdate={() => {
            if (videoRef.current) {
              setCurrentTime(videoRef.current.currentTime);
              setDuration(videoRef.current.duration || 0);
            }
          }}
          onEnded={() => {
            setIsPlaying(false);
            if (onEnded) onEnded();
          }}
          className="w-full h-full object-contain cursor-pointer select-none"
          onClick={handlePlayPause}
        />

        {/* Custom Overlay Controls */}
        <div className="absolute bottom-0 left-0 right-0 z-30 p-3 sm:p-4 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent space-y-2 opacity-95 group-hover:opacity-100 transition-opacity">
          {/* Progress Bar */}
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => {
                const targetTime = Number(e.target.value);
                if (videoRef.current) {
                  videoRef.current.currentTime = targetTime;
                  setCurrentTime(targetTime);
                }
              }}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#046BD2]"
            />
          </div>

          <div className="flex items-center justify-between text-white text-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePlayPause}
                className="w-8 h-8 rounded-full bg-white text-slate-950 flex items-center justify-center hover:scale-105 transition"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-slate-950" /> : <Play className="w-4 h-4 fill-slate-950 ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={() => handleSeek(-10)}
                className="p-1 text-slate-300 hover:text-white transition"
                title="Rewind 10 seconds"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => handleSeek(10)}
                className="p-1 text-slate-300 hover:text-white transition"
                title="Forward 10 seconds"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.muted = !isMuted;
                    setIsMuted(!isMuted);
                  }
                }}
                className="p-1 text-slate-300 hover:text-white transition"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <span className="text-[11px] font-mono text-slate-300">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Speed Controller */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                  className="px-2 py-1 rounded bg-slate-800 text-[11px] font-bold text-slate-200 hover:bg-slate-700 transition"
                >
                  {playbackSpeed}x
                </button>
                {showSpeedMenu && (
                  <div className="absolute bottom-full right-0 mb-2 bg-slate-900 border border-slate-700 rounded-xl p-1 shadow-xl flex flex-col gap-1 z-40">
                    {[0.75, 1, 1.25, 1.5, 2].map((sp) => (
                      <button
                        key={sp}
                        type="button"
                        onClick={() => handleSpeedChange(sp)}
                        className={`px-3 py-1 text-xs rounded-lg text-left ${
                          playbackSpeed === sp ? 'bg-[#046BD2] text-white font-bold' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {sp}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Fullscreen */}
              <button
                type="button"
                onClick={toggleFullscreen}
                className="p-1.5 text-slate-300 hover:text-white transition"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Engine 2: Dedicated In-App Sandboxed YouTube Player
  // Ensures playback stays 100% inside the website and NEVER leaves to YouTube
  const videoId = youtubeId || rawInput;
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=${
    autoPlay ? 1 : 0
  }&rel=0&modestbranding=1&playsinline=1&controls=1&fs=1&disablekb=0&iv_load_policy=3&enablejsapi=1${
    currentOrigin ? `&origin=${encodeURIComponent(currentOrigin)}` : ''
  }`;

  return (
    <div
      ref={containerRef}
      onContextMenu={(e) => {
        e.preventDefault();
        triggerSecurityAlert();
      }}
      className={`relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 shadow-2xl border border-slate-800 group select-none ${className}`}
    >
      {/* Screen Capture Detection Blackout Overlay */}
      {isScreenCaptured && (
        <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center text-center p-6 space-y-3">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center border border-rose-500/30">
            <Lock className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-white">DRM Content Protected</p>
          <p className="text-xs text-slate-400 max-w-sm">
            Screen capture and external recording of paid batch lectures are strictly prohibited by Aspire Academy.
          </p>
        </div>
      )}

      {/* Anti-Piracy Security Alert Toast */}
      {securityWarning && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-xl bg-red-600/95 text-white text-xs font-bold shadow-2xl border border-red-400 backdrop-blur-sm animate-in fade-in flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{securityWarning}</span>
        </div>
      )}

      {/* Dynamic Floating Anti-Piracy Watermark with Student Identity */}
      <div
        style={{
          top: `${watermarkPos.top}%`,
          left: `${watermarkPos.left}%`,
          transform: 'translate(-50%, -50%)',
        }}
        className="absolute z-20 pointer-events-none select-none transition-all duration-1000 ease-in-out flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur-[3px] border border-white/15 text-[10px] sm:text-xs font-mono font-bold text-white/75 tracking-wider shadow-lg"
      >
        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
        <span>{studentWatermarkText}</span>
      </div>

      {/* Corner DRM Protection Seal */}
      <div className="absolute bottom-2.5 right-32 z-20 pointer-events-none select-none opacity-50 text-[9px] font-mono text-white/70">
        🔒 Aspire Academy DRM Protected
      </div>

      {/* Top Protective Header: Generously covers the YouTube title bar & share icon (56px height) */}
      <div className="absolute top-0 left-0 right-0 z-30 h-14 bg-gradient-to-b from-slate-950/95 via-slate-950/70 to-transparent px-3 sm:px-4 flex items-center justify-between text-white pointer-events-auto">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-600/30 border border-blue-400/30 text-[10px] font-bold text-blue-300 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Aspire Secure Player</span>
          </span>
          <span className="text-xs font-semibold text-slate-100 truncate max-w-[180px] sm:max-w-md">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-block text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Paid Batch Stream
          </span>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-white/10 transition"
            title="Expand Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Interactive Middle Glass Shield:
          - Intercepts right-clicks so students CANNOT right-click on YouTube iframe to copy URL!
          - Intercepts clicks to toggle play/pause via postMessage
          - Intercepts double clicks for 10s rewind / forward
      */}
      <div
        className="absolute top-14 bottom-12 inset-x-0 z-20 cursor-pointer"
        onContextMenu={(e) => {
          e.preventDefault();
          triggerSecurityAlert();
        }}
        onClick={() => {
          if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage(
              JSON.stringify({
                event: 'command',
                func: isPlaying ? 'pauseVideo' : 'playVideo',
                args: [],
              }),
              '*'
            );
            setIsPlaying(!isPlaying);
          }
        }}
        onDoubleClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const isLeftSide = clickX < rect.width / 2;
          if (iframeRef.current?.contentWindow) {
            const delta = isLeftSide ? -10 : 10;
            const targetTime = Math.max(0, currentTime + delta);
            iframeRef.current.contentWindow.postMessage(
              JSON.stringify({
                event: 'command',
                func: 'seekTo',
                args: [targetTime, true],
              }),
              '*'
            );
            setCurrentTime(targetTime);
            triggerSecurityAlert(isLeftSide ? '⏪ Rewound 10s' : '⏩ Forwarded 10s');
          }
        }}
      />

      {/* Bottom-Right YouTube Logo Blocker Shield:
          Covers YouTube logo & "Watch on YouTube" icon to prevent opening youtube.com!
      */}
      <div
        className="absolute bottom-0 right-0 z-30 w-32 h-12 pointer-events-auto cursor-default flex items-center justify-end pr-2.5 pb-2 select-none"
        onContextMenu={(e) => {
          e.preventDefault();
          triggerSecurityAlert();
        }}
        onClick={(e) => {
          e.stopPropagation();
          triggerSecurityAlert('🔒 External redirection blocked. This video is locked to Aspire Academy.');
        }}
      >
        <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900/95 border border-slate-700 text-[9px] font-mono text-slate-300 shadow">
          <ShieldCheck className="w-2.5 h-2.5 text-blue-400" />
          <span>Aspire DRM</span>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950 text-slate-400 space-y-3 pointer-events-none transition-opacity duration-300">
          <div className="w-10 h-10 border-2 border-[#046BD2] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-300">Opening video inside website...</p>
        </div>
      )}

      {/* Sandboxed YouTube Embed:
          - sandbox="allow-scripts allow-same-origin allow-presentation"
          - WITHOUT "allow-top-navigation" and WITHOUT "allow-popups-to-escape-sandbox"
          - WITHOUT "web-share"
          Strictly prevents YouTube from redirecting to youtube.com, opening external apps, or sharing links!
      */}
      <iframe
        ref={iframeRef}
        key={videoId}
        title={title}
        src={embedUrl}
        className="w-full h-full border-0 select-none pointer-events-auto"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        sandbox="allow-scripts allow-same-origin allow-presentation"
        onLoad={() => setIsLoading(false)}
      />
    </div>
  );
}
