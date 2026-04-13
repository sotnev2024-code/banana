import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getNotifications, markNotificationsRead, type NotificationItem } from '../api/client'
import { getLang } from '../i18n'

const typeIcons: Record<string, string> = {
  like: 'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z',
  comment: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
  reply: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
  donate: 'M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
  achievement: 'M6 9V2h12v7a6 6 0 11-12 0z',
  follow: 'M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return getLang() === 'en' ? 'now' : 'сейчас'
  if (min < 60) return `${min}m`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h`
  const d = Math.floor(hr / 24)
  return `${d}d`
}

export default function NotificationsPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getNotifications().then(d => {
      setItems(d.items)
      markNotificationsRead().catch(() => {})
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <>
      <div className="topbar" style={{ gap: 12 }}>
        <button className="back-btn" onClick={() => navigate(-1)}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M11 4L6 9l5 5"/></svg>
        </button>
        <div className="topbar-title">{getLang() === 'en' ? 'Notifications' : 'Уведомления'}</div>
      </div>

      <div style={{ padding: '4px 0' }}>
        {loading && Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 16px', borderBottom: '0.5px solid var(--border)' }}>
            <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ height: 14, width: '70%' }} />
              <div className="skeleton" style={{ height: 12, width: '40%', marginTop: 6 }} />
            </div>
          </div>
        ))}

        {!loading && items.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>
            {getLang() === 'en' ? 'No notifications yet' : 'Пока нет уведомлений'}
          </div>
        )}

        {items.map(n => (
          <div key={n.id}
            onClick={() => n.refId && navigate(`/generation/${n.refId}`)}
            style={{
              display: 'flex', gap: 12, padding: '12px 16px',
              borderBottom: '0.5px solid var(--border)',
              background: n.isRead ? 'transparent' : 'var(--accent-light)',
              cursor: n.refId ? 'pointer' : 'default',
            }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth={1.8}>
                <path d={typeIcons[n.type] ?? typeIcons.like} />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13 }}>{n.text}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{timeAgo(n.createdAt)}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
