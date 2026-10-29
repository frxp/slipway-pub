import createClient from 'openapi-fetch'
import type { components, paths } from './schema'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'

export type User = components['schemas']['User']
export type AuthResponse =
  paths['/login']['post']['responses'][200]['content']['application/json']

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

const client = createClient<paths>({ baseUrl: BASE })

client.use({
  onRequest({ request }) {
    const token = getToken()
    if (token) request.headers.set('Authorization', `Bearer ${token}`)
    request.headers.set('Accept', 'application/json')
    return request
  },
})

function fail(error: unknown): never {
  const body = (error ?? {}) as { message?: string; errors?: Record<string, string[]> }
  throw new ApiError(body.message ?? 'Request failed', body.errors)
}

export const api = {
  async register(body: { name: string; email: string; password: string }) {
    const { data, error } = await client.POST('/register', { body })
    if (!data) fail(error)
    return data
  },
  async login(body: { email: string; password: string }) {
    const { data, error } = await client.POST('/login', { body })
    if (!data) fail(error)
    return data
  },
  async logout() {
    const { data, error } = await client.POST('/logout')
    if (!data) fail(error)
    return data
  },
  async me() {
    const { data, error } = await client.GET('/me')
    if (!data) fail(error)
    return data
  },
  async updateProfile(body: { name: string }) {
    const { data, error } = await client.PATCH('/me', { body })
    if (!data) fail(error)
    return data
  },
  async changePassword(body: { current_password: string; password: string }) {
    const { data, error } = await client.PUT('/me/password', { body })
    if (!data) fail(error)
    return data
  },
}
