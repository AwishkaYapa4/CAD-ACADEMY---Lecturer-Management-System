import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  orderBy,
  limit as fbLimit,
} from 'firebase/firestore'

import { db } from '@/config/firebase'

/**
 * Factory that produces a reusable CRUD service for a single Firestore collection.
 * Every feature service (lecturers, courses, batches, ...) is built on top of this
 * instead of hand-rolling Firestore calls, so query/mutation behavior stays consistent.
 */
export function createFirestoreService(collectionName) {
  const colRef = () => collection(db, collectionName)
  const docRef = (id) => doc(db, collectionName, id)

  async function getAll(constraints = []) {
    const q = query(colRef(), ...constraints)
    const snapshot = await getDocs(q)
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
  }

  async function getById(id) {
    const snapshot = await getDoc(docRef(id))
    if (!snapshot.exists()) return null
    return { id: snapshot.id, ...snapshot.data() }
  }

  async function create(data) {
    const ref = await addDoc(colRef(), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  }

  async function update(id, data) {
    await updateDoc(docRef(id), {
      ...data,
      updatedAt: serverTimestamp(),
    })
  }

  async function remove(id) {
    await deleteDoc(docRef(id))
  }

  /**
   * Subscribes to realtime updates for a query and returns the unsubscribe function.
   * onNext receives the mapped array of documents on every change.
   */
  function subscribe(constraints = [], onNext, onError) {
    const q = query(colRef(), ...constraints)
    return onSnapshot(
      q,
      (snapshot) => {
        onNext(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
      },
      onError
    )
  }

  function subscribeToDoc(id, onNext, onError) {
    return onSnapshot(
      docRef(id),
      (snapshot) => {
        onNext(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null)
      },
      onError
    )
  }

  return {
    colRef,
    docRef,
    getAll,
    getById,
    create,
    update,
    remove,
    subscribe,
    subscribeToDoc,
  }
}

// Re-export common Firestore query helpers so feature services only need one import source.
export { where, orderBy, fbLimit as limit }
