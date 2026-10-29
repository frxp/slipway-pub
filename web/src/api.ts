const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'

export type User = { id: number; name: string; email: string }
export type AuthResponse = { user: User; token: string }

export class ApiError extends Error {
  errors: Record<string, string[]>

  constructor(message: string, errors: Record<string, string[]> = {}) {
    super(message)
    this.errors = errors
  }
}

export function getToken(): string | null {
  return localStorage.getItem('token')
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem('token', token)
  else localStorage.removeItem('token')
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(body.message ?? 'Request failed', body.errors)
  return body as T
}

export const api = {
  register: (data: { name: string; email: string; password: string }) =>
    request<AuthResponse>('/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    request<AuthResponse>('/login', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => request<{ message: string }>('/logout', { method: 'POST' }),
  me: () => request<User>('/me'),
}
