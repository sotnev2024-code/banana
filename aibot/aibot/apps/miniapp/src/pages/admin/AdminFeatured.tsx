import { useState, useEffect, useRef } from 'react'
import { MODELS } from '@aibot/shared'
import {
  adminListFeatured, adminCreateFeatured, adminUpdateFeatured,
  adminDeleteFeatured, adminUploadMedia,
} from './api'
import { toast } from '../../components/ui/Toast'

interface Block {
  id: string
  position: number
  mediaUrl: string | null
  mediaType: 'image' | 'video'
  badge: string | null
  titleRu: string | null
  titleEn: string | null
  descriptionRu: string | null
  descriptionEn: string | null
  modelId: string | null
  externalUrl: string | null
  enabled: boolean
}

const PRESET_BADGES = ['NEW', 'TOP', 'HOT', 'PRO', 'BETA', 'SALE']

export function AdminFeatured() {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [editing, setEditing] = useState<Block | null>(null)

  const load = () => adminListFeatured().then(setBlocks).catch(() => {})
  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    try {
      const block = await adminCreateFeatured({
        mediaType: 'image', enabled: true,
        titleRu: 'Новый блок', titleEn: 'New block',
      })
      setBlocks(prev => [...prev, block])
      setEditing(block)
      toast('Создан')
    } catch (e: any) {
      const msg = e?.message ?? 'unknown'
      alert(`Не удалось создать блок: ${msg}\n\nПроверь, что на сервере выполнено:\n  npx prisma db push\n  npx prisma generate\n  cd apps/api && npx tsc\n  pm2 restart picpulse-api --update-env`)
    }
  }

  const handleSave = async (updated: Block) => {
    const saved = await adminUpdateFeatured(updated.id, updated)
    setBlocks(prev => prev.map(b => b.id === saved.id ? saved : b))
    setEditing(null)
    toast('Сохранено')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить блок?')) return
    await adminDeleteFeatured(id)
    setBlocks(prev => prev.filter(b => b.id !== id))
    if (editing?.id === id) setEditing(null)
    toast('Удалено')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <button className="btn-primary" onClick={handleCreate}>+ Создать блок</button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {blocks.map(b => (
          <BlockRow key={b.id} block={b}
            onEdit={() => setEditing(b)}
            onDelete={() => handleDelete(b.id)}
            onToggle={async () => {
              const saved = await adminUpdateFeatured(b.id, { enabled: !b.enabled })
              setBlocks(prev => prev.map(x => x.id === saved.id ? saved : x))
            }}
          />
        ))}
      </div>

      {editing && (
        <BlockEditor block={editing} onClose={() => setEditing(null)} onSave={handleSave} />
      )}
    </div>
  )
}

