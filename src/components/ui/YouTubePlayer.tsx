'use client';

import React, { useState, useEffect, useRef } from 'react';
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

  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

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
      rawInput.includes('blob:'));

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
        className={`relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 shadow-2xl border border-slate-800 group select-none ${className}`}
      >
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
          controlsList="nodownload"
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
          className="w-full h-full object-contain cursor-pointer"
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
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=${
    autoPlay ? 1 : 0
  }&rel=0&modestbranding=1&playsinline=1&controls=1&fs=1&disablekb=0&iv_load_policy=3&enablejsapi=1`;

  return (
    <div
      ref={containerRef}
      className={`relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 shadow-2xl border border-slate-800 group select-none ${className}`}
    >
      {/* Top Protective Header: Covers the YouTube top title bar so clicking title does NOT open YouTube */}
      <div className="absolute top-0 left-0 right-0 z-30 h-11 bg-gradient-to-b from-slate-950/95 via-slate-950/60 to-transparent px-3 sm:px-4 flex items-center justify-between text-white pointer-events-auto">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-600/30 border border-blue-400/30 text-[10px] font-bold text-blue-300 shadow-sm">
            <ShieldCheck className="w-3 h-3 text-blue-400" />
            <span>Aspire Player</span>
          </span>
          <span className="text-xs font-semibold text-slate-100 truncate max-w-[200px] sm:max-w-md">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Playing in Website
          </span>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1 rounded text-slate-300 hover:text-white hover:bg-white/10 transition"
            title="Expand Fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
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
          This strictly prevents YouTube from redirecting the parent page to youtube.com or opening external apps!
      */}
      <iframe
        key={videoId}
        title={title}
        src={embedUrl}
        className="w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        sandbox="allow-scripts allow-same-origin allow-presentation"
        onLoad={() => setIsLoading(false)}
      />
    </div>
  );
}
