import { getModel } from './models'
import * as geminigen from './geminigenai'

const KIE_BASE = 'https://api.kie.ai/api/v1'

// Feature flag: when "true", supported models are routed through GeminiGen.
// Task ids returned for those get "gg_" prefix so pollTask can route back.
const USE_GEMINIGEN = () => process.env.USE_GEMINIGEN === 'true'
const GG_PREFIX = 'gg_'

interface KieResponse {
  code: number
  msg: string
  data?: {
    taskId: string
    status?: string
    response?: Record<string, unknown>
  }
}

interface TaskResult {
  status: 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED'
  resultUrl?: string
}

function headers() {
  return {
    'Authorization': `Bearer ${process.env.KIE_API_KEY}`,
    'Content-Type': 'application/json',
  }
}

async function post(path: string, body: Record<string, unknown>): Promise<KieResponse> {
  console.log(`[KIE] POST ${path}`, JSON.stringify(body))
  const res = await fetch(`${KIE_BASE}${path}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    console.error(`[KIE] HTTP ${res.status}: ${text}`)
    throw new Error(`kie.ai HTTP ${res.status}: ${text}`)
  }
  const json = await res.json() as KieResponse
  console.log(`[KIE] Response: code=${json.code}, msg=${json.msg}`)
  return json
}

async function get(path: string): Promise<KieResponse> {
  const res = await fetch(`${KIE_BASE}${path}`, { headers: headers() })
  if (!res.ok) throw new Error(`kie.ai HTTP ${res.status}: ${await res.text()}`)
  return res.json()
}

// ─── Unified generation ──────────────────────────────────────────────────────

export async function generate(
  modelId: string,
  prompt: string,
  imageUrl?: string,
  settings: Record<string, string | number | boolean> = {},
  callBackUrl?: string,
): Promise<string> {
  const model = getModel(modelId)
  if (!model) throw new Error(`Unknown model: ${modelId}`)

  // ── Route to GeminiGen when flag is on and model is supported ──
  if (USE_GEMINIGEN() && geminigen.isSupported(modelId)) {
    console.log(`[router] -> GeminiGen for ${modelId}`)
    const uuid = await geminigen.generate(modelId, prompt, imageUrl, settings)
    return GG_PREFIX + uuid
  }

  const endpoint = model.kieEndpoint
  const kieModel = model.kieModel

  // Build request body based on endpoint type
  if (endpoint === '/veo/generate') {
    return generateVeo(kieModel, prompt, imageUrl, settings, callBackUrl)
  }
  if (endpoint === '/generate') {
    return generateSuno(kieModel, prompt, settings, callBackUrl)
  }
  // All /jobs/createTask models
  return generateTask(kieModel, model.type, prompt, imageUrl, settings, callBackUrl)
}

// /jobs/createTask — most models (image, video, motion)
async function generateTask(
  kieModel: string,
  type: string,
  prompt: string,
  imageUrl?: string,
  settings: Record<string, string | number | boolean> = {},
  callBackUrl?: string,
): Promise<string> {
  const input: Record<string, unknown> = { prompt }

  // Always enable NSFW checker
  input.nsfw_checker = true

  // Apply settings
  if (settings.aspect_ratio) input.aspect_ratio = String(settings.aspect_ratio)
  if (settings.resolution) input.resolution = String(settings.resolution)
  if (settings.quality) input.quality = String(settings.quality)
  if (settings.output_format) input.output_format = String(settings.output_format)
  if (settings.mode) input.mode = String(settings.mode)
  if (settings.duration !== undefined) input.duration = Number(settings.duration)
  if (settings.sound !== undefined) input.sound = settings.sound === true || settings.sound === 'true'
  if (settings.generate_audio !== undefined) input.generate_audio = settings.generate_audio === true || settings.generate_audio === 'true'
  if (settings.enable_pro !== undefined) input.enable_pro = settings.enable_pro === true || settings.enable_pro === 'true'
  if (settings.character_orientation) input.character_orientation = String(settings.character_orientation)
  if (settings.background_source) input.background_source = String(settings.background_source)
  if (settings.nsfw_checker !== undefined) input.nsfw_checker = false
  if (settings.web_search !== undefined) input.web_search = settings.web_search === true || settings.web_search === 'true'

  // ── Model-specific required fields ──

  // Kling 3.0: multi_shots (boolean) and multi_prompt (array) are REQUIRED
  if (kieModel === 'kling-3.0/video') {
    input.multi_shots = false
    input.multi_prompt = []
  }

  // Kling 2.6 I2V: sound is REQUIRED boolean, duration must be string "5" or "10"
  if (kieModel === 'kling-2.6/image-to-video') {
    input.sound = input.sound ?? false
    if (input.duration !== undefined) input.duration = String(input.duration)
    else input.duration = '5'
  }

  // Seedance 2.0: web_search is REQUIRED boolean
  if (kieModel === 'bytedance/seedance-2') {
    input.web_search = input.web_search ?? false
  }

  // Grok I2V: spicy mode unavailable with external images — fallback to normal
  if (kieModel === 'grok-imagine/image-to-video') {
    const hasImages = (settings._imageUrls as unknown as string[] | undefined)?.length ?? (imageUrl ? 1 : 0)
    if (hasImages > 0 && String(input.mode) === 'spicy') {
      input.mode = 'normal'
    }
  }

  // File inputs (skip blob: URLs)
  const imageUrls = (settings._imageUrls as unknown as string[] | undefined) ?? (imageUrl && !imageUrl.startsWith('blob:') ? [imageUrl] : [])
  const validUrls = imageUrls.filter(u => !u.startsWith('blob:'))

  if (validUrls.length > 0) {
    if (kieModel.includes('seedance')) {
      // Seedance: separate image/video/audio references
      const imgs = validUrls.filter(u => !u.match(/\.(mp4|mov|wav|mp3|ogg)$/i))
      const vids = validUrls.filter(u => u.match(/\.(mp4|mov)$/i))
      const auds = validUrls.filter(u => u.match(/\.(wav|mp3|ogg)$/i))
      if (imgs.length > 0) input.first_frame_url = imgs[0]
      if (imgs.length > 1) input.reference_image_urls = imgs.slice(1)
      if (vids.length > 0) input.reference_video_urls = vids
      if (auds.length > 0) input.reference_audio_urls = auds
    } else if (kieModel.includes('image-to-video')) {
      input.image_urls = validUrls.slice(0, 1)
    } else if (kieModel.includes('image-to-image')) {
      input.image_urls = validUrls
    } else if (kieModel === 'gpt-image-2-image-to-image') {
      // GPT Image 2 image-to-image: input_urls (max 16)
      input.input_urls = validUrls.slice(0, 16)
    } else if (kieModel.includes('motion-control')) {
      const imgs = validUrls.filter(u => !u.match(/\.(mp4|mov)$/i))
      const vids = validUrls.filter(u => u.match(/\.(mp4|mov)$/i))
      if (imgs.length > 0) input.input_urls = [imgs[0]]
      if (vids.length > 0) input.video_urls = [vids[0]]
    } else if (kieModel.includes('avatar')) {
      const imgs = validUrls.filter(u => !u.match(/\.(wav|mp3|ogg)$/i))
      const auds = validUrls.filter(u => u.match(/\.(wav|mp3|ogg)$/i))
      if (imgs.length > 0) input.image_url = imgs[0]
      if (auds.length > 0) input.audio_url = auds[0]
    } else {
      input.image_input = validUrls
    }
  }

  const body: Record<string, unknown> = {
    model: kieModel,
    input,
  }
  if (callBackUrl) body.callBackUrl = callBackUrl

  const res = await post('/jobs/createTask', body)
  if (res.code !== 200 || !res.data?.taskId) {
    throw new Error(`kie.ai error: ${res.msg}`)
  }
  return res.data.taskId
}

// /veo/generate — Veo 3.x models
async function generateVeo(
  kieModel: string,
  prompt: string,
  imageUrl?: string,
  settings: Record<string, string | number | boolean> = {},
  callBackUrl?: string,
): Promise<string> {
  const body: Record<string, unknown> = {
    prompt,
    model: kieModel,
  }

  if (settings.aspect_ratio) body.aspect_ratio = String(settings.aspect_ratio)
  // Only veo3_fast supports image reference
  if (imageUrl && kieModel === 'veo3_fast') {
    body.imageUrls = [imageUrl]
    body.generationType = 'REFERENCE_2_VIDEO'
  }
  if (callBackUrl) body.callBackUrl = callBackUrl

  const res = await post('/veo/generate', body)
  if (res.code !== 200 || !res.data?.taskId) {
    throw new Error(`kie.ai veo error: ${res.msg}`)
  }
  return res.data.taskId
}

// /generate — Suno music
async function generateSuno(
  kieModel: string,
  prompt: string,
  settings: Record<string, string | number | boolean> = {},
  callBackUrl?: string,
): Promise<string> {
  // customMode and instrumental are REQUIRED booleans
  const customMode = settings.customMode === true || settings.customMode === 'true'
  const instrumental = settings.instrumental === true || settings.instrumental === 'true'

  const body: Record<string, unknown> = {
    prompt,
    model: kieModel,
    customMode,
    instrumental,
  }

  if (customMode) {
    if (settings.title) body.title = String(settings.title)
    if (settings.style) body.style = String(settings.style)
  }

  // callBackUrl is required for Suno
  if (callBackUrl) body.callBackUrl = callBackUrl
  else body.callBackUrl = ''

  const res = await post('/generate', body)
  if (res.code !== 200 || !res.data?.taskId) {
    throw new Error(`kie.ai music error: ${res.msg}`)
  }
  return res.data.taskId
}

// Keep old exports for backward compat
export const generateImage = (prompt: string, model: string, imageUrl?: string, callBackUrl?: string) =>
  generate(model, prompt, imageUrl, {}, callBackUrl)
export const generateVideo = (prompt: string, model: string, imageUrl?: string, callBackUrl?: string) =>
  generate(model, prompt, imageUrl, {}, callBackUrl)
export const generateMusic = (prompt: string, model: string, callBackUrl?: string) =>
  generate(model, prompt, undefined, {}, callBackUrl)

// ─── Poll task status ────────────────────────────────────────────────────────

export async function pollTask(taskId: string): Promise<TaskResult> {
  // Route to GeminiGen when the task id is prefixed
  if (taskId.startsWith(GG_PREFIX)) {
    return geminigen.pollTask(taskId.slice(GG_PREFIX.length))
  }

  // Try /jobs/recordInfo first (for /jobs/createTask models)
  const res = await get(`/jobs/recordInfo?taskId=${taskId}`)
  if (res.code !== 200) {
    // Fallback to /task/ endpoint (for veo/suno)
    const res2 = await get(`/task/${taskId}`)
    if (res2.code !== 200) throw new Error(`kie.ai poll error: ${res2.msg}`)
    return parsePollResponse(res2.data)
  }
  return parsePollResponse(res.data)
}

function parsePollResponse(data: any): TaskResult {
  if (!data) return { status: 'PENDING' }

  const state = (data.state ?? data.status ?? '').toLowerCase()

  if (state === 'success' || state === 'done') {
    // resultJson may be a string that needs parsing
    let resultUrl: string | undefined
    if (typeof data.resultJson === 'string') {
      try {
        const parsed = JSON.parse(data.resultJson)
        resultUrl = extractResultUrl(parsed)
      } catch {
        resultUrl = undefined
      }
    } else if (data.response) {
      resultUrl = extractResultUrl(data.response as Record<string, unknown>)
    }
    return { status: 'DONE', resultUrl }
  }

  if (state === 'fail' || state === 'failed' || state === 'error') {
    return { status: 'FAILED' }
  }

  if (state === 'generating' || state === 'processing' || state === 'running') {
    return { status: 'PROCESSING' }
  }

  // waiting, queuing
  return { status: 'PENDING' }
}

function extractResultUrl(resp?: Record<string, unknown>): string | undefined {
  if (!resp) return undefined
  // resultUrls array (from recordInfo)
  if (Array.isArray(resp.resultUrls) && resp.resultUrls.length > 0) return resp.resultUrls[0]
  // Image
  if (typeof resp.imageUrl === 'string') return resp.imageUrl
  if (Array.isArray(resp.imageUrls) && resp.imageUrls.length > 0) return resp.imageUrls[0]
  // Video
  if (typeof resp.videoUrl === 'string') return resp.videoUrl
  // Music
  if (Array.isArray(resp.sunoData) && resp.sunoData.length > 0) {
    const track = resp.sunoData[0] as Record<string, unknown>
    if (typeof track.audioUrl === 'string') return track.audioUrl
  }
  // Generic fallback
  if (typeof resp.url === 'string') return resp.url
  if (typeof resp.resultUrl === 'string') return resp.resultUrl
  return undefined
}
