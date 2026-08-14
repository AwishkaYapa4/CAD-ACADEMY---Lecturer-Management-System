const { HttpsError } = require('firebase-functions/v2/https')

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function requireString(value, field, { minLength = 1, maxLength = 500 } = {}) {
  if (typeof value !== 'string' || value.trim().length < minLength) {
    throw new HttpsError('invalid-argument', `${field} is required.`)
  }
  if (value.length > maxLength) {
    throw new HttpsError('invalid-argument', `${field} is too long.`)
  }
  return value.trim()
}

function requireEmail(value) {
  const email = requireString(value, 'Email')
  if (!EMAIL_RE.test(email)) {
    throw new HttpsError('invalid-argument', 'Enter a valid email address.')
  }
  return email.toLowerCase()
}

function requirePassword(value) {
  if (typeof value !== 'string' || value.length < 8) {
    throw new HttpsError('invalid-argument', 'Password must be at least 8 characters.')
  }
  if (value.length > 128) {
    throw new HttpsError('invalid-argument', 'Password is too long.')
  }
  return value
}

function optionalString(value, { maxLength = 500 } = {}) {
  if (value === undefined || value === null) return ''
  if (typeof value !== 'string') {
    throw new HttpsError('invalid-argument', 'Expected a text value.')
  }
  return value.trim().slice(0, maxLength)
}

module.exports = { requireString, requireEmail, requirePassword, optionalString }
