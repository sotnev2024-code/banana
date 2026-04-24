import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { MODELS, type ModelConfig } from '@aibot/shared'
import { getFeed, type Generation } from '../api/client'
import { useAuth } from '../hooks/useAuth'
import { t, getLang } from '../i18n'

const FILTERS = [
  { label: () => t('feed.all'),    value: 'ALL' },
  { label: () => t('feed.photo'),  value: 'IMAGE' },
  { label: () => t('feed.video'),  value: 'VIDEO' },
  { label: () => t('feed.music'),  value: 'MUSIC' },
  { label: () => t('feed.motion'), value: 'MOTION' },
]

// Featured model cards shown in horizontal scroller (admin-curated feel).
// Each links straight to /create with the model preselected.
const FEATURED: { id: string; badge?: 'HOT' | 'NEW' | 'PRO'; badgeRu?: string }[] = [
  { id: 'nano-banana-pro', badge: 'NEW' },
  { id: 'veo3-fast',       badge: 'HOT' },
  { id: 'kling-3-0' },
  { id: 'seedance-2' },
  { id: 'nano-banana-2' },
  { id: 'suno-v5-5',       badge: 'PRO' },
  { id: 'kling-3-0-motion' },
  { id: 'grok-image-to-video' },
]

const PREVIEW_BASE = '/uploads/previews'
const PREVIEWS: Record<string, { type: 'image' | 'video'; file: string }> = {
  'nano-banana-pro':    { type: 'image', file: 'nano-banana-pro-thumb.jpg' },
  'nano-banana-2':      { type: 'image', file: 'nano-banana-2-thumb.jpg' },
  'veo3-fast':          { type: 'video', file: 'veo3-sm.mp4' },
  'veo3-lite':          { type: 'video', file: 'veo3-sm.mp4' },
  'veo3-quality':       { type: 'video', file: 'veo3-sm.mp4' },
  'kling-3-0':          { type: 'video', file: 'kling-3-0-sm.mp4' },
  'seedance-2':         { type: 'video', file: 'seedance-2-sm.mp4' },
  'kling-3-0-motion':   { type: 'video', file: 'kling-3-0-motion-sm.mp4' },
  'kling-2-6-motion':   { type: 'video', file: 'kling-2-6-motion-sm.mp4' },
  'grok-image-to-video':{ type: 'video', file: 'grok-image-to-video-sm.mp4' },
  'grok-text-to-video': { type: 'video', file: 'grok-text-to-video-sm.mp4' },
  'kling-2-6-i2v':      { type: 'video', file: 'kling-2-6-i2v-sm.mp4' },
}

function modelShortName(raw: string): string {
  // "kling-3-0" → "KLING 3.0", "nano-banana-pro" → "NANO BANANA PRO"
  return raw.replace(/-/g, ' ').toUpperCase()
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}

// ─── Featured card (horizontal scroller) ───

function FeaturedCard({ model, badge, onClick }: { model: ModelConfig; badge?: string; onClick: () => void }) {
  const preview = PREVIEWS[model.id]
  const lang = getLang()
  return (
    <div onClick={onClick} style={{
      minWidth: 112, width: 112, height: 150, flexShrink: 0,
      borderRadius: 12, overflow: 'hidden', position: 'relative',
      border: '1px solid var(--border)', cursor: 'pointer',
      background: 'var(--surface)',
    }}>
      {preview?.type === 'video' ? (
        <video src={`${PREVIEW_BASE}/${preview.file}`} loop muted playsInline autoPlay
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : preview?.type === 'image' ? (
        <img src={`${PREVIEW_BASE}/${preview.file}`} alt={model.name} loading="lazy"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, var(--accent-light), var(--surface2))',
        }} />
      )}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 35%, rgba(0,0,0,0.9) 100%)' }} />
      {badge && (
        <div style={{
          position: 'absolute', top: 6, left: 6,
          padding: '2px 6px', borderRadius: 4,
          background: 'var(--accent)', color: 'var(--accent-text)',
          fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 700, letterSpacing: 0.8,
        }}>{badge}</div>
      )}
      <div style={{ position: 'absolute', bottom: 6, left: 8, right: 8 }}>
        <div style={{
          fontSize: 9, color: 'var(--accent)', fontFamily: 'var(--font-mono)',
          fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
          marginBottom: 2, lineHeight: 1.2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>✦ {model.name}</div>
        <div style={{
          marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 10, color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontWeight: 600,
        }}>
          <BoltIcon />
          {model.tokensPerGeneration} · {lang === 'en' ? 'create' : 'создать'} →
        </div>
      </div>
    </div>
  )
}

function BoltIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="#fff" stroke="none">
      <path d="M12 21s-7-4.5-9.5-9A5 5 0 0112 6a5 5 0 019.5 6c-2.5 4.5-9.5 9-9.5 9z"/>
    </svg>
  )
}

// ─── Feed cell (grid item) ───

