import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const MAIN_TABS = ['/feed', '/create', '/history', '/profile']

export function useBackButton() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    if (!tg?.BackButton) return

    const isFeed = location.pathname === '/feed' || location.pathname === '/'
    const isMainTab = MAIN_TABS.includes(location.pathname)

    if (isFeed) {
      // On feed — back button asks to close app
      tg.BackButton.show()

      const handler = () => {
        tg.showConfirm('Close the app?', (confirmed: boolean) => {
          if (confirmed) tg.close()
        })
      }

      tg.BackButton.onClick(handler)
      return () => { tg.BackButton.offClick(handler) }
    }

    if (isMainTab) {
      // On other main tabs — back goes to feed
      tg.BackButton.show()

      const handler = () => { navigate('/feed') }

      tg.BackButton.onClick(handler)
      return () => { tg.BackButton.offClick(handler) }
    }

    // Sub-pages — back navigates up
    tg.BackButton.show()

    const handler = () => {
      if (location.pathname.startsWith('/generation/')) {
        navigate('/feed')
      } else if (location.pathname === '/admin') {
        navigate('/profile')
      } else {
        navigate(-1)
      }
    }

    tg.BackButton.onClick(handler)
    return () => { tg.BackButton.offClick(handler) }
  }, [location.pathname, navigate])
}
