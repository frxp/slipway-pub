import { createContext, useContext } from 'react'
import type { AuthResponse, User } from './api'

export type AuthState = {
  user: User | null
  loading: boolean
  loadFailed: boolean
  signIn: (res: AuthResponse) => void
  signOut: () => Promise<void>
  setUser: (user: User) => void
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
