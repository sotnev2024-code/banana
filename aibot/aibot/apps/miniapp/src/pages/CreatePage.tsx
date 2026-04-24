import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { MODELS, type ModelConfig, getModelsByType, calculatePrice } from '@aibot/shared'
import { createGeneration, uploadFile } from '../api/client'
import { useAuth } from '../hooks/useAuth'
import { ModelSettings } from '../components/ui/ModelSettings'
import { t, getLang } from '../i18n'

const PREVIEW_BASE = '/uploads/previews'

// Admin-uploaded model previews override the bundled defaults; hidden models are filtered out.
const adminPreviewOverrides: Record<string, { type: 'image' | 'video'; url: string }> = {}
const adminHiddenModels = new Set<string>()
let overridesLoaded = false
function loadAdminOverrides(onLoad?: () => void) {
  if (overridesLoaded) { onLoad?.(); return }
  overridesLoaded = true
  fetch(`${import.meta.env.VITE_API_URL}/feed/model-previews`)
    .then(r => r.json())
    .then((rows: { modelId: string; mediaUrl: string | null; mediaType: 'image' | 'video'; hidden: boolean }[]) => {
      for (const r of rows) {
        if (r.mediaUrl) adminPreviewOverrides[r.modelId] = { type: r.mediaType, url: r.mediaUrl }
        if (r.hidden) adminHiddenModels.add(r.modelId)
      }
      onLoad?.()
    })
    .catch(() => onLoad?.())
}

// Models with image/video previews on server
const MODEL_PREVIEWS: Record<string, { type: 'image' | 'video'; file: string }> = {
  // Images
  'nano-banana-pro':    { type: 'image', file: 'nano-banana-pro-thumb.jpg' },
  'nano-banana-2':      { type: 'image', file: 'nano-banana-2-thumb.jpg' },
  'seedream-4-5-edit':  { type: 'image', file: 'seedream-4-5-edit-thumb.jpg' },
  'seedream-5-lite':    { type: 'image', file: 'seedream-5-lite-thumb.jpg' },
  'grok-text-to-image': { type: 'image', file: 'grok-text-to-image-thumb.jpg' },
  'grok-image-to-image':{ type: 'image', file: 'grok-image-to-image-thumb.jpg' },
  // Videos
  'grok-text-to-video': { type: 'video', file: 'grok-text-to-video-sm.mp4' },
  'grok-image-to-video':{ type: 'video', file: 'grok-image-to-video-sm.mp4' },
  'kling-2-6-i2v':      { type: 'video', file: 'kling-2-6-i2v-sm.mp4' },
  'veo3-lite':          { type: 'video', file: 'veo3-sm.mp4' },
  'veo3-fast':          { type: 'video', file: 'veo3-sm.mp4' },
  'veo3-quality':       { type: 'video', file: 'veo3-sm.mp4' },
  'seedance-2':         { type: 'video', file: 'seedance-2-sm.mp4' },
  'kling-3-0':          { type: 'video', file: 'kling-3-0-sm.mp4' },
  // Motion
  'kling-3-0-motion':   { type: 'video', file: 'kling-3-0-motion-sm.mp4' },
  'kling-2-6-motion':   { type: 'video', file: 'kling-2-6-motion-sm.mp4' },
  'kling-avatar':       { type: 'video', file: 'kling-avatar-sm.mp4' },
}

const MODEL_COLORS: Record<string, string> = {
  'veo3-lite': 'linear-gradient(135deg,#E8F5E9,#66BB6A)',
  'veo3-fast': 'linear-gradient(135deg,#EAF3DE,#97C459)',
  'veo3-quality': 'linear-gradient(135deg,#E1F5EE,#1D9E75)',
  'kling-3-0': 'linear-gradient(135deg,#E3F2FD,#42A5F5)',
  'kling-2-6-i2v': 'linear-gradient(135deg,#E8EAF6,#5C6BC0)',
  'seedance-2': 'linear-gradient(135deg,#FFF3E0,#FFA726)',
  'grok-image-to-video': 'linear-gradient(135deg,#FCE4EC,#F06292)',
  'kling-3-0-motion': 'linear-gradient(135deg,#E3F2FD,#1E88E5)',
  'kling-2-6-motion': 'linear-gradient(135deg,#E8EAF6,#7986CB)',
  'kling-avatar': 'linear-gradient(135deg,#FFF8E1,#FFD54F)',
}

const TYPE_TABS = [
  { id: 'IMAGE',  key: 'feed.photo' as const },
  { id: 'VIDEO',  key: 'feed.video' as const },
  { id: 'MUSIC',  key: 'feed.music' as const },
  { id: 'MOTION', key: 'feed.motion' as const },
]

