// Minimal GeminiGen AI integration (test mode).
// Same contract as kieai.ts: generate() returns a task id, pollTask() checks status.
// Task ids from here are prefixed with "gg_" so pollTask() in kieai.ts can route back.

const BASE = 'https://api.geminigen.ai/uapi/v1'

interface GenerateResponse {
  id: number
  uuid: string
  status: number
  status_percentage: number
  type: string
  model_name: string
}

interface TaskResult {
  status: 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED'
  resultUrl?: string
}

interface ModelMap {
  endpoint: string
  category: 'image' | 'veo' | 'kling' | 'kling-motion' | 'seedance' | 'grok-video' | 'grok-image'
  model: string
}

function headers() {
  return { 'x-api-key': process.env.GEMINIGEN_API_KEY ?? '' }
}

// Our model id → GeminiGen endpoint + model id
export function mapModel(ourId: string): ModelMap | null {
  switch (ourId) {
    case 'nano-banana-pro':     return { endpoint: '/generate_image',    category: 'image',        model: 'nano-banana-pro' }
    case 'nano-banana-2':       return { endpoint: '/generate_image',    category: 'image',        model: 'nano-banana-2' }

    case 'veo3-lite':           return { endpoint: '/video-gen/veo',     category: 'veo',          model: 'veo-3.1-lite' }
    case 'veo3-fast':           return { endpoint: '/video-gen/veo',     category: 'veo',          model: 'veo-3.1-fast' }
    case 'veo3-quality':        return { endpoint: '/video-gen/veo',     category: 'veo',          model: 'veo-3.1' }

    case 'kling-3-0':           return { endpoint: '/video-gen/kling',   category: 'kling',        model: 'kling-video-3-0' }
    case 'kling-2-6-i2v':       return { endpoint: '/video-gen/kling',   category: 'kling',        model: 'kling-video-2-6' }

    case 'kling-3-0-motion':    return { endpoint: '/video-gen/kling',   category: 'kling-motion', model: 'kling-video-motion-3' }
    case 'kling-2-6-motion':    return { endpoint: '/video-gen/kling',   category: 'kling-motion', model: 'kling-video-motion' }

    case 'seedance-2':          return { endpoint: '/video-gen/seedance', category: 'seedance',    model: 'seedance-2' }

    case 'grok-text-to-video':  return { endpoint: '/video-gen/grok',    category: 'grok-video',   model: 'grok-3' }
    case 'grok-image-to-video': return { endpoint: '/video-gen/grok',    category: 'grok-video',   model: 'grok-3' }

    case 'grok-text-to-image':  return { endpoint: '/imagen/grok',       category: 'grok-image',   model: '' }
    case 'grok-image-to-image': return { endpoint: '/imagen/grok',       category: 'grok-image',   model: '' }

    // Unsupported (Suno music, Seedream, Kling avatar) fall back to KIE via caller
    default: return null
  }
}

export function isSupported(ourId: string): boolean {
  return mapModel(ourId) !== null
}

// ─── Generate ──────────────────────────────────────────────────────────