function FeedCard({ item, aspectRatio, onClick }: { item: Generation; aspectRatio: string; onClick: () => void }) {
  const isVideo = item.type === 'VIDEO' || item.type === 'MOTION'
  const isMusic = item.type === 'MUSIC'
  const thumbSrc = (item as any).thumbnailUrl ?? item.resultUrl
  const likesCount = (item as any).likesCount ?? 0
  const authorName = item.user?.username ?? item.user?.firstName ?? ''

  return (
    <div className="feed-cell" style={{ aspectRatio }} onClick={onClick}>
      {/* Media */}
      {isMusic ? (
        <div className="music-waveform-bg" style={{ position: 'absolute', inset: 0, flexDirection: 'column', gap: 8 }}>
          <div className="waveform-bars">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="waveform-bar" style={{ animationDelay: `${i * 0.11}s` }} />
            ))}
          </div>
          <span style={{ fontSize: 10, color: 'var(--text2)', textAlign: 'center', padding: '0 12px', lineHeight: 1.3 }}>
            {item.prompt.slice(0, 40)}
          </span>
        </div>
      ) : thumbSrc ? (
        <img src={thumbSrc} alt={item.prompt} loading="lazy"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div className="skeleton" style={{ position: 'absolute', inset: 0 }} />
      )}

      {/* Play icon for video */}
      {isVideo && thumbSrc && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%', background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 12 12"><path d="M3 2 L10 6 L3 10 Z" fill="#fff"/></svg>
          </div>
        </div>
      )}

      {/* Darken overlay at bottom */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, transparent 55%, rgba(0,0,0,0.8) 100%)',
        pointerEvents: 'none',
      }} />

      {/* Model badge top-left */}
      <div className="feed-cell-badge">✦ {modelShortName(item.model)}</div>

      {/* Author + likes bottom */}
      <div className="feed-cell-footer">
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>
          @{authorName.toLowerCase()}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
          <HeartIcon /> {formatCount(likesCount)}
        </span>
      </div>
    </div>
  )
}

// ─── Page ───

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

  const lang = getLang()

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
    const scrollTop = scrollRef.current?.closest('.page')?.scrollTop ?? 0
    if (scrollTop <= 0 && !refreshing) {
      const dy = e.touches[0].clientY - pullStartY.current
      if (dy > 0) setPullDistance(Math.min(dy * 0.4, 80))
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current)

    if (Math.abs(dx) > 60 && dy < 80) {
      if (dx < 0 && filterIndex < FILTERS.length - 1) setFilterIndex(filterIndex + 1)
      else if (dx > 0 && filterIndex > 0) setFilterIndex(filterIndex - 1)
    }

    if (pullDistance > 50) refresh()
    else setPullDistance(0)
  }

  const gotoCreate = (modelId: string) => {
    navigate('/create', { state: { model: modelId } })
  }

  return (
    <>
      {/* ── Header: wordmark + token badge ── */}
      <div style={{
        padding: '56px 16px 8px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'relative', zIndex: 5,
      }}>
        <div className="wordmark">picpulse</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {user && (
            <div className="token-badge">
              <BoltIcon />
              {user.balance.toLocaleString()}
            </div>
          )}
          <button onClick={refresh} disabled={refreshing} style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'var(--surface)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text2)" strokeWidth={2} strokeLinecap="round"
              style={refreshing ? { animation: 'spin 0.8s linear infinite' } : undefined}>
              <path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Pull-to-refresh indicator */}
      {pullDistance > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: `${pullDistance / 4}px 0` }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth={2}
            style={{ opacity: Math.min(pullDistance / 50, 1), transform: `rotate(${pullDistance * 4}deg)` }}>
            <path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/>
          </svg>
        </div>
      )}

      {/* ── Featured scroller ── */}
      <div style={{
        padding: '8px 16px 4px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{
          fontSize: 10, color: 'var(--text3)',
          fontFamily: 'var(--font-mono)', letterSpacing: 1.5, textTransform: 'uppercase',
        }}>
          — {lang === 'en' ? 'Try the models' : 'Попробуй модели'}
        </div>
        <button onClick={() => navigate('/create')} style={{
          fontSize: 10, color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: 0.5,
        }}>
          {lang === 'en' ? 'all →' : 'все →'}
        </button>
      </div>
      <div className="noscroll" style={{
        display: 'flex', gap: 10, overflowX: 'auto', padding: '6px 16px 4px',
      }}>
        {FEATURED.map(f => {
          const model = MODELS.find(m => m.id === f.id)
          if (!model) return null
          return (
            <FeaturedCard key={f.id} model={model} badge={f.badge} onClick={() => gotoCreate(f.id)} />
          )
        })}
      </div>

      {/* ── Filter pills ── */}
      <div className="filter-row">
        {FILTERS.map((f, i) => (
          <button key={f.value} className={`filter-pill ${filterIndex === i ? 'active' : ''}`}
            onClick={() => setFilterIndex(i)}>
            {f.label()}
          </button>
        ))}
      </div>

      {/* ── 2-col grid ── */}
      <div ref={scrollRef} className="feed-grid"
        onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
        {items.map((item, i) => (
          <FeedCard key={item.id} item={item}
            aspectRatio={i % 5 === 0 ? '3/5' : '3/4'}
            onClick={() => navigate(`/generation/${item.id}`)} />
        ))}
        {loading && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="feed-cell" style={{ aspectRatio: i % 3 === 0 ? '3/5' : '3/4' }}>
            <div className="skeleton" style={{ position: 'absolute', inset: 0 }} />
          </div>
        ))}
      </div>
      <div ref={loaderRef} style={{ height: 20 }} />
    </>
  )
}
