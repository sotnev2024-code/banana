import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getFeed, type Generation } from '../api/client'
import { useAuth } from '../hooks/useAuth'
import { t } from '../i18n'

const FILTERS = [
  { label: () => t('feed.all'),    value: 'ALL' },
  { label: () => t('feed.photo'),  value: 'IMAGE' },
  { label: () => t('feed.video'),  value: 'VIDEO' },
  { label: () => t('feed.music'),  value: 'MUSIC' },
  { label: () => t('feed.motion'), value: 'MOTION' },
]

function FeedCard({ item, onClick }: { item: Generation; onClick: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const isVideo = item.type === 'VIDEO' || item.type === 'MOTION'
  const isMusic = item.type === 'MUSIC'

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
        <video ref={videoRef} src={item.resultUrl} loop muted playsInline
          style={{ width: '100%', minHeight: 140, objectFit: 'cover', borderRadius: 12 }} />
      ) : isMusic ? (
        <div style={{
          minHeight: 100, background: 'var(--accent-light)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 8, borderRadius: 12, padding: 16,
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth={1.5}>
            <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
          </svg>
          <span style={{ fontSize: 11, color: 'var(--accent-dark)', textAlign: 'center', lineHeight: 1.3 }}>
            {item.prompt.slice(0, 40)}
          </span>
        </div>
      ) : item.resultUrl ? (
        <img src={(item as any).thumbnailUrl ?? item.resultUrl} alt={item.prompt} loading="lazy"
          style={{ width: '100%', minHeight: 100, objectFit: 'cover', borderRadius: 12 }} />
      ) : (
        <div className="skeleton" style={{ height: 120 }} />
      )}
      <div className="feed-cell-footer">
        <div className="feed-cell-badge">{modelLabel}</div>
        {item.user && (
          <div className="feed-cell-author">
            {item.user.photoUrl
              ? <img src={item.user.photoUrl} alt="" className="feed-cell-avatar" />
              : <div className="feed-cell-avatar-placeholder">{item.user.firstName[0]}</div>
            }
          </div>
        )}
      </div>
    </div>
  )
}

export default function FeedPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [filterIndex, setFilterIndex] = useState(0)
  const filter = FILTERS[filterIndex].value
  const [items, setItems] = useState<Generation[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const loaderRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const [refreshing, setRefreshing] = useState(false)
  const pullStartY = useRef(0)
  const [pullDistance, setPullDistance] = useState(0)

  const loadingRef = useRef(false)
  const cursorRef = useRef<string | null>(null)

  const loadFeed = useCallback(async (reset = false) => {
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    try {
      const cur = reset ? undefined : cursorRef.current ?? undefined
      const data = await getFeed(filter, cur)
      if (reset) {
        setItems(data.items)
      } else {
        setItems(prev => {
          const existingIds = new Set(prev.map(i => i.id))
          const newItems = data.items.filter(i => !existingIds.has(i.id))
          return [...prev, ...newItems]
        })
      }
      cursorRef.current = data.nextCursor
      setCursor(data.nextCursor)
      setHasMore(!!data.nextCursor)
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }, [filter])

  const refresh = useCallback(async () => {
    setRefreshing(true)
    cursorRef.current = null
    try {
      await loadFeed(true)
    } finally {
      setRefreshing(false)
      setPullDistance(0)
    }
  }, [loadFeed])

  useEffect(() => {
    setItems([])
    cursorRef.current = null
    setCursor(null)
    setHasMore(true)
    loadFeed(true)
  }, [filter])

  useEffect(() => {
    if (!loaderRef.current) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && hasMore && !loading) loadFeed()
    }, { threshold: 0.1 })
    obs.observe(loaderRef.current)
    return () => obs.disconnect()
  }, [hasMore, loading, loadFeed])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    pullStartY.current = e.touches[0].clientY
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    // Pull-to-refresh: only when scrolled to top
    const scrollTop = scrollRef.current?.closest('.page')?.scrollTop ?? 0
    if (scrollTop <= 0 && !refreshing) {
      const dy = e.touches[0].clientY - pullStartY.current
      if (dy > 0) {
        setPullDistance(Math.min(dy * 0.4, 80))
      }
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current)

    // Category swipe
    if (Math.abs(dx) > 60 && dy < 80) {
      if (dx < 0 && filterIndex < FILTERS.length - 1) {
        setFilterIndex(filterIndex + 1)
      } else if (dx > 0 && filterIndex > 0) {
        setFilterIndex(filterIndex - 1)
      }
    }

    // Pull-to-refresh trigger
    if (pullDistance > 50) {
      refresh()
    } else {
      setPullDistance(0)
    }
  }

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">{t('feed.title')}</div>
          <div className="topbar-sub">{t('feed.subtitle')}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {user && (
            <div className="token-badge">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><circle cx="6" cy="6" r="5"/></svg>
              {user.balance}
            </div>
          )}
          <button onClick={refresh} disabled={refreshing} style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text2)" strokeWidth={2} strokeLinecap="round"
              style={refreshing ? { animation: 'spin 0.8s linear infinite' } : undefined}>
              <path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Pull-to-refresh indicator */}
      {pullDistance > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: `${pullDistance / 4}px 0`, transition: pullDistance > 50 ? 'none' : 'padding 0.2s' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth={2}
            style={{ opacity: Math.min(pullDistance / 50, 1), transform: `rotate(${pullDistance * 4}deg)` }}>
            <path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/>
          </svg>
        </div>
      )}

      <div className="filter-row">
        {FILTERS.map((f, i) => (
          <button key={f.value} className={`filter-pill ${filterIndex === i ? 'active' : ''}`}
            onClick={() => setFilterIndex(i)}>
            {f.label()}
          </button>
        ))}
      </div>

      <div ref={scrollRef} className="feed-grid" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
        {items.map(item => (
          <FeedCard key={item.id} item={item}
            onClick={() => navigate(`/generation/${item.id}`)} />
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
