import { v2 as cloudinary } from 'cloudinary'

import { env } from './env.js'

// Central Cloudinary configuration module — every service that talks to
// Cloudinary imports the configured client from here, never calls
// cloudinary.config() itself. Credentials only ever live in this server's
// process env (see .env.example); CLOUDINARY_API_SECRET never reaches the
// frontend bundle.
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
})

export { cloudinary }
