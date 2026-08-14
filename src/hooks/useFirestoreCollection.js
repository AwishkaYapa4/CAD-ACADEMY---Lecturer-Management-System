import { useCallback, useEffect, useState } from 'react'

/**
 * Subscribes to a Firestore query for the lifetime of the component.
 * `subscribeFn` is the `.subscribe` method from a service built with
 * createFirestoreService (services/firestoreService.js). Pass a stable
 * `deps` array (e.g. []) to control when the subscription is re-created.
 *
 * Also returns `refetch`, which tears down and re-creates the listener on
 * demand. Normally the live `onSnapshot` listener alone keeps `data` current,
 * but on some networks the stream can silently stop delivering updates
 * (see the comment in config/firebase.js) — calling `refetch` right after a
 * mutation you know just changed this data is a cheap way to get a fresh
 * result without waiting on that listener or making the user reload the page.
 */
export function useFirestoreCollection(subscribeFn, constraints = [], deps = []) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshToken, setRefreshToken] = useState(0)

  useEffect(() => {
    setLoading(true)
    const unsubscribe = subscribeFn(
      constraints,
      (docs) => {
        setData(docs)
        setLoading(false)
      },
      (err) => {
        setError(err)
        setLoading(false)
      }
    )
    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, refreshToken])

  const refetch = useCallback(() => setRefreshToken((token) => token + 1), [])

  return { data, loading, error, refetch }
}
