# KIE.ai API Reference — Полная документация моделей

> Базовый URL: `https://api.kie.ai/api/v1`
> Авторизация: `Bearer YOUR_API_KEY`
> Получение статуса задачи: `GET /task/{taskId}`
> 1 credit ≈ $0.005

---

## ИЗОБРАЖЕНИЯ (IMAGE)

### 1. Nano Banana Pro (Google)
- **Модель**: `nano-banana-pro`
- **Endpoint**: `POST /jobs/createTask`
- **Цена**: 18 credits ($0.09) за 1K | 24 credits ($0.12) за 2K/4K
- **Описание**: Google Imagen — быстрая генерация до 4K

| Параметр | Тип | Обязательный | Значения | По умолчанию |
|----------|-----|-------------|----------|-------------|
| model | string | Да | `nano-banana-pro` | — |
| callBackUrl | string | Нет | URL | — |
| input.prompt | string | Да | макс 10 000 символов | — |
| input.aspect_ratio | string | Нет | 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9, auto | 1:1 |
| input.resolution | string | Нет | 1K, 2K, 4K | 1K |
| input.output_format | string | Нет | png, jpg | png |
| input.image_input | array | Нет | до 8 изображений, JPEG/PNG/WebP, макс 30MB | [] |

**Лимиты**: промпт до 10 000 символов, до 8 входных изображений, файл до 30MB

---

### 2. Nano Banana 2 (Google)
- **Модель**: `nano-banana-2`
- **Endpoint**: `POST /jobs/createTask`
- **Цена**: 8 credits ($0.04) за 1K | 12 credits ($0.06) за 2K | 18 credits ($0.09) за 4K
- **Описание**: Улучшенная версия Nano Banana, дешевле

| Параметр | Тип | Обязательный | Значения | По умолчанию |
|----------|-----|-------------|----------|-------------|
| model | string | Да | `nano-banana-2` | — |
| callBackUrl | string | Нет | URL | — |
| input.prompt | string | Да | макс 20 000 символов | — |
| input.image_input | array | Нет | до 14 изображений, JPEG/PNG/WebP, макс 30MB | [] |
| input.aspect_ratio | string | Нет | 1:1, 1:4, 1:8, 2:3, 3:2, 3:4, 4:1, 4:3, 4:5, 5:4, 8:1, 9:16, 16:9, 21:9, auto | auto |
| input.resolution | string | Нет | 1K, 2K, 4K | 1K |
| input.output_format | string | Нет | png, jpg | jpg |

**Лимиты**: промпт до 20 000 символов, до 14 входных изображений, файл до 30MB

---

### 3. Seedream 4.5 Edit (ByteDance)
- **Модель**: `seedream/4.5-edit`
- **Endpoint**: `POST /jobs/createTask`
- **Цена**: 6.5 credits ($0.0325) за генерацию
- **Описание**: Редактирование изображений по промпту, до 4K

| Параметр | Тип | Обязательный | Значения | По умолчанию |
|----------|-----|-------------|----------|-------------|
| model | string | Да | `seedream/4.5-edit` | — |
| callBackUrl | string | Нет | URL | — |
| input.prompt | string | Да | макс 3 000 символов | — |
| input.image_urls | array | Да | до 14 изображений, JPEG/PNG/WebP, макс 10MB | — |
| input.aspect_ratio | string | Да | 1:1, 4:3, 3:4, 16:9, 9:16, 2:3, 3:2, 21:9 | 1:1 |
| input.quality | string | Да | basic (2K), high (4K) | basic |
| input.nsfw_checker | boolean | Нет | true/false | false |

**Лимиты**: промпт до 3 000 символов, до 14 изображений, файл до 10MB

---

### 4. Seedream 5.0 Lite (ByteDance)
- **Модель**: `seedream/5-lite-text-to-image`
- **Endpoint**: `POST /jobs/createTask`
- **Цена**: 5.5 credits ($0.0275) за генерацию
- **Описание**: Быстрая генерация текст-в-изображение, до 3K разрешение

| Параметр | Тип | Обязательный | Значения | По умолчанию |
|----------|-----|-------------|----------|-------------|
| model | string | Да | `seedream/5-lite-text-to-image` | — |
| callBackUrl | string | Нет | URL | — |
| input.prompt | string | Да | 3—3 000 символов | — |
| input.aspect_ratio | string | Да | 1:1, 4:3, 3:4, 16:9, 9:16, 2:3, 3:2, 21:9 | 1:1 |
| input.quality | string | Да | basic (2K), high (4K) | basic |
| input.nsfw_checker | boolean | Нет | true/false | false |

