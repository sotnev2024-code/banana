import { useState, useEffect, useRef } from 'react'
import { MODELS } from '@aibot/shared'
import {
  adminListModelPreviews, adminUpsertModelPreview,
  adminDeleteModelPreview, adminUploadMedia,
} from './api'
import { toast } from '../../components/ui/Toast'

interface Preview {
  id: string
  modelId: string
  mediaUrl: string | null
  mediaType: 'image' | 'video'
  hidden: boolean
  updatedAt: string
}

export function AdminModelPreviews() {
  const [previews, setPreviews] = useState<Preview[]>([])
  const [filter, setFilter] = useState<'all' | 'IMAGE' | 'VIDEO' | 'MUSIC' | 'MOTION'>('all')

  const load = () => adminListModelPreviews().then(setPreviews).catch(() => {})
  useEffect(() => { load() }, [])

  const previewMap = Object.fromEntries(previews.map(p => [p.modelId, p]))

  const filteredModels = filter === 'all' ? MODELS : MODELS.filter(m => m.type === filter)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="filter-row" style={{ padding: 0 }}>
        {[
          { id: 'all',    label: 'Все' },
          { id: 'IMAGE',  label: 'Фото' },
          { id: 'VIDEO',  label: 'Видео' },
          { id: 'MOTION', label: 'Motion' },
          { id: 'MUSIC',  label: 'Музыка' },
        ].map(f => (
          <button key={f.id} className={`filter-pill ${filter === f.id ? 'active' : ''}`}
            onClick={() => setFilter(f.id as any)}>{f.label}</button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filteredModels.map(m => (
          <ModelRow key={m.id} model={m} preview={previewMap[m.id]}
            onUpdate={(p) => {
              setPreviews(prev => {
                const without = prev.filter(x => x.modelId !== m.id)
                return p ? [...without, p] : without
              })
            }}
          />
        ))}
      </div>
    </div>
  )
}

function ModelRow({ model, preview, onUpdate }: {
  model: typeof MODELS[number]; preview?: Preview; onUpdate: (p: Preview | null) => void
}) {
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const { url, mediaType } = await adminUploadMedia(file)
      const saved = await adminUpsertModelPreview(model.id, { mediaUrl: url, mediaType, hidden: preview?.hidden ?? false })
      onUpdate(saved)
      toast(`${model.name} обновлён`)
    } catch (err: any) {
      alert(err.message ?? 'Upload error')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleToggleHide = async () => {
    const newHidden = !(preview?.hidden ?? false)
    try {
      const saved = await adminUpsertModelPreview(model.id, { hidden: newHidden })
      onUpdate(saved)
      toast(newHidden ? 'Скрыто' : 'Показано')
    } catch (err: any) {
      alert(err.message ?? 'Error')
    }
  }

  const handleReset = async () => {
    if (!confirm(`Сбросить превью для ${model.name}? Будет использован дефолтный.`)) return
    await adminDeleteModelPreview(model.id)
    onUpdate(null)
    toast('Сброшено')
  }

  const isHidden = preview?.hidden ?? false

  return (
    <div className="card" style={{
      padding: 10, display: 'flex', gap: 10, alignItems: 'center',
      opacity: isHidden ? 0.5 : 1,
    }}>
      <div style={{ width: 60, height: 60, borderRadius: 8, overflow: 'hidden', background: 'var(--surface2)', flexShrink: 0 }}>
        {preview?.mediaUrl ? (
          preview.mediaType === 'video'
            ? <video src={preview.mediaUrl} muted playsInline autoPlay loop style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <img src={preview.mediaUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: 9 }}>def</div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{model.name}</div>
        <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
          {model.id} · {model.type}
          {isHidden && <span style={{ color: 'var(--danger)', marginLeft: 4 }}>· СКРЫТО</span>}
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleUpload} style={{ display: 'none' }} />
      <button onClick={handleToggleHide} className="btn-chip"
        style={{
          background: isHidden ? 'var(--surface2)' : 'var(--accent-light)',
          color: isHidden ? 'var(--text3)' : 'var(--accent)',
          borderColor: isHidden ? 'var(--border)' : 'var(--accent)',
        }}>
        {isHidden ? 'Скрыто' : 'Видно'}
      </button>
      <button onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-chip">
        {uploading ? '...' : 'Загр.'}
      </button>
      {preview?.mediaUrl && <button onClick={handleReset} className="btn-chip" style={{ color: 'var(--danger)' }}>×</button>}
    </div>
  )
}
