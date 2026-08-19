# Materials API

Small Express backend whose only job is to hold the Cloudflare R2 secret and
the Firebase Admin service account — the two things that must never reach the
frontend bundle. Everything else in this app (auth, Firestore reads/writes,
routing) stays exactly as it was: direct client-side Firebase SDK calls,
enforced by `firestore.rules`. This server does not replace any of that.

**Why this exists instead of a Firebase Cloud Function:** this project has a
standing decision (see project memory / `firestore.rules`'s top comment) to
stay on Firebase's free Spark plan with no Cloud Functions, because deploying
Cloud Functions (v2, Cloud Run–backed) requires enabling Blaze billing. Issuing
presigned R2 URLs and a signed-download-URL generator both need a secret held
server-side no matter what, so this was built as a small, separately
deployable Express app instead (Vercel free tier, no credit card needed) —
see `api/index.js` + `vercel.json`.

## Upload flow

Materials upload directly from the browser to R2 using short-lived presigned
URLs — the file's bytes never pass through this Express function, so a 25MB
file never has to fit inside Vercel's serverless request-body limit:

```
1. POST /api/materials/upload-url  { courseId, week, filename, mimeType, sizeBytes }
   → validates + checks permission, returns { uploadUrl, key, expiresAt }
2. Browser PUTs the file straight to `uploadUrl` (R2)
3. POST /api/materials  { courseId, week, title, description, r2Key, originalFilename, mimeType, sizeBytes }
   → re-checks permission, confirms the object exists in R2, writes the Firestore record
```

See `server/services/r2Service.js` and `server/controllers/materials.controller.js`.

## Endpoints

All routes are namespaced under `/api` and require `Authorization: Bearer <Firebase ID token>`.

- `POST /api/materials/upload-url` — step 1 of upload, above. Admin or a Lecturer teaching that course.
- `POST /api/materials` — step 3 of upload, above. Same permission.
- `GET /api/courses/:courseId/materials` — list materials for a course. Admin/Staff always; Lecturer only for courses they teach.
- `GET /api/materials/:id/download` — returns `{ url, expiresAt }`, a short-lived (5 minute) signed R2 URL. Same view permission as above.
- `DELETE /api/materials/:id` — Admin (any material) or the uploading Lecturer (their own upload, course access required).

## Local development

```
npm run server:dev
```

Reads the same root `.env` as the frontend. Requires (see `.env.example`):
`R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`,
`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`.

Once those are set, run `npm run r2:cors` to configure the R2 bucket's CORS
policy — required for the browser's direct PUT/GET requests to be accepted at
all. Re-run it whenever `CORS_ORIGIN` (or the deployed frontend's origin)
changes. See `server/scripts/configureR2Cors.js`.

## Deploying

Deploy this repo to Vercel as-is — `vercel.json` routes `/api/*` to
`api/index.js`. Set the six env vars above (plus optional `CORS_ORIGIN`) in
the Vercel project settings; never commit them. Point the frontend's
`VITE_API_BASE_URL` at the resulting `https://your-project.vercel.app` URL.
After the first deploy, re-run `npm run r2:cors` locally with `CORS_ORIGIN`
including the production frontend origin, so R2 accepts uploads/downloads
from production too.
