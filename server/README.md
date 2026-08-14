# Materials API

Small Express backend whose only job is to hold the Cloudinary secret and the
Firebase Admin service account — the two things that must never reach the
frontend bundle. Everything else in this app (auth, Firestore reads/writes,
routing) stays exactly as it was: direct client-side Firebase SDK calls,
enforced by `firestore.rules`. This server does not replace any of that.

**Why this exists instead of a Firebase Cloud Function:** this project has a
standing decision (see project memory / `firestore.rules`'s top comment) to
stay on Firebase's free Spark plan with no Cloud Functions, because deploying
Cloud Functions (v2, Cloud Run–backed) requires enabling Blaze billing. A
Cloudinary upload signer and a signed-download-URL generator both need a
secret held server-side no matter what, so this was built as a small,
separately deployable Express app instead (Vercel free tier, no credit card
needed) — see `api/index.js` + `vercel.json`.

## Endpoints

All routes are namespaced under `/api` and require `Authorization: Bearer <Firebase ID token>`.

- `POST /api/materials/upload` — multipart form (`file`, `courseId`, `week`, `title`, `description?`). Admin or a Lecturer teaching that course.
- `GET /api/courses/:courseId/materials` — list materials for a course. Admin/Staff always; Lecturer only for courses they teach.
- `GET /api/materials/:id/download` — returns `{ url, expiresAt }`, a short-lived (5 minute) signed Cloudinary URL. Same view permission as above.
- `DELETE /api/materials/:id` — Admin (any material) or the uploading Lecturer (their own upload, course access required).

## Local development

```
npm run server:dev
```

Reads the same root `.env` as the frontend. Requires (see `.env.example`):
`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`,
`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`.

## Deploying

Deploy this repo to Vercel as-is — `vercel.json` routes `/api/*` to
`api/index.js`. Set the six env vars above (plus optional `CORS_ORIGIN`) in
the Vercel project settings; never commit them. Point the frontend's
`VITE_API_BASE_URL` at the resulting `https://your-project.vercel.app` URL.