**Лимиты**: промпт 3—3 000 символов, 1 изображение на запрос

---

### 5. Grok Imagine Text-to-Image (xAI)
- **Модель**: `grok-imagine/text-to-image`
- **Endpoint**: `POST /jobs/createTask`
- **Цена**: Standard: 4 credits ($0.02) за 6 изображений | Quality: 5 credits ($0.025) за 4 изображения
- **Описание**: xAI генерация изображений, несколько вариантов за раз

| Параметр | Тип | Обязательный | Значения | По умолчанию |
|----------|-----|-------------|----------|-------------|
| model | string | Да | `grok-imagine/text-to-image` | — |
| callBackUrl | string | Нет | URL | — |
| input.prompt | string | Да | макс 5 000 символов (только English) | — |
| input.aspect_ratio | string | Нет | 2:3, 3:2, 1:1, 16:9, 9:16 | 1:1 |
| input.nsfw_checker | boolean | Нет | true/false | false |
| input.enable_pro | boolean | Нет | false=Standard(6шт), true=Quality(4шт) | false |

**Лимиты**: промпт до 5 000 символов, только английский язык

---

### 6. Grok Imagine Image-to-Image (xAI)
- **Модель**: `grok-imagine/image-to-image`
- **Endpoint**: `POST /jobs/createTask`
- **Цена**: 4 credits ($0.02) за 2 изображения
- **Описание**: Редактирование изображений по референсу

| Параметр | Тип | Обязательный | Значения | По умолчанию |
|----------|-----|-------------|----------|-------------|
| model | string | Да | `grok-imagine/image-to-image` | — |
| callBackUrl | string | Нет | URL | — |
| input.prompt | string | Нет | макс 390 000 символов | — |
| input.image_urls | array | Да | до 5 URL, JPEG/PNG/WebP, макс 10MB | — |
| input.nsfw_checker | boolean | Нет | true/false | false |

**Лимиты**: 1 изображение на запрос (реально), файл до 10MB. Синтаксис `@image(n)` в промпте.

---

## ВИДЕО (VIDEO)

### 7. Veo 3.1 (Google)
- **Модель**: `veo3`, `veo3_fast`, `veo3_lite`
- **Endpoint**: `POST /veo/generate`
- **Цена**: Lite: 30 credits ($0.15) | Fast: 60 credits ($0.30) | Quality: 250 credits ($1.25)
- **Описание**: Google Veo 3.1 — лучшее видео + аудио

| Параметр | Тип | Обязательный | Значения | По умолчанию |
|----------|-----|-------------|----------|-------------|
| prompt | string | Да | текст | — |
| imageUrls | array | Нет | 1-3 URL | — |
| model | string | Нет | veo3, veo3_fast, veo3_lite | veo3_fast |
| generationType | string | Нет | TEXT_2_VIDEO, FIRST_AND_LAST_FRAMES_2_VIDEO, REFERENCE_2_VIDEO | авто |
| aspect_ratio | string | Нет | 16:9, 9:16, Auto | 16:9 |
| seeds | integer | Нет | 10000-99999 | авто |
| callBackUrl | string | Нет | URL | — |
| enableTranslation | boolean | Нет | true/false | true |
| watermark | string | Нет | текст | — |

**Лимиты**: 1080P и 4K (4K = 2x цена Fast). REFERENCE_2_VIDEO только для veo3_fast. Аудио включено по умолчанию.

---

### 8. Kling 3.0 Video (Kuaishou)
- **Модель**: `kling-3.0/video`
- **Endpoint**: `POST /jobs/createTask`
- **Цена**: Standard без аудио: 14 credits/сек ($0.07) | с аудио: 20 credits/сек ($0.10) | Pro без аудио: 18 credits/сек ($0.09) | с аудио: 27 credits/сек ($0.135)
- **Описание**: Мультишот видео, до 15 сек, элементы-референсы

