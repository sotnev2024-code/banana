# 📖 Инструкция разработчика — AI Bot + Mini App

> Подгляди сюда когда что-то непонятно. Обновляй по мере разработки.

---

## 📁 Структура проекта

```
/
├── apps/
│   ├── bot/          → Telegram бот (telegraf)
│   ├── api/          → REST API (fastify)
│   └── miniapp/      → Mini App (react + vite)
├── packages/
│   └── shared/       → Общие типы, модели, kie.ai клиент
├── prisma/
│   └── schema.prisma → Схема БД
└── .env.example      → Шаблон переменных окружения
```

---

## 🚀 Первый запуск

### 1. Установка зависимостей
```bash
npm install
```

### 2. Скопировать .env и заполнить
```bash
cp .env.example .env
# Заполни все поля — см. раздел "Переменные окружения"
```

### 3. Поднять PostgreSQL и Redis (локально через Docker)
```bash
docker run -d --name pg -e POSTGRES_PASSWORD=password -e POSTGRES_DB=aibot -p 5432:5432 postgres:16
docker run -d --name redis -p 6379:6379 redis:7
```

### 4. Применить миграции БД
```bash
npm run db:push
npm run db:generate
```

### 5. Запустить всё
```bash
npm run dev            # запускает api + bot + miniapp одновременно
# или по отдельности:
npm run dev:api        # :3001
npm run dev:bot        # polling
npm run dev:miniapp    # :5173
```

### 6. Туннель для бота и webhook (dev)
```bash
npx localtunnel --port 3001 --subdomain aibot-api
# или
ngrok http 3001
```
Скопируй URL туннеля → вставь в YUKASSA как webhook URL: `https://your-tunnel/payment/yukassa/webhook`

---

## 🔑 Переменные окружения

| Переменная | Где взять |
|---|---|
| `BOT_TOKEN` | @BotFather → /newbot |
| `MINIAPP_URL` | URL задеплоенного miniapp (Vercel) |
| `KIE_API_KEY` | kie.ai → Dashboard → API Keys |
| `DATABASE_URL` | Строка подключения PostgreSQL |
| `REDIS_URL` | Строка подключения Redis |
| `JWT_SECRET` | Любая случайная строка 32+ символов |
| `YUKASSA_SHOP_ID` | ЮKassa → Настройки магазина |
| `YUKASSA_SECRET_KEY` | ЮKassa → Настройки → Ключи API |
| `VITE_BOT_USERNAME` | username бота без @ (например `my_ai_bot`) |
| `VITE_API_URL` | URL задеплоенного API |

---

## 🏗 Архитектура

### Поток генерации
```
Пользователь (бот/mini app)
  → POST /generate                  # спишет токены, создаст Generation
  → BullMQ queue "generations"      # задача в очередь
  → Worker: вызов kie.ai API        # получить taskId
  → Polling kie.ai каждые 5 сек     # ждать DONE
  → Обновить Generation.status=DONE
  → Redis pub/sub "generation:done" # уведомить бот
  → Бот отправляет файл пользователю
```

### Авторизация Mini App
```
Mini App запускается в Telegram
  → window.Telegram.WebApp.initData  # строка с данными от Telegram
  → POST /auth/telegram { initData } # наш API
  → HMAC-SHA256 проверка подписи     # безопасно
  → Вернуть JWT токен
  → Все запросы: Authorization: Bearer {token}
```

### Платёж через ЮKassa
```
Пользователь выбирает пакет
  → POST /payment/yukassa/create
  → Создаём Payment запись в БД
  → Запрос к ЮKassa API → получаем confirmationUrl
  → Редирект пользователя на оплату
  → ЮKassa вызывает наш webhook POST /payment/yukassa/webhook
  → Начисляем токены + уведомляем в боте
```

---

## 📦 Модели kie.ai

### Изображения
| Model ID | Название | Токены | Особенности |
|---|---|---|---|
| `midjourney-v7` | Midjourney v7 | 30 | Лучший художественный стиль |
| `flux-kontext` | Flux Kontext | 20 | Редактирование по референсу |
| `nano-banana-pro` | Nano Banana Pro | 15 | Быстро, дёшево, 4K |
| `gpt-4o-image` | 4o Image | 25 | Точный текст в картинках |

### Видео
| Model ID | Название | Токены | Длительность |
|---|---|---|---|
| `veo3-fast` | Veo 3.1 Fast | 150 | 8 сек |
| `veo3-quality` | Veo 3.1 Quality | 500 | 8 сек + аудио |
| `wan-2-6` | Wan 2.6 | 200 | до 15 сек |
| `runway-aleph` | Runway Aleph | 180 | Motion control |

### Музыка
| Model ID | Название | Токены | Длительность |
|---|---|---|---|
| `suno-v4-5` | Suno V4.5 | 40 | до 4 мин |
| `suno-v4-5-plus` | Suno V4.5 Plus | 80 | до 8 мин |

