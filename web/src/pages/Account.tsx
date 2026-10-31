import { useState, type SubmitEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { api, toApiError, type ApiError } from '../api'
import { useAuth } from '../useAuth'

type Status = { kind: 'ok'; text: string } | { kind: 'error'; error: ApiError } | null

function StatusLine({ status, field }: { status: Status; field?: string }) {
  if (!status) return null
  if (status.kind === 'ok') return field ? null : <span className="success">{status.text}</span>
  const { error } = status
  const text = field ? error.errors[field]?.[0] : error.hasFieldErrors ? null : error.message
  return text ? <span className="error">{text}</span> : null
}

export default function Account() {
  const { user, loading, loadFailed, signOut, setUser } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Status>(null)
  const [password, setPassword] = useState<Status>(null)

  if (loading) return <p className="muted">Loading…</p>
  if (loadFailed) return <p className="error">Could not load your account. Reload to try again.</p>
  if (!user) return <Navigate to="/login" replace />

  async function saveProfile(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    const name = String(new FormData(e.currentTarget).get('name'))
    try {
      setUser(await api.updateProfile({ name }))
      setProfile({ kind: 'ok', text: 'Name saved.' })
    } catch (err) {
      setProfile({ kind: 'error', error: toApiError(err) })
    }
  }

  async function savePassword(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    try {
      const res = await api.changePassword({
        current_password: String(data.get('current_password')),
        password: String(data.get('password')),
      })
      form.reset()
      setPassword({ kind: 'ok', text: res.message })
    } catch (err) {
      setPassword({ kind: 'error', error: toApiError(err) })
    }
  }

  return (
    <div className="stack">
      <div className="card">
        <h1>Account</h1>
        <dl>
          <dt>Name</dt>
          <dd>{user.name}</dd>
          <dt>Email</dt>
          <dd>{user.email}</dd>
        </dl>
        <button
          className="secondary"
          onClick={async () => {
            await signOut()
            navigate('/login')
          }}
        >
          Sign out
        </button>
      </div>

      <form className="card" onSubmit={saveProfile}>
        <h2>Profile</h2>
        <label>
          Name
          <input name="name" defaultValue={user.name} required />
          <StatusLine status={profile} field="name" />
        </label>
        <button>Save name</button>
        <StatusLine status={profile} />
      </form>

      <form className="card" onSubmit={savePassword}>
        <h2>Change password</h2>
        <label>
          Current password
          <input name="current_password" type="password" autoComplete="current-password" required />
          <StatusLine status={password} field="current_password" />
        </label>
        <label>
          New password
          <input name="password" type="password" autoComplete="new-password" minLength={8} required />
          <StatusLine status={password} field="password" />
        </label>
        <button>Change password</button>
        <StatusLine status={password} />
      </form>
    </div>
  )
}