| Параметр | Тип | Обязательный | Значения | По умолчанию |
|----------|-----|-------------|----------|-------------|
| model | string | Да | `kling-3.0/video` | — |
| callBackUrl | string | Нет | URL | — |
| input.prompt | string | Да* | макс 500 символов/шот | — |
| input.image_urls | array | Нет | URL изображений (first/last frame) | — |
| input.sound | boolean | Да | true/false | false |
| input.duration | string | Да | 3-15 секунд | 5 |
| input.aspect_ratio | string | Нет | 16:9, 9:16, 1:1 | 16:9 |
| input.mode | string | Да | std (720p), pro (1080p) | pro |
| input.multi_shots | boolean | Да | true/false | false |
| input.multi_prompt | array | Нет | шоты [{prompt, duration}] | — |
| input.kling_elements | array | Нет | до 3 элементов [{name, description, element_input_urls}] | — |

**Лимиты**: длительность 3-15 сек, до 5 шотов, до 3 элементов, 2-4 URL на элемент. Изображения JPG/PNG до 10MB.

**Разрешение**: std = 720p (1280x720 / 720x1280 / 720x720) | pro = 1080p (1920x1080 / 1080x1920 / 1080x1080)

---

### 9. Kling 2.6 Image-to-Video (Kuaishou)
- **Модель**: `kling-2.6/image-to-video`
- **Endpoint**: `POST /jobs/createTask`
- **Цена**: 5сек без аудио: 55 credits ($0.28) | 10сек без аудио: 110 credits ($0.55) | 5сек с аудио: 110 credits ($0.55) | 10сек с аудио: 220 credits ($1.10)
- **Описание**: Анимация изображения в видео

| Параметр | Тип | Обязательный | Значения | По умолчанию |
|----------|-----|-------------|----------|-------------|
| model | string | Да | `kling-2.6/image-to-video` | — |
| callBackUrl | string | Нет | URL | — |
| input.prompt | string | Да | макс 1 000 символов | — |
| input.image_urls | array | Да | 1 изображение, JPEG/PNG/WebP, макс 10MB | — |
| input.sound | boolean | Да | true/false | — |
| input.duration | string | Да | "5" или "10" секунд | "5" |

**Лимиты**: промпт до 1 000 символов, 1 входное изображение, файл до 10MB

---

### 10. Seedance 2.0 (ByteDance)
- **Модель**: `bytedance/seedance-2`
- **Endpoint**: `POST /jobs/createTask`
- **Цена**: 480P: 11.5 credits/сек (с видео) / 19 credits/сек (без видео) | 720P: 25 credits/сек (с видео) / 41 credits/сек (без видео)
- **Описание**: ByteDance видеогенерация, аудио, мульти-референсы

| Параметр | Тип | Обязательный | Значения | По умолчанию |
|----------|-----|-------------|----------|-------------|
| model | string | Да | `bytedance/seedance-2` | — |
| callBackUrl | string | Нет | URL | — |
| input.prompt | string | Да | 3—1 536 символов | — |
| input.first_frame_url | string | Нет | URL изображения | — |
| input.last_frame_url | string | Нет | URL изображения | — |
| input.reference_image_urls | array | Нет | до 9 изображений | — |
| input.reference_video_urls | array | Нет | до 3 видео, 2-15сек, <50MB | — |
| input.reference_audio_urls | array | Нет | до 3 аудио, 2-15сек, <15MB | — |
| input.generate_audio | boolean | Нет | true/false | true |
| input.resolution | string | Нет | 480p, 720p | 720p |
| input.aspect_ratio | string | Нет | 1:1, 4:3, 3:4, 16:9, 9:16, 21:9, adaptive | 16:9 |
| input.duration | integer | Нет | 4-15 секунд | 8 |
| input.web_search | boolean | Да | true/false | — |
| input.nsfw_checker | boolean | Нет | true/false | false |
| input.return_last_frame | boolean | Нет | true/false | false |

**Лимиты**: промпт 3—1 536 символов, видео 4-15 сек, изображения до 30MB, видео до 50MB, аудио до 15MB

---

### 11. Grok Imagine Text-to-Video (xAI)
- **Модель**: `grok-imagine/text-to-video`
- **Endpoint**: `POST /jobs/createTask`
- **Цена**: 480p: 1.6 credits/сек | 720p: 3 credits/сек
- **Описание**: xAI генерация видео из текста, до 30 сек

