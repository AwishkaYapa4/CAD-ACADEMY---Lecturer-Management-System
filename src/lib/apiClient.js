import { auth } from '@/config/firebase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

if (!API_BASE_URL) {
  console.error(
    'VITE_API_BASE_URL is not set — requests to the Materials API will fail. Copy .env.example and fill it in.'
  )
}

/** Attaches the current Firebase ID token; throws if nobody is signed in. */
async function authHeader() {
  const user = auth.currentUser
  if (!user) {
    throw new Error('You must be signed in.')
  }
  const token = await user.getIdToken()
  return { Authorization: `Bearer ${token}` }
}

async function parseResponse(response) {
  const isJson = response.headers.get('content-type')?.includes('application/json')
  const body = isJson ? await response.json().catch(() => null) : null
  if (!response.ok) {
    throw new Error(body?.error || `Request failed (${response.status})`)
  }
  return body
}

/** Plain JSON request (GET/DELETE/etc.) against the Materials API, with the caller's Firebase ID token attached. */
export async function apiFetch(path, { method = 'GET', body } = {}) {
  const headers = await authHeader()
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      ...headers,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  return parseResponse(response)
}

/**
 * Multipart upload with progress reporting — fetch() can't report upload
 * progress, so this uses XMLHttpRequest (same ergonomics as the existing
 * Firebase Storage uploads: `onProgress` receives a 0-100 number).
 */
export function apiUpload(path, formData, onProgress) {
  return authHeader().then(
    (headers) =>
      new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', `${API_BASE_URL}${path}`)
        xhr.setRequestHeader('Authorization', headers.Authorization)

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            onProgress?.(Math.round((event.loaded / event.total) * 100))
          }
        }

        xhr.onload = () => {
          let parsed = null
          try {
            parsed = JSON.parse(xhr.responseText)
          } catch {
            // non-JSON response body, fall through to the status check below
          }
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(parsed)
          } else {
            reject(new Error(parsed?.error || `Upload failed (${xhr.status})`))
          }
        }
        xhr.onerror = () => reject(new Error('Network error during upload.'))

        xhr.send(formData)
      })
  )
}
