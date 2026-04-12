import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { MODELS, type ModelConfig, getModelsByType } from '@aibot/shared'
import { createGeneration } from '../api/client'
import { useAuth } from '../hooks/useAuth'
import { ModelSettings } from '../components/ui/ModelSettings'
import { t } from '../i18n'

const MODEL_COLORS: Record<string, string> = {
  'nano-banana-pro': 'linear-gradient(135deg,#FAEEDA,#EF9F27)',
  'nano-banana-2': 'linear-gradient(135deg,#FFF3E0,#FF9800)',
  'seedream-4-5-edit': 'linear-gradient(135deg,#E8F5E9,#4CAF50)',
  'seedream-5-lite': 'linear-gradient(135deg,#E1F5EE,#26A69A)',
  'grok-text-to-image': 'linear-gradient(135deg,#F3E5F5,#AB47BC)',
  'grok-image-to-image': 'linear-gradient(135deg,#FCE4EC,#EC407A)',
  'veo3-lite': 'linear-gradient(135deg,#E8F5E9,#66BB6A)',
  'veo3-fast': 'linear-gradient(135deg,#EAF3DE,#97C459)',
  'veo3-quality': 'linear-gradient(135deg,#E1F5EE,#1D9E75)',
  'kling-3-0': 'linear-gradient(135deg,#E3F2FD,#42A5F5)',
  'kling-2-6-i2v': 'linear-gradient(135deg,#E8EAF6,#5C6BC0)',
  'seedance-2': 'linear-gradient(135deg,#FFF3E0,#FFA726)',
  'grok-text-to-video': 'linear-gradient(135deg,#F3E5F5,#BA68C8)',
  'grok-image-to-video': 'linear-gradient(135deg,#FCE4EC,#F06292)',
  'kling-3-0-motion': 'linear-gradient(135deg,#E3F2FD,#1E88E5)',
  'kling-2-6-motion': 'linear-gradient(135deg,#E8EAF6,#7986CB)',
  'kling-avatar': 'linear-gradient(135deg,#FFF8E1,#FFD54F)',
  'suno-v4': 'linear-gradient(135deg,#EEEDFE,#7F77DD)',
  'suno-v4-5': 'linear-gradient(135deg,#EEEDFE,#9C95F0)',
  'suno-v5': 'linear-gradient(135deg,#E8EAF6,#5C6BC0)',
  'suno-v5-5': 'linear-gradient(135deg,#26215C,#7F77DD)',
}

const TYPE_TABS = [
  { id: 'IMAGE',  key: 'feed.photo' as const },
  { id: 'VIDEO',  key: 'feed.video' as const },
  { id: 'MUSIC',  key: 'feed.music' as const },
  { id: 'MOTION', key: 'feed.motion' as const },
]

