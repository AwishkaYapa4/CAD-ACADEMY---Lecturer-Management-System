/** Thrown anywhere in the request pipeline to short-circuit with a specific HTTP status. */
export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}
