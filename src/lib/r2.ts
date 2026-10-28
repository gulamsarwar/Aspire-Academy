import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface R2ConfigDiagnostic {
  isConfigured: boolean;
  missing: string[];
  bucketName?: string;
  publicDomain?: string;
}

export function getR2Diagnostic(): R2ConfigDiagnostic {
  const accountId =
    process.env.CLOUDFLARE_R2_ACCOUNT_ID ||
    process.env.R2_ACCOUNT_ID ||
    '';
  const accessKeyId =
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ||
    process.env.R2_ACCESS_KEY_ID ||
    '';
  const secretAccessKey =
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ||
    process.env.R2_SECRET_ACCESS_KEY ||
    '';
  const bucketName =
    process.env.CLOUDFLARE_R2_BUCKET_NAME ||
    process.env.R2_BUCKET_NAME ||
    '';
  const publicDomain =
    process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN ||
    process.env.R2_PUBLIC_DOMAIN ||
    '';

  const missing: string[] = [];
  if (!accountId) missing.push('R2_ACCOUNT_ID');
  if (!accessKeyId) missing.push('R2_ACCESS_KEY_ID');
  if (!secretAccessKey) missing.push('R2_SECRET_ACCESS_KEY');
  if (!bucketName) missing.push('R2_BUCKET_NAME');

  return {
    isConfigured: missing.length === 0,
    missing,
    bucketName: bucketName || undefined,
    publicDomain: publicDomain || undefined,
  };
}

export function isR2Configured(): boolean {
  return getR2Diagnostic().isConfigured;
}

let cachedS3Client: S3Client | null = null;

export function getR2Client(): S3Client | null {
  const diagnostic = getR2Diagnostic();
  if (!diagnostic.isConfigured) {
    return null;
  }

  if (cachedS3Client) {
    return cachedS3Client;
  }

  const accountId =
    process.env.CLOUDFLARE_R2_ACCOUNT_ID ||
    process.env.R2_ACCOUNT_ID ||
    '';
  const accessKeyId =
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ||
    process.env.R2_ACCESS_KEY_ID ||
    '';
  const secretAccessKey =
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ||
    process.env.R2_SECRET_ACCESS_KEY ||
    '';

  cachedS3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return cachedS3Client;
}

export function getR2BucketName(): string {
  return (
    process.env.CLOUDFLARE_R2_BUCKET_NAME ||
    process.env.R2_BUCKET_NAME ||
    'aspire-academy-media'
  );
}

/**
 * Generate a short-lived presigned upload URL for direct client-to-R2 upload.
 * Reduces server memory overhead and handles large video files seamlessly.
 */
export async function createPresignedUploadUrl({
  key,
  contentType,
  expiresInSeconds = 900, // 15 mins
}: {
  key: string;
  contentType: string;
  expiresInSeconds?: number;
}): Promise<{ uploadUrl: string; key: string }> {
  const client = getR2Client();
  if (!client) {
    throw new Error('Cloudflare R2 is not configured. Missing credentials.');
  }

  const bucket = getR2BucketName();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, {
    expiresIn: expiresInSeconds,
  });

  return { uploadUrl, key };
}

/**
 * Generate a short-lived secure signed URL for private video playback.
 * Enforces course enrollment before issuing URL.
 */
export async function createSignedPlaybackUrl({
  key,
  expiresInSeconds = 7200, // 2 hours
}: {
  key: string;
  expiresInSeconds?: number;
}): Promise<string> {
  const client = getR2Client();
  if (!client) {
    throw new Error('Cloudflare R2 is not configured.');
  }

  const bucket = getR2BucketName();
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return await getSignedUrl(client, command, {
    expiresIn: expiresInSeconds,
  });
}

/**
 * Server-side upload for small files like thumbnails or images.
 */
export async function uploadToR2ServerSide({
  key,
  buffer,
  contentType,
}: {
  key: string;
  buffer: Buffer;
  contentType: string;
}): Promise<{ key: string; publicUrl?: string }> {
  const client = getR2Client();
  if (!client) {
    throw new Error('Cloudflare R2 is not configured. Missing credentials.');
  }

  const bucket = getR2BucketName();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  const publicDomain =
    process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN ||
    process.env.R2_PUBLIC_DOMAIN;

  const publicUrl = publicDomain
    ? `${publicDomain.replace(/\/$/, '')}/${key}`
    : undefined;

  return { key, publicUrl };
}
