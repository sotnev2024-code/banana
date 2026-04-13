import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const MAIN_TABS = ['/feed', '/create', '/history', '/profile']

export function useBackButton() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    try {
      const tg = window.Telegram?.WebApp
      if (!tg?.BackButton) return

      const isFeed = location.pathname === '/feed' || location.pathname === '/'
      const isMainTab = MAIN_TABS.includes(location.pathname)

      tg.BackButton.show()

      const handler = () => {
        try {
          if (isFeed) {
            tg.showConfirm('Close the app?', (confirmed: boolean) => {
              if (confirmed) tg.close()
            })
          } else if (isMainTab) {
            navigate('/feed')
          } else if (location.pathname.startsWith('/generation/')) {
            navigate('/feed')
          } else if (location.pathname === '/admin') {
            navigate('/profile')
          } else {
            navigate(-1)
          }
        } catch {
          navigate(-1)
        }
      }

      tg.BackButton.onClick(handler)
      return () => {
        try { tg.BackButton.offClick(handler) } catch {}
      }
    } catch {}
  }, [location.pathname, navigate])
}