function ModelCard({ model, selected, onSelect }: { model: ModelConfig; selected: boolean; onSelect: () => void }) {
  const override = adminPreviewOverrides[model.id]
  const defaultPreview = MODEL_PREVIEWS[model.id]
  const previewSrc = override?.url ?? (defaultPreview ? `${PREVIEW_BASE}/${defaultPreview.file}` : null)
  const previewType = override?.type ?? defaultPreview?.type
  const isMusic = model.type === 'MUSIC'
  const desc = getLang() === 'en' && model.descriptionEn ? model.descriptionEn : model.description

  return (
    <div className={`model-card ${selected ? 'model-card-selected' : ''}`} onClick={onSelect}>
      {previewSrc && previewType === 'video' ? (
        <video
          src={previewSrc}
          loop muted playsInline autoPlay
          style={{ width: '100%', height: 120, objectFit: 'cover' }}
        />
      ) : previewSrc && previewType === 'image' ? (
        <img
          src={previewSrc}
          alt={model.name}
          loading="lazy"
          style={{ width: '100%', height: 120, objectFit: 'cover' }}
        />
      ) : isMusic ? (
        <div className="music-waveform-bg" style={{ height: 120 }}>
          <div className="waveform-bars">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="waveform-bar" style={{ animationDelay: `${i * 0.12}s` }} />
            ))}
          </div>
        </div>
      ) : (
        <div style={{
          height: 120, background: MODEL_COLORS[model.id] ?? 'var(--surface2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={1.5} style={{ opacity: 0.6 }}>
            {model.type === 'VIDEO' ? <><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M10 9l5 3-5 3V9z"/></>
             : <><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></>}
          </svg>
        </div>
      )}
      <div className="model-card-overlay">
        <div className="model-card-name">{model.name}</div>
        <div className="model-card-price">{desc}</div>
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
  const [files, setFiles] = useState<{ file: File; preview: string; type: 'image' | 'video' | 'audio'; duration?: number }[]>([])
  const [modelSettings, setModelSettings] = useState<Record<string, string | number | boolean>>({})
  const [genState, setGenState] = useState<GenState>('idle')
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [genId, setGenId] = useState<string | null>(null)
  const [isPublic, setIsPublic] = useState(true)
  const fileRef = useRef<HTMLInputElement>(null)

  const [, forceRender] = useState(0)
  const models = getModelsByType(type as any).filter(m => !adminHiddenModels.has(m.id))

  // Load admin model preview overrides once, then re-render so hidden filter applies
  useEffect(() => { loadAdminOverrides(() => forceRender(n => n + 1)) }, [])

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
    const newFiles = Array.from(e.target.files ?? [])
    const maxImg = model?.maxImages ?? 1
    const maxVid = model?.maxVideos ?? 0
    const maxAud = model?.maxAudios ?? 0

    const additions = await Promise.all(newFiles.map(async file => {
      const ft = file.type.startsWith('video/') ? 'video' as const
        : file.type.startsWith('audio/') ? 'audio' as const
        : 'image' as const
      const preview = URL.createObjectURL(file)
      let duration: number | undefined

      // Get duration for video/audio
      if (ft === 'video' || ft === 'audio') {
        duration = await getMediaDuration(preview, ft)
      }

      return { file, preview, type: ft, duration }
    }))

    setFiles(prev => {
      const combined = [...prev, ...additions]
      const images = combined.filter(f => f.type === 'image').slice(0, maxImg)
      const videos = combined.filter(f => f.type === 'video').slice(0, maxVid || 0)
      const audios = combined.filter(f => f.type === 'audio').slice(0, maxAud || 0)
      return [...images, ...videos, ...audios]
    })
    e.target.value = ''
  }

  function getMediaDuration(url: string, type: 'video' | 'audio'): Promise<number> {
    return new Promise(resolve => {
      const el = document.createElement(type)
      el.preload = 'metadata'
      el.onloadedmetadata = () => { resolve(Math.ceil(el.duration)); URL.revokeObjectURL(url) }
      el.onerror = () => resolve(0)
      el.src = url
    })
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Prompt history
  const [showHistory, setShowHistory] = useState(false)
  const promptHistory: string[] = JSON.parse(localStorage.getItem('promptHistory') ?? '[]')

  const saveToHistory = (p: string) => {
    const history = JSON.parse(localStorage.getItem('promptHistory') ?? '[]') as string[]
    const filtered = history.filter(h => h !== p)
    filtered.unshift(p)
    localStorage.setItem('promptHistory', JSON.stringify(filtered.slice(0, 20)))
  }

  const handleGenerate = async () => {
    if (!selectedModel || !prompt.trim()) return
    saveToHistory(prompt.trim())
    setGenState('loading'); setError('')
    try {
      // Upload all files
      const uploadedUrls: string[] = []
      for (const f of files) {
        const url = await uploadFile(f.file)
        uploadedUrls.push(url)
      }
      // Pass video duration in settings for accurate pricing
      const genSettings = { ...modelSettings }
      const videoDur = files.find(f => f.type === 'video')?.duration
      if (videoDur) (genSettings as any)._videoDuration = videoDur

      const gen = await createGeneration({
        model: selectedModel, prompt, isPublic, settings: genSettings,
        imageUrl: uploadedUrls[0],
        imageUrls: uploadedUrls.length > 1 ? uploadedUrls : undefined,
      })
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

        {model?.supportsImageInput && (() => {
          const accept = [
            'image/*',
            model.acceptsVideo ? 'video/*' : '',
            model.acceptsAudio ? 'audio/*' : '',
          ].filter(Boolean).join(',')
          const maxTotal = (model.maxImages ?? 1) + (model.maxVideos ?? 0) + (model.maxAudios ?? 0)
          const canAddMore = files.length < maxTotal

          return (
            <>
              <input ref={fileRef} type="file" accept={accept} multiple={maxTotal > 1} style={{ display: 'none' }} onChange={handleFileChange} />

              {files.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {files.map((f, i) => (
                    <div key={i} style={{ position: 'relative', width: 72, height: 72, borderRadius: 8, overflow: 'hidden', background: 'var(--surface2)' }}>
                      {f.type === 'image' && <img src={f.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                      {f.type === 'video' && <>
                        <video src={f.preview} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        {f.duration && <div style={{ position: 'absolute', bottom: 2, left: 2, fontSize: 9, color: '#fff', background: 'rgba(0,0,0,0.6)', padding: '1px 4px', borderRadius: 3 }}>{f.duration}s</div>}
                      </>}
                      {f.type === 'audio' && (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth={1.5}><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/></svg>
                        </div>
                      )}
                      <button onClick={() => removeFile(i)} style={{ position: 'absolute', top: 2, right: 2, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#fff" strokeWidth={1.5} strokeLinecap="round"><path d="M1 1l8 8M9 1l-8 8"/></svg>
                      </button>
                    </div>
                  ))}
                  {canAddMore && (
                    <div onClick={() => fileRef.current?.click()} style={{ width: 72, height: 72, borderRadius: 8, border: '1.5px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--text3)" strokeWidth={1.5} strokeLinecap="round"><path d="M10 4v12M4 10h12"/></svg>
                    </div>
                  )}
                </div>
              )}

              {files.length === 0 && (
                <div className="upload-zone" onClick={() => fileRef.current?.click()}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth={1.5} style={{ margin: '0 auto 6px' }}>
                    <path d="M12 16V4M8 8l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"/>
                  </svg>
                  <div style={{ fontSize: 13, color: 'var(--text2)' }}>{t('create.uploadRef')}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                    {t('create.uploadOptional')}
                    {maxTotal > 1 && ` (max ${maxTotal})`}
                    {model.acceptsVideo && ' + video'}
                    {model.acceptsAudio && ' + audio'}
                  </div>
                </div>
              )}
            </>
          )
        })()}

        <div style={{ position: 'relative' }}>
          <textarea className="prompt-area" placeholder={t('create.promptPlaceholder')}
            value={prompt} onChange={e => setPrompt(e.target.value)} rows={3}
            onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)} />
          {promptHistory.length > 0 && (
            <button onClick={() => setShowHistory(!showHistory)}
              style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 6, background: 'var(--surface)', border: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text2)" strokeWidth={2} strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
              </svg>
            </button>
          )}
          {showHistory && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 10, maxHeight: 160, overflowY: 'auto', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
              {promptHistory.map((p, i) => (
                <div key={i} onClick={() => { setPrompt(p); setShowHistory(false) }}
                  style={{ padding: '10px 12px', fontSize: 13, borderBottom: i < promptHistory.length - 1 ? '0.5px solid var(--border)' : undefined, cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Publish toggle */}
        <div className="setting-toggle-row" onClick={() => setIsPublic(!isPublic)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{t('create.publishToFeed')}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>{t('create.publishDesc')}</div>
          </div>
          <div className={`setting-toggle ${isPublic ? 'on' : ''}`}>
            <div className="setting-toggle-knob" />
          </div>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: '#fcebeb', borderRadius: 10, fontSize: 13, color: '#a32d2d' }}>{error}</div>
        )}

        <button className="btn-primary" onClick={handleGenerate} disabled={!prompt.trim() || !selectedModel}>
          {t('create.generate')} — {selectedModel ? calculatePrice(selectedModel, modelSettings, files.find(f => f.type === 'video')?.duration) : 0}
        </button>
      </div>
    </>
  )
}
