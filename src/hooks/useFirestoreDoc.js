import { useEffect, useState } from 'react'

/**
 * Subscribes to a single Firestore document. `subscribeToDocFn` is the
 * `.subscribeToDoc` method from a service built with createFirestoreService.
 */
export function useFirestoreDoc(subscribeToDocFn, id) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) {
      setData(null)
      setLoading(false)
      return
    }

    setLoading(true)
    const unsubscribe = subscribeToDocFn(
      id,
      (doc) => {
        setData(doc)
        setLoading(false)
      },
      (err) => {
        setError(err)
        setLoading(false)
      }
    )
    return unsubscribe
  }, [subscribeToDocFn, id])

  return { data, loading, error }
}
