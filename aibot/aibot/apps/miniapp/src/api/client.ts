const BASE = import.meta.env.VITE_API_URL as string

let _token: string | null = null

export function setToken(t: string) { _token = t }
export function getToken() { return _token }

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (_token) headers['Authorization'] = `Bearer ${_token}`

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw Object.assign(new Error(err.error ?? 'Request failed'), { status: res.status, ...err })
  }
  return res.json()
}

// Auth
export const authTelegram = (initData: string) =>
  req<{ token: string; user: User; isNew: boolean }>('POST', '/auth/telegram', { initData })

// Profile
export const getMe = () => req<User>('GET', '/me')
export const getMyGenerations = (cursor?: string) =>
  req<PaginatedGenerations>('GET', `/me/generations${cursor ? `?cursor=${cursor}` : ''}`)

// Feed
export const getFeed = (type?: string, cursor?: string) => {
  const params = new URLSearchParams()
  if (type && type !== 'ALL') params.set('type', type)
  if (cursor) params.set('cursor', cursor)
  return req<PaginatedGenerations>('GET', `/feed?${params}`)
}

// Generate
export const createGeneration = (body: { model: string; prompt: string; imageUrl?: string; isPublic?: boolean }) =>
  req<{ id: string; status: string }>('POST', '/generate', body)

export const getGeneration = (id: string) =>
  req<Generation>('GET', `/generate/${id}`)

// Plans
export const getPlans = () => req<Plan[]>('GET', '/plans')

// Payment
export const createPayment = (planId: string) =>
  req<{ paymentId: string; confirmationUrl: string }>('POST', '/payment/yukassa/create', { planId })

// Types
export interface User {
  id: string
  telegramId: string
  firstName: string
  lastName?: string
  username?: string
  photoUrl?: string
  balance: number
}

export interface Generation {
  id: string
  type: 'IMAGE' | 'VIDEO' | 'MUSIC' | 'MOTION'
  model: string
  prompt: string
  status: 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED'
  resultUrl?: string
  tokensSpent: number
  isPublic: boolean
  createdAt: string
  user?: { firstName: string; username?: string; photoUrl?: string }
}

export interface PaginatedGenerations {
  items: Generation[]
  nextCursor: string | null
}

export interface Plan {
  id: string
  name: string
  tokens: number
  bonusTokens: number
  priceRub: number
  popular?: boolean
}
