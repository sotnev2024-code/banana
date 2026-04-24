import { useState, useEffect, useRef } from 'react'
import { MODELS } from '@aibot/shared'
import {
  adminListIdeaCategories, adminCreateIdeaCategory, adminUpdateIdeaCategory, adminDeleteIdeaCategory,
  adminListIdeas, adminCreateIdea, adminUpdateIdea, adminDeleteIdea,
  adminUploadMedia,
} from './api'
import { toast } from '../../components/ui/Toast'

interface Category {
  id: string
  slug: string
  nameRu: string
  nameEn: string
  position: number
  _count?: { ideas: number }
}

interface Idea {
  id: string
  categoryId: string
  modelId: string
  promptRu: string
  promptEn: string
  mediaUrl: string | null
  mediaType: 'image' | 'video'
  badge: string | null
  enabled: boolean
  createdAt: string
}

const PRESET_BADGES = ['NEW', 'TOP', 'HOT', 'PRO', 'BETA', 'SALE', 'VIRAL']

export function AdminIdeas() {
  const [categories, setCategories] = useState<Category[]>([])
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [filterCat, setFilterCat] = useState<string | 'all'>('all')
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null)
  const [editingCat, setEditingCat] = useState<Category | null>(null)
  const [creatingCat, setCreatingCat] = useState(false)

  const loadCats = () => adminListIdeaCategories().then(setCategories).catch(() => {})
  const loadIdeas = () => adminListIdeas().then(setIdeas).catch(() => {})
  useEffect(() => { loadCats(); loadIdeas() }, [])

  const filteredIdeas = filterCat === 'all' ? ideas : ideas.filter(i => i.categoryId === filterCat)

  const handleCreateIdea = async () => {
    if (categories.length === 0) {
      alert('Сначала создай хотя бы одну категорию.')
      return
    }
    try {
      const idea = await adminCreateIdea({
        categoryId: categories[0].id,
        modelId: MODELS[0].id,
        promptRu: 'Новая идея',
        promptEn: 'New idea',
        enabled: true,
      })
      setIdeas(prev => [idea, ...prev])
      setEditingIdea(idea)
    } catch (e: any) {
      alert(e?.message ?? 'Ошибка создания')
    }
  }

  const handleSaveIdea = async (updated: Idea) => {
    const saved = await adminUpdateIdea(updated.id, updated)
    setIdeas(prev => prev.map(i => i.id === saved.id ? saved : i))
    setEditingIdea(null)
    toast('Сохранено')
  }

  const handleDeleteIdea = async (id: string) => {
    if (!confirm('Удалить идею?')) return
    await adminDeleteIdea(id)
    setIdeas(prev => prev.filter(i => i.id !== id))
    toast('Удалено')
  }

  const handleSaveCategory = async (cat: Category) => {
    if (cat.id === '__new__') {
      const created = await adminCreateIdeaCategory({
        slug: cat.slug, nameRu: cat.nameRu, nameEn: cat.nameEn, position: cat.position,
      })
      setCategories(prev => [...prev, created])
    } else {
      const saved = await adminUpdateIdeaCategory(cat.id, cat)
      setCategories(prev => prev.map(c => c.id === saved.id ? saved : c))
    }
    setEditingCat(null)
    setCreatingCat(false)
    toast('Сохранено')
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Удалить категорию? ВСЕ идеи внутри тоже удалятся.')) return
    await adminDeleteIdeaCategory(id)
    setCategories(prev => prev.filter(c => c.id !== id))
    setIdeas(prev => prev.filter(i => i.categoryId !== id))
    if (filterCat === id) setFilterCat('all')
    toast('Удалено')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* ─── CATEGORIES ─── */}
      <div className="section-eyebrow" style={{ padding: 0 }}>Категории</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {categories.map(c => (
          <div key={c.id} className="card" style={{
            padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{c.nameRu} <span style={{ color: 'var(--text3)', fontWeight: 400 }}>· {c.nameEn}</span></div>
              <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
                {c.slug} · {c._count?.ideas ?? 0} идей · pos {c.position}
              </div>
            </div>
            <button onClick={() => setEditingCat(c)} className="btn-chip">Изм</button>
            <button onClick={() => handleDeleteCategory(c.id)} className="btn-chip" style={{ color: 'var(--danger)' }}>×</button>
          </div>
        ))}
        <button className="btn-outline" onClick={() => {
          setEditingCat({ id: '__new__', slug: '', nameRu: '', nameEn: '', position: categories.length })
          setCreatingCat(true)
        }}>+ Категория</button>
      </div>

      {/* ─── IDEAS ─── */}
      <div className="section-eyebrow" style={{ padding: 0, marginTop: 12 }}>Идеи</div>

      {/* Category filter */}
      <div className="filter-row noscroll" style={{ padding: 0 }}>
        <button className={`filter-pill ${filterCat === 'all' ? 'active' : ''}`}
          onClick={() => setFilterCat('all')}>Все ({ideas.length})</button>
        {categories.map(c => (
          <button key={c.id} className={`filter-pill ${filterCat === c.id ? 'active' : ''}`}
            onClick={() => setFilterCat(c.id)}>
            {c.nameRu} ({ideas.filter(i => i.categoryId === c.id).length})
          </button>
        ))}
      </div>

      <button className="btn-primary" onClick={handleCreateIdea}>+ Создать идею</button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {filteredIdeas.map(idea => (
          <IdeaRow key={idea.id} idea={idea} categories={categories}
            onEdit={() => setEditingIdea(idea)}
            onDelete={() => handleDeleteIdea(idea.id)}
            onToggle={async () => {
              const saved = await adminUpdateIdea(idea.id, { enabled: !idea.enabled })
              setIdeas(prev => prev.map(x => x.id === saved.id ? saved : x))
            }}
          />
        ))}
        {filteredIdeas.length === 0 && (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text3)', fontSize: 12 }}>
            Идей нет. Нажми «+ Создать идею».
          </div>
        )}
      </div>

      {editingIdea && (
        <IdeaEditor idea={editingIdea} categories={categories}
          onClose={() => setEditingIdea(null)} onSave={handleSaveIdea} />
      )}
      {editingCat && (
        <CategoryEditor cat={editingCat} isNew={creatingCat}
          onClose={() => { setEditingCat(null); setCreatingCat(false) }}
          onSave={handleSaveCategory} />
      )}
    </div>
  )
}

