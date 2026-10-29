import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'

export default function Account() {
  const { user, loading, signOut } = useAuth()
  const navigate = useNavigate()

  if (loading) return <p className="muted">Loading…</p>
  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="card">
      <h1>Account</h1>
      <dl>
        <dt>Name</dt>
        <dd>{user.name}</dd>
        <dt>Email</dt>
        <dd>{user.email}</dd>
      </dl>
      <button
        onClick={async () => {
          await signOut()
          navigate('/login')
        }}
      >
        Sign out
      </button>
    </div>
  )
}
