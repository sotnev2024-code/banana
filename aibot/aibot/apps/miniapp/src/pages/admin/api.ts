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

// Featured blocks
export const adminListFeatured = () => adminReq<any[]>('GET', '/featured')
export const adminCreateFeatured = (body: any) => adminReq<any>('POST', '/featured', body)
export const adminUpdateFeatured = (id: string, body: any) => adminReq<any>('PUT', `/featured/${id}`, body)
export const adminDeleteFeatured = (id: string) => adminReq<any>('DELETE', `/featured/${id}`)

// Model previews
export const adminListModelPreviews = () => adminReq<any[]>('GET', '/model-previews')
export const adminUpsertModelPreview = (modelId: string, body: { mediaUrl: string; mediaType: 'image' | 'video' }) =>
  adminReq<any>('PUT', `/model-previews/${modelId}`, body)
export const adminDeleteModelPreview = (modelId: string) => adminReq<any>('DELETE', `/model-previews/${modelId}`)

// Media upload (with compression on server)
export async function adminUploadMedia(file: File): Promise<{ url: string; mediaType: 'image' | 'video' }> {
  const form = new FormData()
  form.append('file', file)
  const headers: Record<string, string> = {}
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${BASE}/admin/upload-media`, { method: 'POST', headers, body: form })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload failed' }))
    throw new Error(err.error ?? 'Upload failed')
  }
  return res.json()
}
