// One-off setup script — the browser PUTs uploads and GETs downloads
// directly to/from R2 using presigned URLs (see server/services/r2Service.js),
// which requires CORS to be configured on the bucket or those requests are
// blocked before they ever reach R2. Run once, and again whenever
// CORS_ORIGIN / the deployed frontend origin changes:
//
//   npm run r2:cors
import { PutBucketCorsCommand } from '@aws-sdk/client-s3'

import { env } from '../config/env.js'
import { r2, R2_BUCKET } from '../config/r2.js'

const DEV_ORIGIN = 'http://localhost:5173'

const origins =
  env.CORS_ORIGIN === '*'
    ? [DEV_ORIGIN]
    : [...new Set([...env.CORS_ORIGIN.split(',').map((o) => o.trim()), DEV_ORIGIN])]

await r2.send(
  new PutBucketCorsCommand({
    Bucket: R2_BUCKET,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedOrigins: origins,
          AllowedMethods: ['PUT', 'GET'],
          AllowedHeaders: ['*'],
          ExposeHeaders: ['ETag'],
          MaxAgeSeconds: 3000,
        },
      ],
    },
  })
)

console.log(`R2 CORS configured on bucket "${R2_BUCKET}" for origins:`, origins)
