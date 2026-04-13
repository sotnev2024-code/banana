import { useLocation, useNavigate } from 'react-router-dom'
import { t } from '../../i18n'

const tabs = [
  {
    path: '/feed',
    key: 'nav.feed' as const,
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8}>
        <rect x="3" y="3" width="7" height="7" rx="1.5"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    ),
  },
  {
    path: '/create',
    key: 'nav.create' as const,
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8}>
        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
      </svg>
    ),
  },
  {
    path: '/history',
    key: 'nav.history' as const,
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
        <path d="M3 6h18M3 12h14M3 18h10"/>
      </svg>
    ),
  },
  {
    path: '/profile',
    key: 'nav.profile' as const,
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8}>
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      </svg>
    ),
  },
]

const hiddenPaths = ['/plans', '/payment', '/transactions', '/referral', '/achievements', '/favorites', '/settings', '/promo', '/generation', '/admin', '/user']

export function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  if (hiddenPaths.some(p => location.pathname.startsWith(p))) return null

  return (
    <nav className="bottom-nav">
      {tabs.map(tab => {
        const active = location.pathname === tab.path
        return (
          <button
            key={tab.path}
            className={`nav-tab ${active ? 'active' : ''}`}
            onClick={() => navigate(tab.path)}
          >
            {tab.icon(active)}
            <span>{t(tab.key)}</span>
          </button>
        )
      })}
    </nav>
  )
}
