import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { authTelegram, setToken, type UserFull } from '../api/client'
import { setLang, detectLang, detectTheme } from '../i18n'

interface AuthCtx {
  user: UserFull | null
  loading: boolean
  refresh: () => Promise<void>
}

const Ctx = createContext<AuthCtx>({ user: null, loading: true, refresh: async () => {} })

function applyTheme(theme: string) {
  // Neon Cyber design is dark-first. "auto" → dark unless user explicitly chose light.
  const resolved = theme === 'light' ? 'light' : 'dark'
  document.documentElement.setAttribute('data-theme', resolved)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserFull | null>(null)
  const [loading, setLoading] = useState(true)

  const init = async () => {
    try {
      // Auto-detect from Telegram
      const detectedLang = detectLang()
      const detectedTheme = detectTheme()
      setLang(detectedLang)
      applyTheme(detectedTheme)

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

      // Apply user's saved preferences (override auto-detect)
      if (user.lang) setLang(user.lang)
      if (user.theme) applyTheme(user.theme)
    } catch (e) {
      console.error('Auth failed', e)
    } finally {
      setLoading(false)
    }
  }

  const refresh = useCallback(async () => {
    const { getMe } = await import('../api/client')
    const u = await getMe()
    setUser(u)
    if (u.lang) setLang(u.lang)
    if (u.theme) applyTheme(u.theme)
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('jwt')
    if (saved) setToken(saved)
    init()
  }, [])

  return <Ctx.Provider value={{ user, loading, refresh }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
