import { useState, type SubmitEvent } from 'react'
import { Link } from 'react-router-dom'
import { api, toApiError } from '../api'

export default function ForgotPassword() {
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    const email = String(new FormData(e.currentTarget).get('email'))
    setError(null)
    try {
      const res = await api.forgotPassword({ email })
      setMessage(res.message)
    } catch (err) {
      setError(toApiError(err).message)
    }
  }

  return (
    <form className="card" onSubmit={onSubmit}>
      <h1>Reset password</h1>
      <label>
        Email
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <button>Send reset link</button>
      {message && <span className="success">{message}</span>}
      {error && <span className="error">{error}</span>}
      <p className="muted">
        <Link to="/login">Back to sign in</Link>
      </p>
    </form>
  )
}
