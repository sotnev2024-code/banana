import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { AdminDashboard } from './AdminDashboard'
import { AdminUsers } from './AdminUsers'
import { AdminFeed } from './AdminFeed'
import { AdminReports } from './AdminReports'
import { AdminPayments } from './AdminPayments'
import { AdminPromos } from './AdminPromos'
import { AdminBroadcast } from './AdminBroadcast'
import { AdminLogs } from './AdminLogs'
import { AdminFeatured } from './AdminFeatured'
import { AdminModelPreviews } from './AdminModelPreviews'

const ADMIN_IDS = ['1724263429']

const TABS = [
  { id: 'dashboard', label: 'Сводка' },
  { id: 'users', label: 'Пользователи' },
  { id: 'feed', label: 'Лента' },
  { id: 'featured', label: 'Блоки' },
  { id: 'previews', label: 'Превью' },
  { id: 'reports', label: 'Жалобы' },
  { id: 'payments', label: 'Платежи' },
  { id: 'promos', label: 'Промокоды' },
  { id: 'broadcast', label: 'Рассылка' },
  { id: 'logs', label: 'Логи' },
]

export default function AdminPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState('dashboard')

  if (!user || !ADMIN_IDS.includes(user.telegramId)) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>Доступ запрещён</div>
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <div className="topbar">
        <div className="topbar-title">Админ-панель</div>
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
        {tab === 'featured' && <AdminFeatured />}
        {tab === 'previews' && <AdminModelPreviews />}
        {tab === 'reports' && <AdminReports />}
        {tab === 'payments' && <AdminPayments />}
        {tab === 'promos' && <AdminPromos />}
        {tab === 'broadcast' && <AdminBroadcast />}
        {tab === 'logs' && <AdminLogs />}
      </div>
    </div>
  )
}
