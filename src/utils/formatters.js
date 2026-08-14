/** Firestore Timestamps need `.toDate()`; already-hydrated Dates pass through. */
export function toDate(value) {
  if (!value) return null
  return typeof value.toDate === 'function' ? value.toDate() : value
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
