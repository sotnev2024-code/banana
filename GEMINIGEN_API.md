# GeminiGen AI — Полная API Документация

**Base URL:** `https://api.geminigen.ai/uapi/v1`

---

## 🔐 1. Аутентификация

Все запросы должны содержать API-ключ в заголовке:

```
x-api-key: YOUR_API_KEY
```

- Ключ создаётся в разделе Service Integration
- Никогда не публикуй ключ в GitHub, frontend-коде и других публичных местах
- Production-запросы — только через backend, ключ из env переменной
- Ключ можно удалить или перегенерировать в любое время

---

## 🪝 2. Webhooks

### Настройка
Зарегистрируй URL вебхука в Service Integration. URL должен быть доступен из интернета и принимать POST-запросы.

При получении уведомления сервер должен ответить **200 OK**. Иначе — повторы до 3 раз с паузой 1 час.

### Верификация подписи (HMAC-SHA256 в заголовке `x-signature`)

```python
from cryptography.hazmat.primitives.hashes import SHA256
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives.serialization import load_pem_public_key
from hashlib import md5

def verify_signature_by_public_key(data: str, signature: bytes, public_key_path: str) -> bool:
    try:
        with open(public_key_path, "rb") as key_file:
            public_key = load_pem_public_key(key_file.read())
        event_data_hash = md5(data.encode()).digest()
        public_key.verify(signature, event_data_hash, padding.PKCS1v15(), SHA256())
        return True
    except Exception as e:
        print(str(e))
        return False
```

### Поля webhook payload
| Поле  | Описание |
|-------|----------|
| event | Тип события |
| uuid  | Уникальный идентификатор события |
| data  | Объект с деталями |

### События
| Событие                       | Описание                    |
|-------------------------------|-----------------------------|
| VIDEO_GENERATION_COMPLETED    | Видео успешно сгенерировано |
| VIDEO_GENERATION_FAILED       | Ошибка генерации видео      |
| IMAGE_GENERATION_COMPLETED    | Изображение готово          |
| IMAGE_GENERATION_FAILED       | Ошибка генерации изображения |

---

## ⚠️ 3. Ошибки (Глобальные)

### HTTP коды
| Код | Значение              |
|-----|-----------------------|
| 200 | OK                    |
| 400 | Bad Request           |
| 401 | Unauthorized          |
| 403 | Forbidden             |
| 404 | Not Found             |
| 429 | Too Many Requests     |
| 500 | Internal Server Error |
| 503 | Service Unavailable   |

### Формат
```json
{
  "detail": {
    "error_code": "API_KEY_NOT_FOUND",
    "message": "Api key is not found"
  }
}
```

### Коды ошибок
| Код                           | Описание                              |
|-------------------------------|---------------------------------------|
| API_KEY_REQUIRED              | API-ключ обязателен                   |
| USER_NOT_FOUND                | Пользователь не найден                |
| API_KEY_NOT_FOUND             | API-ключ не найден                    |
| NOT_ENOUGH_CREDIT             | Недостаточно кредитов                 |
| NOT_ENOUGH_AND_LOCK_CREDIT    | Недостаточно кредитов (часть заблокирована) |
| TEXT_TOO_LONG                 | Текст > 10 000 символов               |
| MAXIMUM_FILE_SIZE_EXCEED      | Файл превышает максимальный размер    |
| FILE_TYPE_NOT_ALLOWED         | Тип файла не поддерживается           |
| PDF_MORE_THAN_400_PAGES       | PDF более 400 страниц                 |
| PLAN_MAX_FILE_SIZE_EXCEED     | Размер файла превышает лимит плана    |
| PREMIUM_PLAN_REQUIRED         | Требуется премиум-план                |
| PLAN_TOTAL_FILE_EXCEED        | Превышен месячный лимит файлов        |
| GEMINI_RATE_LIMIT             | Превышен rate limit Gemini API        |
| GEMINI_RAI_MEDIA_FILTERED     | Заблокировано RAI-фильтром Gemini     |
| FORBIDDEN                     | Нет доступа                           |
| SYSTEM_ERROR                  | Внутренняя ошибка                     |
| RATE_LIMIT_ERROR              | Rate limit GeminiGen                  |

