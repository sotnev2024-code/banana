import { useLocation, useNavigate } from 'react-router-dom'
import { t, getLang } from '../../i18n'

const sideTabs = [
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
    path: '/ideas',
    labelRu: 'Идеи',
    labelEn: 'Ideas',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18h6M10 22h4"/>
        <path d="M12 2a7 7 0 00-4 12.7c.6.4 1 1.1 1 1.9V17h6v-.4c0-.8.4-1.5 1-1.9A7 7 0 0012 2z"/>
      </svg>
    ),
  },
  {
    path: '/history',
    key: 'nav.history' as const,
    icon: () => (
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

const hiddenPaths = ['/plans', '/payment', '/transactions', '/referral', '/achievements', '/favorites', '/settings', '/promo', '/generation', '/admin', '/user', '/notifications']

export function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  if (hiddenPaths.some(p => location.pathname.startsWith(p))) return null

  const lang = getLang()
  // Layout: feed, ideas, [+ create center], history, profile
  const left = sideTabs.slice(0, 2)
  const right = sideTabs.slice(2)

  const renderTab = (tab: typeof sideTabs[number]) => {
    const active = location.pathname === tab.path
    const label = 'key' in tab ? t(tab.key as any) : (lang === 'en' ? tab.labelEn : tab.labelRu)
    return (
      <button
        key={tab.path}
        className={`nav-tab ${active ? 'active' : ''}`}
        onClick={() => navigate(tab.path)}
      >
        {tab.icon(active)}
        <span>{label}</span>
      </button>
    )
  }

  const createActive = location.pathname === '/create'

  return (
    <nav className="bottom-nav">
      {left.map(renderTab)}

      <button
        className={`nav-create ${createActive ? 'active' : ''}`}
        onClick={() => navigate('/create')}
        aria-label={t('nav.create')}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      </button>

      {right.map(renderTab)}
    </nav>
  )
}
