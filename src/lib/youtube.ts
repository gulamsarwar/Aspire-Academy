/**
 * Robust YouTube URL Parser & Video ID Extractor
 * Supports standard watch, short youtu.be, embed, live, shorts, mobile, and raw IDs.
 */

const YOUTUBE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

export interface ParsedYouTubeInfo {
  videoId: string;
  isValid: boolean;
  embedUrl: string;
  watchUrl: string;
  thumbnailUrl: string;
  isLive?: boolean;
}

/**
 * Extracts the 11-character YouTube video ID from any valid YouTube URL format or raw ID.
 * Returns null if the input does not yield a valid 11-character YouTube video ID.
 */
export function extractYouTubeVideoId(input: string | null | undefined): string | null {
  if (!input) return null;
  const raw = input.trim();
  if (!raw) return null;

  // 1. If it's already an 11-char ID
  if (YOUTUBE_ID_REGEX.test(raw)) {
    return raw;
  }

  try {
    // Check if input can be parsed as a URL
    // Prepend https:// if missing protocol
    const urlString = raw.startsWith('http://') || raw.startsWith('https://')
      ? raw
      : `https://${raw}`;

    const url = new URL(urlString);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, '');

    // Host: youtu.be/<id>
    if (hostname === 'youtu.be') {
      const pathnameId = url.pathname.slice(1).split('/')[0].split('?')[0];
      if (YOUTUBE_ID_REGEX.test(pathnameId)) {
        return pathnameId;
      }
    }

    // Host: youtube.com, m.youtube.com, or youtube-nocookie.com
    if (
      hostname === 'youtube.com' ||
      hostname === 'm.youtube.com' ||
      hostname === 'youtube-nocookie.com' ||
      hostname.endsWith('.youtube.com') ||
      hostname.endsWith('.youtube-nocookie.com')
    ) {
      // 1. /watch?v=<id>
      const vParam = url.searchParams.get('v');
      if (vParam && YOUTUBE_ID_REGEX.test(vParam)) {
        return vParam;
      }

      // 2. /embed/<id>
      if (url.pathname.startsWith('/embed/')) {
        const embedId = url.pathname.replace('/embed/', '').split('/')[0].split('?')[0];
        if (YOUTUBE_ID_REGEX.test(embedId)) {
          return embedId;
        }
      }

      // 3. /live/<id>
      if (url.pathname.startsWith('/live/')) {
        const liveId = url.pathname.replace('/live/', '').split('/')[0].split('?')[0];
        if (YOUTUBE_ID_REGEX.test(liveId)) {
          return liveId;
        }
      }

      // 4. /shorts/<id>
      if (url.pathname.startsWith('/shorts/')) {
        const shortsId = url.pathname.replace('/shorts/', '').split('/')[0].split('?')[0];
        if (YOUTUBE_ID_REGEX.test(shortsId)) {
          return shortsId;
        }
      }

      // 5. /v/<id>
      if (url.pathname.startsWith('/v/')) {
        const vId = url.pathname.replace('/v/', '').split('/')[0].split('?')[0];
        if (YOUTUBE_ID_REGEX.test(vId)) {
          return vId;
        }
      }
    }
  } catch {
    // Regex fallback for non-standard or partial strings
  }

  // Fallback regex matching common patterns in freeform text
  const matchWatch = raw.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (matchWatch && matchWatch[1]) return matchWatch[1];

  const matchShort = raw.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (matchShort && matchShort[1]) return matchShort[1];

  const matchEmbed = raw.match(/youtube(?:-nocookie)?\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (matchEmbed && matchEmbed[1]) return matchEmbed[1];

  const matchLive = raw.match(/youtube\.com\/live\/([a-zA-Z0-9_-]{11})/);
  if (matchLive && matchLive[1]) return matchLive[1];

  const matchShorts = raw.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (matchShorts && matchShorts[1]) return matchShorts[1];

  return null;
}

/**
 * Builds YouTube info with embed, watch, and thumbnail URLs.
 */
export function getYouTubeInfo(input: string | null | undefined): ParsedYouTubeInfo | null {
  const videoId = extractYouTubeVideoId(input);
  if (!videoId) return null;

  return {
    videoId,
    isValid: true,
    embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1&enablejsapi=1`,
    watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    isLive: input ? input.includes('/live/') : false,
  };
}

/**
 * Generates privacy-enhanced YouTube embed URL with optimal configuration.
 */
export function generateYouTubeEmbedUrl(videoId: string, autoPlay: boolean = false): string {
  const cleanId = extractYouTubeVideoId(videoId) || videoId;
  return `https://www.youtube-nocookie.com/embed/${cleanId}?autoplay=${autoPlay ? 1 : 0}&rel=0&modestbranding=1&enablejsapi=1`;
}

/**
 * Validates if an 11-character string conforms to standard YouTube video ID format.
 */
export function isValidYouTubeVideoId(id: string): boolean {
  return YOUTUBE_ID_REGEX.test(id);
}
