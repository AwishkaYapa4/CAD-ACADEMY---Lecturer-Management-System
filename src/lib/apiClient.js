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
 * PUTs a file straight to a presigned URL (e.g. R2) with progress reporting
 * — fetch() can't report upload progress, so this uses XMLHttpRequest (same
 * ergonomics as the old multipart uploads: `onProgress` receives a 0-100
 * number). No auth header here — the presigned URL itself is the
 * credential, and it points at R2, not this app's API.
 */
export function uploadToSignedUrl(url, file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    xhr.setRequestHeader('Content-Type', file.type)

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress?.(Math.round((event.loaded / event.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        reject(new Error(`Upload to storage failed (${xhr.status})`))
      }
    }
    xhr.onerror = () => reject(new Error('Network error while uploading the file.'))

    xhr.send(file)
  })
}
