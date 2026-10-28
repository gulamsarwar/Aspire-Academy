import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/data/supabase-service';

export interface StorageDiagnostic {
  isConfigured: boolean;
  provider: 'supabase' | 'none';
  bucketName: string;
  message: string;
}

const THUMBNAIL_BUCKET = 'course-thumbnails';
const MAX_THUMBNAIL_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function getSupabaseStorageDiagnostic(): StorageDiagnostic {
  const configured = isSupabaseConfigured();
  return {
    isConfigured: configured,
    provider: configured ? 'supabase' : 'none',
    bucketName: THUMBNAIL_BUCKET,
    message: configured
      ? 'Supabase Cloud Storage is configured and ready for course thumbnail uploads.'
      : 'Supabase credentials missing in .env.local',
  };
}

let bucketEnsured = false;

export async function ensureThumbnailBucketExists() {
  if (bucketEnsured) return true;
  const supabase = createAdminClient();
  if (!supabase) return false;

  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some((b) => b.name === THUMBNAIL_BUCKET);
    if (!exists) {
      await supabase.storage.createBucket(THUMBNAIL_BUCKET, {
        public: true,
        fileSizeLimit: MAX_THUMBNAIL_SIZE,
        allowedMimeTypes: ALLOWED_MIME_TYPES,
      });
    }
    bucketEnsured = true;
    return true;
  } catch (err) {
    console.warn('Could not verify/create thumbnail bucket:', err);
    return false;
  }
}

export async function uploadThumbnailToSupabase(
  buffer: Buffer | Uint8Array,
  originalFilename: string,
  contentType: string
): Promise<{ success: boolean; url?: string; key?: string; error?: string }> {
  const supabase = createAdminClient();
  if (!supabase) {
    return { success: false, error: 'Supabase admin client not available' };
  }

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(contentType)) {
    return {
      success: false,
      error: `Invalid file type: ${contentType}. Allowed: JPG, PNG, WebP, GIF`,
    };
  }

  // Validate size
  if (buffer.length > MAX_THUMBNAIL_SIZE) {
    return {
      success: false,
      error: `File size exceeds 10MB limit (size: ${(buffer.length / (1024 * 1024)).toFixed(1)}MB)`,
    };
  }

  try {
    await ensureThumbnailBucketExists();

    const extMatch = originalFilename.match(/\.([a-zA-Z0-9]+)$/);
    const ext = extMatch ? extMatch[1].toLowerCase() : 'webp';
    const timestamp = Date.now();
    const randomHex = Math.random().toString(36).substring(2, 8);
    const fileName = `course_thumb_${timestamp}_${randomHex}.${ext}`;

    const { data, error } = await supabase.storage
      .from(THUMBNAIL_BUCKET)
      .upload(fileName, buffer, {
        contentType,
        upsert: true,
      });

    if (error || !data) {
      return { success: false, error: error?.message || 'Failed to upload to Supabase storage' };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(THUMBNAIL_BUCKET).getPublicUrl(data.path);

    return {
      success: true,
      url: publicUrl,
      key: data.path,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown storage upload error' };
  }
}

export async function deleteThumbnailFromSupabase(key: string): Promise<boolean> {
  const supabase = createAdminClient();
  if (!supabase || !key) return false;

  try {
    const { error } = await supabase.storage.from(THUMBNAIL_BUCKET).remove([key]);
    return !error;
  } catch {
    return false;
  }
}
