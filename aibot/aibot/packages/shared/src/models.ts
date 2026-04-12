// ─── Generation types ────────────────────────────────────────────────────────

export type GenerationType = 'IMAGE' | 'VIDEO' | 'MUSIC' | 'MOTION'
export type GenerationStatus = 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED' | 'REFUNDED'

// ─── Model catalog ────────────────────────────────────────────────────────────

export interface ModelConfig {
  id: string
  name: string
  type: GenerationType
  tokensPerGeneration: number
  supportsImageInput: boolean
  description: string
  maxDuration?: number // seconds, for video
}

export const MODELS: ModelConfig[] = [
  // IMAGE
  {
    id: 'midjourney-v7',
    name: 'Midjourney v7',
    type: 'IMAGE',
    tokensPerGeneration: 30,
    supportsImageInput: true,
    description: 'Художественный стиль, лучший визуал',
  },
  {
    id: 'flux-kontext',
    name: 'Flux Kontext',
    type: 'IMAGE',
    tokensPerGeneration: 20,
    supportsImageInput: true,
    description: 'Редактирование и генерация по референсу',
  },
  {
    id: 'nano-banana-pro',
    name: 'Nano Banana Pro',
    type: 'IMAGE',
    tokensPerGeneration: 15,
    supportsImageInput: true,
    description: 'Быстро, дёшево, 4K качество',
  },
  {
    id: 'gpt-4o-image',
    name: '4o Image',
    type: 'IMAGE',
    tokensPerGeneration: 25,
    supportsImageInput: true,
    description: 'GPT-4o: точный текст в изображениях',
  },
  // VIDEO
  {
    id: 'veo3-fast',
    name: 'Veo 3.1 Fast',
    type: 'VIDEO',
    tokensPerGeneration: 150,
    supportsImageInput: true,
    description: 'Google Veo — быстрая версия, 8 сек',
    maxDuration: 8,
  },
  {
    id: 'veo3-quality',
    name: 'Veo 3.1 Quality',
    type: 'VIDEO',
    tokensPerGeneration: 500,
    supportsImageInput: true,
    description: 'Google Veo — максимальное качество + аудио',
    maxDuration: 8,
  },
  {
    id: 'wan-2-6',
    name: 'Wan 2.6',
    type: 'VIDEO',
    tokensPerGeneration: 200,
    supportsImageInput: true,
    description: 'Alibaba, до 15 сек, синхронный звук',
    maxDuration: 15,
  },
  {
    id: 'runway-aleph',
    name: 'Runway Aleph',
    type: 'MOTION',
    tokensPerGeneration: 180,
    supportsImageInput: true,
    description: 'Motion control, точное управление камерой',
    maxDuration: 10,
  },
  // MUSIC
  {
    id: 'suno-v4-5',
    name: 'Suno V4.5',
    type: 'MUSIC',
    tokensPerGeneration: 40,
    supportsImageInput: false,
    description: 'AI музыка до 4 минут',
  },
  {
    id: 'suno-v4-5-plus',
    name: 'Suno V4.5 Plus',
    type: 'MUSIC',
    tokensPerGeneration: 80,
    supportsImageInput: false,
    description: 'AI музыка до 8 минут, студийное качество',
  },
]

export const getModel = (id: string) => MODELS.find(m => m.id === id)
export const getModelsByType = (type: GenerationType) => MODELS.filter(m => m.type === type)

// ─── Token plans ──────────────────────────────────────────────────────────────

export interface TokenPlan {
  id: string
  name: string
  tokens: number
  bonusTokens: number
  priceRub: number
  popular?: boolean
}

export const TOKEN_PLANS: TokenPlan[] = [
  { id: 'start',   name: 'Старт',    tokens: 300,  bonusTokens: 0,    priceRub: 299  },
  { id: 'basic',   name: 'Базовый',  tokens: 800,  bonusTokens: 100,  priceRub: 699  },
  { id: 'pro',     name: 'Про',      tokens: 2000, bonusTokens: 400,  priceRub: 1499, popular: true },
  { id: 'max',     name: 'Максимум', tokens: 5000, bonusTokens: 1500, priceRub: 3499 },
]

export const getPlan = (id: string) => TOKEN_PLANS.find(p => p.id === id)
export const REFERRAL_BONUS = 50 // tokens per referred user who made first purchase
export const WELCOME_BONUS = 30  // tokens on /start
