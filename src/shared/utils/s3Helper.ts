import fs from "fs";
import logger from "./logger";

// Types are imported at type-level only — no runtime import
import type { S3Client } from "@aws-sdk/client-s3";

// S3 config from env
function getS3Config() {
  const endpoint = process.env.S3_ENDPOINT || "";
  return {
    region: process.env.S3_REGION || "ap-southeast-1",
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
    bucket: process.env.S3_BUCKET || "",
    endpoint,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
  };
}

/** Kiểm tra S3 đã được cấu hình đầy đủ (accessKey, secret, bucket) chưa */
export function isS3Enabled(): boolean {
  const cfg = getS3Config();
  return !!cfg.accessKeyId && !!cfg.secretAccessKey && !!cfg.bucket;
}

let _client: S3Client | null = null;
let _bucket: string | null = null;

async function getClient(): Promise<{
  client: S3Client;
  bucket: string;
} | null> {
  if (_client && _bucket) return { client: _client, bucket: _bucket };

  const cfg = getS3Config();
  if (!cfg.accessKeyId || !cfg.secretAccessKey || !cfg.bucket) {
    return null;
  }

  try {
    // Dynamic import — chỉ load khi thực sự cần, không crash app nếu thiếu package
    const { S3Client: S3 } = await import("@aws-sdk/client-s3");

    _client = new S3({
      region: cfg.region,
      credentials: {
        accessKeyId: cfg.accessKeyId,
        secretAccessKey: cfg.secretAccessKey,
      },
      maxAttempts: 2,
      ...(cfg.endpoint
        ? { endpoint: cfg.endpoint, forcePathStyle: cfg.forcePathStyle }
        : {}),
    });
    _bucket = cfg.bucket;
    logger.info(`[S3Helper] Initialized (bucket=${_bucket})`);
    return { client: _client, bucket: _bucket };
  } catch (err) {
    logger.warn(
      "[S3Helper] Failed to init S3 client, uploads will use local storage only:",
      err,
    );
    return null;
  }
}

/**
 * Build full S3 URL from storage key.
 * Example: "EMPLOYEE/xxx/AVATAR/file.png" → "https://s3...amazonaws.com/bucket/EMPLOYEE/xxx/AVATAR/file.png"
 */
export function getS3Url(storageKey: string): string {
  const cfg = getS3Config();
  if (!cfg.bucket) return storageKey;

  // Wasabi/S3-compatible: endpoint + bucket + key
  if (cfg.endpoint) {
    return `${cfg.endpoint.replace(/\/+$/, "")}/${cfg.bucket}/${storageKey}`;
  }
  // AWS S3 standard: https://{bucket}.s3.{region}.amazonaws.com/{key}
  return `https://${cfg.bucket}.s3.${cfg.region}.amazonaws.com/${storageKey}`;
}

/**
 * Upload file to S3.
 * Returns storageKey on success, null on failure.
 * Storage key format: {entityType}/{entityId}/{category}/{filename}
 */
export async function uploadToS3(params: {
  filePath: string;
  entityType: string;
  entityId: string;
  category: string;
  fileName: string;
  mimeType: string;
}): Promise<string | null> {
  try {
    const s3 = await getClient();
    if (!s3) return null;

    const { PutObjectCommand } = await import("@aws-sdk/client-s3");

    const key = `${params.entityType}/${params.entityId}/${params.category}/${params.fileName}`;
    const fileStream = fs.createReadStream(params.filePath);

    await s3.client.send(
      new PutObjectCommand({
        Bucket: s3.bucket,
        Key: key,
        Body: fileStream,
        ContentType: params.mimeType,
      }),
    );

    logger.info(`[S3Helper] Uploaded: ${key}`);
    return key;
  } catch (error) {
    logger.error(`[S3Helper] Upload failed for ${params.filePath}:`, error);
    return null;
  }
}

/**
 * Delete file from S3.
 */
export async function deleteFromS3(storageKey: string): Promise<void> {
  try {
    const s3 = await getClient();
    if (!s3) return;

    const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");

    await s3.client.send(
      new DeleteObjectCommand({
        Bucket: s3.bucket,
        Key: storageKey,
      }),
    );
    logger.info(`[S3Helper] Deleted: ${storageKey}`);
  } catch (error) {
    logger.error(`[S3Helper] Delete failed for ${storageKey}:`, error);
  }
}

/**
 * Generate presigned URL for viewing/downloading a file from S3.
 * Cache presigned URLs for 30 min to avoid regenerating on every request.
 */
const presignedCache = new Map<string, { url: string; expiresAt: number }>();
const PRESIGNED_CACHE_TTL_MS = 30 * 60 * 1000; // 30 min
const PRESIGNED_EXPIRES_SEC = 3600; // 1 hour

export async function getPresignedUrl(
  storageKey: string,
): Promise<string | null> {
  // Check cache
  const cached = presignedCache.get(storageKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url;
  }

  try {
    const s3 = await getClient();
    if (!s3) return null;

    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");

    const url = await getSignedUrl(
      s3.client,
      new GetObjectCommand({
        Bucket: s3.bucket,
        Key: storageKey,
      }),
      { expiresIn: PRESIGNED_EXPIRES_SEC },
    );

    // Cache
    presignedCache.set(storageKey, {
      url,
      expiresAt: Date.now() + PRESIGNED_CACHE_TTL_MS,
    });

    return url;
  } catch (error) {
    logger.error(
      `[S3Helper] Failed to generate presigned URL for ${storageKey}:`,
      error,
    );
    return null;
  }
}
