import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getIdeas, getIdeaCategories, type IdeaApi, type IdeaCategoryApi } from '../api/client'
import { getLang } from '../i18n'
import { toast } from '../components/ui/Toast'

// Deterministic gradient fallback for ideas without uploaded media.
// Hash slug → two HSL colors so colors stay stable per idea between renders.
function gradientFor(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0xffff
  const a = h % 360
  const b = (a + 60 + (h >> 4) % 120) % 360
  return `linear-gradient(135deg, hsl(${a} 60% 35%), hsl(${b} 60% 25%))`
}

function IdeaCard({ idea, lang, categoryName, onUse }: {
  idea: IdeaApi; lang: string; categoryName: string; onUse: () => void
}) {
  const text = lang === 'en' ? (idea.promptEn || idea.promptRu) : (idea.promptRu || idea.promptEn)

  return (
    <div onClick={onUse} style={{
      position: 'relative', aspectRatio: '1 / 1',
      borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
      border: '1px solid var(--border)',
      background: idea.mediaUrl ? 'var(--surface2)' : gradientFor(idea.id),
    }}>
      {idea.mediaUrl && (
        idea.mediaType === 'video' ? (
          <video src={idea.mediaUrl} loop muted playsInline autoPlay
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <img src={idea.mediaUrl} alt="" loading="lazy"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        )
      )}

      {/* gradient overlay for legibility */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, transparent 35%, rgba(0,0,0,0.88) 100%)',
      }} />

      {/* badge top-left */}
      {idea.badge && (
        <div style={{
          position: 'absolute', top: 6, left: 6,
          padding: '2px 6px', borderRadius: 4,
          background: 'var(--accent)', color: 'var(--accent-text)',
          fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 700, letterSpacing: 0.6,
        }}>{idea.badge}</div>
      )}

      {/* category badge top-right */}
      <div style={{
        position: 'absolute', top: 6, right: 6,
        padding: '2px 6px', borderRadius: 4,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
        fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--accent)',
        fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase',
      }}>{categoryName}</div>

      {/* model + prompt bottom */}
      <div style={{ position: 'absolute', bottom: 8, left: 8, right: 8 }}>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--accent)',
          fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          ✦ {idea.modelId.replace(/-/g, ' ')}
        </div>
        <div style={{
          color: '#fff', fontSize: 11, lineHeight: 1.35,
          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {text}
        </div>
      </div>
    </div>
  )
}

export default function IdeasPage() {
  const navigate = useNavigate()
  const [activeCat, setActiveCat] = useState<string>('all')
  const [categories, setCategories] = useState<IdeaCategoryApi[]>([])
  const [ideas, setIdeas] = useState<IdeaApi[]>([])
  const [loading, setLoading] = useState(true)
  const [openIdea, setOpenIdea] = useState<IdeaApi | null>(null)
  const lang = getLang()

  useEffect(() => {
    Promise.all([getIdeaCategories(), getIdeas()])
      .then(([cats, items]) => {
        setCategories(cats)
        setIdeas(items)
      })
      .catch(() => { /* keep empty */ })
      .finally(() => setLoading(false))
  }, [])

  const filtered = activeCat === 'all'
    ? ideas
    : ideas.filter(i => i.categoryId === activeCat)

  const handleUse = (idea: IdeaApi) => {
    const prompt = lang === 'en' ? (idea.promptEn || idea.promptRu) : (idea.promptRu || idea.promptEn)
    navigate('/create', { state: { prompt, model: idea.modelId } })
  }

  const handleCopy = (text: string) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(
        () => toast(lang === 'en' ? 'Copied' : 'Скопировано'),
        () => toast(lang === 'en' ? 'Copy failed' : 'Не удалось скопировать'),
      )
    }
  }

  return (
    <>
      <div className="topbar">
        <div className="topbar-eyebrow">INSPO // GALLERY</div>
        <div className="topbar-title">{lang === 'en' ? 'IDEAS' : 'ИДЕИ'}</div>
        <div className="topbar-sub">
          {lang === 'en' ? 'Tap to view the prompt & recreate' : 'Нажми — увидишь промт и повторишь'}
        </div>
      </div>

      {/* Category chips */}
      <div className="filter-row noscroll">
        <button className={`filter-pill ${activeCat === 'all' ? 'active' : ''}`}
          onClick={() => setActiveCat('all')}>
          {lang === 'en' ? 'All' : 'Все'}
        </button>
        {categories.filter(c => (c._count?.ideas ?? 0) > 0).map(c => (
          <button key={c.id} className={`filter-pill ${activeCat === c.id ? 'active' : ''}`}
            onClick={() => setActiveCat(c.id)}>
            {lang === 'en' ? c.nameEn : c.nameRu}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{
          padding: '4px 12px 20px',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6,
        }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ aspectRatio: '1 / 1', borderRadius: 10 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div style={{
            fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)',
            letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8,
          }}>— {lang === 'en' ? 'no ideas' : 'нет идей'}</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>
            {lang === 'en' ? 'Admin can add ideas via the panel.' : 'Админ может добавить идеи через панель.'}
          </div>
        </div>
      ) : (
        <div style={{
          padding: '4px 12px 20px',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6,
        }}>
          {filtered.map(idea => {
            const cat = categories.find(c => c.id === idea.categoryId)
            const catName = cat ? (lang === 'en' ? cat.nameEn : cat.nameRu) : ''
            return (
              <IdeaCard key={idea.id} idea={idea} lang={lang}
                categoryName={catName} onUse={() => setOpenIdea(idea)} />
            )
          })}
        </div>
      )}

      {openIdea && (
        <IdeaModal
          idea={openIdea}
          categoryName={categories.find(c => c.id === openIdea.categoryId)
            ? (lang === 'en' ? categories.find(c => c.id === openIdea.categoryId)!.nameEn : categories.find(c => c.id === openIdea.categoryId)!.nameRu)
            : ''}
          lang={lang}
          onClose={() => setOpenIdea(null)}
          onCopy={handleCopy}
          onUse={() => { handleUse(openIdea); setOpenIdea(null) }}
        />
      )}
    </>
  )
}

