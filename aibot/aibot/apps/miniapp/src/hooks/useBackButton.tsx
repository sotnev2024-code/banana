import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

// Pages where back button should NOT show (main tabs)
const MAIN_PAGES = ['/feed', '/create', '/history', '/profile', '/']

export function useBackButton() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    if (!tg?.BackButton) return

    const isMain = MAIN_PAGES.includes(location.pathname)

    if (isMain) {
      tg.BackButton.hide()
    } else {
      tg.BackButton.show()

      const handler = () => {
        // If in generation viewer, go back to feed
        if (location.pathname.startsWith('/generation/')) {
          navigate('/feed')
        } else if (location.pathname === '/admin') {
          navigate('/profile')
        } else {
          navigate(-1)
        }
      }

      tg.BackButton.onClick(handler)
      return () => {
        tg.BackButton.offClick(handler)
      }
    }
  }, [location.pathname, navigate])
}
