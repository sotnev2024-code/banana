import { getToken } from '../../api/client'

const BASE = import.meta.env.VITE_API_URL as string

async function adminReq<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}/admin${path}`, {
    method, headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? 'Request failed')
  }
  return res.json()
}

export const getDashboard = () => adminReq<any>('GET', '/dashboard')
export const getUsers = (page: number, search?: string) =>
  adminReq<any>('GET', `/users?page=${page}${search ? `&search=${search}` : ''}`)
export const getUser = (id: string) => adminReq<any>('GET', `/users/${id}`)
export const blockUser = (id: string) => adminReq<any>('POST', `/users/${id}/block`, {})
export const unblockUser = (id: string) => adminReq<any>('POST', `/users/${id}/unblock`, {})
export const adjustBalance = (id: string, amount: number, description: string) =>
  adminReq<any>('POST', `/users/${id}/balance`, { amount, description })
export const getAdminFeed = (page: number, reported?: boolean) =>
  adminReq<any>('GET', `/feed?page=${page}${reported ? '&reported=true' : ''}`)
export const hidePost = (id: string) => adminReq<any>('POST', `/feed/${id}/hide`, {})
export const showPost = (id: string) => adminReq<any>('POST', `/feed/${id}/show`, {})
export const deletePost = (id: string) => adminReq<any>('DELETE', `/feed/${id}`)
export const getReports = (page: number) => adminReq<any>('GET', `/reports?page=${page}`)
export const getPayments = (page: number) => adminReq<any>('GET', `/payments?page=${page}`)
export const getPromos = () => adminReq<any>('GET', '/promos')
export const createPromo = (code: string, tokens: number, maxUses: number) =>
  adminReq<any>('POST', '/promos', { code, tokens, maxUses })
export const togglePromo = (id: string) => adminReq<any>('POST', `/promos/${id}/toggle`, {})
export const broadcast = (message: string) => adminReq<any>('POST', '/broadcast', { message })
export const getErrorLogs = (lines = 50) => adminReq<any[]>('GET', `/logs/errors?lines=${lines}`)
export const getApiLogs = (lines = 50) => adminReq<any[]>('GET', `/logs/api?lines=${lines}`)
