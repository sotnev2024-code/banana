import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getFeed, getFeedItem, toggleLike, addFavorite, removeFavorite, addComment, type Generation, type GenerationDetail, type CommentItem } from '../api/client'
import { useAuth } from '../hooks/useAuth'
import { t } from '../i18n'

export default function GenerationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [items, setItems] = useState<Generation[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [detail, setDetail] = useState<GenerationDetail | null>(null)
  const [showComments, setShowComments] = useState(false)
  const [showPromptPanel, setShowPromptPanel] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Load feed items for swiping
  useEffect(() => {
    getFeed().then(data => {
      const feedItems = data.items
      setItems(feedItems)
      const idx = feedItems.findIndex(i => i.id === id)
      if (idx >= 0) setCurrentIndex(idx)
    })
  }, [id])

  // Load detail for current item
  useEffect(() => {
    const currentItem = items[currentIndex]
    if (!currentItem) return
    getFeedItem(currentItem.id).then(setDetail).catch(() => {})
  }, [currentIndex, items])

  // Scroll snap handler
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return
    const scrollTop = containerRef.current.scrollTop
    const height = containerRef.current.clientHeight
    const newIndex = Math.round(scrollTop / height)
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < items.length) {
      setCurrentIndex(newIndex)
      setShowComments(false)
    }
  }, [currentIndex, items.length])

  if (items.length === 0) {
    return <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  }

  return (
    <div
      ref={containerRef}
      className="viewer-container"
      onScroll={handleScroll}
    >
      {items.map((item, index) => (
        <ViewerSlide
          key={item.id}
          item={item}
          detail={index === currentIndex ? detail : null}
          isActive={index === currentIndex}
          showComments={index === currentIndex && showComments}
          showPromptPanel={index === currentIndex && showPromptPanel}
          onToggleComments={() => { setShowComments(v => !v); setShowPromptPanel(false) }}
          onTogglePromptPanel={() => { setShowPromptPanel(v => !v); setShowComments(false) }}
          onBack={() => navigate(-1)}
          onTryPrompt={() => navigate('/create', { state: { prompt: item.prompt, model: item.model } })}
          user={user}
        />
      ))}
    </div>
  )
}