// ─── Idea row ─────────────────────────────────────────────────────

function IdeaRow({ idea, categories, onEdit, onDelete, onToggle }: {
  idea: Idea; categories: Category[]; onEdit: () => void; onDelete: () => void; onToggle: () => void
}) {
  const cat = categories.find(c => c.id === idea.categoryId)
  return (
    <div className="card" style={{
      padding: 8, display: 'flex', alignItems: 'center', gap: 8,
      opacity: idea.enabled ? 1 : 0.5,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 8, overflow: 'hidden',
        background: 'var(--surface2)', flexShrink: 0,
      }}>
        {idea.mediaUrl ? (
          idea.mediaType === 'video'
            ? <video src={idea.mediaUrl} muted playsInline autoPlay loop style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <img src={idea.mediaUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : null}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 12, color: 'var(--text)', lineHeight: 1.3,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{idea.promptRu}</div>
        <div style={{
          fontSize: 9, color: 'var(--text3)', fontFamily: 'var(--font-mono)',
          marginTop: 2, display: 'flex', gap: 6, alignItems: 'center',
        }}>
          <span>{cat?.nameRu ?? '?'}</span>
          <span>·</span>
          <span>{idea.modelId}</span>
          {idea.badge && <span style={{ color: 'var(--accent)' }}>· {idea.badge}</span>}
        </div>
      </div>
      <button onClick={onToggle} className="btn-chip"
        style={{
          background: idea.enabled ? 'var(--accent-light)' : 'var(--surface2)',
          color: idea.enabled ? 'var(--accent)' : 'var(--text3)',
          borderColor: idea.enabled ? 'var(--accent)' : 'var(--border)',
        }}>{idea.enabled ? 'Вкл' : 'Выкл'}</button>
      <button onClick={onEdit} className="btn-chip">Изм</button>
      <button onClick={onDelete} className="btn-chip" style={{ color: 'var(--danger)' }}>×</button>
    </div>
  )
}

// ─── Idea editor modal ────────────────────────────────────────────

function IdeaEditor({ idea, categories, onClose, onSave }: {
  idea: Idea; categories: Category[]; onClose: () => void; onSave: (i: Idea) => void
}) {
  const [draft, setDraft] = useState<Idea>(idea)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const { url, mediaType } = await adminUploadMedia(file)
      setDraft(d => ({ ...d, mediaUrl: url, mediaType }))
      toast('Загружено')
    } catch (err: any) {
      alert(err.message ?? 'Upload error')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 500,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, overflow: 'auto',
    }} onClick={onClose}>
      <div className="card" style={{
        width: '100%', maxWidth: 380, padding: 16,
        display: 'flex', flexDirection: 'column', gap: 12,
        maxHeight: '92vh', overflow: 'auto',
      }} onClick={e => e.stopPropagation()}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Идея</div>
          <button onClick={onClose} className="btn-chip">×</button>
        </div>

        {/* Media */}
        <div>
          <div className="setting-label">Медиа</div>
          {draft.mediaUrl ? (
            <div style={{ borderRadius: 10, overflow: 'hidden', marginTop: 6 }}>
              {draft.mediaType === 'video'
                ? <video src={draft.mediaUrl} muted playsInline autoPlay loop style={{ width: '100%', display: 'block' }} />
                : <img src={draft.mediaUrl} alt="" style={{ width: '100%', display: 'block' }} />}
            </div>
          ) : (
            <div style={{
              height: 100, borderRadius: 10, marginTop: 6,
              background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text3)', fontSize: 12,
            }}>нет медиа (будет градиент-фоллбек)</div>
          )}
          <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleUpload} style={{ display: 'none' }} />
          <button onClick={() => fileRef.current?.click()} className="btn-outline"
            style={{ marginTop: 8 }} disabled={uploading}>
            {uploading ? 'Сжимаю...' : 'Загрузить медиа'}
          </button>
        </div>

        {/* Category */}
        <div className="setting-row">
          <div className="setting-label">Категория</div>
          <select className="setting-text-input" value={draft.categoryId}
            onChange={e => setDraft({ ...draft, categoryId: e.target.value })}>
            {categories.map(c => <option key={c.id} value={c.id}>{c.nameRu} ({c.slug})</option>)}
          </select>
        </div>

        {/* Model */}
        <div className="setting-row">
          <div className="setting-label">Модель</div>
          <select className="setting-text-input" value={draft.modelId}
            onChange={e => setDraft({ ...draft, modelId: e.target.value })}>
            {MODELS.map(m => <option key={m.id} value={m.id}>{m.name} ({m.id})</option>)}
          </select>
        </div>

        {/* Prompts */}
        <div className="setting-row">
          <div className="setting-label">Промпт RU</div>
          <textarea className="setting-text-input" rows={4} value={draft.promptRu}
            onChange={e => setDraft({ ...draft, promptRu: e.target.value })} />
        </div>
        <div className="setting-row">
          <div className="setting-label">Промпт EN</div>
          <textarea className="setting-text-input" rows={4} value={draft.promptEn}
            onChange={e => setDraft({ ...draft, promptEn: e.target.value })} />
        </div>

        {/* Badge */}
        <div className="setting-row">
          <div className="setting-label">Бейдж</div>
          <div className="setting-chips">
            <button className={`setting-chip ${!draft.badge ? 'active' : ''}`}
              onClick={() => setDraft({ ...draft, badge: null })}>нет</button>
            {PRESET_BADGES.map(tag => (
              <button key={tag}
                className={`setting-chip ${draft.badge === tag ? 'active' : ''}`}
                onClick={() => setDraft({ ...draft, badge: tag })}>{tag}</button>
            ))}
          </div>
          <input className="setting-text-input" placeholder="или свой..."
            value={draft.badge && !PRESET_BADGES.includes(draft.badge) ? draft.badge : ''}
            onChange={e => setDraft({ ...draft, badge: e.target.value || null })}
            style={{ marginTop: 6 }} />
        </div>

        <button className="btn-primary" onClick={() => onSave(draft)}
          disabled={!draft.promptRu.trim() || !draft.promptEn.trim()}>
          Сохранить
        </button>
      </div>
    </div>
  )
}