// ─── Detail modal ──────────────────────────────────────────────────────

function IdeaModal({ idea, categoryName, lang, onClose, onCopy, onUse }: {
  idea: IdeaApi
  categoryName: string
  lang: string
  onClose: () => void
  onCopy: (text: string) => void
  onUse: () => void
}) {
  const text = lang === 'en' ? (idea.promptEn || idea.promptRu) : (idea.promptRu || idea.promptEn)

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 500,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      padding: 0,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 480,
        background: 'var(--bg)',
        borderRadius: '16px 16px 0 0',
        display: 'flex', flexDirection: 'column',
        maxHeight: '92vh', overflow: 'auto',
        border: '1px solid var(--border)',
      }}>
        {/* Header with close */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', borderBottom: '1px solid var(--border)',
        }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text3)',
            letterSpacing: 1.5, textTransform: 'uppercase',
          }}>
            {categoryName || (lang === 'en' ? 'Idea' : 'Идея')}
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'var(--surface)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text)',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18"/>
            </svg>
          </button>
        </div>

        {/* Media — full preview */}
        <div style={{ padding: 16 }}>
          <div style={{
            position: 'relative', width: '100%',
            borderRadius: 12, overflow: 'hidden',
            background: 'var(--surface)', border: '1px solid var(--border)',
          }}>
            {idea.mediaUrl ? (
              idea.mediaType === 'video' ? (
                <video src={idea.mediaUrl} controls loop muted playsInline autoPlay
                  style={{ width: '100%', display: 'block' }} />
              ) : (
                <img src={idea.mediaUrl} alt="" style={{ width: '100%', display: 'block' }} />
              )
            ) : (
              <div style={{
                aspectRatio: '1 / 1',
                background: 'linear-gradient(135deg, var(--accent-light), var(--surface2))',
              }} />
            )}
            {idea.badge && (
              <div style={{
                position: 'absolute', top: 8, left: 8,
                padding: '3px 8px', borderRadius: 5,
                background: 'var(--accent)', color: 'var(--accent-text)',
                fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, letterSpacing: 0.8,
              }}>{idea.badge}</div>
            )}
          </div>

          {/* Model badge */}
          <div style={{
            marginTop: 12,
            fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)',
            fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
          }}>
            ✦ {idea.modelId.replace(/-/g, ' ')}
          </div>

          {/* Prompt eyebrow */}
          <div style={{
            marginTop: 14, marginBottom: 6,
            fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text3)',
            letterSpacing: 1.5, textTransform: 'uppercase',
          }}>
            — {lang === 'en' ? 'Prompt' : 'Промпт'}
          </div>

          {/* Prompt body — selectable */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 10, padding: 12,
            color: 'var(--text)', fontSize: 13, lineHeight: 1.5,
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            userSelect: 'text', WebkitUserSelect: 'text',
          }}>
            {text}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button onClick={() => onCopy(text)} className="btn-outline" style={{ flex: 1 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <rect x="8" y="8" width="13" height="13" rx="2"/>
                  <path d="M16 8V5a2 2 0 00-2-2H5a2 2 0 00-2 2v9a2 2 0 002 2h3"/>
                </svg>
                {lang === 'en' ? 'Copy' : 'Копировать'}
              </span>
            </button>
            <button onClick={onUse} className="btn-primary" style={{ flex: 1 }}>
              {lang === 'en' ? 'Use prompt' : 'Использовать'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
