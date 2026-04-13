// ─── Generation types ────────────────────────────────────────────────────────

export type GenerationType = 'IMAGE' | 'VIDEO' | 'MUSIC' | 'MOTION'
export type GenerationStatus = 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED' | 'REFUNDED'

// ─── Model catalog ────────────────────────────────────────────────────────────

export interface SettingOption {
  id: string
  type: 'select' | 'toggle' | 'slider' | 'text'
  labelRu: string
  labelEn: string
  values?: string[]              // for select
  defaultValue?: string | number | boolean
  min?: number                   // for slider
  max?: number                   // for slider
  step?: number                  // for slider
}

export interface ModelConfig {
  id: string
  name: string
  type: GenerationType
  tokensPerGeneration: number
  supportsImageInput: boolean
  description: string
  descriptionEn?: string
  maxDuration?: number          // seconds, for video/motion
  minDuration?: number          // seconds
  resolutions?: string[]        // available resolutions
  aspectRatios?: string[]       // supported aspect ratios
  maxPromptLength?: number      // max prompt chars
  pricingNote?: string          // pricing details
  kieModel: string              // actual model string for kie.ai API
  kieEndpoint: string           // API endpoint path
  settings?: SettingOption[]    // configurable settings for this model
  maxImages?: number            // max image uploads (0 = none)
  maxVideos?: number            // max video uploads
  maxAudios?: number            // max audio uploads
  acceptsVideo?: boolean        // accepts video reference
  acceptsAudio?: boolean        // accepts audio reference
}