| Параметр | Тип | Обязательный | Значения | По умолчанию |
|----------|-----|-------------|----------|-------------|
| model | string | Да | `grok-imagine/text-to-video` | — |
| callBackUrl | string | Нет | URL | — |
| input.prompt | string | Да | макс 5 000 символов (English) | — |
| input.aspect_ratio | string | Нет | 2:3, 3:2, 1:1, 16:9, 9:16 | 2:3 |
| input.mode | string | Нет | fun, normal, spicy | normal |
| input.duration | number | Нет | 6-30 секунд (шаг 1) | — |
| input.resolution | string | Нет | 480p, 720p | 480p |
| input.nsfw_checker | boolean | Нет | true/false | false |

**Лимиты**: промпт до 5 000 символов, только English, длительность 6-30 сек

---

### 12. Grok Imagine Image-to-Video (xAI)
- **Модель**: `grok-imagine/image-to-video`
- **Endpoint**: `POST /jobs/createTask`
- **Цена**: 480p: 1.6 credits/сек | 720p: 3 credits/сек
- **Описание**: Анимация изображения в видео

| Параметр | Тип | Обязательный | Значения | По умолчанию |
|----------|-----|-------------|----------|-------------|
| model | string | Да | `grok-imagine/image-to-video` | — |
| callBackUrl | string | Нет | URL | — |
| input.image_urls | array | Нет* | до 7 URL, JPEG/PNG/WebP, макс 10MB | — |
| input.task_id | string | Нет* | ID задачи text-to-image | — |
| input.index | integer | Нет | 0-5 | 0 |
| input.prompt | string | Нет | макс 5 000 символов | — |
| input.mode | string | Нет | fun, normal, spicy | normal |
| input.duration | string | Нет | 6-30 секунд | — |
| input.resolution | string | Нет | 480p, 720p | 480p |
| input.aspect_ratio | string | Нет | 2:3, 3:2, 1:1, 16:9, 9:16 | 16:9 |
| input.nsfw_checker | boolean | Нет | true/false | false |

*Нужен либо image_urls, либо task_id

**Лимиты**: промпт до 5 000 символов, до 7 входных изображений, файл до 10MB

---

## MOTION (Управление движением)

### 13. Kling 3.0 Motion Control (Kuaishou)
- **Модель**: `kling-3.0/motion-control`
- **Endpoint**: `POST /jobs/createTask`
- **Цена**: 720p: 20 credits/сек ($0.10) | 1080p: 27 credits/сек ($0.135)
- **Описание**: Kling 3.0 с управлением движением по видео-референсу

| Параметр | Тип | Обязательный | Значения | По умолчанию |
|----------|-----|-------------|----------|-------------|
| model | string | Да | `kling-3.0/motion-control` | — |
| callBackUrl | string | Да | URL | — |
| input.prompt | string | Нет | макс 2 500 символов | — |
| input.input_urls | array | Да | 1 изображение JPEG/PNG/JPG, макс 10MB, >340px | — |
| input.video_urls | array | Да | 1 видео MP4/QuickTime, 3-30сек, макс 100MB | — |
| input.mode | string | Нет | std (720p), pro (1080p) | std |
| input.character_orientation | string | Нет | video, image | video |
| input.background_source | string | Нет | input_video, input_image | input_video |

**Лимиты**: промпт до 2 500 символов, видео 3-30 сек, изображение >340px, соотношение 2:5 — 5:2

---

### 14. Kling 2.6 Motion Control (Kuaishou)
- **Модель**: `kling-2.6/motion-control`
- **Endpoint**: `POST /jobs/createTask`
- **Цена**: 720p: 6 credits/сек ($0.03) | 1080p: 9 credits/сек ($0.045)
- **Описание**: Бюджетный motion control, на 60% дешевле

| Параметр | Тип | Обязательный | Значения | По умолчанию |
|----------|-----|-------------|----------|-------------|
| model | string | Да | `kling-2.6/motion-control` | — |
| callBackUrl | string | Нет | URL | — |
| input.prompt | string | Нет | макс 2 500 символов | — |
| input.input_urls | array | Да | 1 изображение JPEG/PNG/JPG, макс 10MB, >300px | — |
| input.video_urls | array | Да | 1 видео MP4/QuickTime/Matroska, макс 100MB | — |
| input.character_orientation | string | Да | image, video | video |
| input.mode | string | Да | 720p, 1080p | 720p |

**Лимиты**: промпт до 2 500 символов, видео 3-30 сек, изображение >300px

---

