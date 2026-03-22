import {
  browserLocalPersistence,
  onIdTokenChanged,
  setPersistence,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { createGoogleProvider, getFirebaseAuth } from '@/lib/firebase'

type AuthContextValue = {
  user: User | null
  idToken: string | null
  isReady: boolean
  isAuthenticating: boolean
  error: string | null
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  refreshIdToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

type Props = {
  children: ReactNode
}

export function AuthProvider({ children }: Props) {
  const [user, setUser] = useState<User | null>(null)
  const [idToken, setIdToken] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    let unsubscribe = () => {}

    async function initializeAuth() {
      try {
        const auth = getFirebaseAuth()
        await setPersistence(auth, browserLocalPersistence)

        unsubscribe = onIdTokenChanged(auth, async (nextUser) => {
          if (!isMounted) {
            return
          }

          setUser(nextUser)

          if (!nextUser) {
            setIdToken(null)
            setIsReady(true)
            return
          }

          const nextToken = await nextUser.getIdToken()

          if (!isMounted) {
            return
          }

          setIdToken(nextToken)
          setIsReady(true)
        })
      } catch (err) {
        if (!isMounted) {
          return
        }

        setError(
          err instanceof Error ? err.message : 'Failed to initialize Firebase Authentication'
        )
        setIsReady(true)
      }
    }

    void initializeAuth()

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  const signInWithGoogle = async () => {
    setError(null)
    setIsAuthenticating(true)

    try {
      const auth = getFirebaseAuth()
      await setPersistence(auth, browserLocalPersistence)
      await signInWithPopup(auth, createGoogleProvider())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in')
      throw err
    } finally {
      setIsAuthenticating(false)
    }
  }

  const signOut = async () => {
    setError(null)
    const auth = getFirebaseAuth()
    await firebaseSignOut(auth)
  }

  const refreshIdToken = async () => {
    if (!user) {
      return null
    }

    const nextToken = await user.getIdToken(true)
    setIdToken(nextToken)
    return nextToken
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        idToken,
        isReady,
        isAuthenticating,
        error,
        signInWithGoogle,
        signOut,
        refreshIdToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
