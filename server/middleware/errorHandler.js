import { ApiError } from '../utils/ApiError.js'

export function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Not found.' })
}

// eslint-disable-next-line no-unused-vars -- Express only treats a 4-arg function as error middleware.
export function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message })
  }
  console.error('[materials-api]', err)
  res.status(500).json({ error: 'Something went wrong. Please try again.' })
}