export const MODELS: ModelConfig[] = [
  // ══════════════════════ IMAGE ══════════════════════

  {
    id: 'nano-banana-pro',
    name: 'Nano Banana Pro',
    type: 'IMAGE',
    tokensPerGeneration: 18,
    supportsImageInput: true,
    maxImages: 8,
    description: 'Google Imagen — быстро, до 4K, референсы',
    descriptionEn: 'Google Imagen — fast, up to 4K, references',
    maxPromptLength: 10000,
    resolutions: ['1K', '2K', '4K'],
    aspectRatios: ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9', 'auto'],
    pricingNote: '18 cr ($0.09) 1K | 24 cr ($0.12) 2K/4K',
    kieModel: 'nano-banana-pro',
    kieEndpoint: '/jobs/createTask',
    settings: [
      { id: 'resolution', type: 'select', labelRu: 'Разрешение', labelEn: 'Resolution', values: ['1K', '2K', '4K'], defaultValue: '1K' },
      { id: 'aspect_ratio', type: 'select', labelRu: 'Соотношение сторон', labelEn: 'Aspect ratio', values: ['1:1', '2:3', '3:2', '3:4', '4:3', '9:16', '16:9', 'auto'], defaultValue: '1:1' },
      { id: 'output_format', type: 'select', labelRu: 'Формат', labelEn: 'Format', values: ['png', 'jpg'], defaultValue: 'png' },
    ],
  },
  {
    id: 'nano-banana-2',
    name: 'Nano Banana 2',
    type: 'IMAGE',
    tokensPerGeneration: 8,
    supportsImageInput: true,
    maxImages: 14,
    description: 'Дешевая генерация, до 14 референсов, 4K',
    descriptionEn: 'Cheap generation, up to 14 references, 4K',
    maxPromptLength: 20000,
    resolutions: ['1K', '2K', '4K'],
    aspectRatios: ['1:1', '1:4', '1:8', '2:3', '3:2', '3:4', '4:1', '4:3', '4:5', '5:4', '8:1', '9:16', '16:9', '21:9', 'auto'],
    pricingNote: '8 cr ($0.04) 1K | 12 cr ($0.06) 2K | 18 cr ($0.09) 4K',
    kieModel: 'nano-banana-2',
    kieEndpoint: '/jobs/createTask',
    settings: [
      { id: 'resolution', type: 'select', labelRu: 'Разрешение', labelEn: 'Resolution', values: ['1K', '2K', '4K'], defaultValue: '1K' },
      { id: 'aspect_ratio', type: 'select', labelRu: 'Соотношение сторон', labelEn: 'Aspect ratio', values: ['1:1', '2:3', '3:2', '3:4', '4:3', '9:16', '16:9', 'auto'], defaultValue: 'auto' },
      { id: 'output_format', type: 'select', labelRu: 'Формат', labelEn: 'Format', values: ['png', 'jpg'], defaultValue: 'jpg' },
    ],
  },
  {
    id: 'seedream-4-5-edit',
    name: 'Seedream 4.5 Edit',
    type: 'IMAGE',
    tokensPerGeneration: 7,
    supportsImageInput: true,
    maxImages: 14,
    description: 'ByteDance — редактирование изображений, 4K',
    descriptionEn: 'ByteDance — image editing, 4K',
    maxPromptLength: 3000,
    resolutions: ['2K', '4K'],
    aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16', '2:3', '3:2', '21:9'],
    pricingNote: '6.5 cr ($0.0325) за генерацию',
    kieModel: 'seedream/4.5-edit',
    kieEndpoint: '/jobs/createTask',
    settings: [
      { id: 'aspect_ratio', type: 'select', labelRu: 'Соотношение сторон', labelEn: 'Aspect ratio', values: ['1:1', '4:3', '3:4', '16:9', '9:16', '2:3', '3:2'], defaultValue: '1:1' },
      { id: 'quality', type: 'select', labelRu: 'Качество', labelEn: 'Quality', values: ['basic', 'high'], defaultValue: 'basic' },
    ],
  },
  {
    id: 'seedream-5-lite',
    name: 'Seedream 5.0 Lite',
    type: 'IMAGE',
    tokensPerGeneration: 6,
    supportsImageInput: false,
    description: 'ByteDance — самое дешёвое, текст-в-изображение',
    descriptionEn: 'ByteDance — cheapest, text-to-image',
    maxPromptLength: 3000,
    resolutions: ['2K', '4K'],
    aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16', '2:3', '3:2', '21:9'],
    pricingNote: '5.5 cr ($0.0275) за генерацию',
    kieModel: 'seedream/5-lite-text-to-image',
    kieEndpoint: '/jobs/createTask',
    settings: [
      { id: 'aspect_ratio', type: 'select', labelRu: 'Соотношение сторон', labelEn: 'Aspect ratio', values: ['1:1', '4:3', '3:4', '16:9', '9:16', '2:3', '3:2'], defaultValue: '1:1' },
      { id: 'quality', type: 'select', labelRu: 'Качество', labelEn: 'Quality', values: ['basic', 'high'], defaultValue: 'basic' },
    ],
  },
  {
    id: 'grok-text-to-image',
    name: 'Grok Imagine',
    type: 'IMAGE',
    tokensPerGeneration: 5,
    supportsImageInput: false,
    description: 'xAI — 4-6 вариантов за раз, очень дёшево',
    descriptionEn: 'xAI — 4-6 variants at once, very cheap',
    maxPromptLength: 5000,
    aspectRatios: ['2:3', '3:2', '1:1', '16:9', '9:16'],
    pricingNote: 'Standard: 4 cr за 6шт | Quality: 5 cr за 4шт',
    kieModel: 'grok-imagine/text-to-image',
    kieEndpoint: '/jobs/createTask',
    settings: [
      { id: 'aspect_ratio', type: 'select', labelRu: 'Соотношение сторон', labelEn: 'Aspect ratio', values: ['1:1', '2:3', '3:2', '16:9', '9:16'], defaultValue: '1:1' },
      { id: 'enable_pro', type: 'toggle', labelRu: 'Режим качества (4 шт)', labelEn: 'Quality mode (4 images)', defaultValue: false },
    ],
  },
  {
    id: 'grok-image-to-image',
    name: 'Grok Edit',
    type: 'IMAGE',
    tokensPerGeneration: 4,
    supportsImageInput: true,
    maxImages: 5,
    description: 'xAI — редактирование по референсу, 2 варианта',
    descriptionEn: 'xAI — reference editing, 2 variants',
    maxPromptLength: 5000,
    aspectRatios: ['2:3', '3:2', '1:1', '16:9', '9:16'],
    pricingNote: '4 cr ($0.02) за 2 изображения',
    kieModel: 'grok-imagine/image-to-image',
    kieEndpoint: '/jobs/createTask',
    settings: [],
  },

  // ══════════════════════ VIDEO ══════════════════════

  {
    id: 'veo3-lite',
    name: 'Veo 3.1 Lite',
    type: 'VIDEO',
    tokensPerGeneration: 30,
    supportsImageInput: true,
    description: 'Google Veo — бюджетная версия + аудио',
    descriptionEn: 'Google Veo — budget version + audio',
    maxPromptLength: 5000,
    aspectRatios: ['16:9', '9:16', 'Auto'],
    pricingNote: '30 cr ($0.15) за видео',
    kieModel: 'veo3_lite',
    kieEndpoint: '/veo/generate',
    settings: [
      { id: 'aspect_ratio', type: 'select', labelRu: 'Соотношение сторон', labelEn: 'Aspect ratio', values: ['16:9', '9:16', 'Auto'], defaultValue: '16:9' },
    ],
  },
  {
    id: 'veo3-fast',
    name: 'Veo 3.1 Fast',
    type: 'VIDEO',
    tokensPerGeneration: 60,
    supportsImageInput: true,
    description: 'Google Veo — быстрый, 1080p + аудио',
    descriptionEn: 'Google Veo — fast, 1080p + audio',
    maxPromptLength: 5000,
    aspectRatios: ['16:9', '9:16', 'Auto'],
    pricingNote: '60 cr ($0.30) за видео',
    kieModel: 'veo3_fast',
    kieEndpoint: '/veo/generate',
    settings: [
      { id: 'aspect_ratio', type: 'select', labelRu: 'Соотношение сторон', labelEn: 'Aspect ratio', values: ['16:9', '9:16', 'Auto'], defaultValue: '16:9' },
    ],
  },
  {
    id: 'veo3-quality',
    name: 'Veo 3.1 Quality',
    type: 'VIDEO',
    tokensPerGeneration: 250,
    supportsImageInput: true,
    description: 'Google Veo — макс качество, 4K + аудио',
    descriptionEn: 'Google Veo — max quality, 4K + audio',
    maxPromptLength: 5000,
    aspectRatios: ['16:9', '9:16', 'Auto'],
    pricingNote: '250 cr ($1.25) за видео',
    kieModel: 'veo3',
    kieEndpoint: '/veo/generate',
    settings: [
      { id: 'aspect_ratio', type: 'select', labelRu: 'Соотношение сторон', labelEn: 'Aspect ratio', values: ['16:9', '9:16', 'Auto'], defaultValue: '16:9' },
    ],
  },
  {
    id: 'kling-3-0',
    name: 'Kling 3.0',
    type: 'VIDEO',
    tokensPerGeneration: 100,
    supportsImageInput: true,
    description: 'Мультишот, элементы, до 15 сек, аудио',
    descriptionEn: 'Multi-shot, elements, up to 15 sec, audio',
    maxDuration: 15,
    minDuration: 3,
    maxPromptLength: 500,
    resolutions: ['720p', '1080p'],
    aspectRatios: ['16:9', '9:16', '1:1'],
    pricingNote: 'Std: 14 cr/сек | Pro: 18 cr/сек | +аудио: +6-9 cr/сек',
    kieModel: 'kling-3.0/video',
    kieEndpoint: '/jobs/createTask',
    settings: [
      { id: 'mode', type: 'select', labelRu: 'Качество', labelEn: 'Quality', values: ['std', 'pro'], defaultValue: 'std' },
      { id: 'aspect_ratio', type: 'select', labelRu: 'Соотношение сторон', labelEn: 'Aspect ratio', values: ['16:9', '9:16', '1:1'], defaultValue: '16:9' },
      { id: 'duration', type: 'slider', labelRu: 'Длительность (сек)', labelEn: 'Duration (sec)', min: 3, max: 15, step: 1, defaultValue: 5 },
      { id: 'sound', type: 'toggle', labelRu: 'Звук', labelEn: 'Sound', defaultValue: false },
    ],
  },
  {
    id: 'kling-2-6-i2v',
    name: 'Kling 2.6 Image to Video',
    type: 'VIDEO',
    tokensPerGeneration: 55,
    supportsImageInput: true,
    description: 'Анимация фото в видео, 5-10 сек',
    descriptionEn: 'Photo to video animation, 5-10 sec',
    maxDuration: 10,
    minDuration: 5,
    maxPromptLength: 1000,
    pricingNote: '5с: 55 cr | 10с: 110 cr | +аудио x2',
    kieModel: 'kling-2.6/image-to-video',
    kieEndpoint: '/jobs/createTask',
    settings: [
      { id: 'duration', type: 'select', labelRu: 'Длительность', labelEn: 'Duration', values: ['5', '10'], defaultValue: '5' },
      { id: 'sound', type: 'toggle', labelRu: 'Звук', labelEn: 'Sound', defaultValue: false },
    ],
  },
  {
    id: 'seedance-2',
    name: 'Seedance 2.0',
    type: 'VIDEO',
    tokensPerGeneration: 90,
    supportsImageInput: true,
    maxImages: 9,
    maxVideos: 3,
    maxAudios: 3,
    acceptsVideo: true,
    acceptsAudio: true,
    description: 'ByteDance — аудио, мульти-референсы, 4-15 сек',
    descriptionEn: 'ByteDance — audio, multi-references, 4-15 sec',
    maxDuration: 15,
    minDuration: 4,
    maxPromptLength: 1536,
    resolutions: ['480p', '720p'],
    aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16', '21:9', 'adaptive'],
    pricingNote: '480P: 11.5-19 cr/сек | 720P: 25-41 cr/сек',
    kieModel: 'bytedance/seedance-2',
    kieEndpoint: '/jobs/createTask',
    settings: [
      { id: 'resolution', type: 'select', labelRu: 'Разрешение', labelEn: 'Resolution', values: ['480p', '720p'], defaultValue: '720p' },
      { id: 'aspect_ratio', type: 'select', labelRu: 'Соотношение сторон', labelEn: 'Aspect ratio', values: ['16:9', '9:16', '1:1', '4:3', '3:4', 'adaptive'], defaultValue: '16:9' },
      { id: 'duration', type: 'slider', labelRu: 'Длительность (сек)', labelEn: 'Duration (sec)', min: 4, max: 15, step: 1, defaultValue: 8 },
      { id: 'generate_audio', type: 'toggle', labelRu: 'Генерировать аудио', labelEn: 'Generate audio', defaultValue: true },
    ],
  },
  {
    id: 'grok-text-to-video',
    name: 'Grok Video',
    type: 'VIDEO',
    tokensPerGeneration: 20,
    supportsImageInput: false,
    description: 'xAI — до 30 сек видео, дёшево',
    descriptionEn: 'xAI — up to 30 sec video, cheap',
    maxDuration: 30,
    minDuration: 6,
    maxPromptLength: 5000,
    resolutions: ['480p', '720p'],
    aspectRatios: ['2:3', '3:2', '1:1', '16:9', '9:16'],
    pricingNote: '480p: 1.6 cr/сек | 720p: 3 cr/сек',
    kieModel: 'grok-imagine/text-to-video',
    kieEndpoint: '/jobs/createTask',
    settings: [
      { id: 'resolution', type: 'select', labelRu: 'Разрешение', labelEn: 'Resolution', values: ['480p', '720p'], defaultValue: '480p' },
      { id: 'aspect_ratio', type: 'select', labelRu: 'Соотношение сторон', labelEn: 'Aspect ratio', values: ['16:9', '9:16', '1:1', '2:3', '3:2'], defaultValue: '16:9' },
      { id: 'duration', type: 'slider', labelRu: 'Длительность (сек)', labelEn: 'Duration (sec)', min: 6, max: 30, step: 1, defaultValue: 10 },
      { id: 'mode', type: 'select', labelRu: 'Стиль', labelEn: 'Style', values: ['normal', 'fun', 'spicy'], defaultValue: 'normal' },
    ],
  },
  {
    id: 'grok-image-to-video',
    name: 'Grok Animate',
    type: 'VIDEO',
    tokensPerGeneration: 20,
    supportsImageInput: true,
    maxImages: 7,
    description: 'xAI — анимация фото, до 30 сек, дёшево',
    descriptionEn: 'xAI — photo animation, up to 30 sec, cheap',
    maxDuration: 30,
    minDuration: 6,
    maxPromptLength: 5000,
    resolutions: ['480p', '720p'],
    aspectRatios: ['2:3', '3:2', '1:1', '16:9', '9:16'],
    pricingNote: '480p: 1.6 cr/сек | 720p: 3 cr/сек',
    kieModel: 'grok-imagine/image-to-video',
    kieEndpoint: '/jobs/createTask',
    settings: [
      { id: 'resolution', type: 'select', labelRu: 'Разрешение', labelEn: 'Resolution', values: ['480p', '720p'], defaultValue: '480p' },
      { id: 'duration', type: 'slider', labelRu: 'Длительность (сек)', labelEn: 'Duration (sec)', min: 6, max: 30, step: 1, defaultValue: 10 },
      { id: 'mode', type: 'select', labelRu: 'Стиль', labelEn: 'Style', values: ['normal', 'fun', 'spicy'], defaultValue: 'normal' },
    ],
  },

  // ══════════════════════ MOTION ══════════════════════

  {
    id: 'kling-3-0-motion',
    name: 'Kling 3.0 Motion',
    type: 'MOTION',
    tokensPerGeneration: 120,
    supportsImageInput: true,
    maxImages: 1,
    maxVideos: 1,
    acceptsVideo: true,
    description: 'Motion control v3, фото+видео-референс, 1080p',
    descriptionEn: 'Motion control v3, photo+video reference, 1080p',
    maxDuration: 30,
    minDuration: 3,
    maxPromptLength: 2500,
    resolutions: ['720p', '1080p'],
    pricingNote: '720p: 20 cr/сек ($0.10) | 1080p: 27 cr/сек ($0.135)',
    kieModel: 'kling-3.0/motion-control',
    kieEndpoint: '/jobs/createTask',
    settings: [
      { id: 'mode', type: 'select', labelRu: 'Разрешение', labelEn: 'Resolution', values: ['720p', '1080p'], defaultValue: '720p' },
      { id: 'character_orientation', type: 'select', labelRu: 'Ориентация персонажа', labelEn: 'Character orientation', values: ['video', 'image'], defaultValue: 'video' },
      { id: 'background_source', type: 'select', labelRu: 'Источник фона', labelEn: 'Background source', values: ['input_video', 'input_image'], defaultValue: 'input_video' },
    ],
  },
  {
    id: 'kling-2-6-motion',
    name: 'Kling 2.6 Motion',
    type: 'MOTION',
    tokensPerGeneration: 40,
    supportsImageInput: true,
    maxImages: 1,
    maxVideos: 1,
    acceptsVideo: true,
    description: 'Бюджетный motion control, на 60% дешевле',
    descriptionEn: 'Budget motion control, 60% cheaper',
    maxDuration: 30,
    minDuration: 3,
    maxPromptLength: 2500,
    resolutions: ['720p', '1080p'],
    pricingNote: '720p: 6 cr/сек ($0.03) | 1080p: 9 cr/сек ($0.045)',
    kieModel: 'kling-2.6/motion-control',
    kieEndpoint: '/jobs/createTask',
    settings: [
      { id: 'mode', type: 'select', labelRu: 'Разрешение', labelEn: 'Resolution', values: ['720p', '1080p'], defaultValue: '720p' },
      { id: 'character_orientation', type: 'select', labelRu: 'Ориентация персонажа', labelEn: 'Character orientation', values: ['video', 'image'], defaultValue: 'video' },
    ],
  },
  {
    id: 'kling-avatar',
    name: 'Kling AI Avatar',
    type: 'MOTION',
    tokensPerGeneration: 80,
    supportsImageInput: true,
    maxImages: 1,
    maxAudios: 1,
    acceptsAudio: true,
    description: 'Анимация аватара по аудио, до 15 сек',
    descriptionEn: 'Audio-driven avatar animation, up to 15 sec',
    maxDuration: 15,
    maxPromptLength: 5000,
    resolutions: ['720p', '1080p'],
    pricingNote: '720P: 8 cr/сек ($0.04) | 1080P: 16 cr/сек ($0.08)',
    kieModel: 'kling/ai-avatar-pro',
    kieEndpoint: '/jobs/createTask',
    settings: [],
  },

  // ══════════════════════ MUSIC ══════════════════════

  {
    id: 'suno-v4',
    name: 'Suno V4',
    type: 'MUSIC',
    tokensPerGeneration: 12,
    supportsImageInput: false,
    description: 'AI музыка до 4 минут',
    descriptionEn: 'AI music up to 4 minutes',
    maxPromptLength: 500,
    pricingNote: '12 cr ($0.06) за генерацию',
    kieModel: 'V4',
    kieEndpoint: '/generate',
    settings: [
      { id: 'instrumental', type: 'toggle', labelRu: 'Инструментал (без вокала)', labelEn: 'Instrumental (no vocals)', defaultValue: false },
      { id: 'customMode', type: 'toggle', labelRu: 'Расширенный режим', labelEn: 'Custom mode', defaultValue: false },
      { id: 'title', type: 'text', labelRu: 'Название трека', labelEn: 'Track title', defaultValue: '' },
      { id: 'style', type: 'text', labelRu: 'Стиль (pop, rock, jazz...)', labelEn: 'Style (pop, rock, jazz...)', defaultValue: '' },
    ],
  },
  {
    id: 'suno-v4-5',
    name: 'Suno V4.5',
    type: 'MUSIC',
    tokensPerGeneration: 12,
    supportsImageInput: false,
    description: 'AI музыка до 8 минут, улучшенное качество',
    descriptionEn: 'AI music up to 8 min, improved quality',
    maxPromptLength: 500,
    pricingNote: '12 cr ($0.06) за генерацию',
    kieModel: 'V4_5',
    kieEndpoint: '/generate',
    settings: [
      { id: 'instrumental', type: 'toggle', labelRu: 'Инструментал (без вокала)', labelEn: 'Instrumental (no vocals)', defaultValue: false },
      { id: 'customMode', type: 'toggle', labelRu: 'Расширенный режим', labelEn: 'Custom mode', defaultValue: false },
      { id: 'title', type: 'text', labelRu: 'Название трека', labelEn: 'Track title', defaultValue: '' },
      { id: 'style', type: 'text', labelRu: 'Стиль (pop, rock, jazz...)', labelEn: 'Style (pop, rock, jazz...)', defaultValue: '' },
    ],
  },
  {
    id: 'suno-v5',
    name: 'Suno V5',
    type: 'MUSIC',
    tokensPerGeneration: 12,
    supportsImageInput: false,
    description: 'Новейшая версия, до 8 минут, лучший звук',
    descriptionEn: 'Newest version, up to 8 min, best sound',
    maxPromptLength: 500,
    pricingNote: '12 cr ($0.06) за генерацию',
    kieModel: 'V5',
    kieEndpoint: '/generate',
    settings: [
      { id: 'instrumental', type: 'toggle', labelRu: 'Инструментал (без вокала)', labelEn: 'Instrumental (no vocals)', defaultValue: false },
      { id: 'customMode', type: 'toggle', labelRu: 'Расширенный режим', labelEn: 'Custom mode', defaultValue: false },
      { id: 'title', type: 'text', labelRu: 'Название трека', labelEn: 'Track title', defaultValue: '' },
      { id: 'style', type: 'text', labelRu: 'Стиль (pop, rock, jazz...)', labelEn: 'Style (pop, rock, jazz...)', defaultValue: '' },
    ],
  },
  {
    id: 'suno-v5-5',
    name: 'Suno V5.5',
    type: 'MUSIC',
    tokensPerGeneration: 12,
    supportsImageInput: false,
    description: 'Топовая версия, до 8 минут, студийное качество',
    descriptionEn: 'Top version, up to 8 min, studio quality',
    maxPromptLength: 500,
    pricingNote: '12 cr ($0.06) за генерацию',
    kieModel: 'V5_5',
    kieEndpoint: '/generate',
    settings: [
      { id: 'instrumental', type: 'toggle', labelRu: 'Инструментал (без вокала)', labelEn: 'Instrumental (no vocals)', defaultValue: false },
      { id: 'customMode', type: 'toggle', labelRu: 'Расширенный режим', labelEn: 'Custom mode', defaultValue: false },
      { id: 'title', type: 'text', labelRu: 'Название трека', labelEn: 'Track title', defaultValue: '' },
      { id: 'style', type: 'text', labelRu: 'Стиль (pop, rock, jazz...)', labelEn: 'Style (pop, rock, jazz...)', defaultValue: '' },
    ],
  },
]