// ─── Category editor modal ────────────────────────────────────────

function CategoryEditor({ cat, isNew, onClose, onSave }: {
  cat: Category; isNew: boolean; onClose: () => void; onSave: (c: Category) => void
}) {
  const [draft, setDraft] = useState<Category>(cat)

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 500,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }} onClick={onClose}>
      <div className="card" style={{
        width: '100%', maxWidth: 320, padding: 16,
        display: 'flex', flexDirection: 'column', gap: 10,
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{isNew ? 'Новая категория' : 'Категория'}</div>
          <button onClick={onClose} className="btn-chip">×</button>
        </div>
        <div className="setting-row">
          <div className="setting-label">Slug (латиница)</div>
          <input className="setting-text-input" value={draft.slug}
            onChange={e => setDraft({ ...draft, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
            placeholder="portrait" />
        </div>
        <div className="setting-row">
          <div className="setting-label">Название RU</div>
          <input className="setting-text-input" value={draft.nameRu}
            onChange={e => setDraft({ ...draft, nameRu: e.target.value })} />
        </div>
        <div className="setting-row">
          <div className="setting-label">Название EN</div>
          <input className="setting-text-input" value={draft.nameEn}
            onChange={e => setDraft({ ...draft, nameEn: e.target.value })} />
        </div>
        <div className="setting-row">
          <div className="setting-label">Позиция (для порядка)</div>
          <input type="number" className="setting-text-input" value={draft.position}
            onChange={e => setDraft({ ...draft, position: Number(e.target.value) })} />
        </div>
        <button className="btn-primary"
          disabled={!draft.slug.trim() || !draft.nameRu.trim() || !draft.nameEn.trim()}
          onClick={() => onSave(draft)}>
          Сохранить
        </button>
      </div>
    </div>
  )
}
