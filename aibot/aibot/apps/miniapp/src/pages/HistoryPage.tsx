import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyGenerations, type Generation } from '../api/client'
import { useAuth } from '../hooks/useAuth'
import { t, getLang } from '../i18n'

const STATUS_FILTERS = [
  { id: 'all',     labelRu: 'Все',     labelEn: 'All' },
  { id: 'DONE',    labelRu: 'Готово',  labelEn: 'Done' },
  { id: 'VIDEO',   labelRu: 'Видео',   labelEn: 'Video' },
  { id: 'IMAGE',   labelRu: 'Фото',    labelEn: 'Photo' },
  { id: 'MUSIC',   labelRu: 'Музыка',  labelEn: 'Music' },
  { id: 'MOTION',  labelRu: 'Motion',  labelEn: 'Motion' },
] as const

type FilterId = typeof STATUS_FILTERS[number]['id']

function HistoryRow({ item, onRecreate }: { item: Generation; onRecreate: () => void }) {
  const lang = getLang()
  const isVideoLike = item.type === 'VIDEO' || item.type === 'MOTION'
  const thumb = (item as any).thumbnailUrl ?? item.resultUrl
  const status = item.status

  const ago = (() => {
    const d = new Date(item.createdAt)
    const diff = (Date.now() - d.getTime()) / 1000
    if (diff < 60) return lang === 'en' ? 'just now' : 'сейчас'
    if (diff < 3600) return `${Math.floor(diff / 60)} ${lang === 'en' ? 'min' : 'мин'}`
    if (diff < 86400) return `${Math.floor(diff / 3600)} ${lang === 'en' ? 'h' : 'ч'}`
    if (diff < 86400 * 2) return lang === 'en' ? 'Yesterday' : 'Вчера'
    return d.toLocaleDateString(lang === 'en' ? 'en' : 'ru', { day: 'numeric', month: 'short' })
  })()

  return (
    <div style={{
      display: 'flex', gap: 12, padding: 10, borderRadius: 12,
      background: 'var(--surface)', border: '1px solid var(--border)',
    }}>
      {/* Thumbnail */}
      <div style={{
        width: 74, height: 74, borderRadius: 8, flexShrink: 0, overflow: 'hidden',
        background: 'var(--surface2)', position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {thumb ? (
          <img src={thumb} alt="" loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth={1.5}>
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
          </svg>
        )}
        {isVideoLike && thumb && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.25)',
          }}>
            <svg width="14" height="14" viewBox="0 0 12 12"><path d="M3 2 L10 6 L3 10 Z" fill="#fff"/></svg>
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <span style={{
            fontSize: 10, color: 'var(--accent)', fontFamily: 'var(--font-mono)',
            fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase',
          }}>
            ✦ {item.model.replace(/-/g, ' ')}
          </span>
          <span style={{
            fontSize: 9, color: 'var(--text3)', fontFamily: 'var(--font-mono)',
          }}>· {ago}</span>
          {(status === 'PENDING' || status === 'PROCESSING') && (
            <span className="badge badge-proc">{t(`history.status.${status.toLowerCase()}` as any)}</span>
          )}
          {(status === 'FAILED' || status === 'REFUNDED') && (
            <span className="badge badge-fail">{t(`history.status.${status.toLowerCase()}` as any)}</span>
          )}
        </div>

        <div style={{
          color: 'var(--text)', fontSize: 13, lineHeight: 1.35,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {item.prompt}
        </div>

        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <button className="btn-chip" onClick={() => navigator.clipboard?.writeText(item.prompt).catch(() => {})}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="8" y="8" width="13" height="13" rx="2"/>
              <path d="M16 8V5a2 2 0 00-2-2H5a2 2 0 00-2 2v9a2 2 0 002 2h3"/>
            </svg>
          </button>
          <button className="btn-chip accent" onClick={onRecreate}>
            ✦ {lang === 'en' ? 'recreate' : 'повторить'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function HistoryPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState<Generation[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterId>('all')
  const lang = getLang()

  useEffect(() => {
    getMyGenerations().then(d => { setItems(d.items); setLoading(false) })
  }, [])

  const filtered = items.filter(it => {
    if (filter === 'all') return true
    if (filter === 'DONE') return it.status === 'DONE'
    return it.type === filter
  })

  return (
    <>
      <div className="topbar">
        <div className="topbar-eyebrow">LOG</div>
        <div className="topbar-title">{lang === 'en' ? 'HISTORY' : 'ИСТОРИЯ'}</div>
      </div>

      {/* Status filters */}
      <div className="filter-row noscroll">
        {STATUS_FILTERS.map(f => (
          <button key={f.id} className={`filter-pill ${filter === f.id ? 'active' : ''}`}
            onClick={() => setFilter(f.id)}>
            {lang === 'en' ? f.labelEn : f.labelRu}
          </button>
        ))}
      </div>

      <div style={{ padding: '4px 12px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading && Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{
            display: 'flex', gap: 12, padding: 10, borderRadius: 12,
            background: 'var(--surface)', border: '1px solid var(--border)',
          }}>
            <div className="skeleton" style={{ width: 74, height: 74, borderRadius: 8, flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div className="skeleton" style={{ height: 14, width: '50%' }} />
              <div className="skeleton" style={{ height: 12, width: '90%' }} />
              <div className="skeleton" style={{ height: 12, width: '70%' }} />
            </div>
          </div>
        ))}

        {!loading && filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{
              fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)',
              letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8,
            }}>— {lang === 'en' ? 'empty log' : 'пустой лог'}</div>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>{t('history.empty')}</div>
          </div>
        )}

        {filtered.map(item => (
          <HistoryRow key={item.id} item={item}
            onRecreate={() => navigate('/create', { state: { prompt: item.prompt, model: item.model } })} />
        ))}
      </div>
    </>
  )
}
