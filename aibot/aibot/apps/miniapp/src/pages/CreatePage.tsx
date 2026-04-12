import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { MODELS, type ModelConfig, getModelsByType } from '@aibot/shared'
import { createGeneration } from '../api/client'
import { useAuth } from '../hooks/useAuth'

// Map model IDs to demo video URLs (replace with your actual preview videos)
const MODEL_VIDEOS: Record<string, string> = {
  'midjourney-v7':    'https://cdn.your-domain.com/previews/midjourney.mp4',
  'flux-kontext':     'https://cdn.your-domain.com/previews/flux.mp4',
  'nano-banana-pro':  'https://cdn.your-domain.com/previews/nano-banana.mp4',
  'gpt-4o-image':     'https://cdn.your-domain.com/previews/gpt4o.mp4',
  'veo3-fast':        'https://cdn.your-domain.com/previews/veo3-fast.mp4',
  'veo3-quality':     'https://cdn.your-domain.com/previews/veo3-quality.mp4',
  'wan-2-6':          'https://cdn.your-domain.com/previews/wan26.mp4',
  'runway-aleph':     'https://cdn.your-domain.com/previews/runway.mp4',
  'suno-v4-5':        'https://cdn.your-domain.com/previews/suno.mp4',
  'suno-v4-5-plus':   'https://cdn.your-domain.com/previews/suno-plus.mp4',
}

// Solid color fallbacks when no video
const MODEL_COLORS: Record<string, string> = {
  'midjourney-v7':   'linear-gradient(135deg,#EEEDFE,#AFA9EC)',
  'flux-kontext':    'linear-gradient(135deg,#E1F5EE,#5DCAA5)',
  'nano-banana-pro': 'linear-gradient(135deg,#FAEEDA,#EF9F27)',
  'gpt-4o-image':    'linear-gradient(135deg,#E6F1FB,#378ADD)',
  'veo3-fast':       'linear-gradient(135deg,#EAF3DE,#97C459)',
  'veo3-quality':    'linear-gradient(135deg,#E1F5EE,#1D9E75)',
  'wan-2-6':         'linear-gradient(135deg,#FBEAF0,#ED93B1)',
  'runway-aleph':    'linear-gradient(135deg,#FAECE7,#D85A30)',
  'suno-v4-5':       'linear-gradient(135deg,#EEEDFE,#7F77DD)',
  'suno-v4-5-plus':  'linear-gradient(135deg,#26215C,#7F77DD)',
}

const QUICK_STYLES = ['реализм', 'аниме', 'арт', '3D', 'кино', 'минимализм', 'акварель']

const TYPE_TABS = [
  { id: 'IMAGE',  label: 'Фото' },
  { id: 'VIDEO',  label: 'Видео' },
  { id: 'MUSIC',  label: 'Музыка' },
  { id: 'MOTION', label: 'Motion' },
]

