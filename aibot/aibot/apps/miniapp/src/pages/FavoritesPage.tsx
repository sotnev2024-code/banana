import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getFavorites, removeFavorite, type Generation } from '../api/client'
import { t } from '../i18n'

export default function FavoritesPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<Generation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getFavorites().then(setItems).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleRemove = async (id: string) => {
    await removeFavorite(id).catch(() => {})
    setItems(prev => prev.filter(g => g.id !== id))
  }

  return (
    <>
      <div className="topbar" style={{ gap: 12 }}>
        <button className="back-btn" onClick={() => navigate(-1)}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M11 4L6 9l5 5"/></svg>
        </button>
        <div className="topbar-title">{t('fav.title')}</div>
      </div>

      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: 8 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 140, borderRadius: 12 }} />
          ))}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth={1.5} style={{ margin: '0 auto 12px' }}>
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
          </svg>
          <div style={{ fontSize: 16, fontWeight: 500 }}>{t('fav.empty')}</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>{t('fav.emptyDesc')}</div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: 8 }}>
        {items.map(item => (
          <div key={item.id} style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: 'var(--surface2)' }}>
            {item.resultUrl && item.type === 'IMAGE' ? (
              <img src={item.resultUrl} alt="" style={{ width: '100%', height: 140, objectFit: 'cover' }} />
            ) : item.resultUrl && (item.type === 'VIDEO' || item.type === 'MOTION') ? (
              <video src={item.resultUrl} muted playsInline style={{ width: '100%', height: 140, objectFit: 'cover' }} />
            ) : (
              <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth={1.5}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
              </div>
            )}
            <div style={{ padding: '8px 10px' }}>
              <div style={{ fontSize: 12, fontWeight: 500 }}>{item.model.replace(/-/g, ' ')}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.prompt}</div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); handleRemove(item.id) }} style={{
              position: 'absolute', top: 6, right: 6, width: 28, height: 28, borderRadius: '50%',
              background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 14, backdropFilter: 'blur(4px)',
            }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><path d="M2 2l8 8M10 2l-8 8"/></svg>
            </button>
          </div>
        ))}
      </div>
    </>
  )
}
