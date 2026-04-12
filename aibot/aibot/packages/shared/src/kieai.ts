const KIE_BASE = 'https://api.kie.ai/api/v1'

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
  thumbnailUrl?: string
}

function headers() {
  return {
    'Authorization': `Bearer ${process.env.KIE_API_KEY}`,
    'Content-Type': 'application/json',
  }
}

async function post(path: string, body: Record<string, unknown>): Promise<KieResponse> {
  const res = await fetch(`${KIE_BASE}${path}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`kie.ai HTTP ${res.status}: ${await res.text()}`)
  return res.json()
}

async function get(path: string): Promise<KieResponse> {
  const res = await fetch(`${KIE_BASE}${path}`, { headers: headers() })
  if (!res.ok) throw new Error(`kie.ai HTTP ${res.status}: ${await res.text()}`)
  return res.json()
}

// ─── Image generation ─────────────────────────────────────────────────────────

export async function generateImage(
  prompt: string,
  model: string,
  imageUrl?: string,
  callBackUrl?: string,
): Promise<string> {
  // Map our model ids to kie.ai model strings
  const modelMap: Record<string, string> = {
    'midjourney-v7':    'midjourney',
    'flux-kontext':     'flux-kontext-max',
    'nano-banana-pro':  'nano-banana-pro',
    'gpt-4o-image':     'gpt-4o-image',
  }

  const endpoint = model === 'midjourney-v7' ? '/midjourney/imagine' : '/image/generate'

  const body: Record<string, unknown> = {
    prompt,
    model: modelMap[model] ?? model,
    callBackUrl,
  }
  if (imageUrl) body.imageUrl = imageUrl

  const res = await post(endpoint, body)
  if (res.code !== 200 || !res.data?.taskId) {
    throw new Error(`kie.ai image error: ${res.msg}`)
  }
  return res.data.taskId
}

// ─── Video generation ─────────────────────────────────────────────────────────

export async function generateVideo(
  prompt: string,
  model: string,
  imageUrl?: string,
  callBackUrl?: string,
): Promise<string> {
  const endpointMap: Record<string, string> = {
    'veo3-fast':    '/veo/generate',
    'veo3-quality': '/veo/generate',
    'wan-2-6':      '/wan/generate',
    'runway-aleph': '/runway/generate',
  }

  const kieModelMap: Record<string, string> = {
    'veo3-fast':    'veo3_fast',
    'veo3-quality': 'veo3',
    'wan-2-6':      'wan2.6-t2v',
    'runway-aleph': 'runway-aleph',
  }

  const body: Record<string, unknown> = {
    prompt,
    model: kieModelMap[model] ?? model,
    aspect_ratio: '16:9',
    callBackUrl,
  }
  if (imageUrl) {
    body.imageUrls = [imageUrl]
    body.generationType = 'REFERENCE_2_VIDEO'
  }

  const endpoint = endpointMap[model] ?? '/video/generate'
  const res = await post(endpoint, body)
  if (res.code !== 200 || !res.data?.taskId) {
    throw new Error(`kie.ai video error: ${res.msg}`)
  }
  return res.data.taskId
}

// ─── Music generation ─────────────────────────────────────────────────────────

export async function generateMusic(
  prompt: string,
  model: string,
  callBackUrl?: string,
): Promise<string> {
  const versionMap: Record<string, string> = {
    'suno-v4-5':      'V4_5',
    'suno-v4-5-plus': 'V4_5',
  }

  const body: Record<string, unknown> = {
    prompt,
    model: 'chirp-v4-5',
    mv: versionMap[model] ?? 'V4_5',
    makeInstrumental: false,
    callBackUrl,
  }

  const res = await post('/suno/generate', body)
  if (res.code !== 200 || !res.data?.taskId) {
    throw new Error(`kie.ai music error: ${res.msg}`)
  }
  return res.data.taskId
}

// ─── Poll task status ─────────────────────────────────────────────────────────

export async function pollTask(taskId: string): Promise<TaskResult> {
  const res = await get(`/task/${taskId}`)
  if (res.code !== 200) throw new Error(`kie.ai poll error: ${res.msg}`)

  const data = res.data
  if (!data) return { status: 'PENDING' }

  const kieStatus = (data.status ?? '').toUpperCase()

  if (kieStatus === 'SUCCESS' || kieStatus === 'DONE') {
    // Extract result URL from nested response depending on type
    const resp = data.response as Record<string, unknown> | undefined
    const resultUrl = extractResultUrl(resp)
    return { status: 'DONE', resultUrl }
  }

  if (kieStatus === 'FAILED' || kieStatus === 'ERROR') {
    return { status: 'FAILED' }
  }

  if (kieStatus === 'PROCESSING' || kieStatus === 'RUNNING') {
    return { status: 'PROCESSING' }
  }

  return { status: 'PENDING' }
}

function extractResultUrl(resp?: Record<string, unknown>): string | undefined {
  if (!resp) return undefined
  // Image: resp.imageUrl or resp.imageUrls[0]
  if (typeof resp.imageUrl === 'string') return resp.imageUrl
  if (Array.isArray(resp.imageUrls) && resp.imageUrls.length > 0) return resp.imageUrls[0]
  // Video: resp.videoUrl
  if (typeof resp.videoUrl === 'string') return resp.videoUrl
  // Suno: resp.sunoData[0].audioUrl
  if (Array.isArray(resp.sunoData) && resp.sunoData.length > 0) {
    const track = resp.sunoData[0] as Record<string, unknown>
    if (typeof track.audioUrl === 'string') return track.audioUrl
  }
  return undefined
}