function ModelCard({ model, selected, onSelect }: { model: ModelConfig; selected: boolean; onSelect: () => void }) {
  return (
    <div className={`model-card ${selected ? 'model-card-selected' : ''}`} onClick={onSelect}>
      <div style={{
        height: 120, background: MODEL_COLORS[model.id] ?? 'var(--surface2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={1.5} style={{ opacity: 0.6 }}>
          {model.type === 'IMAGE' ? <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></>
           : model.type === 'VIDEO' ? <><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M10 9l5 3-5 3V9z"/></>
           : model.type === 'MUSIC' ? <><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></>
           : <><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></>}
        </svg>
      </div>
      <div className="model-card-overlay">
        <div className="model-card-name">{model.name}</div>
        <div className="model-card-price">{model.tokensPerGeneration} · {model.description}</div>
      </div>
      {selected && (
        <div style={{
          position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: '50%',
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
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [modelSettings, setModelSettings] = useState<Record<string, string | number | boolean>>({})
  const [genState, setGenState] = useState<GenState>('idle')
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [genId, setGenId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const models = getModelsByType(type as any)

  useEffect(() => {
    if (models.length > 0) setSelectedModel(models[0].id)
    setModelSettings({})
  }, [type])

  // Reset settings when model changes
  useEffect(() => {
    const m = MODELS.find(m => m.id === selectedModel)
    if (m?.settings) {
      const defaults: Record<string, string | number | boolean> = {}
      for (const s of m.settings) {
        if (s.defaultValue !== undefined) defaults[s.id] = s.defaultValue
      }
      setModelSettings(defaults)
    } else {
      setModelSettings({})
    }
  }, [selectedModel])

  useEffect(() => {
    if (state?.model) {
      const m = MODELS.find(m => m.id === state.model)
      if (m) { setType(m.type); setSelectedModel(m.id) }
    }
  }, [])

  useEffect(() => {
    if (genState !== 'polling' || !genId) return
    const interval = setInterval(async () => {
      const { getGeneration } = await import('../api/client')
      const gen = await getGeneration(genId).catch(() => null)
      if (!gen) return
      if (gen.status === 'DONE' && gen.resultUrl) {
        setResultUrl(gen.resultUrl); setGenState('done'); refresh(); clearInterval(interval)
      } else if (gen.status === 'FAILED') {
        setError(t('create.genError')); setGenState('error'); refresh(); clearInterval(interval)
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [genState, genId])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageUrl(URL.createObjectURL(file))
  }

  const handleGenerate = async () => {
    if (!selectedModel || !prompt.trim()) return
    const fullPrompt = prompt
    setGenState('loading'); setError('')
    try {
      const gen = await createGeneration({ model: selectedModel, prompt: fullPrompt, imageUrl: imageUrl ?? undefined, settings: modelSettings })
      setGenId(gen.id); setGenState('polling')
    } catch (err: any) {
      setError(err.message ?? 'Error'); setGenState('error')
      if (err.status === 402) setError(t('create.insufficientTokens', { required: err.required, balance: err.balance }))
    }
  }

  const model = MODELS.find(m => m.id === selectedModel)

  if (genState === 'polling' || genState === 'loading') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', gap: 20, padding: 24 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', border: '3px solid var(--accent-light)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>{t('create.generating')}</div>
          <div style={{ fontSize: 14, color: 'var(--text2)', marginTop: 6 }}>{t('create.generatingTime')}</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>{t('create.generatingHint')}</div>
        </div>
      </div>
    )
  }

  if (genState === 'done' && resultUrl) {
    const isVideo = model?.type === 'VIDEO' || model?.type === 'MOTION'
    return (
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 600 }}>{t('create.done')}</div>
        {isVideo
          ? <video src={resultUrl} controls style={{ width: '100%', borderRadius: 16 }} />
          : <img src={resultUrl} alt="result" style={{ width: '100%', borderRadius: 16 }} />
        }
        <a href={resultUrl} download className="btn-primary">{t('create.download')}</a>
        <button className="btn-outline" onClick={() => { setGenState('idle'); setResultUrl(null) }}>
          {t('create.createMore')}
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="topbar">
        <div><div className="topbar-title">{t('create.title')}</div></div>
        {user && <div className="token-badge">{user.balance}</div>}
      </div>

      <div className="filter-row">
        {TYPE_TABS.map(tab => (
          <button key={tab.id} className={`filter-pill ${type === tab.id ? 'active' : ''}`}
            onClick={() => setType(tab.id)}>
            {t(tab.key)}
          </button>
        ))}
      </div>

      <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {models.map(m => (
            <ModelCard key={m.id} model={m} selected={selectedModel === m.id} onSelect={() => setSelectedModel(m.id)} />
          ))}
        </div>

        {/* Model settings */}
        {model?.settings && model.settings.length > 0 && (
          <ModelSettings
            settings={model.settings}
            values={modelSettings}
            onChange={(id, val) => setModelSettings(prev => ({ ...prev, [id]: val }))}
            maxPromptLength={model.maxPromptLength}
            promptLength={prompt.length}
          />
        )}

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
                  <div style={{ fontSize: 13, color: 'var(--text2)' }}>{t('create.uploadRef')}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{t('create.uploadOptional')}</div>
                </>
              )}
            </div>
          </>
        )}

        <textarea className="prompt-area" placeholder={t('create.promptPlaceholder')}
          value={prompt} onChange={e => setPrompt(e.target.value)} rows={3} />

        {error && (
          <div style={{ padding: '10px 14px', background: '#fcebeb', borderRadius: 10, fontSize: 13, color: '#a32d2d' }}>{error}</div>
        )}

        <button className="btn-primary" onClick={handleGenerate} disabled={!prompt.trim() || !selectedModel}>
          {t('create.generate')} — {model?.tokensPerGeneration ?? 0}
        </button>
      </div>
    </>
  )
}