function ModelCard({ model, selected, onSelect }: { model: ModelConfig; selected: boolean; onSelect: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const videoUrl = MODEL_VIDEOS[model.id]

  useEffect(() => {
    if (!videoRef.current) return
    videoRef.current.play().catch(() => {})
  }, [])

  return (
    <div
      className={`model-card ${selected ? 'model-card-selected' : ''}`}
      onClick={onSelect}
    >
      {videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          loop
          muted
          playsInline
          style={{ width: '100%', height: 120, objectFit: 'cover' }}
        />
      ) : (
        <div style={{
          height: 120,
          background: MODEL_COLORS[model.id] ?? 'var(--surface2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style={{ fontSize: 32, opacity: 0.4 }}>
            {model.type === 'IMAGE' ? '🖼' : model.type === 'VIDEO' ? '🎬' : model.type === 'MUSIC' ? '🎵' : '🎥'}
          </span>
        </div>
      )}
      <div className="model-card-overlay">
        <div className="model-card-name">{model.name}</div>
        <div className="model-card-price">{model.tokensPerGeneration} 🪙 · {model.description}</div>
      </div>
      {selected && (
        <div style={{
          position: 'absolute', top: 8, right: 8,
          width: 22, height: 22, borderRadius: '50%',
          background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}
    </div>
  )
}

type GenState = 'idle' | 'loading' | 'polling' | 'done' | 'error'

export default function CreatePage() {
  const location = useLocation()
  const state = location.state as { prompt?: string; model?: string } | null
  const { user, refresh } = useAuth()

  const [type, setType] = useState<string>('IMAGE')
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [prompt, setPrompt] = useState(state?.prompt ?? '')
  const [style, setStyle] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [genState, setGenState] = useState<GenState>('idle')
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [genId, setGenId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const models = getModelsByType(type as any)

  // Auto-select first model of type
  useEffect(() => {
    if (models.length > 0) setSelectedModel(models[0].id)
  }, [type])

  // Pre-fill from feed click
  useEffect(() => {
    if (state?.model) {
      const m = MODELS.find(m => m.id === state.model)
      if (m) { setType(m.type); setSelectedModel(m.id) }
    }
  }, [])

  // Poll for result
  useEffect(() => {
    if (genState !== 'polling' || !genId) return
    const interval = setInterval(async () => {
      const { getGeneration } = await import('../api/client')
      const gen = await getGeneration(genId).catch(() => null)
      if (!gen) return
      if (gen.status === 'DONE' && gen.resultUrl) {
        setResultUrl(gen.resultUrl)
        setGenState('done')
        refresh()
        clearInterval(interval)
      } else if (gen.status === 'FAILED') {
        setError('Ошибка генерации. Токены возвращены.')
        setGenState('error')
        refresh()
        clearInterval(interval)
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [genState, genId])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // In production: upload to S3 and get URL
    // For now: create object URL as placeholder
    const url = URL.createObjectURL(file)
    setImageUrl(url)
  }

  const handleGenerate = async () => {
    if (!selectedModel || !prompt.trim()) return
    const fullPrompt = style ? `${prompt}, ${style} style` : prompt

    setGenState('loading')
    setError('')

    try {
      const gen = await createGeneration({ model: selectedModel, prompt: fullPrompt, imageUrl: imageUrl ?? undefined })
      setGenId(gen.id)
      setGenState('polling')
    } catch (err: any) {
      setError(err.message ?? 'Ошибка')
      setGenState('error')
      if (err.status === 402) {
        // Insufficient tokens
        setError(`Недостаточно токенов. Нужно ${err.required}, есть ${err.balance}`)
      }
    }
  }

  const model = MODELS.find(m => m.id === selectedModel)

  if (genState === 'polling' || genState === 'loading') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', gap: 20, padding: 24 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', border: '3px solid var(--accent-light)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Генерирую...</div>
          <div style={{ fontSize: 14, color: 'var(--text2)', marginTop: 6 }}>Это займёт 1–3 минуты</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>Можешь закрыть — пришлю в бот когда будет готово</div>
        </div>
      </div>
    )
  }

  if (genState === 'done' && resultUrl) {
    const isVideo = model?.type === 'VIDEO' || model?.type === 'MOTION'
    return (
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 600 }}>✅ Готово!</div>
        {isVideo ? (
          <video src={resultUrl} controls style={{ width: '100%', borderRadius: 16 }} />
        ) : (
          <img src={resultUrl} alt="result" style={{ width: '100%', borderRadius: 16 }} />
        )}
        <a href={resultUrl} download className="btn-primary">Скачать</a>
        <button className="btn-outline" onClick={() => { setGenState('idle'); setResultUrl(null) }}>
          Создать ещё
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Создать</div>
        </div>
        {user && <div className="token-badge">🪙 {user.balance}</div>}
      </div>

      {/* Type tabs */}
      <div className="filter-row">
        {TYPE_TABS.map(t => (
          <button
            key={t.id}
            className={`filter-pill ${type === t.id ? 'active' : ''}`}
            onClick={() => setType(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Model grid with videos */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {models.map(m => (
            <ModelCard
              key={m.id}
              model={m}
              selected={selectedModel === m.id}
              onSelect={() => setSelectedModel(m.id)}
            />
          ))}
        </div>

        {/* Reference upload (for image/video/motion) */}
        {model?.supportsImageInput && (
          <>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            <div className="upload-zone" onClick={() => fileRef.current?.click()}>
              {imageUrl ? (
                <img src={imageUrl} alt="ref" style={{ width: '100%', maxHeight: 120, objectFit: 'cover', borderRadius: 8 }} />
              ) : (
                <>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth={1.5} style={{ margin: '0 auto 6px' }}>
                    <path d="M12 16V4M8 8l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"/>
                  </svg>
                  <div style={{ fontSize: 13, color: 'var(--text2)' }}>Загрузить референс</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>необязательно</div>
                </>
              )}
            </div>
          </>
        )}

        {/* Prompt */}
        <textarea
          className="prompt-area"
          placeholder="Опишите что хотите создать..."
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          rows={3}
        />

        {/* Quick style tags */}
        <div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>Быстрый стиль</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {QUICK_STYLES.map(s => (
              <button
                key={s}
                onClick={() => setStyle(style === s ? '' : s)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 20,
                  fontSize: 12,
                  border: `0.5px solid ${style === s ? 'var(--accent)' : 'var(--border)'}`,
                  background: style === s ? 'var(--accent-light)' : 'transparent',
                  color: style === s ? 'var(--accent-dark)' : 'var(--text2)',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: '#fcebeb', borderRadius: 10, fontSize: 13, color: '#a32d2d' }}>
            {error}
          </div>
        )}

        {/* Generate button */}
        <button
          className="btn-primary"
          onClick={handleGenerate}
          disabled={!prompt.trim() || !selectedModel}
        >
          Сгенерировать — {model?.tokensPerGeneration ?? 0} 🪙
        </button>
      </div>
    </>
  )
}
