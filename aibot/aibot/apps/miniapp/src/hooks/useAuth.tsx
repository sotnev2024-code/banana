import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { authTelegram, setToken, type UserFull } from '../api/client'

interface AuthCtx {
  user: UserFull | null
  loading: boolean
  refresh: () => Promise<void>
}

const Ctx = createContext<AuthCtx>({ user: null, loading: true, refresh: async () => {} })

function applyTheme(theme: string) {
  document.documentElement.setAttribute('data-theme', theme || 'auto')
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserFull | null>(null)
  const [loading, setLoading] = useState(true)

  const init = async () => {
    try {
      const tg = window.Telegram?.WebApp
      const initData = tg?.initData ?? ''

      if (!initData) {
        console.warn('No Telegram initData — dev mode')
        setLoading(false)
        return
      }

      const { token, user } = await authTelegram(initData)
      setToken(token)
      localStorage.setItem('jwt', token)
      setUser(user)
      applyTheme(user.theme)
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
    applyTheme(u.theme)
  }

  useEffect(() => {
    const saved = localStorage.getItem('jwt')
    if (saved) setToken(saved)
    init()
  }, [])

  return <Ctx.Provider value={{ user, loading, refresh }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
