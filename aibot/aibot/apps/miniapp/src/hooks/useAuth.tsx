import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { authTelegram, setToken, type User } from '../api/client'

interface AuthCtx {
  user: User | null
  loading: boolean
  refresh: () => Promise<void>
}

const Ctx = createContext<AuthCtx>({ user: null, loading: true, refresh: async () => {} })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const init = async () => {
    try {
      const tg = window.Telegram?.WebApp
      const initData = tg?.initData ?? ''

      if (!initData) {
        // Dev fallback — use a mock token if no Telegram context
        console.warn('No Telegram initData — dev mode')
        setLoading(false)
        return
      }

      const { token, user } = await authTelegram(initData)
      setToken(token)
      localStorage.setItem('jwt', token)
      setUser(user)
    } catch (e) {
      console.error('Auth failed', e)
    } finally {
      setLoading(false)
    }
  }

  const refresh = async () => {
    const { getMe } = await import('../api/client')
    const u = await getMe()
    setUser(u)
  }

  useEffect(() => {
    // Restore token from storage if available
    const saved = localStorage.getItem('jwt')
    if (saved) setToken(saved)
    init()
  }, [])

  return <Ctx.Provider value={{ user, loading, refresh }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