---

## 💳 4. Billing & Credits

### Инфо об аккаунте
```http
GET /uapi/v1/account
Accept: application/json
x-api-key: <your api key>
```

### Пример ответа
```json
{
  "uuid": "6d3c93c0-7a1e-4d1b-9b56-5a6d5b0a9f12",
  "is_active": true,
  "full_name": "Demo User",
  "email": "demo.user@example.com",
  "plan_id": "FP0001",
  "user_credit": {
    "locked_credit": 0,
    "available_credit": 125000
  },
  "user_benefits": [ ... ]
}
```

---

## 🎬 5. VEO Video Generation

**Endpoint:** `POST /uapi/v1/video-gen/veo`

### Параметры
| Параметр      | Тип    | Обяз. | Описание |
|---------------|--------|:-----:|----------|
| prompt        | string | ✅    | Описание видео |
| model         | string | ✅    | `veo-3.1`, `veo-3.1-fast`, `veo-2`, `veo-3.1-lite` |
| resolution    | string | —     | `720p` (default), `1080p` |
| aspect_ratio  | string | —     | `16:9`, `9:16` |
| mode_image    | string | —     | `frame` (default), `ingredient` |
| ref_images    | array  | —     | Файлы или URL (max 2 для frame, 3 для ingredient) |

### Модели Veo
| Модель         | Длительность | Разрешение    | Aspect Ratio |
|----------------|--------------|---------------|--------------|
| veo-3.1        | 8 сек (фикс) | 720p, 1080p   | 16:9 |
| veo-3.1-fast   | 8 сек (фикс) | 720p, 1080p   | 16:9 |
| veo-2          | 8 сек (фикс) | 720p          | 16:9, 9:16 |
| veo-3.1-lite   | 8 сек (фикс) | —             | — |

### Пример curl
```bash
curl -X POST https://api.geminigen.ai/uapi/v1/video-gen/veo \
  -H "Content-Type: multipart/form-data" \
  -H "x-api-key: <your api key>" \
  --form "prompt=A serene lake surrounded by mountains at sunset" \
  --form "model=veo-2" \
  --form "resolution=720p" \
  --form "aspect_ratio=16:9" \
  --form "ref_images=@image.jpg" \
  --form "mode_image=frame"
```

### Пример ответа
```json
{
  "id": 2588,
  "uuid": "c558a44c-c91c-11f0-98b4-0242ac120004",
  "user_id": 3,
  "model_name": "veo-2",
  "input_text": "A serene lake...",
  "type": "video",
  "status": 1,
  "status_percentage": 1,
  "estimated_credit": 20,
  "media_type": "video",
  "created_at": "2025-11-24T10:03:05",
  "delay_seconds": 0
}
```

### Статусы
| Код | Описание    |
|:---:|-------------|
| 1   | Processing  |
| 2   | Completed   |
| 3   | Failed      |

---

## 🔁 6. Extend Veo

**Endpoint:** `POST /uapi/v1/video-extend/veo`

| Параметр     | Тип    | Обяз. | Описание |
|--------------|--------|:-----:|----------|
| prompt       | string | ✅    | Описание продолжения |
| ref_history  | string | —     | UUID исходного видео Veo |

Модель, aspect_ratio и resolution берутся из исходного видео.

---

## 🎬 7. SORA Video Generation

**Endpoint:** `POST /uapi/v1/video-gen/sora`

| Параметр     | Тип     | Обяз. | Описание |
|--------------|---------|:-----:|----------|
| prompt       | string  | ✅    | Описание видео |
| model        | string  | —     | `sora-2`, `sora-2-pro`, `sora-2-pro-hd` |
| duration     | integer | —     | 10, 15, 25 (зависит от модели) |
| resolution   | string  | —     | `small` (720p), `large` (1080p) |
| aspect_ratio | string  | —     | `landscape` (16:9), `portrait` (9:16) |
| ref_history  | string  | —     | UUID ранее созданного изображения |
| files        | array   | —     | Локальные файлы (1) |
| file_urls    | array   | —     | URL файлов (1) |

