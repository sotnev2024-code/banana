import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getFeedItem, addFavorite, removeFavorite, type GenerationDetail } from '../api/client'
import { useAuth } from '../hooks/useAuth'
import { t } from '../i18n'

const typeLabels: Record<string, Record<string, string>> = {
  IMAGE: { ru: 'Изображение', en: 'Image' },
  VIDEO: { ru: 'Видео', en: 'Video' },
  MUSIC: { ru: 'Музыка', en: 'Music' },
  MOTION: { ru: 'Motion', en: 'Motion' },
}

export default function GenerationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [item, setItem] = useState<GenerationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFav, setIsFav] = useState(false)

  useEffect(() => {
    if (!id) return
    getFeedItem(id).then(data => {
      setItem(data)
      setIsFav(data.isFavorited ?? false)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  const handleFavorite = async () => {
    if (!item) return
    if (isFav) {
      await removeFavorite(item.id).catch(() => {})
      setIsFav(false)
    } else {
      await addFavorite(item.id).catch(() => {})
      setIsFav(true)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="skeleton" style={{ height: 300, borderRadius: 16 }} />
        <div className="skeleton" style={{ height: 20, width: '60%' }} />
        <div className="skeleton" style={{ height: 60 }} />
      </div>
    )
  }

  if (!item) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>
        Not found
      </div>
    )
  }

  const isVideo = item.type === 'VIDEO' || item.type === 'MOTION'
  const isMusic = item.type === 'MUSIC'
  const lang = user?.lang === 'en' ? 'en' : 'ru'

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between' }}>
        <button className="back-btn" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }} onClick={() => navigate(-1)}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round"><path d="M11 4L6 9l5 5"/></svg>
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="back-btn" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }} onClick={handleFavorite}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill={isFav ? '#fff' : 'none'} stroke="#fff" strokeWidth={1.8}>
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Media */}
      <div style={{ background: '#000' }}>
        {isVideo && item.resultUrl ? (
          <video src={item.resultUrl} controls playsInline autoPlay muted
            style={{ width: '100%', maxHeight: '50vh', objectFit: 'contain' }} />
        ) : isMusic && item.resultUrl ? (
          <div style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, background: 'var(--surface2)' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth={1.5}>
              <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
            </svg>
            <audio src={item.resultUrl} controls style={{ width: '100%' }} />
          </div>
        ) : item.resultUrl ? (
          <img src={item.resultUrl} alt="" style={{ width: '100%', maxHeight: '60vh', objectFit: 'contain' }} />
        ) : (
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface2)' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth={1.5}>
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Author */}
        {item.user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {item.user.photoUrl
              ? <img src={item.user.photoUrl} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
              : <div className="avatar-placeholder" style={{ width: 36, height: 36, fontSize: 14 }}>{item.user.firstName[0]}</div>
            }
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{item.user.firstName}</div>
              {item.user.username && <div style={{ fontSize: 12, color: 'var(--text2)' }}>@{item.user.username}</div>}
            </div>
            <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text3)' }}>
              {new Date(item.createdAt).toLocaleDateString(lang === 'en' ? 'en' : 'ru', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
        )}

        {/* Prompt */}
        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, fontWeight: 500 }}>{t('detail.prompt')}</div>
          <div style={{ fontSize: 14, lineHeight: 1.5 }}>{item.prompt}</div>
        </div>

        {/* Model & Type */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div className="card" style={{ padding: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--text2)' }}>{t('detail.model')}</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{item.model.replace(/-/g, ' ')}</div>
          </div>
          <div className="card" style={{ padding: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--text2)' }}>{t('detail.type')}</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{typeLabels[item.type]?.[lang] ?? item.type}</div>
          </div>
        </div>

        {/* Cost */}
        <div className="card" style={{ padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>{t('detail.cost')}</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent)' }}>{item.tokensSpent} {t('profile.tokens')}</div>
        </div>

        {/* Reference image */}
        {item.imageUrl && (
          <div className="card" style={{ padding: 14 }}>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8, fontWeight: 500 }}>{t('detail.reference')}</div>
            <img src={item.imageUrl} alt="reference" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8 }} />
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          {item.resultUrl && (
            <a href={item.resultUrl} download className="btn-primary" style={{ flex: 1, textDecoration: 'none' }}>
              {t('detail.download')}
            </a>
          )}
          <button className="btn-outline" style={{ flex: 1 }}
            onClick={() => navigate('/create', { state: { prompt: item.prompt, model: item.model } })}>
            {t('detail.tryPrompt')}
          </button>
        </div>

        <button
          className={isFav ? 'btn-primary' : 'btn-outline'}
          onClick={handleFavorite}
          style={{ opacity: isFav ? 0.8 : 1 }}
        >
          {isFav ? t('detail.removeFavorite') : t('detail.addFavorite')}
        </button>

        <div style={{ height: 40 }} />
      </div>
    </div>
  )
}