function BlockRow({ block, onEdit, onDelete, onToggle }: {
  block: Block; onEdit: () => void; onDelete: () => void; onToggle: () => void
}) {
  return (
    <div className="card" style={{ padding: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
      <div style={{ width: 60, height: 60, borderRadius: 8, overflow: 'hidden', background: 'var(--surface2)', flexShrink: 0 }}>
        {block.mediaUrl ? (
          block.mediaType === 'video'
            ? <video src={block.mediaUrl} muted playsInline autoPlay loop style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <img src={block.mediaUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : null}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
          {block.titleRu || block.titleEn || '(без названия)'}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>
          {block.modelId ? `→ ${block.modelId}` : block.externalUrl ? `→ ${block.externalUrl.slice(0, 30)}…` : 'без действия'}
          {block.badge && ` · ${block.badge}`}
        </div>
      </div>
      <button onClick={onToggle} className="btn-chip" style={{ background: block.enabled ? 'var(--accent-light)' : 'var(--surface2)', color: block.enabled ? 'var(--accent)' : 'var(--text3)', borderColor: block.enabled ? 'var(--accent)' : 'var(--border)' }}>
        {block.enabled ? 'Вкл' : 'Выкл'}
      </button>
      <button onClick={onEdit} className="btn-chip">Изм</button>
      <button onClick={onDelete} className="btn-chip" style={{ color: 'var(--danger)' }}>×</button>
    </div>
  )
}

function BlockEditor({ block, onClose, onSave }: {
  block: Block; onClose: () => void; onSave: (b: Block) => void
}) {
  const [draft, setDraft] = useState<Block>(block)
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

  const targetType: 'model' | 'url' | 'none' =
    draft.modelId ? 'model' : draft.externalUrl ? 'url' : 'none'

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 500,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, overflow: 'auto',
    }} onClick={onClose}>
      <div className="card" style={{
        width: '100%', maxWidth: 380, padding: 16,
        display: 'flex', flexDirection: 'column', gap: 12,
        maxHeight: '90vh', overflow: 'auto',
      }} onClick={e => e.stopPropagation()}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Редактировать блок</div>
          <button onClick={onClose} className="btn-chip">×</button>
        </div>

        {/* Media preview + upload */}
        <div>
          <div className="setting-label">Медиа</div>
          {draft.mediaUrl ? (
            <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', marginTop: 6 }}>
              {draft.mediaType === 'video'
                ? <video src={draft.mediaUrl} muted playsInline autoPlay loop style={{ width: '100%', display: 'block' }} />
                : <img src={draft.mediaUrl} alt="" style={{ width: '100%', display: 'block' }} />}
            </div>
          ) : (
            <div style={{
              height: 120, borderRadius: 10, marginTop: 6,
              background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text3)', fontSize: 12,
            }}>нет медиа</div>
          )}
          <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleUpload} style={{ display: 'none' }} />
          <button onClick={() => fileRef.current?.click()} className="btn-outline" style={{ marginTop: 8 }} disabled={uploading}>
            {uploading ? 'Сжимаю...' : 'Загрузить медиа'}
          </button>
        </div>

        {/* Title RU/EN */}
        <div className="setting-row">
          <div className="setting-label">Название (RU)</div>
          <input className="setting-text-input" value={draft.titleRu ?? ''} onChange={e => setDraft({ ...draft, titleRu: e.target.value })} />
        </div>
        <div className="setting-row">
          <div className="setting-label">Название (EN)</div>
          <input className="setting-text-input" value={draft.titleEn ?? ''} onChange={e => setDraft({ ...draft, titleEn: e.target.value })} />
        </div>

        {/* Description RU/EN */}
        <div className="setting-row">
          <div className="setting-label">Описание (RU)</div>
          <input className="setting-text-input" value={draft.descriptionRu ?? ''} onChange={e => setDraft({ ...draft, descriptionRu: e.target.value })} />
        </div>
        <div className="setting-row">
          <div className="setting-label">Описание (EN)</div>
          <input className="setting-text-input" value={draft.descriptionEn ?? ''} onChange={e => setDraft({ ...draft, descriptionEn: e.target.value })} />
        </div>

        {/* Badge — chip selector + custom */}
        <div className="setting-row">
          <div className="setting-label">Бейдж</div>
          <div className="setting-chips">
            <button className={`setting-chip ${!draft.badge ? 'active' : ''}`}
              onClick={() => setDraft({ ...draft, badge: null })}>
              нет
            </button>
            {PRESET_BADGES.map(tag => (
              <button key={tag}
                className={`setting-chip ${draft.badge === tag ? 'active' : ''}`}
                onClick={() => setDraft({ ...draft, badge: tag })}>
                {tag}
              </button>
            ))}
          </div>
          <input className="setting-text-input" placeholder="или свой бейдж..."
            value={draft.badge && !PRESET_BADGES.includes(draft.badge) ? draft.badge : ''}
            onChange={e => setDraft({ ...draft, badge: e.target.value || null })}
            style={{ marginTop: 6 }} />
        </div>

        {/* Target selector */}
        <div className="setting-row">
          <div className="setting-label">Действие при клике</div>
          <div className="setting-chips">
            <button className={`setting-chip ${targetType === 'model' ? 'active' : ''}`}
              onClick={() => setDraft({ ...draft, modelId: draft.modelId ?? MODELS[0].id, externalUrl: null })}>
              Модель
            </button>
            <button className={`setting-chip ${targetType === 'url' ? 'active' : ''}`}
              onClick={() => setDraft({ ...draft, externalUrl: draft.externalUrl ?? 'https://', modelId: null })}>
              Ссылка
            </button>
            <button className={`setting-chip ${targetType === 'none' ? 'active' : ''}`}
              onClick={() => setDraft({ ...draft, modelId: null, externalUrl: null })}>
              Нет
            </button>
          </div>
        </div>

        {targetType === 'model' && (
          <div className="setting-row">
            <div className="setting-label">Модель</div>
            <select className="setting-text-input" value={draft.modelId ?? ''}
              onChange={e => setDraft({ ...draft, modelId: e.target.value })}>
              {MODELS.map(m => <option key={m.id} value={m.id}>{m.name} ({m.id})</option>)}
            </select>
          </div>
        )}

        {targetType === 'url' && (
          <div className="setting-row">
            <div className="setting-label">URL</div>
            <input className="setting-text-input" value={draft.externalUrl ?? ''} placeholder="https://..."
              onChange={e => setDraft({ ...draft, externalUrl: e.target.value })} />
          </div>
        )}

        {/* Position */}
        <div className="setting-row">
          <div className="setting-label">Позиция (порядок)</div>
          <input type="number" className="setting-text-input" value={draft.position}
            onChange={e => setDraft({ ...draft, position: Number(e.target.value) })} />
        </div>

        <button className="btn-primary" onClick={() => onSave(draft)}>Сохранить</button>
      </div>
    </div>
  )
}
