import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

// Loads the same root .env the Vite frontend uses (see .env.example) — one
// env file for the whole repo, same as functions/ has its own for Cloud
// Functions. Only the backend-only keys below are required here.
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const REQUIRED_VARS = [
  'R2_ENDPOINT',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET_NAME',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
]

const missing = REQUIRED_VARS.filter((name) => !process.env[name])
if (missing.length > 0) {
  throw new Error(
    `Missing required environment variable(s): ${missing.join(', ')}. ` +
      'Copy .env.example and fill them in (see README for where each one comes from).'
  )
}

export const env = {
  PORT: Number(process.env.PORT) || 4000,
  // Comma-separated list of allowed origins, or '*' to allow any (dev default).
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  R2_ENDPOINT: process.env.R2_ENDPOINT,
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
  // Service-account keys arrive as a single-line env var with literal `\n`
  // sequences — turn them back into real newlines or the PEM won't parse.
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
}
