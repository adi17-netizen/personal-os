import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
} from 'firebase/auth'
import { auth, googleProvider } from '../config/firebase'
import { tokenStore } from '../lib/tokenStore'

const MOCK = import.meta.env.VITE_MOCK_MODE === 'true'

const MOCK_USER = {
  uid: 'mock-uid',
  displayName: 'Demo User',
  email: 'demo@example.com',
  photoURL: null,
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(MOCK ? MOCK_USER : null)
  const [loading, setLoading] = useState(!MOCK)
  const [needsReconnect, setNeedsReconnect] = useState(false)

  useEffect(() => {
    if (MOCK) return

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser && !tokenStore.isValid()) {
        setNeedsReconnect(true)
      } else if (!firebaseUser) {
        setNeedsReconnect(false)
        tokenStore.clear()
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const signInWithGoogle = useCallback(async () => {
    if (MOCK) return MOCK_USER
    const result = await signInWithPopup(auth, googleProvider)
    const credential = GoogleAuthProvider.credentialFromResult(result)
    if (credential?.accessToken) {
      tokenStore.set(credential.accessToken)
    }
    setNeedsReconnect(false)
    return result.user
  }, [])

  const signOut = useCallback(async () => {
    if (MOCK) return
    tokenStore.clear()
    setNeedsReconnect(false)
    await firebaseSignOut(auth)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, needsReconnect, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
