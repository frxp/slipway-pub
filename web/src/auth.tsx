import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, getToken, setToken, type AuthResponse, type User } from './api'

type AuthState = {
  user: User | null
  loading: boolean
  signIn: (res: AuthResponse) => void
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(Boolean(getToken()))

  useEffect(() => {
    if (!getToken()) return
    api
      .me()
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setLoading(false))
  }, [])

  const signIn = (res: AuthResponse) => {
    setToken(res.token)
    setUser(res.user)
  }

  const signOut = async () => {
    await api.logout().catch(() => undefined)
    setToken(null)
    setUser(null)
  }

  return <AuthContext value={{ user, loading, signIn, signOut }}>{children}</AuthContext>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