### Модели Sora
| Модель          | Длительность | Разрешение | Aspect |
|-----------------|--------------|------------|--------|
| sora-2          | 10/15 сек    | 720p       | landscape, portrait |
| sora-2-pro      | 25 сек       | 720p       | landscape, portrait |
| sora-2-pro-hd   | 15 сек       | 1080p      | landscape, portrait |

---

## 🎬 8. GROK Video Generation

**Endpoint:** `POST /uapi/v1/video-gen/grok`

| Параметр     | Тип     | Обяз. | Описание |
|--------------|---------|:-----:|----------|
| prompt       | string  | ✅    | Описание |
| model        | string  | ✅    | `grok-3` |
| resolution   | string  | —     | `480p` (default), `720p` |
| aspect_ratio | string  | —     | `landscape`, `portrait`, `square`, `vertical`, `horizontal` |
| duration     | integer | —     | 6, 10, 15 сек |
| mode         | string  | —     | `custom`, `normal`, `extremely-crazy`, `extremely-spicy-or-crazy` |
| files        | array   | —     | Локальные изображения (приоритет 1) |
| file_urls    | array   | —     | URL изображений (приоритет 2) |
| ref_images   | array   | —     | UUID ранее созданных (приоритет 3) |

---

## 🔁 9. Extend Grok

**Endpoint:** `POST /uapi/v1/video-extend/grok`

| Параметр     | Тип    | Обяз. | Описание |
|--------------|--------|:-----:|----------|
| prompt       | string | ✅    | Описание продолжения |
| ref_history  | string | ✅    | UUID исходного видео Grok |

---

## 🌱 10. SEEDANCE Video Generation

**Endpoint:** `POST /uapi/v1/video-gen/seedance`

| Параметр     | Тип     | Обяз. | Описание |
|--------------|---------|:-----:|----------|
| prompt       | string  | ✅    | Описание |
| model        | string  | —     | `seedance-2`, `seedance-2-remix`, `seedance-2-omni` |
| mode         | string  | —     | Зависит от модели |
| duration     | integer | —     | В секундах (зависит) |
| aspect_ratio | string  | —     | Зависит от модели |
| ref_images   | array   | —     | До 4 шт, 15 MB/шт |
| ref_videos   | string  | —     | Только omni (mp4/webm, до 15 сек, 60 MB) |
| ref_audios   | string  | —     | Только omni (mp3/wav, до 15 сек) |

### Модели Seedance
**seedance-2** — Aspect: 16:9, 9:16, 1:1, 3:4, 4:3, 21:9 • Duration: 4–15 сек • Modes: `fast`, `pro` • Ref Images: первый/последний кадр

**seedance-2-remix** — Aspect: 9:16 • Duration: 12 или 15 сек • Modes: `fast` • Ref Images: ingredient (до 4)

**seedance-2-omni** — Aspect: 16:9, 9:16, 1:1, 3:4, 4:3, 21:9 • Duration: 4–15 сек • Modes: `fast`, `pro`, `fast-2`, `pro-2`, `fast-vip`, `pro-vip` • Ref: ingredient + ref_video + ref_audio

---

## 🔁 11. Extend Seedance

**Endpoint:** `POST /uapi/v1/video-extend/seedance`

| Параметр     | Тип    | Обяз. | Описание |
|--------------|--------|:-----:|----------|
| prompt       | string | ✅    | Описание продолжения |
| ref_history  | string | ✅    | UUID исходного видео Seedance |

---

## 🎞 12. GROK Storyboard (многосценовое видео)

**Endpoint:** `POST /uapi/v1/video-storyboard/grok`

Генерация цепочки Grok-клипов. Последний кадр сцены N становится референсом для сцены N+1.

