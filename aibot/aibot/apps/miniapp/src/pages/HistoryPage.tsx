import { useState, useEffect } from 'react'
import { getMyGenerations, type Generation } from '../api/client'
import { useAuth } from '../hooks/useAuth'
import { t } from '../i18n'

export default function HistoryPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<Generation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyGenerations().then(d => { setItems(d.items); setLoading(false) })
  }, [])

  const statusClass: Record<string, string> = {
    DONE: 'badge-done', PENDING: 'badge-pend', PROCESSING: 'badge-proc', FAILED: 'badge-fail', REFUNDED: 'badge-fail',
  }

  return (
    <>
      <div className="topbar">
        <div><div className="topbar-title">{t('history.title')}</div></div>
        {user && <div className="token-badge">{user.balance}</div>}
      </div>
      <div style={{ padding: '8px 0' }}>
        {loading && Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 16px', borderBottom: '0.5px solid var(--border)' }}>
            <div className="skeleton" style={{ width: 52, height: 52, borderRadius: 10, flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div className="skeleton" style={{ height: 14, width: '60%' }} />
              <div className="skeleton" style={{ height: 12, width: '90%' }} />
            </div>
          </div>
        ))}
        {!loading && items.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>{t('history.empty')}</div>
        )}
        {items.map(item => (
          <div key={item.id} style={{ display: 'flex', gap: 12, padding: '12px 16px', borderBottom: '0.5px solid var(--border)', alignItems: 'center' }}>
            <div style={{
              width: 52, height: 52, borderRadius: 10, flexShrink: 0, overflow: 'hidden',
              background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {item.resultUrl && item.type === 'IMAGE'
                ? <img src={item.resultUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : item.resultUrl && (item.type === 'VIDEO' || item.type === 'MOTION')
                ? <video src={item.resultUrl} muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth={1.5}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{item.model.replace(/-/g, ' ')}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.prompt}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                -{item.tokensSpent} · {new Date(item.createdAt).toLocaleDateString('ru')}
              </div>
            </div>
            <span className={`badge ${statusClass[item.status] ?? 'badge-pend'}`}>
              {t(`history.status.${item.status.toLowerCase()}` as any)}
            </span>
          </div>
        ))}
      </div>
    </>
  )
}