export const getModel = (id: string) => MODELS.find(m => m.id === id)
export const getModelsByType = (type: GenerationType) => MODELS.filter(m => m.type === type)

// ─── Dynamic pricing ─────────────────────────────────────────────────────────

// Markup multiplier for profit margin (~70%)
const MARKUP = 2

export function calculatePrice(modelId: string, settings: Record<string, string | number | boolean> = {}): number {
  const model = getModel(modelId)
  if (!model) return 0

  let cost: number

  switch (modelId) {
    // ── IMAGE ──
    case 'nano-banana-pro': {
      const res = String(settings.resolution ?? '1K')
      cost = res === '1K' ? 18 : 24
      break
    }
    case 'nano-banana-2': {
      const res = String(settings.resolution ?? '1K')
      if (res === '1K') cost = 8
      else if (res === '2K') cost = 12
      else cost = 18
      break
    }
    case 'seedream-4-5-edit':
      cost = 7; break
    case 'seedream-5-lite':
      cost = 6; break
    case 'grok-text-to-image': {
      const pro = settings.enable_pro === true || settings.enable_pro === 'true'
      cost = pro ? 5 : 4; break
    }
    case 'grok-image-to-image':
      cost = 4; break

    // ── VIDEO ──
    case 'veo3-lite':
      cost = 30; break
    case 'veo3-fast':
      cost = 60; break
    case 'veo3-quality':
      cost = 250; break

    case 'kling-3-0': {
      const dur = Number(settings.duration ?? 5)
      const mode = String(settings.mode ?? 'std')
      const sound = settings.sound === true || settings.sound === 'true'
      const rateMap: Record<string, number> = {
        'std': sound ? 20 : 14,
        'pro': sound ? 27 : 18,
      }
      cost = Math.ceil((rateMap[mode] ?? 14) * dur)
      break
    }
    case 'kling-2-6-i2v': {
      const dur = String(settings.duration ?? '5')
      const sound = settings.sound === true || settings.sound === 'true'
      if (dur === '5') cost = sound ? 110 : 55
      else cost = sound ? 220 : 110
      break
    }
    case 'seedance-2': {
      const dur = Number(settings.duration ?? 8)
      const res = String(settings.resolution ?? '720p')
      const rate = res === '480p' ? 19 : 41
      cost = Math.ceil(rate * dur)
      break
    }
    case 'grok-text-to-video': {
      const dur = Number(settings.duration ?? 10)
      const res = String(settings.resolution ?? '480p')
      const rate = res === '480p' ? 1.6 : 3
      cost = Math.ceil(rate * dur)
      break
    }
    case 'grok-image-to-video': {
      const dur = Number(settings.duration ?? 10)
      const res = String(settings.resolution ?? '480p')
      const rate = res === '480p' ? 1.6 : 3
      cost = Math.ceil(rate * dur)
      break
    }

    // ── MOTION ──
    case 'kling-3-0-motion': {
      const mode = String(settings.mode ?? '720p')
      const rate = mode === '1080p' ? 54 : 40  // actual KIE pricing
      cost = Math.ceil(rate * 5) // base estimate, actual depends on video length
      break
    }
    case 'kling-2-6-motion': {
      const mode = String(settings.mode ?? '720p')
      const rate = mode === '1080p' ? 18 : 12  // actual KIE pricing
      cost = Math.ceil(rate * 5)
      break
    }
    case 'kling-avatar':
      cost = 80; break

    // ── MUSIC ──
    case 'suno-v4':
    case 'suno-v4-5':
    case 'suno-v5':
    case 'suno-v5-5':
      cost = 12; break

    default:
      cost = model.tokensPerGeneration
  }

  return Math.ceil(cost * MARKUP)
}

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

