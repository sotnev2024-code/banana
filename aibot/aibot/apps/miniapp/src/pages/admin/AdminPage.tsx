import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { AdminDashboard } from './AdminDashboard'
import { AdminUsers } from './AdminUsers'
import { AdminFeed } from './AdminFeed'
import { AdminReports } from './AdminReports'
import { AdminPayments } from './AdminPayments'
import { AdminPromos } from './AdminPromos'
import { AdminBroadcast } from './AdminBroadcast'

const ADMIN_IDS = ['1724263429']

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'users', label: 'Users' },
  { id: 'feed', label: 'Feed' },
  { id: 'reports', label: 'Reports' },
  { id: 'payments', label: 'Payments' },
  { id: 'promos', label: 'Promos' },
  { id: 'broadcast', label: 'Broadcast' },
]

export default function AdminPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState('dashboard')

  if (!user || !ADMIN_IDS.includes(user.telegramId)) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>Access denied</div>
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <div className="topbar">
        <div className="topbar-title">Admin</div>
      </div>

      <div className="filter-row">
        {TABS.map(t => (
          <button key={t.id} className={`filter-pill ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '8px 12px 100px' }}>
        {tab === 'dashboard' && <AdminDashboard />}
        {tab === 'users' && <AdminUsers />}
        {tab === 'feed' && <AdminFeed />}
        {tab === 'reports' && <AdminReports />}
        {tab === 'payments' && <AdminPayments />}
        {tab === 'promos' && <AdminPromos />}
        {tab === 'broadcast' && <AdminBroadcast />}
      </div>
    </div>
  )
}
