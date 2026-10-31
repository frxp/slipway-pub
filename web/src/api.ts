import createClient from 'openapi-fetch'
import type { components, paths } from './schema'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'

export type User = components['schemas']['User']
export type AuthResponse =
  paths['/login']['post']['responses'][200]['content']['application/json']

export class ApiError extends Error {
  status: number
  errors: Record<string, string[]>

  constructor(message: string, status = 0, errors: Record<string, string[]> = {}) {
    super(message)
    this.status = status
    this.errors = errors
  }

  get hasFieldErrors() {
    return Object.keys(this.errors).length > 0
  }
}

export function toApiError(err: unknown): ApiError {
  return err instanceof ApiError ? err : new ApiError('Something went wrong')
}

export function getToken(): string | null {
  try {
    return localStorage.getItem('token')
  } catch {
    return null
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem('token', token)
    else localStorage.removeItem('token')
  } catch {
    // Storage can be blocked; the user then stays signed in for this page view only.
  }
}

let onUnauthorized = () => {}

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler
}

const client = createClient<paths>({ baseUrl: BASE })

client.use({
  onRequest({ request }) {
    const token = getToken()
    if (token) request.headers.set('Authorization', `Bearer ${token}`)
    request.headers.set('Accept', 'application/json')
    return request
  },
  onResponse({ response }) {
    if (response.status === 401 && getToken()) {
      setToken(null)
      onUnauthorized()
    }
  },
})

async function unwrap<T>(
  call: Promise<{ data?: T; error?: unknown; response: Response }>,
): Promise<T> {
  const result = await call.catch(() => {
    throw new ApiError('Could not reach the server.')
  })
  if (result.data !== undefined) return result.data
  const body = (result.error ?? {}) as { message?: string; errors?: Record<string, string[]> }
  throw new ApiError(body.message ?? 'Request failed', result.response.status, body.errors)
}

export const api = {
  register: (body: { name: string; email: string; password: string }) =>
    unwrap(client.POST('/register', { body })),
  login: (body: { email: string; password: string }) => unwrap(client.POST('/login', { body })),
  logout: () => unwrap(client.POST('/logout')),
  me: () => unwrap(client.GET('/me')),
  forgotPassword: (body: { email: string }) =>
    unwrap(client.POST('/forgot-password', { body })),
  resetPassword: (body: { token: string; email: string; password: string }) =>
    unwrap(client.POST('/reset-password', { body })),
  updateProfile: (body: { name: string }) => unwrap(client.PATCH('/me', { body })),
  changePassword: (body: { current_password: string; password: string }) =>
    unwrap(client.PUT('/me/password', { body })),
}
