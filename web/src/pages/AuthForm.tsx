import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, ApiError } from '../api'
import { useAuth } from '../auth'

export default function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const isRegister = mode === 'register'
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<ApiError | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const email = String(form.get('email'))
    const password = String(form.get('password'))
    setBusy(true)
    setError(null)
    try {
      const res = isRegister
        ? await api.register({ name: String(form.get('name')), email, password })
        : await api.login({ email, password })
      signIn(res)
      navigate('/account')
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError('Something went wrong'))
    } finally {
      setBusy(false)
    }
  }

  const fieldError = (name: string) => error?.errors[name]?.[0]

  return (
    <form className="card" onSubmit={onSubmit}>
      <h1>{isRegister ? 'Create account' : 'Sign in'}</h1>
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
