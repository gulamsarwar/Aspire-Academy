'use client';

import React, { useState, useEffect } from 'react';
import { extractYouTubeVideoId, getYouTubeInfo } from '@/lib/youtube';
import { Video, ExternalLink, AlertCircle, RefreshCw, Play } from 'lucide-react';

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
}: YouTubePlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const rawInput = videoIdOrUrl || url || '';
  const info = getYouTubeInfo(rawInput);
  const videoId = info?.videoId;

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
  }, [rawInput]);

  if (!videoId || !info) {
    return (
      <div className={`aspect-video w-full rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center p-6 text-center text-slate-300 space-y-3 ${className}`}>
        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-amber-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-white">Video Link Not Available</h4>
          <p className="text-xs text-slate-400 max-w-sm">
            The video URL provided is missing or invalid. Please check the video link or contact academy support.
          </p>
        </div>
      </div>
    );
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=${autoPlay ? 1 : 0}&rel=0&modestbranding=1&playsinline=1`;

  return (
    <div className={`relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 shadow-2xl border border-slate-800 group ${className}`}>
      {/* Loading Skeleton */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950 text-slate-400 space-y-3">
          <div className="w-10 h-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-300">Loading secure video player...</p>
        </div>
      )}

      {/* Embed Iframe */}
      <iframe
        key={videoId}
        title={title}
        src={embedUrl}
        className="w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />

      {/* Fallback Banner at bottom of player */}
      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
        <a
          href={info.watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 text-white text-[11px] font-bold backdrop-blur-md hover:bg-rose-600 transition shadow-lg border border-white/10"
        >
          <span>Watch on YouTube</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Embedding Fallback Alert (Shown if student reports playback issue or video restricts embedding) */}
      {hasError && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-slate-950/95 text-center text-white space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-md">
            <h4 className="text-base font-bold">YouTube Embedding Restricted</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              This video creator has disabled embedding or restricted playback inside external websites. You can watch the full video directly on YouTube.
            </p>
          </div>
          <a
            href={info.watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-lg transition"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Open & Watch on YouTube</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </div>
  );
}