| Параметр      | Тип         | Обяз. | Описание |
|---------------|-------------|:-----:|----------|
| scenes        | JSON string | ✅    | Массив сцен (см. ниже) |
| aspect_ratio  | string      | —     | `landscape` (default), `portrait`, `square` |
| resolution    | string      | —     | `480p` (default), `720p` |
| model         | string      | —     | `grok-video` (default), `grok-3` |

### Объект сцены
| Поле     | Тип     | Обяз. | Описание |
|----------|---------|:-----:|----------|
| prompt   | string  | ✅    | Описание сцены |
| duration | integer | ✅    | 6 или 10 сек |
| mode     | string  | —     | Нормализуется в `custom` |

### Ограничения
- Мин. 2, макс. 10 сцен
- Макс. суммарная длительность: **45 сек**
- Доступно только на **Premium** плане

```bash
curl -X POST https://api.geminigen.ai/uapi/v1/video-storyboard/grok \
  -H "Content-Type: multipart/form-data" \
  -H "x-api-key: <your api key>" \
  --form 'scenes=[
    {"prompt":"A sunrise over mountains","duration":6,"mode":"custom"},
    {"prompt":"A river flowing in the valley","duration":6,"mode":"custom"},
    {"prompt":"A village waking at dawn","duration":10,"mode":"custom"}
  ]' \
  --form "aspect_ratio=landscape" \
  --form "resolution=720p" \
  --form "model=grok-video"
```

---

## 🎥 13. KLING Video Generation

**Endpoint:** `POST /uapi/v1/video-gen/kling` (единый для всех 13 моделей Kling)

| Параметр     | Тип     | Обяз. | Описание |
|--------------|---------|:-----:|----------|
| prompt       | string  | ✅    | Мин. 10 символов |
| model        | string  | ✅    | Одна из 13 моделей |
| mode         | string  | —     | `standard`, `professional`, `professional_audio`, `relax` |
| aspect_ratio | string  | —     | `16:9` (default), `9:16`, `1:1` |
| duration     | string  | —     | 3–15 сек (default 5) |
| mode_image   | string  | —     | `DEFAULT` |
| ref_images   | array   | —     | JPG/PNG, 10 MB, до 4 файлов |
| ref_videos   | array   | —     | MP4/MOV/WebM, 100 MB, до 1 файла |

### Модели Kling

**Text-to-Video**
| Модель                | Описание |
|-----------------------|----------|
| kling-video-3-0       | Последняя, лучшее качество, до 15 сек |
| kling-video-2-6       | Поддержка `professional_audio` |
| kling-video-o1        | O1 вариант, оптимизированный |
| kling-video-2-5       | Legacy, есть `relax` |
| kling-video-lipsync   | Lip-sync |
| kling-video-2-1-10s / -5s | Legacy 2.1 |
| kling-video-1-6-10s / -5s | Legacy 1.6 |

**Motion Control** (требуют `ref_videos`)
| Модель                 | Описание |
|------------------------|----------|
| kling-video-motion-3   | Последний motion control |
| kling-video-motion     | Базовый motion control |

**Edit** (требуют `ref_videos`)
| Модель                | Описание |
|-----------------------|----------|
| kling-video-3-0-edit  | Редактирование на базе 3.0 |
| kling-video-o1-edit   | Редактирование на базе O1 |

### Rate Limits Kling
- 30 req/мин
- 5 concurrent
- 1000 req/час

---

## 🖼 14. IMAGE Generation (Gemini)

**Endpoint:** `POST /uapi/v1/generate_image`

| Параметр       | Тип    | Обяз. | Описание |
|----------------|--------|:-----:|----------|
| prompt         | string | ✅    | Описание |
| model          | string | ✅    | `nano-banana-pro`, `nano-banana-2`, `imagen-4` |
| aspect_ratio   | string | —     | `1:1`, `16:9`, `9:16`, `4:3`, `3:4` |
| output_format  | string | —     | `jpeg` (default), `png` |
| resolution     | string | —     | `1K` (default), `2K`, `4K` |
| style          | string | —     | см. ниже |
| ref_history    | string | —     | UUID ранее созданного изображения |
| files          | array  | —     | Локальные файлы |
| file_urls      | array  | —     | URL файлов |

