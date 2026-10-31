import { useEffect, useState, type ReactNode } from 'react'
import {
  api,
  getToken,
  setToken,
  setUnauthorizedHandler,
  toApiError,
  type AuthResponse,
  type User,
} from './api'
import { AuthContext } from './useAuth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(Boolean(getToken()))
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null))
    if (!getToken()) return
    api
      .me()
      .then(setUser)
      // api.ts drops the token on a 401. Any other failure keeps it for the next reload.
      .catch((err) => setLoadFailed(toApiError(err).status !== 401))
      .finally(() => setLoading(false))
  }, [])

  const signIn = (res: AuthResponse) => {
    setToken(res.token)
    setUser(res.user)
    setLoadFailed(false)
  }

  const signOut = async () => {
    await api.logout().catch(() => undefined)
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext value={{ user, loading, loadFailed, signIn, signOut, setUser }}>
      {children}
    </AuthContext>
  )
}