> ⚠️ Все генерации **асинхронные**. POST → taskId → polling каждые 5 сек → результат.

---

## 💰 Тарифные планы

| ID | Название | Токены | Бонус | Цена |
|---|---|---|---|---|
| `start` | Старт | 300 | — | 299 ₽ |
| `basic` | Базовый | 800 | +100 | 699 ₽ |
| `pro` | Про | 2000 | +400 | 1499 ₽ |
| `max` | Максимум | 5000 | +1500 | 3499 ₽ |

Менять в: `packages/shared/src/models.ts` → `TOKEN_PLANS`

---

## 🎬 Видео-превью в карточках моделей

В `apps/miniapp/src/pages/CreatePage.tsx` есть объект `MODEL_VIDEOS`:
```ts
const MODEL_VIDEOS: Record<string, string> = {
  'midjourney-v7': 'https://cdn.your-domain.com/previews/midjourney.mp4',
  ...
}
```

**Что сделать:**
1. Записать/найти ~5-10 секундные видео-примеры для каждой модели
2. Загрузить на Cloudflare R2 / S3 / CDN
3. Вставить URL в `MODEL_VIDEOS`
4. Видео воспроизводятся автоматически (muted, loop) при рендере карточки

Если URL нет — карточка показывает цветной градиент-заглушку (тоже красиво).

---

## 🌐 Деплой

### Mini App → Vercel
```bash
cd apps/miniapp
vercel --prod
# Скопировать URL → BOT_TOKEN MINIAPP_URL + @BotFather → /setmenubutton
```

### API → Railway / Render / VPS
```bash
# Railway:
railway init
railway up

# VPS (Docker):
docker build -t aibot-api ./apps/api
docker run -d --env-file .env -p 3001:3001 aibot-api
```

### Бот
Бот работает в polling-режиме. Запускай как pm2 процесс на VPS:
```bash
npm install -g pm2
pm2 start "npm run dev:bot" --name aibot-bot
pm2 save
```

### Регистрация Mini App в BotFather
```
@BotFather → выбрать бота → /newapp
Или: /setmenubutton → указать URL miniapp
```

---

## 🛠 Частые задачи

### Добавить новую модель
1. Добавить в `packages/shared/src/models.ts` → массив `MODELS`
2. Добавить маппинг в `packages/shared/src/kieai.ts` (нужные endpoint/model string)
3. Добавить превью-видео URL в `apps/miniapp/src/pages/CreatePage.tsx` → `MODEL_VIDEOS`

### Изменить цены на токены
`packages/shared/src/models.ts` → поле `tokensPerGeneration` у модели

### Изменить тарифные планы
`packages/shared/src/models.ts` → массив `TOKEN_PLANS`

### Посмотреть логи задач
```bash
# BullMQ через RedisInsight или:
redis-cli KEYS "bull:generations:*"
```

### Сбросить застрявшую генерацию
```sql
UPDATE "Generation" SET status='FAILED' WHERE id='xxx' AND status='PROCESSING';
-- Вернуть токены вручную:
UPDATE "User" SET balance = balance + N WHERE id='user_id';
```

### Посмотреть БД
```bash
npm run db:studio    # откроет Prisma Studio на :5555
```

---

## 🐛 Известные нюансы

- **kie.ai асинхронность**: `POST /generate` возвращает `200` и `taskId` сразу. Результат — только через polling. Worker в BullMQ опрашивает каждые 5 сек, таймаут 10 минут.
- **Токены списываются до генерации** и возвращаются если kie.ai вернул ошибку или таймаут.
- **Mini App авторизация**: работает только в Telegram. В браузере (dev) — `initData` будет пустым, нужен мок.
- **ЮKassa webhook**: в продакшне ЮKassa шлёт только с определённых IP — добавь whitelist middleware.
- **Redis pub/sub**: воркер и бот должны подключаться к одному Redis. `worker` публикует, `bot` подписывается через дубликат соединения.
- **Видео в боте**: Telegram принимает файлы до 50MB через `sendVideo`. Для больших файлов — загрузи на CDN и шли ссылкой.

---

## 📋 Чеклист перед запуском

- [ ] Заполнены все поля `.env`
- [ ] БД мигрирована (`npm run db:push`)
- [ ] Бот зарегистрирован в @BotFather
- [ ] Mini App зарегистрирован через /setmenubutton
- [ ] kie.ai API ключ работает (проверь в playground)
- [ ] ЮKassa: магазин активирован, webhook URL указан
- [ ] MINIAPP_URL указан без `/` в конце
- [ ] Redis запущен
- [ ] Тест: /start → меню → выбрать фото → промпт → получить результат
- [ ] Тест: Mini App → Создать → Midjourney → генерация
- [ ] Тест: оплата тестовой картой ЮKassa → зачисление токенов
