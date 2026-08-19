import { S3Client } from '@aws-sdk/client-s3'

// Cloudflare R2 is S3-compatible, so the official AWS SDK v3 client works
// as-is against R2's endpoint — this is Cloudflare's documented pattern.
export const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

export const R2_BUCKET = process.env.R2_BUCKET_NAME