### Модели
| Модель           | Описание |
|------------------|----------|
| nano-banana-pro  | Gemini 3 Pro Image Preview |
| nano-banana-2    | Gemini 3.1 Flash Image Preview |
| imagen-4         | Баланс скорости и качества |

### Стили
None, 3D Render, Acrylic, Anime General, Creative, Dynamic, Fashion, Game Concept, Graphic Design 3D, Illustration, Photorealistic, Portrait, Portrait Cinematic, Portrait Fashion, Ray Traced, Stock Photo, Watercolor

### Rate Limits
- `nano-banana-pro`: 5/мин, 100/час, 1000/день
- Остальные: без ограничений

---

## 🖼 15. GROK Image Generation

**Endpoint:** `POST /uapi/v1/imagen/grok`

| Параметр      | Тип     | Обяз. | Описание |
|---------------|---------|:-----:|----------|
| prompt        | string  | ✅    | Описание |
| orientation   | string  | —     | `landscape` (default), `portrait`, `square` |
| num_result    | integer | —     | 1–8 (default 1) |
| ref_history   | string  | —     | UUID ранее созданного |
| files         | array   | —     | PNG/JPG/JPEG/WebP |

---

## 🖼 16. META AI Image Generation

**Endpoint:** `POST /uapi/v1/meta_ai/generate`

| Параметр      | Тип     | Обяз. | Описание |
|---------------|---------|:-----:|----------|
| prompt        | string  | ✅    | Описание |
| orientation   | string  | —     | `landscape` (default), `portrait`, `square` |
| num_result    | integer | —     | 1, 2, 3 или 4 (default 1) |
| ref_history   | string  | —     | UUID ранее созданного |
| files         | array   | —     | PNG/JPG/JPEG/WebP |

---

## 📚 17. History APIs

| Метод  | URL                                      | Назначение |
|--------|------------------------------------------|------------|
| GET    | `/uapi/v1/histories`                     | Список (пагинация) |
| GET    | `/uapi/v1/history/{uuid}`                | Одна запись с медиа |
| DELETE | `/uapi/v1/histories`                     | Удалить выбранные |
| DELETE | `/uapi/v1/histories/all`                 | Удалить все |

### `GET /uapi/v1/histories`
Query: `filter_by` (video/image/all), `items_per_page` (default 10), `page` (default 1)

---

## 📋 Справочник эндпоинтов

| Метод  | URL                                | Назначение |
|--------|------------------------------------|------------|
| GET    | `/uapi/v1/account`                 | Инфо аккаунта |
| POST   | `/uapi/v1/video-gen/veo`           | Veo video |
| POST   | `/uapi/v1/video-extend/veo`        | Extend Veo |
| POST   | `/uapi/v1/video-gen/sora`          | Sora video |
| POST   | `/uapi/v1/video-gen/grok`          | Grok video |
| POST   | `/uapi/v1/video-extend/grok`       | Extend Grok |
| POST   | `/uapi/v1/video-gen/seedance`      | Seedance video |
| POST   | `/uapi/v1/video-extend/seedance`   | Extend Seedance |
| POST   | `/uapi/v1/video-storyboard/grok`   | Grok Storyboard |
| POST   | `/uapi/v1/video-gen/kling`         | Kling (все 13 моделей) |
| POST   | `/uapi/v1/generate_image`          | Gemini images |
| POST   | `/uapi/v1/imagen/grok`             | Grok images |
| POST   | `/uapi/v1/meta_ai/generate`        | Meta AI images |
| GET    | `/uapi/v1/histories`               | История |
| GET    | `/uapi/v1/history/{uuid}`          | Одна запись |
| DELETE | `/uapi/v1/histories`               | Удалить выбранные |
| DELETE | `/uapi/v1/histories/all`           | Удалить все |
