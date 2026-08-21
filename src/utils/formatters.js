/**
 * Safely converts a Firestore Timestamp (SDK instance or plain
 * `{seconds,nanoseconds}` / `{_seconds,_nanoseconds}` shape from a REST/cache
 * read), a Date, or an ISO string into a valid `Date` — or `null` if no valid
 * date can be produced. Never throws, so callers never hand date-fns (or
 * `new Date(...)`) a value that blows up with `RangeError: Invalid time value`.
 */
export function toDate(value) {
  if (!value) return null

  if (typeof value.toDate === 'function') {
    try {
      const date = value.toDate()
      return Number.isNaN(date?.getTime()) ? null : date
    } catch {
      return null
    }
  }

  if (typeof value.seconds === 'number') {
    return new Date(value.seconds * 1000)
  }

  if (typeof value._seconds === 'number') {
    return new Date(value._seconds * 1000)
  }

  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function getInitials(name, email) {
  if (name) {
    return name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }
  return email?.[0]?.toUpperCase() ?? '?'
}
