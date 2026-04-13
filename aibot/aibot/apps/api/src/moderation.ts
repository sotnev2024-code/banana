// ─── Word blacklist ──────────────────────────────────────────────────────────

const BLACKLIST_RU = [
  'порно', 'порнография', 'секс', 'эротик', 'голый', 'голая', 'обнажен',
  'наркотик', 'героин', 'кокаин', 'метамфетамин',
  'терроризм', 'террорист', 'взрыв', 'бомба', 'убийство', 'убить',
  'суицид', 'самоубийство',
  'детск', 'несовершеннолетн', 'ребёнок в сексуальн', 'ребенок в сексуальн',
  'насилие над детьми', 'педофил',
  'нацизм', 'нацист', 'свастик', 'гитлер',
  'расстрел', 'казнь', 'пытк',
]

const BLACKLIST_EN = [
  'porn', 'pornograph', 'nude', 'naked', 'nsfw', 'xxx', 'erotic',
  'drug', 'heroin', 'cocaine', 'methamphetamine',
  'terrorism', 'terrorist', 'bomb', 'kill', 'murder',
  'suicide', 'self-harm',
  'child abuse', 'pedophil', 'minor in sexual', 'underage',
  'nazi', 'swastika', 'hitler',
  'execution', 'torture', 'gore', 'dismember',
]

const BLACKLIST = [...BLACKLIST_RU, ...BLACKLIST_EN]

export function checkBlacklist(text: string): { blocked: boolean; word?: string } {
  const lower = text.toLowerCase()
  for (const word of BLACKLIST) {
    if (lower.includes(word)) {
      return { blocked: true, word }
    }
  }
  return { blocked: false }
}

// ─── DeepSeek AI moderation ─────────────────────────────────────────────────

const DEEPSEEK_API = 'https://api.deepseek.com/v1/chat/completions'

const MODERATION_PROMPT = `You are a content moderation system. Analyze the following user prompt that will be used for AI image/video/music generation.

Determine if the prompt requests any of the following PROHIBITED content:
1. Sexual or pornographic content
2. Child exploitation or abuse
3. Extreme violence, gore, torture
4. Terrorism or terrorist propaganda
5. Drug manufacturing instructions
6. Hate speech, nazism, discrimination
7. Self-harm or suicide instructions
8. Real person deepfakes for harmful purposes

Respond with ONLY a JSON object:
- If SAFE: {"safe": true}
- If UNSAFE: {"safe": false, "reason": "brief explanation"}

User prompt to analyze:`

export async function moderateWithDeepSeek(prompt: string): Promise<{ safe: boolean; reason?: string }> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    // If no key configured, skip AI moderation
    return { safe: true }
  }

  try {
    const res = await fetch(DEEPSEEK_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'user', content: `${MODERATION_PROMPT}\n\n${prompt}` },
        ],
        max_tokens: 100,
        temperature: 0,
      }),
    })

    if (!res.ok) {
      console.error('DeepSeek moderation error:', res.status)
      return { safe: true } // fail open — don't block on API errors
    }

    const data = await res.json() as any
    const content = data.choices?.[0]?.message?.content ?? ''

    try {
      const parsed = JSON.parse(content)
      return { safe: !!parsed.safe, reason: parsed.reason }
    } catch {
      // If can't parse, check for keywords
      if (content.toLowerCase().includes('"safe": false') || content.toLowerCase().includes('"safe":false')) {
        return { safe: false, reason: 'Content policy violation' }
      }
      return { safe: true }
    }
  } catch (err) {
    console.error('DeepSeek moderation failed:', err)
    return { safe: true } // fail open
  }
}

// ─── Combined moderation ────────────────────────────────────────────────────

export async function moderatePrompt(prompt: string, modelId?: string): Promise<{ allowed: boolean; reason?: string }> {
  // Step 1: Blacklist check (instant)
  const blacklist = checkBlacklist(prompt)
  if (blacklist.blocked) {
    return { allowed: false, reason: 'Запрещённый контент' }
  }

  // Step 2: DeepSeek AI moderation
  // Skip for motion/avatar models where character transfer is the core feature
  const skipAiModels = ['kling-3-0-motion', 'kling-2-6-motion', 'kling-avatar', 'kling-2-6-i2v', 'grok-image-to-video', 'grok-image-to-image', 'seedream-4-5-edit']
  if (modelId && skipAiModels.includes(modelId)) {
    return { allowed: true }
  }

  const ai = await moderateWithDeepSeek(prompt)
  if (!ai.safe) {
    return { allowed: false, reason: ai.reason ?? 'Контент не прошёл модерацию' }
  }

  return { allowed: true }
}