### 15. Kling AI Avatar Pro (Kuaishou)
- **Модель**: `kling/ai-avatar-pro`
- **Endpoint**: `POST /jobs/createTask`
- **Цена**: 720P (Standard): 8 credits/сек ($0.04) | 1080P (Pro): 16 credits/сек ($0.08), до 15 сек
- **Описание**: Анимация аватара по аудио

| Параметр | Тип | Обязательный | Значения | По умолчанию |
|----------|-----|-------------|----------|-------------|
| model | string | Да | `kling/ai-avatar-pro` | — |
| callBackUrl | string | Нет | URL | — |
| input.image_url | string | Да | JPEG/PNG/WebP, макс 10MB | — |
| input.audio_url | string | Да | MP3/WAV/AAC/M4A/OGG, макс 10MB | — |
| input.prompt | string | Да | макс 5 000 символов | — |

**Лимиты**: промпт до 5 000 символов, до 15 секунд, изображение до 10MB, аудио до 10MB

---

## ДОПОЛНИТЕЛЬНЫЕ ВОЗМОЖНОСТИ (Grok Imagine)

### 16. Grok Imagine Extend (Продление видео)
- **Модель**: `grok-imagine/extend`
- **Endpoint**: `POST /jobs/createTask`
- **Цена**: 6сек 480p: 10 credits ($0.05) | 6сек 720p: 20 credits ($0.10) | 10сек 480p: 20 credits ($0.10) | 10сек 720p: 30 credits ($0.15)

| Параметр | Тип | Обязательный | Значения |
|----------|-----|-------------|----------|
| input.task_id | string | Да | ID задачи Kie AI видео |
| input.prompt | string | Да | текст |
| input.extend_at | string | Да | позиция начала |
| input.extend_times | string | Да | "6" или "10" секунд |

**Лимиты**: только видео, сгенерированные через Kie AI

---

### 17. Grok Imagine Upscale (Улучшение качества видео)
- **Модель**: `grok-imagine/upscale`
- **Endpoint**: `POST /jobs/createTask`
- **Цена**: 10 credits ($0.05) за апскейл (360p → 720p)

| Параметр | Тип | Обязательный | Значения |
|----------|-----|-------------|----------|
| input.task_id | string | Да | ID задачи Kie AI видео |

**Лимиты**: только видео Kie AI, апскейл 360p → 720p

---

## МУЗЫКА (MUSIC)

### 18. Suno Music Generation
- **Модель**: V4, V4_5, V4_5PLUS, V4_5ALL, V5, V5_5
- **Endpoint**: `POST /generate`
- **Цена**: 12 credits ($0.06) за генерацию
- **Описание**: AI музыка, несколько вариантов за раз

| Параметр | Тип | Обязательный | Значения | По умолчанию |
|----------|-----|-------------|----------|-------------|
| prompt | string | Да | Custom: 3000-5000 символов, Non-custom: 500 символов | — |
| customMode | boolean | Да | true/false | — |
| instrumental | boolean | Да | true/false | — |
| model | string | Да | V4, V4_5, V4_5PLUS, V4_5ALL, V5, V5_5 | — |
| callBackUrl | string | Да | URL | — |
| style | string | Custom only | V4: 200 символов, остальные: 1000 символов | — |
| title | string | Custom only | макс 80 символов | — |
| negativeTags | string | Нет | исключение стилей | — |
| vocalGender | string | Нет | m, f | — |
| styleWeight | number | Нет | 0-1 (шаг 0.01) | — |
| weirdnessConstraint | number | Нет | 0-1 (шаг 0.01) | — |
| audioWeight | number | Нет | 0-1 (шаг 0.01) | — |
| personaId | string | Нет | ID персоны (custom only) | — |

**Лимиты**: V4 до 4 минут, V4_5+ до 8 минут. Файлы хранятся 14 дней.

---

## Общие коды ответов

| Код | Описание |
|-----|----------|
| 200 | Успех |
| 401 | Не авторизован |
| 402 | Недостаточно кредитов |
| 404 | Не найдено |
| 408 | Таймаут (>10 мин) |
| 422 | Ошибка валидации |
| 429 | Превышен лимит запросов |
| 455 | Сервис недоступен |
| 500 | Ошибка сервера |
| 501 | Генерация не удалась |
| 505 | Функция отключена |

---

## Примечания по ценам
- High-tier пополнения дают +10% бонусных кредитов
- Эффективная цена для high-tier примерно на 10% ниже указанной
- 1 credit ≈ $0.005
