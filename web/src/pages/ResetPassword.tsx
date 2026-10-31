import { useState, type SubmitEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api, toApiError, type ApiError } from '../api'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState<ApiError | null>(null)

  async function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    const password = String(new FormData(e.currentTarget).get('password'))
    setError(null)
    try {
      await api.resetPassword({
        token: params.get('token') ?? '',
        email: params.get('email') ?? '',
        password,
      })
      navigate('/login', { state: { notice: 'Password reset. Sign in with the new password.' } })
    } catch (err) {
      setError(toApiError(err))
    }
  }

  return (
    <form className="card" onSubmit={onSubmit}>
      <h1>Choose a new password</h1>
      <p className="muted">{params.get('email')}</p>
      <label>
        New password
        <input name="password" type="password" autoComplete="new-password" minLength={8} required />
        {error?.errors.password?.[0] && <span className="error">{error.errors.password[0]}</span>}
      </label>
      <button>Reset password</button>
      {error && !error.errors.password && (
        <span className="error">{error.errors.email?.[0] ?? error.message}</span>
      )}
      <p className="muted">
        <Link to="/forgot-password">Request a new link</Link>
      </p>
    </form>
  )
}