function ViewerSlide({ item, detail, isActive, showComments, showPromptPanel, onToggleComments, onTogglePromptPanel, onBack, onTryPrompt, user }: {
  item: Generation
  detail: GenerationDetail | null
  isActive: boolean
  showComments: boolean
  showPromptPanel: boolean
  onToggleComments: () => void
  onTogglePromptPanel: () => void
  onBack: () => void
  onTryPrompt: () => void
  user: any
}) {
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [isFav, setIsFav] = useState(false)
  const [comments, setComments] = useState<CommentItem[]>([])
  const [commentsCount, setCommentsCount] = useState(0)
  const [commentText, setCommentText] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (detail) {
      setIsLiked(detail.isLiked ?? false)
      setLikesCount(detail.likesCount ?? 0)
      setIsFav(detail.isFavorited ?? false)
      setCommentsCount(detail.commentsCount ?? 0)
      setComments(detail.comments ?? [])
    }
  }, [detail])

  useEffect(() => {
    if (isActive && videoRef.current) {
      videoRef.current.play().catch(() => {})
    } else if (!isActive && videoRef.current) {
      videoRef.current.pause()
    }
  }, [isActive])

  const handleLike = async () => {
    const res = await toggleLike(item.id).catch(() => null)
    if (res) {
      setIsLiked(res.liked)
      setLikesCount(res.likesCount)
    }
  }

  const handleFavorite = async () => {
    if (isFav) {
      await removeFavorite(item.id).catch(() => {})
      setIsFav(false)
    } else {
      await addFavorite(item.id).catch(() => {})
      setIsFav(true)
    }
  }

  const handleComment = async () => {
    if (!commentText.trim()) return
    const c = await addComment(item.id, commentText.trim()).catch(() => null)
    if (c) {
      setComments(prev => [c, ...prev])
      setCommentsCount(prev => prev + 1)
      setCommentText('')
    }
  }

  const isVideo = item.type === 'VIDEO' || item.type === 'MOTION'
  const isMusic = item.type === 'MUSIC'

  return (
    <div className="viewer-slide">
      {/* Media */}
      <div className="viewer-media">
        {isVideo && item.resultUrl ? (
          <video ref={videoRef} src={item.resultUrl} loop muted playsInline
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            onClick={() => videoRef.current?.paused ? videoRef.current?.play() : videoRef.current?.pause()}
          />
        ) : isMusic && item.resultUrl ? (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={1.2}>
              <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
            </svg>
            <audio src={item.resultUrl} controls style={{ width: '80%' }} />
          </div>
        ) : item.resultUrl ? (
          <img src={item.resultUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        ) : null}
      </div>

      {/* Back button */}
      <button className="viewer-back" onClick={onBack}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round">
          <path d="M12 4L6 10l6 6"/>
        </svg>
      </button>

      {/* Right side buttons */}
      <div className="viewer-actions">
        {/* Like */}
        <button className="viewer-action-btn" onClick={handleLike}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill={isLiked ? '#ff4757' : 'none'} stroke={isLiked ? '#ff4757' : '#fff'} strokeWidth={1.8}>
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
          </svg>
          <span className="viewer-action-label">{likesCount}</span>
        </button>

        {/* Comments */}
        <button className="viewer-action-btn" onClick={onToggleComments}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8}>
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
          <span className="viewer-action-label">{commentsCount}</span>
        </button>

        {/* Favorite */}
        <button className="viewer-action-btn" onClick={handleFavorite}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill={isFav ? '#fff' : 'none'} stroke="#fff" strokeWidth={1.8}>
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
          </svg>
          <span className="viewer-action-label"></span>
        </button>

        {/* Try prompt */}
        <button className="viewer-action-btn" onClick={onTryPrompt}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8}>
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
          </svg>
        </button>
      </div>

      {/* Bottom info */}
      <div className="viewer-bottom" onClick={onTogglePromptPanel}>
        {/* Author */}
        {item.user && (
          <div className="viewer-author">
            {item.user.photoUrl
              ? <img src={item.user.photoUrl} alt="" className="viewer-author-avatar" />
              : <div className="viewer-author-avatar-placeholder">{item.user.firstName[0]}</div>
            }
            <span className="viewer-author-name">{item.user.firstName}</span>
            <span className="viewer-model">{item.model.replace(/-/g, ' ')}</span>
          </div>
        )}
        {/* Prompt preview — 2 lines */}
        <div className="viewer-prompt">
          {item.prompt}
        </div>
      </div>

      {/* Prompt panel */}
      {showPromptPanel && (
        <div className="viewer-comments-panel">
          <div className="viewer-comments-header">
            <span>{t('detail.prompt')}</span>
            <button onClick={onTogglePromptPanel} style={{ color: '#fff' }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round">
                <path d="M4 4l12 12M16 4L4 16"/>
              </svg>
            </button>
          </div>
          <div className="viewer-comments-list" style={{ padding: '16px' }}>
            <div style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,0.9)' }}>
              {item.prompt}
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', padding: '4px 10px', background: 'rgba(255,255,255,0.08)', borderRadius: 8 }}>
                {item.model.replace(/-/g, ' ')}
              </div>
              {item.tokensSpent > 0 && (
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', padding: '4px 10px', background: 'rgba(255,255,255,0.08)', borderRadius: 8 }}>
                  {item.tokensSpent} {t('profile.tokens')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Comments panel */}
      {showComments && (
        <div className="viewer-comments-panel">
          <div className="viewer-comments-header">
            <span>{t('detail.comments')} ({commentsCount})</span>
            <button onClick={onToggleComments} style={{ color: '#fff', fontSize: 20 }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round">
                <path d="M4 4l12 12M16 4L4 16"/>
              </svg>
            </button>
          </div>
          <div className="viewer-comments-list">
            {comments.length === 0 && (
              <div style={{ padding: 20, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                {t('detail.noComments')}
              </div>
            )}
            {comments.map(c => (
              <div key={c.id} className="viewer-comment">
                <div className="viewer-comment-header">
                  {c.user.photoUrl
                    ? <img src={c.user.photoUrl} alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
                    : <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff' }}>{c.user.firstName[0]}</div>
                  }
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{c.user.firstName}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginLeft: 'auto' }}>
                    {new Date(c.createdAt).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <div style={{ fontSize: 13, marginTop: 4, paddingLeft: 32 }}>{c.text}</div>
              </div>
            ))}
          </div>
          <div className="viewer-comment-input">
            <input
              type="text"
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder={t('detail.commentPlaceholder')}
              onKeyDown={e => e.key === 'Enter' && handleComment()}
            />
            <button onClick={handleComment} disabled={!commentText.trim()}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
