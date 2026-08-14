import cors from 'cors'
import express from 'express'

import { env } from './config/env.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import materialsRoutes from './routes/materials.routes.js'

const app = express()

app.use(
  cors({
    origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',').map((o) => o.trim()),
  })
)
app.use(express.json())

app.get('/api/health', (req, res) => res.json({ ok: true }))
app.use('/api', materialsRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

export default app