// ─── Daily bonus ─────────────────────────────────────────────────────────────

export const DAILY_BONUS = [5, 7, 10, 12, 15, 20, 30] // tokens per day (streak 1-7)
export const getDailyBonus = (streak: number) => DAILY_BONUS[Math.min(streak, DAILY_BONUS.length - 1)]

// ─── Achievements ────────────────────────────────────────────────────────────

export interface AchievementDef {
  id: string
  name: string
  description: string
  icon: string
  category: 'generation' | 'social' | 'spending' | 'streak'
  threshold: number
  reward: number // bonus tokens
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // Generation milestones
  { id: 'first-gen',     name: 'Первый шаг',       description: 'Создайте первую генерацию',        icon: '🎨', category: 'generation', threshold: 1,   reward: 5  },
  { id: 'gen-10',        name: 'Креативщик',        description: 'Создайте 10 генераций',            icon: '🔥', category: 'generation', threshold: 10,  reward: 15 },
  { id: 'gen-50',        name: 'Мастер',            description: 'Создайте 50 генераций',            icon: '⭐', category: 'generation', threshold: 50,  reward: 50 },
  { id: 'gen-100',       name: 'Легенда',           description: 'Создайте 100 генераций',           icon: '👑', category: 'generation', threshold: 100, reward: 100 },
  { id: 'gen-500',       name: 'AI Гуру',           description: 'Создайте 500 генераций',           icon: '🏆', category: 'generation', threshold: 500, reward: 300 },

