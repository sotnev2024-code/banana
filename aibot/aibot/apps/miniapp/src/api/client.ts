const BASE = import.meta.env.VITE_API_URL as string

let _token: string | null = null

export function setToken(t: string) { _token = t }
export function getToken() { return _token }

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (_token) headers['Authorization'] = `Bearer ${_token}`

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw Object.assign(new Error(err.error ?? 'Request failed'), { status: res.status, ...err })
  }
  return res.json()
}

// Auth
export const authTelegram = (initData: string) =>
  req<{ token: string; user: UserFull; isNew: boolean }>('POST', '/auth/telegram', { initData })

// Profile
export const getMe = () => req<UserFull>('GET', '/me')
export const getMyGenerations = (cursor?: string) =>
  req<PaginatedGenerations>('GET', `/me/generations${cursor ? `?cursor=${cursor}` : ''}`)
export const getMyTransactions = () =>
  req<Transaction[]>('GET', '/me/transactions')
export const updateSettings = (settings: { lang?: string; theme?: string }) =>
  req<UserFull>('PUT', '/me/settings', settings)

// Feed
export const getFeed = (type?: string, cursor?: string) => {
  const params = new URLSearchParams()
  if (type && type !== 'ALL') params.set('type', type)
  if (cursor) params.set('cursor', cursor)
  return req<PaginatedGenerations>('GET', `/feed?${params}`)
}

// Upload
export async function uploadFile(file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)

  const headers: Record<string, string> = {}
  if (_token) headers['Authorization'] = `Bearer ${_token}`

  const res = await fetch(`${BASE}/upload`, { method: 'POST', headers, body: form })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload failed' }))
    throw new Error(err.error ?? 'Upload failed')
  }
  const data = await res.json() as { url: string }
  return data.url
}

// Generate
export const createGeneration = (body: { model: string; prompt: string; imageUrl?: string; isPublic?: boolean; settings?: Record<string, string | number | boolean> }) =>
  req<{ id: string; status: string }>('POST', '/generate', body)

export const getGeneration = (id: string) =>
  req<Generation>('GET', `/generate/${id}`)

export const getFeedItem = (id: string) =>
  req<GenerationDetail>('GET', `/feed/${id}`)

// Likes
export const toggleLike = (id: string) =>
  req<{ liked: boolean; likesCount: number }>('POST', `/feed/${id}/like`, {})

// Report
export const reportGeneration = (id: string, reason?: string) =>
  req<{ ok: boolean }>('POST', `/feed/${id}/report`, { reason: reason ?? 'inappropriate' })

// Comments
export const getComments = (id: string) =>
  req<CommentItem[]>('GET', `/feed/${id}/comments`)
export const addComment = (id: string, text: string) =>
  req<CommentItem>('POST', `/feed/${id}/comments`, { text })

// Plans
export const getPlans = () => req<Plan[]>('GET', '/plans')

// Payment
export const createPayment = (planId: string) =>
  req<{ paymentId: string; confirmationUrl: string }>('POST', '/payment/yukassa/create', { planId })

// Daily bonus
export const claimDailyBonus = () =>
  req<{ tokens: number; streak: number; nextClaimAt: string }>('POST', '/me/daily', {})

// Referral
export const getReferralStats = () =>
  req<{ code: string; count: number; earned: number; referrals: ReferralUser[] }>('GET', '/me/referrals')

// Achievements
export const getAchievements = () =>
  req<{ unlocked: string[]; all: AchievementInfo[] }>('GET', '/me/achievements')

// Favorites
export const getFavorites = () =>
  req<Generation[]>('GET', '/me/favorites')
export const addFavorite = (generationId: string) =>
  req<{ ok: boolean }>('POST', '/me/favorites', { generationId })
export const removeFavorite = (generationId: string) =>
  req<{ ok: boolean }>('DELETE', `/me/favorites/${generationId}`)

// Promo codes
export const redeemPromo = (code: string) =>
  req<{ tokens: number; message: string }>('POST', '/me/promo', { code })

// Stats
export const getStats = () =>
  req<UserStats>('GET', '/me/stats')

// Types
export interface UserFull {
  id: string
  telegramId: string
  firstName: string
  lastName?: string
  username?: string
  photoUrl?: string
  balance: number
  totalSpent: number
  referralCode: string
  dailyStreak: number
  lastDailyAt?: string
  lang: string
  theme: string
  createdAt: string
}

// Keep backward compat
export type User = UserFull

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
  isFavorited?: boolean
  user?: { firstName: string; username?: string; photoUrl?: string }
}

export interface GenerationDetail extends Generation {
  imageUrl?: string
  settings?: Record<string, string | number | boolean>
  likesCount: number
  commentsCount: number
  isLiked?: boolean
  comments?: CommentItem[]
}

export interface CommentItem {
  id: string
  text: string
  createdAt: string
  user: { firstName: string; username?: string; photoUrl?: string }
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

export interface Transaction {
  id: string
  amount: number
  type: string
  description: string
  createdAt: string
}

export interface ReferralUser {
  firstName: string
  username?: string
  createdAt: string
}

export interface AchievementInfo {
  id: string
  name: string
  description: string
  icon: string
  category: string
  threshold: number
  reward: number
  unlocked: boolean
  unlockedAt?: string
}

export interface UserStats {
  totalGenerations: number
  byType: Record<string, number>
  favoriteModel: string | null
  totalSpent: number
  memberSince: string
}
