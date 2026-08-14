// Vercel serverless entrypoint — Vercel's Node runtime invokes an Express
// app's default export directly as the request handler. Local dev instead
// uses server/index.js (`npm run server:dev`), which calls app.listen().
import app from '../server/app.js'

export default app
