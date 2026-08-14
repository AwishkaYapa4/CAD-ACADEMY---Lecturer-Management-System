import { createContext, useEffect, useState, useCallback } from 'react'
import { onAuthStateChanged } from 'firebase/auth'

import { auth } from '@/config/firebase'
import {
  signIn as signInService,
  signOutUser,
  getUserProfile,
  touchLastLogin,
} from '@/features/auth/services/authService'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setError(null)
      setFirebaseUser(user)

      if (!user) {
        setProfile(null)
        setLoading(false)
        return
      }

      try {
        const userProfile = await getUserProfile(user.uid)
        setProfile(userProfile)
      } catch (err) {
        setError(err)
        setProfile(null)
      } finally {
        setLoading(false)
      }
    })

    return unsubscribe
  }, [])

  const login = useCallback(async (email, password) => {
    const user = await signInService(email, password)
    const userProfile = await getUserProfile(user.uid)

    if (!userProfile) {
      await signOutUser()
      const error = new Error('This account has no role assigned. Contact an administrator.')
      error.code = 'account/no-role'
      throw error
    }

    if (userProfile.active === false) {
      await signOutUser()
      const error = new Error('This account has been deactivated.')
      error.code = 'account/deactivated'
      throw error
    }

    touchLastLogin(user.uid).catch(() => {})
    setProfile(userProfile)
    return userProfile
  }, [])

  const logout = useCallback(async () => {
    await signOutUser()
    setProfile(null)
  }, [])

  const value = {
    firebaseUser,
    profile,
    role: profile?.role ?? null,
    isAuthenticated: Boolean(firebaseUser && profile),
    loading,
    error,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