export async function generate(
  ourId: string,
  prompt: string,
  imageUrl: string | undefined,
  settings: Record<string, string | number | boolean> = {},
): Promise<string> {
  const map = mapModel(ourId)
  if (!map) throw new Error(`GeminiGen does not support model: ${ourId}`)

  const form = new FormData()
  form.append('prompt', prompt)
  if (map.model) form.append('model', map.model)

  const urls = ((settings as any)._imageUrls as string[] | undefined) ?? (imageUrl ? [imageUrl] : [])
  const validUrls = urls.filter(u => u && !u.startsWith('blob:'))

  switch (map.category) {
    case 'image': {
      if (settings.aspect_ratio) form.append('aspect_ratio', String(settings.aspect_ratio))
      if (settings.output_format) form.append('output_format', String(settings.output_format))
      if (settings.resolution) form.append('resolution', String(settings.resolution))
      for (const u of validUrls) form.append('file_urls', u)
      break
    }
    case 'veo': {
      if (settings.aspect_ratio) form.append('aspect_ratio', String(settings.aspect_ratio))
      if (settings.resolution) form.append('resolution', String(settings.resolution))
      // Veo 3.1 Lite doesn't support reference; only veo-3.1-fast does reliably
      const allowRef = map.model === 'veo-3.1-fast' || map.model === 'veo-2'
      if (allowRef) {
        for (const u of validUrls.slice(0, 2)) form.append('ref_images', u)
        if (validUrls.length > 0) form.append('mode_image', 'frame')
      }
      break
    }
    case 'kling': {
      const mode = String(settings.mode ?? 'std')
      const sound = settings.sound === true || settings.sound === 'true'
      let klingMode = mode === 'pro' ? 'professional' : 'standard'
      if (sound && map.model === 'kling-video-2-6') klingMode = 'professional_audio'
      form.append('mode', klingMode)
      if (settings.aspect_ratio) form.append('aspect_ratio', String(settings.aspect_ratio))
      if (settings.duration !== undefined) form.append('duration', String(settings.duration))
      const videos = validUrls.filter(u => /\.(mp4|mov|webm)$/i.test(u))
      const images = validUrls.filter(u => !/\.(mp4|mov|webm)$/i.test(u))
      for (const u of images) form.append('ref_images', u)
      for (const u of videos) form.append('ref_videos', u)
      break
    }
    case 'kling-motion': {
      const resMode = String(settings.mode ?? '720p')
      form.append('mode', resMode === '1080p' ? 'professional' : 'standard')
      const videos = validUrls.filter(u => /\.(mp4|mov|webm)$/i.test(u))
      const images = validUrls.filter(u => !/\.(mp4|mov|webm)$/i.test(u))
      for (const u of images) form.append('ref_images', u)
      for (const u of videos) form.append('ref_videos', u)
      break
    }
    case 'seedance': {
      const res = String(settings.resolution ?? '720p')
      form.append('mode', res === '480p' ? 'fast' : 'pro')
      if (settings.aspect_ratio) form.append('aspect_ratio', String(settings.aspect_ratio))
      if (settings.duration !== undefined) form.append('duration', String(settings.duration))
      for (const u of validUrls) form.append('ref_images', u)
      break
    }
    case 'grok-video': {
      if (settings.resolution) form.append('resolution', String(settings.resolution))
      if (settings.aspect_ratio) form.append('aspect_ratio', String(settings.aspect_ratio))
      if (settings.duration !== undefined) form.append('duration', String(settings.duration))
      const modeIn = String(settings.mode ?? 'normal')
      const modeMap: Record<string, string> = {
        normal: 'normal',
        fun: 'extremely-crazy',
        spicy: 'extremely-spicy-or-crazy',
      }
      form.append('mode', modeMap[modeIn] ?? 'normal')
      for (const u of validUrls) form.append('file_urls', u)
      break
    }
    case 'grok-image': {
      const ar = String(settings.aspect_ratio ?? '1:1')
      const orientMap: Record<string, string> = { '16:9': 'landscape', '9:16': 'portrait', '1:1': 'square' }
      form.append('orientation', orientMap[ar] ?? 'landscape')
      const pro = settings.enable_pro === true || settings.enable_pro === 'true'
      form.append('num_result', String(pro ? 4 : 6))
      // Grok image endpoint accepts only `files` (upload), not URLs.
      // For test mode we skip passing refs — text-to-image still works.
      break
    }
  }

  console.log(`[GeminiGen] POST ${map.endpoint} model=${map.model} urls=${validUrls.length}`)
  const res = await fetch(`${BASE}${map.endpoint}`, {
    method: 'POST',
    headers: headers(),
    body: form,
  })

  if (!res.ok) {
    const text = await res.text()
    console.error(`[GeminiGen] HTTP ${res.status}: ${text}`)
    throw new Error(`GeminiGen ${res.status}: ${text.slice(0, 300)}`)
  }

  const data = await res.json() as GenerateResponse
  console.log(`[GeminiGen] uuid=${data.uuid} status=${data.status}`)
  return data.uuid
}

// ─── Poll task ─────────────────────────────────────────────────────────

export async function pollTask(uuid: string): Promise<TaskResult> {
  const res = await fetch(`${BASE}/history/${uuid}`, { headers: headers() })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`GeminiGen poll ${res.status}: ${text.slice(0, 200)}`)
  }
  const data = await res.json() as any

  const status = Number(data.status ?? data.result?.status ?? 0)

  // 2 = Completed
  if (status === 2) {
    const videos = data.generated_video ?? data.result?.generated_video ?? []
    const images = data.generated_image ?? data.result?.generated_image ?? []
    const audios = data.generated_audio ?? data.result?.generated_audio ?? []

    const resultUrl =
      videos[0]?.url ?? videos[0]?.video_url ??
      images[0]?.image_url ?? images[0]?.url ??
      audios[0]?.audio_url ?? audios[0]?.url ??
      data.media_files?.[0]?.url ??
      data.media_url

    return { status: 'DONE', resultUrl }
  }

  // 3 = Failed
  if (status === 3) return { status: 'FAILED' }

  // 1 = Processing
  if (status === 1) return { status: 'PROCESSING' }

  return { status: 'PENDING' }
}
