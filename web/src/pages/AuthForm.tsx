import { useState, type SubmitEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { api, toApiError, type ApiError } from '../api'
import { useAuth } from '../useAuth'

export default function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const isRegister = mode === 'register'
  const { user, loading, signIn } = useAuth()
  const notice = (useLocation().state as { notice?: string } | null)?.notice
  const [error, setError] = useState<ApiError | null>(null)
  const [busy, setBusy] = useState(false)

  if (loading) return <p className="muted">Loading…</p>
  if (user) return <Navigate to="/account" replace />

  async function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const email = String(form.get('email'))
    const password = String(form.get('password'))
    setBusy(true)
    setError(null)
    try {
      signIn(
        isRegister
          ? await api.register({ name: String(form.get('name')), email, password })
          : await api.login({ email, password }),
      )
    } catch (err) {
      setError(toApiError(err))
    } finally {
      setBusy(false)
    }
  }

  const fieldError = (name: string) => error?.errors[name]?.[0]

  return (
    <form className="card" onSubmit={onSubmit}>
      <h1>{isRegister ? 'Create account' : 'Sign in'}</h1>
      {notice && <span className="success">{notice}</span>}
      {isRegister && (
        <label>
          Name
          <input name="name" autoComplete="name" required />
          {fieldError('name') && <span className="error">{fieldError('name')}</span>}
        </label>
      )}
      <label>
        Email
        <input name="email" type="email" autoComplete="email" required />
        {fieldError('email') && <span className="error">{fieldError('email')}</span>}
      </label>
      <label>
        Password
        <input
          name="password"
          type="password"
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          minLength={8}
          required
        />
        {fieldError('password') && <span className="error">{fieldError('password')}</span>}
      </label>
      <button disabled={busy}>{isRegister ? 'Create account' : 'Sign in'}</button>
      {error && !error.hasFieldErrors && <span className="error">{error.message}</span>}
      {!isRegister && (
        <p className="muted">
          <Link to="/forgot-password">Forgot password?</Link>
        </p>
      )}
      <p className="muted">
        {isRegister ? (
          <>
            Have an account? <Link to="/login">Sign in</Link>
          </>
        ) : (
          <>
            New here? <Link to="/register">Create account</Link>
          </>
        )}
      </p>
    </form>
  )
}
