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
  maxDuration?: number          // seconds, for video/motion
  resolutions?: string[]        // available resolutions
  aspectRatios?: string[]       // supported aspect ratios
  maxPromptLength?: number      // max prompt chars
  pricingNote?: string          // pricing details
  kieModel: string              // actual model string for kie.ai API
  kieEndpoint: string           // API endpoint path
}

export const MODELS: ModelConfig[] = [
  // ══════════════════════ IMAGE ══════════════════════

  {
    id: 'nano-banana-pro',
    name: 'Nano Banana Pro',
    type: 'IMAGE',
    tokensPerGeneration: 18,
    supportsImageInput: true,
    description: 'Google Imagen — быстро, до 4K, референсы',
    maxPromptLength: 10000,
    resolutions: ['1K', '2K', '4K'],
    aspectRatios: ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9', 'auto'],
    pricingNote: '18 cr ($0.09) 1K | 24 cr ($0.12) 2K/4K',
    kieModel: 'nano-banana-pro',
    kieEndpoint: '/jobs/createTask',
  },
  {
    id: 'nano-banana-2',
    name: 'Nano Banana 2',
    type: 'IMAGE',
    tokensPerGeneration: 8,
    supportsImageInput: true,
    description: 'Дешевая генерация, до 14 референсов, 4K',
    maxPromptLength: 20000,
    resolutions: ['1K', '2K', '4K'],
    aspectRatios: ['1:1', '1:4', '1:8', '2:3', '3:2', '3:4', '4:1', '4:3', '4:5', '5:4', '8:1', '9:16', '16:9', '21:9', 'auto'],
    pricingNote: '8 cr ($0.04) 1K | 12 cr ($0.06) 2K | 18 cr ($0.09) 4K',
    kieModel: 'nano-banana-2',
    kieEndpoint: '/jobs/createTask',
  },
  {
    id: 'seedream-4-5-edit',
    name: 'Seedream 4.5 Edit',
    type: 'IMAGE',
    tokensPerGeneration: 7,
    supportsImageInput: true,
    description: 'ByteDance — редактирование изображений, 4K',
    maxPromptLength: 3000,
    resolutions: ['2K', '4K'],
    aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16', '2:3', '3:2', '21:9'],
    pricingNote: '6.5 cr ($0.0325) за генерацию',
    kieModel: 'seedream/4.5-edit',
    kieEndpoint: '/jobs/createTask',
  },
  {
    id: 'seedream-5-lite',
    name: 'Seedream 5.0 Lite',
    type: 'IMAGE',
    tokensPerGeneration: 6,
    supportsImageInput: false,
    description: 'ByteDance — самое дешёвое, текст-в-изображение',
    maxPromptLength: 3000,
    resolutions: ['2K', '4K'],
    aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16', '2:3', '3:2', '21:9'],
    pricingNote: '5.5 cr ($0.0275) за генерацию',
    kieModel: 'seedream/5-lite-text-to-image',
    kieEndpoint: '/jobs/createTask',
  },
  {
    id: 'grok-text-to-image',
    name: 'Grok Imagine',
    type: 'IMAGE',
    tokensPerGeneration: 5,
    supportsImageInput: false,
    description: 'xAI — 4-6 вариантов за раз, очень дёшево',
    maxPromptLength: 5000,
    aspectRatios: ['2:3', '3:2', '1:1', '16:9', '9:16'],
    pricingNote: 'Standard: 4 cr за 6шт | Quality: 5 cr за 4шт',
    kieModel: 'grok-imagine/text-to-image',
    kieEndpoint: '/jobs/createTask',
  },
  {
    id: 'grok-image-to-image',
    name: 'Grok Edit',
    type: 'IMAGE',
    tokensPerGeneration: 4,
    supportsImageInput: true,
    description: 'xAI — редактирование по референсу, 2 варианта',
    maxPromptLength: 5000,
    aspectRatios: ['2:3', '3:2', '1:1', '16:9', '9:16'],
    pricingNote: '4 cr ($0.02) за 2 изображения',
    kieModel: 'grok-imagine/image-to-image',
    kieEndpoint: '/jobs/createTask',
  },

  // ══════════════════════ VIDEO ══════════════════════

  {
    id: 'veo3-lite',
    name: 'Veo 3.1 Lite',
    type: 'VIDEO',
    tokensPerGeneration: 30,
    supportsImageInput: true,
    description: 'Google Veo — бюджетная версия + аудио',
    maxPromptLength: 5000,
    aspectRatios: ['16:9', '9:16', 'Auto'],
    pricingNote: '30 cr ($0.15) за видео',
    kieModel: 'veo3_lite',
    kieEndpoint: '/veo/generate',
  },
  {
    id: 'veo3-fast',
    name: 'Veo 3.1 Fast',
    type: 'VIDEO',
    tokensPerGeneration: 60,
    supportsImageInput: true,
    description: 'Google Veo — быстрый, 1080p + аудио',
    maxPromptLength: 5000,
    aspectRatios: ['16:9', '9:16', 'Auto'],
    pricingNote: '60 cr ($0.30) за видео',
    kieModel: 'veo3_fast',
    kieEndpoint: '/veo/generate',
  },
  {
    id: 'veo3-quality',
    name: 'Veo 3.1 Quality',
    type: 'VIDEO',
    tokensPerGeneration: 250,
    supportsImageInput: true,
    description: 'Google Veo — макс качество, 4K + аудио',
    maxPromptLength: 5000,
    aspectRatios: ['16:9', '9:16', 'Auto'],
    pricingNote: '250 cr ($1.25) за видео',
    kieModel: 'veo3',
    kieEndpoint: '/veo/generate',
  },
  {
    id: 'kling-3-0',
    name: 'Kling 3.0',
    type: 'VIDEO',
    tokensPerGeneration: 100,
    supportsImageInput: true,
    description: 'Мультишот, элементы, до 15 сек, аудио',
    maxDuration: 15,
    maxPromptLength: 500,
    resolutions: ['720p', '1080p'],
    aspectRatios: ['16:9', '9:16', '1:1'],
    pricingNote: 'Std: 14 cr/сек без аудио, 20 cr/сек с аудио | Pro: 18/27 cr/сек',
    kieModel: 'kling-3.0/video',
    kieEndpoint: '/jobs/createTask',
  },
  {
    id: 'kling-2-6-i2v',
    name: 'Kling 2.6 Image→Video',
    type: 'VIDEO',
    tokensPerGeneration: 55,
    supportsImageInput: true,
    description: 'Анимация фото в видео, 5-10 сек',
    maxDuration: 10,
    maxPromptLength: 1000,
    pricingNote: '5с: 55 cr ($0.28) | 10с: 110 cr ($0.55) | +аудио x2',
    kieModel: 'kling-2.6/image-to-video',
    kieEndpoint: '/jobs/createTask',
  },
  {
    id: 'seedance-2',
    name: 'Seedance 2.0',
    type: 'VIDEO',
    tokensPerGeneration: 90,
    supportsImageInput: true,
    description: 'ByteDance — аудио, мульти-референсы, 4-15 сек',
    maxDuration: 15,
    maxPromptLength: 1536,
    resolutions: ['480p', '720p'],
    aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16', '21:9', 'adaptive'],
    pricingNote: '480P: 11.5-19 cr/сек | 720P: 25-41 cr/сек',
    kieModel: 'bytedance/seedance-2',
    kieEndpoint: '/jobs/createTask',
  },
  {
    id: 'grok-text-to-video',
    name: 'Grok Video',
    type: 'VIDEO',
    tokensPerGeneration: 20,
    supportsImageInput: false,
    description: 'xAI — до 30 сек видео, дёшево',
    maxDuration: 30,
    maxPromptLength: 5000,
    resolutions: ['480p', '720p'],
    aspectRatios: ['2:3', '3:2', '1:1', '16:9', '9:16'],
    pricingNote: '480p: 1.6 cr/сек | 720p: 3 cr/сек',
    kieModel: 'grok-imagine/text-to-video',
    kieEndpoint: '/jobs/createTask',
  },
  {
    id: 'grok-image-to-video',
    name: 'Grok Animate',
    type: 'VIDEO',
    tokensPerGeneration: 20,
    supportsImageInput: true,
    description: 'xAI — анимация фото, до 30 сек, дёшево',
    maxDuration: 30,
    maxPromptLength: 5000,
    resolutions: ['480p', '720p'],
    aspectRatios: ['2:3', '3:2', '1:1', '16:9', '9:16'],
    pricingNote: '480p: 1.6 cr/сек | 720p: 3 cr/сек',
    kieModel: 'grok-imagine/image-to-video',
    kieEndpoint: '/jobs/createTask',
  },

  // ══════════════════════ MOTION ══════════════════════

  {
    id: 'kling-3-0-motion',
    name: 'Kling 3.0 Motion',
    type: 'MOTION',
    tokensPerGeneration: 120,
    supportsImageInput: true,
    description: 'Motion control v3, фото+видео-референс, 1080p',
    maxDuration: 30,
    maxPromptLength: 2500,
    resolutions: ['720p', '1080p'],
    pricingNote: '720p: 20 cr/сек ($0.10) | 1080p: 27 cr/сек ($0.135)',
    kieModel: 'kling-3.0/motion-control',
    kieEndpoint: '/jobs/createTask',
  },
  {
    id: 'kling-2-6-motion',
    name: 'Kling 2.6 Motion',
    type: 'MOTION',
    tokensPerGeneration: 40,
    supportsImageInput: true,
    description: 'Бюджетный motion control, на 60% дешевле',
    maxDuration: 30,
    maxPromptLength: 2500,
    resolutions: ['720p', '1080p'],
    pricingNote: '720p: 6 cr/сек ($0.03) | 1080p: 9 cr/сек ($0.045)',
    kieModel: 'kling-2.6/motion-control',
    kieEndpoint: '/jobs/createTask',
  },
  {
    id: 'kling-avatar',
    name: 'Kling AI Avatar',
    type: 'MOTION',
    tokensPerGeneration: 80,
    supportsImageInput: true,
    description: 'Анимация аватара по аудио, до 15 сек',
    maxDuration: 15,
    maxPromptLength: 5000,
    resolutions: ['720p', '1080p'],
    pricingNote: '720P: 8 cr/сек ($0.04) | 1080P: 16 cr/сек ($0.08)',
    kieModel: 'kling/ai-avatar-pro',
    kieEndpoint: '/jobs/createTask',
  },

  // ══════════════════════ MUSIC ══════════════════════

  {
    id: 'suno-v4',
    name: 'Suno V4',
    type: 'MUSIC',
    tokensPerGeneration: 12,
    supportsImageInput: false,
    description: 'AI музыка до 4 минут',
    maxPromptLength: 500,
    pricingNote: '12 cr ($0.06) за генерацию',
    kieModel: 'V4',
    kieEndpoint: '/generate',
  },
  {
    id: 'suno-v4-5',
    name: 'Suno V4.5',
    type: 'MUSIC',
    tokensPerGeneration: 12,
    supportsImageInput: false,
    description: 'AI музыка до 8 минут, улучшенное качество',
    maxPromptLength: 500,
    pricingNote: '12 cr ($0.06) за генерацию',
    kieModel: 'V4_5',
    kieEndpoint: '/generate',
  },
  {
    id: 'suno-v5',
    name: 'Suno V5',
    type: 'MUSIC',
    tokensPerGeneration: 12,
    supportsImageInput: false,
    description: 'Новейшая версия, до 8 минут, лучший звук',
    maxPromptLength: 500,
    pricingNote: '12 cr ($0.06) за генерацию',
    kieModel: 'V5',
    kieEndpoint: '/generate',
  },
  {
    id: 'suno-v5-5',
    name: 'Suno V5.5',
    type: 'MUSIC',
    tokensPerGeneration: 12,
    supportsImageInput: false,
    description: 'Топовая версия, до 8 минут, студийное качество',
    maxPromptLength: 500,
    pricingNote: '12 cr ($0.06) за генерацию',
    kieModel: 'V5_5',
    kieEndpoint: '/generate',
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