  // Social
  { id: 'first-ref',     name: 'Амбассадор',        description: 'Пригласите первого друга',          icon: '🤝', category: 'social',     threshold: 1,   reward: 20 },
  { id: 'ref-5',         name: 'Нетворкер',         description: 'Пригласите 5 друзей',              icon: '🌐', category: 'social',     threshold: 5,   reward: 50 },
  { id: 'ref-20',        name: 'Инфлюенсер',        description: 'Пригласите 20 друзей',             icon: '📢', category: 'social',     threshold: 20,  reward: 200 },

  // Spending
  { id: 'spend-100',     name: 'Инвестор',          description: 'Потратьте 100 токенов',            icon: '💰', category: 'spending',   threshold: 100,  reward: 10 },
  { id: 'spend-1000',    name: 'Магнат',            description: 'Потратьте 1000 токенов',           icon: '💎', category: 'spending',   threshold: 1000, reward: 50 },
  { id: 'spend-5000',    name: 'Олигарх',           description: 'Потратьте 5000 токенов',           icon: '🏛',  category: 'spending',   threshold: 5000, reward: 200 },

  // Streak
  { id: 'streak-3',      name: 'Стабильность',      description: 'Заходите 3 дня подряд',            icon: '📅', category: 'streak',    threshold: 3,   reward: 10 },
  { id: 'streak-7',      name: 'Недельный марафон', description: 'Заходите 7 дней подряд',           icon: '🗓',  category: 'streak',    threshold: 7,   reward: 30 },
  { id: 'streak-30',     name: 'Железная воля',     description: 'Заходите 30 дней подряд',          icon: '🔥', category: 'streak',    threshold: 30,  reward: 150 },
]

export const getAchievement = (id: string) => ACHIEVEMENTS.find(a => a.id === id)
