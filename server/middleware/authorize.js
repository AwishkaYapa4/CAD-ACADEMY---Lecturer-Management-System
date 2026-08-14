import { ApiError } from '../utils/ApiError.js'

/** Role gate — must run after authenticate() so req.user is populated. */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      throw new ApiError(403, 'You do not have permission to perform this action.')
    }
    next()
  }
}
