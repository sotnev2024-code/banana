import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getFeed, getFeedItem, toggleLike, addFavorite, removeFavorite, addComment, deleteComment, toggleCommentLike, getComments, reportGeneration, type Generation, type GenerationDetail, type CommentItem } from '../api/client'
import { useAuth } from '../hooks/useAuth'
import { t, getLang } from '../i18n'
import { toast } from '../components/ui/Toast'

export default function GenerationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [items, setItems] = useState<Generation[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [detail, setDetail] = useState<GenerationDetail | null>(null)
  const [showComments, setShowComments] = useState(false)
  const [showPromptPanel, setShowPromptPanel] = useState(false)
  const [initialScrollDone, setInitialScrollDone] = useState(false)
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

  // Scroll to the correct card once items are loaded
  useEffect(() => {
    if (items.length === 0 || initialScrollDone) return
    if (!containerRef.current) return
    const height = containerRef.current.clientHeight
    if (height === 0) return
    containerRef.current.scrollTo({ top: currentIndex * height, behavior: 'instant' as any })
    setInitialScrollDone(true)
  }, [items, currentIndex, initialScrollDone])

  // Load detail for current item
  useEffect(() => {
    const currentItem = items[currentIndex]
    if (!currentItem) return
    setDetail(null)
    getFeedItem(currentItem.id).then(setDetail).catch(() => {})
  }, [currentIndex, items])

  // Scroll snap handler
  const handleScroll = useCallback(() => {
    if (!containerRef.current || !initialScrollDone) return
    const scrollTop = containerRef.current.scrollTop
    const height = containerRef.current.clientHeight
    const newIndex = Math.round(scrollTop / height)
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < items.length) {
      setCurrentIndex(newIndex)
      setShowComments(false)
      setShowPromptPanel(false)
    }
  }, [currentIndex, items.length, initialScrollDone])

  // Swipe right to go back
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current)
    // Horizontal swipe right > 80px and mostly horizontal
    if (dx > 80 && dy < 100) {
      navigate(-1)
    }
  }

  if (items.length === 0) {
    return <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', zIndex: 200 }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  }

  return (
    <div
      ref={containerRef}
      className="viewer-container"
      onScroll={handleScroll}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
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
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null)
  const [reported, setReported] = useState(false)
  const navigate = useNavigate()
  const isAdmin = user && ['1724263429'].includes(user.telegramId)
  const [showReport, setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportComment, setReportComment] = useState('')
  const [reportSending, setReportSending] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (detail) {
      setIsLiked(detail.isLiked ?? false)
      setLikesCount(detail.likesCount ?? 0)
      setIsFav(detail.isFavorited ?? false)
      setReported(detail.isReported ?? false)
      setCommentsCount(detail.commentsCount ?? 0)
      // Load comments separately for tree structure
      getComments(detail.id).then(setComments).catch(() => {})
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
    const c = await addComment(item.id, commentText.trim(), replyTo?.id).catch(() => null)
    if (c) {
      if (replyTo) {
        // Add reply under parent
        setComments(prev => prev.map(p =>
          p.id === replyTo.id ? { ...p, replies: [...(p.replies ?? []), c] } : p
        ))
      } else {
        setComments(prev => [c, ...prev])
      }
      setCommentsCount(prev => prev + 1)
      setCommentText('')
      setReplyTo(null)
    }
  }

  const handleDeleteComment = async (commentId: string, parentId?: string | null) => {
    await deleteComment(commentId).catch(() => null)
    if (parentId) {
      setComments(prev => prev.map(p =>
        p.id === parentId ? { ...p, replies: (p.replies ?? []).filter(r => r.id !== commentId) } : p
      ))
    } else {
      setComments(prev => prev.filter(c => c.id !== commentId))
    }
    setCommentsCount(prev => Math.max(0, prev - 1))
  }

  const handleCommentLike = async (commentId: string, parentId?: string | null) => {
    const res = await toggleCommentLike(commentId).catch(() => null)
    if (!res) return
    const updateItem = (c: CommentItem): CommentItem =>
      c.id === commentId ? { ...c, isLiked: res.liked, likesCount: res.likesCount } : c
    if (parentId) {
      setComments(prev => prev.map(p =>
        p.id === parentId ? { ...p, replies: (p.replies ?? []).map(updateItem) } : p
      ))
    } else {
      setComments(prev => prev.map(updateItem))
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

        {/* Delete own */}
        {detail?.userId === user?.id && (
          <button className="viewer-action-btn" onClick={async () => {
            const tg = window.Telegram?.WebApp
            const doDelete = () => {
              import('../api/client').then(({ deleteComment: _dc, ...api }) => {
                // We need a delete generation endpoint
                fetch(`${import.meta.env.VITE_API_URL}/generate/${item.id}`, {
                  method: 'DELETE',
                  headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt')}` },
                }).then(() => {
                  toast(getLang() === 'en' ? 'Deleted' : 'Удалено')
                  navigate('/feed')
                })
              })
            }
            if (tg?.showConfirm) {
              tg.showConfirm(getLang() === 'en' ? 'Delete this generation?' : 'Удалить эту генерацию?', (ok: boolean) => { if (ok) doDelete() })
            } else {
              if (confirm('Delete?')) doDelete()
            }
          }} style={{ opacity: 0.5 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8}>
              <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14"/>
            </svg>
          </button>
        )}

        {/* Report */}
        <button className="viewer-action-btn" onClick={() => {
          if (reported) {
            toast(t('detail.reported'))
            return
          }
          setShowReport(true)
        }} style={{ opacity: reported ? 0.3 : 0.5 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8}>
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
          </svg>
        </button>
      </div>

      {/* Bottom info */}
      <div className="viewer-bottom">
        {/* Author */}
        {item.user && (
          <div className="viewer-author" onClick={(e) => { e.stopPropagation(); if (detail?.userId) navigate(`/user/${detail.userId}`) }} style={{ cursor: 'pointer' }}>
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

      {/* Report panel */}
      {showReport && (
        <div className="viewer-comments-panel">
          <div className="viewer-comments-header">
            <span>{t('detail.reportTitle')}</span>
            <button onClick={() => setShowReport(false)} style={{ color: '#fff' }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round">
                <path d="M4 4l12 12M16 4L4 16"/>
              </svg>
            </button>
          </div>
          <div className="viewer-comments-list" style={{ padding: '12px 16px' }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>{t('detail.reportReason')}</div>
            {(['sexual', 'violence', 'hate', 'spam', 'copyright', 'other'] as const).map(r => (
              <div
                key={r}
                onClick={() => setReportReason(r)}
                style={{
                  padding: '12px 14px', borderRadius: 10, marginBottom: 6, cursor: 'pointer',
                  background: reportReason === r ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
                  color: reportReason === r ? '#fff' : 'rgba(255,255,255,0.8)',
                  fontSize: 14, transition: 'background 0.15s',
                }}
              >
                {t(`report.${r}` as any)}
              </div>
            ))}
            <textarea
              value={reportComment}
              onChange={e => setReportComment(e.target.value)}
              placeholder={t('detail.reportComment')}
              rows={2}
              style={{
                width: '100%', marginTop: 10, padding: '10px 12px', borderRadius: 10,
                border: 'none', background: 'rgba(255,255,255,0.08)', color: '#fff',
                fontSize: 13, resize: 'none', outline: 'none',
              }}
            />
          </div>
          <div style={{ padding: '10px 16px 16px' }}>
            <button
              className="btn-primary"
              disabled={!reportReason || reportSending}
              onClick={async () => {
                if (!reportReason || reportSending) return
                setReportSending(true)
                const reason = `${reportReason}${reportComment ? ': ' + reportComment : ''}`
                await reportGeneration(item.id, reason).catch(() => {})
                setReported(true)
                setShowReport(false)
                setReportSending(false)
                setReportReason('')
                setReportComment('')
                toast(t('detail.reported'))
              }}
            >
              {reportSending ? '...' : t('detail.reportSend')}
            </button>
          </div>
        </div>
      )}

      {/* Comments panel */}
      {showComments && (
        <div className="viewer-comments-panel">
          <div className="viewer-comments-header">
            <span>{t('detail.comments')} ({commentsCount})</span>
            <button onClick={onToggleComments} style={{ color: '#fff' }}>
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
              <CommentNode key={c.id} comment={c} isAdmin={!!isAdmin}
                onReply={(id, name) => { setReplyTo({ id, name }); }}
                onDelete={(id) => handleDeleteComment(id, null)}
                onLike={(id) => handleCommentLike(id, null)}
                onDeleteReply={(id, parentId) => handleDeleteComment(id, parentId)}
                onLikeReply={(id, parentId) => handleCommentLike(id, parentId)}
              />
            ))}
          </div>
          <div className="viewer-comment-input">
            {replyTo && (
              <div style={{ position: 'absolute', top: -28, left: 14, right: 14, fontSize: 12, color: 'var(--accent)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Reply to {replyTo.name}</span>
                <button onClick={() => setReplyTo(null)} style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Cancel</button>
              </div>
            )}
            <input
              type="text"
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder={replyTo ? `Reply to ${replyTo.name}...` : t('detail.commentPlaceholder')}
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

function CommentNode({ comment, isAdmin, onReply, onDelete, onLike, onDeleteReply, onLikeReply, depth = 0 }: {
  comment: CommentItem
  isAdmin: boolean
  onReply: (id: string, name: string) => void
  onDelete: (id: string) => void
  onLike: (id: string) => void
  onDeleteReply: (id: string, parentId: string) => void
  onLikeReply: (id: string, parentId: string) => void
  depth?: number
}) {
  const c = comment
  const avatarSize = depth > 0 ? 28 : 32
  const [showReplies, setShowReplies] = useState(true)

  return (
    <>
      <div style={{ display: 'flex', gap: 10, padding: `${depth > 0 ? 6 : 10}px 16px`, marginLeft: depth > 0 ? 32 : 0 }}>
        {/* Avatar */}
        {c.user.photoUrl
          ? <img src={c.user.photoUrl} alt="" style={{ width: avatarSize, height: avatarSize, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          : <div style={{ width: avatarSize, height: avatarSize, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: depth > 0 ? 10 : 12, color: '#fff', flexShrink: 0 }}>{c.user.firstName[0]}</div>
        }

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13 }}>
            <span style={{ fontWeight: 600 }}>{c.user.firstName} </span>
            <span style={{ color: 'rgba(255,255,255,0.85)' }}>{c.text}</span>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
              {timeAgo(c.createdAt)}
            </span>
            {c.likesCount > 0 && (
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>
                {c.likesCount} {c.likesCount === 1 ? 'like' : 'likes'}
              </span>
            )}
            {depth === 0 && (
              <button onClick={() => onReply(c.id, c.user.firstName)}
                style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
                Reply
              </button>
            )}
            {(c.isOwn || isAdmin) && (
              <button onClick={() => depth > 0 ? onDeleteReply(c.id, c.parentId!) : onDelete(c.id)}
                style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Like button (right side) */}
        <button onClick={() => depth > 0 ? onLikeReply(c.id, c.parentId!) : onLike(c.id)}
          style={{ flexShrink: 0, paddingTop: 4 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill={c.isLiked ? '#ff4757' : 'none'} stroke={c.isLiked ? '#ff4757' : 'rgba(255,255,255,0.3)'} strokeWidth={2}>
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
          </svg>
        </button>
      </div>

      {/* Replies toggle */}
      {depth === 0 && c.replies && c.replies.length > 0 && (
        <>
          <button onClick={() => setShowReplies(!showReplies)}
            style={{ marginLeft: 58, fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600, padding: '4px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 20, height: 0.5, background: 'rgba(255,255,255,0.2)' }} />
            {showReplies ? `Hide replies (${c.replies.length})` : `View replies (${c.replies.length})`}
          </button>
          {showReplies && c.replies.map(r => (
            <CommentNode key={r.id} comment={r} isAdmin={isAdmin} depth={1}
              onReply={onReply} onDelete={onDelete} onLike={onLike}
              onDeleteReply={onDeleteReply} onLikeReply={onLikeReply}
            />
          ))}
        </>
      )}
    </>
  )
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'now'
  if (min < 60) return `${min}m`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h`
  const days = Math.floor(hr / 24)
  if (days < 7) return `${days}d`
  return `${Math.floor(days / 7)}w`
}
