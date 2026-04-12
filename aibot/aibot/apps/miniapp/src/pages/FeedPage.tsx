import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getFeed, type Generation } from '../api/client'
import { useAuth } from '../hooks/useAuth'

const FILTERS = [
  { label: 'Все',    value: 'ALL' },
  { label: 'Фото',   value: 'IMAGE' },
  { label: 'Видео',  value: 'VIDEO' },
  { label: 'Музыка', value: 'MUSIC' },
  { label: 'Motion', value: 'MOTION' },
]

function FeedCard({ item, onClick }: { item: Generation; onClick: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const isVideo = item.type === 'VIDEO' || item.type === 'MOTION'
  const isMusic = item.type === 'MUSIC'

  // Autoplay video on hover / intersection
  useEffect(() => {
    if (!videoRef.current) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) videoRef.current?.play().catch(() => {})
        else videoRef.current?.pause()
      },
      { threshold: 0.5 },
    )
    obs.observe(videoRef.current)
    return () => obs.disconnect()
  }, [])

  const modelLabel = item.model.replace(/-/g, ' ')

  return (
    <div className="feed-cell" onClick={onClick}>
      {isVideo && item.resultUrl ? (
        <video
          ref={videoRef}
          src={item.resultUrl}
          loop
          muted
          playsInline
          style={{ width: '100%', minHeight: 140, objectFit: 'cover', borderRadius: 12 }}
        />
      ) : isMusic ? (
        <div style={{
          minHeight: 100,
          background: 'linear-gradient(135deg, #EEEDFE 0%, #E1F5EE 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          borderRadius: 12,
          padding: 16,
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7f77dd" strokeWidth={1.5}>
            <path d="M9 18V5l12-2v13"/>
            <circle cx="6" cy="18" r="3"/>
            <circle cx="18" cy="16" r="3"/>
          </svg>
          <span style={{ fontSize: 11, color: '#534ab7', textAlign: 'center', lineHeight: 1.3 }}>
            {item.prompt.slice(0, 40)}
          </span>
        </div>
      ) : item.resultUrl ? (
        <img
          src={item.resultUrl}
          alt={item.prompt}
          loading="lazy"
          style={{ width: '100%', minHeight: 100, objectFit: 'cover', borderRadius: 12 }}
        />
      ) : (
        <div className="skeleton" style={{ height: 120 }} />
      )}
      <div className="feed-cell-badge">{modelLabel}</div>
    </div>
  )
}

export default function FeedPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [filter, setFilter] = useState('ALL')
  const [items, setItems] = useState<Generation[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const loaderRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async (reset = false) => {
    if (loading) return
    setLoading(true)
    try {
      const cur = reset ? undefined : cursor ?? undefined
      const data = await getFeed(filter, cur)
      setItems(prev => reset ? data.items : [...prev, ...data.items])
      setCursor(data.nextCursor)
      setHasMore(!!data.nextCursor)
    } finally {
      setLoading(false)
    }
  }, [filter, cursor, loading])

  // Reset when filter changes
  useEffect(() => {
    setItems([])
    setCursor(null)
    setHasMore(true)
    load(true)
  }, [filter])

  // Infinite scroll
  useEffect(() => {
    if (!loaderRef.current) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && hasMore && !loading) load()
    }, { threshold: 0.1 })
    obs.observe(loaderRef.current)
    return () => obs.disconnect()
  }, [hasMore, loading, load])

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">AI Студия</div>
          <div className="topbar-sub">лента генераций</div>
        </div>
        {user && (
          <div className="token-badge">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <circle cx="6" cy="6" r="5"/>
            </svg>
            {user.balance}
          </div>
        )}
      </div>

      <div className="filter-row">
        {FILTERS.map(f => (
          <button
            key={f.value}
            className={`filter-pill ${filter === f.value ? 'active' : ''}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="feed-grid">
        {items.map(item => (
          <FeedCard
            key={item.id}
            item={item}
            onClick={() => navigate('/create', { state: { prompt: item.prompt, model: item.model } })}
          />
        ))}
        {loading && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="feed-cell">
            <div className="skeleton" style={{ height: i % 3 === 0 ? 200 : 130 }} />
          </div>
        ))}
      </div>

      <div ref={loaderRef} style={{ height: 20 }} />
    </>
  )
}
