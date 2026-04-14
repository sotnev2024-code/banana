import type { Context, Telegraf } from 'telegraf'
import { Markup } from 'telegraf'
import type { Update } from 'telegraf/types'
import { Queue } from 'bullmq'
import { prisma, redis } from '../index'
import { MODELS, getModel, calculatePrice, WELCOME_BONUS, type ModelConfig, type GenerationType } from '@aibot/shared'

const generationQueue = new Queue('generations', { connection: redis })

const SESSION_TTL_MINUTES = 60

// ─── Helpers ──────────────────────────────────────────────────────────

async function getOrCreateUser(tg: { id: number; first_name: string; last_name?: string; username?: string; language_code?: string }) {
  const telegramId = BigInt(tg.id)
  const existing = await prisma.user.findUnique({ where: { telegramId } })
  if (existing) return existing

  const lang = tg.language_code?.startsWith('ru') ? 'ru' : 'en'
  const user = await prisma.user.create({
    data: {
      telegramId,
      firstName: tg.first_name,
      lastName: tg.last_name ?? null,
      username: tg.username ?? null,
      balance: WELCOME_BONUS,
      lang,
    },
  })
  await prisma.transaction.create({
    data: { userId: user.id, amount: WELCOME_BONUS, type: 'BONUS', description: 'Welcome bonus' },
  })
  return user
}

async function uploadTelegramFile(bot: Telegraf<any>, fileId: string, ext: string): Promise<string | null> {
  try {
    const link = await bot.telegram.getFileLink(fileId)
    const res = await fetch(link.toString())
    if (!res.ok) return null
    const buf = Buffer.from(await res.arrayBuffer())
    const name = `grpref_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`
    const fs = await import('fs')
    const path = '/opt/banana/uploads/gen/' + name
    fs.writeFileSync(path, buf)
    return `${process.env.API_URL ?? 'https://picpulse.fun'}/uploads/gen/${name}`
  } catch (e) {
    console.error('[groupGen] upload error:', e)
    return null
  }
}

function extractReferenceMedia(msg: any, bot: Telegraf<any>): Promise<{ url: string; type: 'image' | 'video' } | null> | null {
  if (!msg) return null
  // Photo (array of sizes, pick largest)
  if (msg.photo?.length) {
    const best = msg.photo[msg.photo.length - 1]
    return (async () => {
      const url = await uploadTelegramFile(bot, best.file_id, '.jpg')
      return url ? { url, type: 'image' as const } : null
    })()
  }
  // Video
  if (msg.video) {
    return (async () => {
      const url = await uploadTelegramFile(bot, msg.video.file_id, '.mp4')
      return url ? { url, type: 'video' as const } : null
    })()
  }
  // Document (image/video uploaded as file)
  if (msg.document?.mime_type) {
    const mime = msg.document.mime_type as string
    if (mime.startsWith('image/')) {
      return (async () => {
        const url = await uploadTelegramFile(bot, msg.document.file_id, '.jpg')
        return url ? { url, type: 'image' as const } : null
      })()
    }
    if (mime.startsWith('video/')) {
      return (async () => {
        const url = await uploadTelegramFile(bot, msg.document.file_id, '.mp4')
        return url ? { url, type: 'video' as const } : null
      })()
    }
  }
  return null
}

// ─── UI builders ──────────────────────────────────────────────────────

const T = (lang: string) => lang === 'en' ? {
  chooseCategory: '🎨 <b>Choose type:</b>',
  image: '🖼 Image',
  video: '🎬 Video',
  motion: '🎥 Motion',
  cancel: '❌ Cancel',
  back: '← Back',
  chooseModel: '🧠 <b>Choose model:</b>',
  chooseSettings: (m: string) => `⚙️ <b>${m}</b>\nAdjust settings:`,
  publishOn: '✅ Publish to feed',
  publishOff: '⬜ Publish to feed',
  continue: '➡️ Continue',
  awaitPrompt: (m: string, price: number) => `✍️ <b>${m}</b> — <b>${price} 🪙</b>\n\nReply to this message with the prompt to start generation.`,
  noBalance: (need: number, have: number) => `❌ Not enough tokens. Need ${need}, balance ${have}. Top up: ${process.env.MINIAPP_URL ?? 'https://picpulse.fun'}`,
  noMedia: 'Reply to a photo or video with /pic or /picpulse to start generation.',
  cancelled: '❌ Cancelled',
  expired: '⌛ Session expired. Use /pic again.',
  generating: (m: string) => `⏳ Generating with <b>${m}</b>...\nIt may take 1–5 minutes.`,
  resultCaption: (m: string, by: string) => `✨ <b>${m}</b> — by ${by}`,
  error: '❌ Generation failed. Tokens refunded.',
} : {
  chooseCategory: '🎨 <b>Выберите тип:</b>',
  image: '🖼 Фото',
  video: '🎬 Видео',
  motion: '🎥 Motion',
  cancel: '❌ Отмена',
  back: '← Назад',
  chooseModel: '🧠 <b>Выберите модель:</b>',
  chooseSettings: (m: string) => `⚙️ <b>${m}</b>\nНастройки:`,
  publishOn: '✅ Публиковать в ленту',
  publishOff: '⬜ Публиковать в ленту',
  continue: '➡️ Продолжить',
  awaitPrompt: (m: string, price: number) => `✍️ <b>${m}</b> — <b>${price} 🪙</b>\n\nОтветьте на это сообщение промптом, чтобы запустить генерацию.`,
  noBalance: (need: number, have: number) => `❌ Недостаточно токенов. Нужно ${need}, баланс ${have}. Пополнить: ${process.env.MINIAPP_URL ?? 'https://picpulse.fun'}`,
  noMedia: 'Ответьте на фото или видео командой /pic или /picpulse, чтобы начать генерацию.',
  cancelled: '❌ Отменено',
  expired: '⌛ Сессия истекла. Используйте /pic ещё раз.',
  generating: (m: string) => `⏳ Генерирую через <b>${m}</b>...\nЗаймёт 1–5 минут.`,
  resultCaption: (m: string, by: string) => `✨ <b>${m}</b> — от ${by}`,
  error: '❌ Генерация не удалась. Токены возвращены.',
}

function categoryKeyboard(lang: string, hasVideoRef: boolean, sessionId: string) {
  const t = T(lang)
  const rows: any[][] = []
  rows.push([Markup.button.callback(t.image, `gg:cat:IMAGE:${sessionId}`)])
  rows.push([Markup.button.callback(t.video, `gg:cat:VIDEO:${sessionId}`)])
  if (hasVideoRef) rows.push([Markup.button.callback(t.motion, `gg:cat:MOTION:${sessionId}`)])
  rows.push([Markup.button.callback(t.cancel, `gg:cancel:${sessionId}`)])
  return Markup.inlineKeyboard(rows)
}

function modelsKeyboard(lang: string, type: GenerationType, sessionId: string, hasImage: boolean) {
  const t = T(lang)
  // Filter MOTION models that require specific references
  let models = MODELS.filter(m => m.type === type)
  if (type === 'IMAGE' || type === 'VIDEO') {
    // If reference exists, prefer models that support it (but still show all)
    models = hasImage
      ? models.filter(m => m.supportsImageInput || type === 'VIDEO')
      : models.filter(m => !m.supportsImageInput || m.id === 'veo3-fast' || m.id === 'grok-image-to-video' || m.id === 'kling-2-6-i2v' ? !m.supportsImageInput : true)
    // Simpler: show all
    models = MODELS.filter(m => m.type === type)
  }
  const rows = models.map(m => [Markup.button.callback(`${m.name} — ${m.tokensPerGeneration}🪙`, `gg:mdl:${m.id}:${sessionId}`)])
  rows.push([Markup.button.callback(t.back, `gg:back:cat:${sessionId}`), Markup.button.callback(t.cancel, `gg:cancel:${sessionId}`)])
  return Markup.inlineKeyboard(rows)
}

function settingsKeyboard(lang: string, model: ModelConfig, settings: any, isPublic: boolean, sessionId: string) {
  const t = T(lang)
  const rows: any[][] = []
  // Show configurable settings as cycling buttons
  for (const s of (model.settings ?? [])) {
    if (s.type === 'text') continue // skip text settings for group flow
    const current = settings[s.id] ?? s.defaultValue
    const label = lang === 'en' ? s.labelEn : s.labelRu
    if (s.type === 'toggle') {
      const val = current === true || current === 'true'
      rows.push([Markup.button.callback(`${val ? '✅' : '⬜'} ${label}`, `gg:set:${s.id}:toggle:${sessionId}`)])
    } else if (s.type === 'select' && s.values) {
      rows.push([Markup.button.callback(`${label}: ${current}`, `gg:set:${s.id}:cycle:${sessionId}`)])
    } else if (s.type === 'slider') {
      rows.push([
        Markup.button.callback('−', `gg:set:${s.id}:dec:${sessionId}`),
        Markup.button.callback(`${label}: ${current}`, `gg:noop:${sessionId}`),
        Markup.button.callback('+', `gg:set:${s.id}:inc:${sessionId}`),
      ])
    }
  }
  // Publish toggle
  rows.push([Markup.button.callback(isPublic ? t.publishOn : t.publishOff, `gg:pub:${sessionId}`)])
  // Continue / back / cancel
  rows.push([Markup.button.callback(t.continue, `gg:go:${sessionId}`)])
  rows.push([Markup.button.callback(t.back, `gg:back:mdl:${sessionId}`), Markup.button.callback(t.cancel, `gg:cancel:${sessionId}`)])
  return Markup.inlineKeyboard(rows)
}

// ─── Session helpers ──────────────────────────────────────────────────

async function getSession(sessionId: string) {
  const s = await prisma.groupGenSession.findUnique({ where: { id: sessionId } })
  if (!s) return null
  if (s.expiresAt < new Date()) return null
  return s
}

async function updateSessionSettings(sessionId: string, patch: Record<string, any>) {
  const s = await prisma.groupGenSession.findUnique({ where: { id: sessionId } })
  if (!s) return null
  const settings = { ...(s.settings as any), ...patch }
  return prisma.groupGenSession.update({ where: { id: sessionId }, data: { settings } })
}

// ─── Main /pic handler ────────────────────────────────────────────────

export async function picCommandHandler(bot: Telegraf<any>, ctx: Context<Update>) {
  const msg = ctx.message as any
  if (!msg || !ctx.from) return

  const user = await getOrCreateUser(ctx.from)
  const lang = user.lang === 'en' ? 'en' : 'ru'
  const t = T(lang)

  const replied = msg.reply_to_message
  const mediaPromise = replied ? extractReferenceMedia(replied, bot) : null

  let ref: { url: string; type: 'image' | 'video' } | null = null
  if (mediaPromise) {
    ref = await mediaPromise
  }

  // For non-group chats where user just sent /pic without reply, show "reply to media" hint
  if (!ref && replied === undefined) {
    await ctx.reply(t.noMedia)
    return
  }

  // Create session
  const now = new Date()
  const session = await prisma.groupGenSession.create({
    data: {
      chatId: String(msg.chat.id),
      userId: user.id,
      botMessageId: 0, // placeholder, updated below
      originalMessageId: replied?.message_id ?? msg.message_id,
      refImageUrl: ref?.url ?? null,
      refFileType: ref?.type ?? null,
      settings: {},
      isPublic: true,
      status: 'CONFIGURING',
      expiresAt: new Date(now.getTime() + SESSION_TTL_MINUTES * 60 * 1000),
    },
  })

  const sent = await ctx.replyWithHTML(
    t.chooseCategory,
    {
      ...categoryKeyboard(lang, ref?.type === 'video', session.id),
      reply_parameters: { message_id: msg.message_id },
    } as any,
  )

  await prisma.groupGenSession.update({
    where: { id: session.id },
    data: { botMessageId: sent.message_id },
  })
}

// ─── Callback handler ─────────────────────────────────────────────────

export async function groupGenCallbackHandler(bot: Telegraf<any>, ctx: Context<Update>) {
  const cbq = ctx.callbackQuery as any
  if (!cbq?.data || !cbq.data.startsWith('gg:')) return

  const parts = cbq.data.split(':')
  const action = parts[1]
  const sessionId = parts[parts.length - 1]

  const session = await getSession(sessionId)
  if (!session) {
    await ctx.answerCbQuery('⌛')
    try { await ctx.editMessageText('⌛ Session expired') } catch {}
    return
  }

  // Ensure clicker is registered as user
  const clicker = await getOrCreateUser(cbq.from)
  const lang = clicker.lang === 'en' ? 'en' : 'ru'
  const t = T(lang)

  // ── Cancel ──
  if (action === 'cancel') {
    await prisma.groupGenSession.update({ where: { id: sessionId }, data: { status: 'EXPIRED' } })
    await ctx.answerCbQuery()
    try { await ctx.editMessageText(t.cancelled) } catch {}
    return
  }

  if (action === 'noop') {
    await ctx.answerCbQuery()
    return
  }

  // ── Category selection ──
  if (action === 'cat') {
    const category = parts[2] as GenerationType
    await prisma.groupGenSession.update({
      where: { id: sessionId },
      data: { category, modelId: null, settings: {} },
    })
    await ctx.answerCbQuery()
    await ctx.editMessageText(t.chooseModel, {
      parse_mode: 'HTML',
      reply_markup: modelsKeyboard(lang, category, sessionId, !!session.refImageUrl).reply_markup,
    })
    return
  }

  // ── Back to category ──
  if (action === 'back' && parts[2] === 'cat') {
    await ctx.answerCbQuery()
    await ctx.editMessageText(t.chooseCategory, {
      parse_mode: 'HTML',
      reply_markup: categoryKeyboard(lang, session.refFileType === 'video', sessionId).reply_markup,
    })
    return
  }

  // ── Back to model list ──
  if (action === 'back' && parts[2] === 'mdl') {
    if (!session.category) return
    await prisma.groupGenSession.update({ where: { id: sessionId }, data: { modelId: null, settings: {} } })
    await ctx.answerCbQuery()
    await ctx.editMessageText(t.chooseModel, {
      parse_mode: 'HTML',
      reply_markup: modelsKeyboard(lang, session.category as GenerationType, sessionId, !!session.refImageUrl).reply_markup,
    })
    return
  }

  // ── Model selection ──
  if (action === 'mdl') {
    const modelId = parts[2]
    const model = getModel(modelId)
    if (!model) { await ctx.answerCbQuery(); return }
    // Init settings with defaults
    const initSettings: Record<string, any> = {}
    for (const s of (model.settings ?? [])) {
      if (s.defaultValue !== undefined) initSettings[s.id] = s.defaultValue
    }
    await prisma.groupGenSession.update({
      where: { id: sessionId },
      data: { modelId, settings: initSettings },
    })
    await ctx.answerCbQuery()
    await ctx.editMessageText(t.chooseSettings(model.name), {
      parse_mode: 'HTML',
      reply_markup: settingsKeyboard(lang, model, initSettings, session.isPublic, sessionId).reply_markup,
    })
    return
  }

  // ── Settings modification ──
  if (action === 'set') {
    const settingId = parts[2]
    const op = parts[3]
    if (!session.modelId) { await ctx.answerCbQuery(); return }
    const model = getModel(session.modelId)
    if (!model) { await ctx.answerCbQuery(); return }
    const settingDef = model.settings?.find(s => s.id === settingId)
    if (!settingDef) { await ctx.answerCbQuery(); return }
    const cur = (session.settings as any)[settingId] ?? settingDef.defaultValue
    let next: any = cur
    if (op === 'toggle') {
      const b = cur === true || cur === 'true'
      next = !b
    } else if (op === 'cycle' && settingDef.values) {
      const idx = settingDef.values.indexOf(String(cur))
      next = settingDef.values[(idx + 1) % settingDef.values.length]
    } else if (op === 'inc' && settingDef.type === 'slider') {
      next = Math.min(settingDef.max ?? 100, Number(cur) + (settingDef.step ?? 1))
    } else if (op === 'dec' && settingDef.type === 'slider') {
      next = Math.max(settingDef.min ?? 0, Number(cur) - (settingDef.step ?? 1))
    }
    const updated = await updateSessionSettings(sessionId, { [settingId]: next })
    await ctx.answerCbQuery()
    if (!updated) return
    await ctx.editMessageText(t.chooseSettings(model.name), {
      parse_mode: 'HTML',
      reply_markup: settingsKeyboard(lang, model, updated.settings as any, updated.isPublic, sessionId).reply_markup,
    })
    return
  }

  // ── Toggle publish ──
  if (action === 'pub') {
    if (!session.modelId) { await ctx.answerCbQuery(); return }
    const model = getModel(session.modelId)
    if (!model) { await ctx.answerCbQuery(); return }
    const updated = await prisma.groupGenSession.update({
      where: { id: sessionId },
      data: { isPublic: !session.isPublic },
    })
    await ctx.answerCbQuery()
    await ctx.editMessageText(t.chooseSettings(model.name), {
      parse_mode: 'HTML',
      reply_markup: settingsKeyboard(lang, model, updated.settings as any, updated.isPublic, sessionId).reply_markup,
    })
    return
  }

  // ── Continue to prompt ──
  if (action === 'go') {
    if (!session.modelId) { await ctx.answerCbQuery(); return }
    const model = getModel(session.modelId)
    if (!model) { await ctx.answerCbQuery(); return }
    const price = calculatePrice(session.modelId, session.settings as any)
    await prisma.groupGenSession.update({
      where: { id: sessionId },
      data: { status: 'AWAITING_PROMPT' },
    })
    await ctx.answerCbQuery()
    await ctx.editMessageText(t.awaitPrompt(model.name, price), {
      parse_mode: 'HTML',
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback(t.cancel, `gg:cancel:${sessionId}`)],
      ]).reply_markup,
    })
    return
  }
}

// ─── Reply-to-prompt listener ─────────────────────────────────────────

export async function groupReplyPromptHandler(ctx: Context<Update>) {
  const msg = ctx.message as any
  if (!msg?.reply_to_message || !msg.text || !ctx.from) return
  if (msg.text.startsWith('/')) return // skip commands

  // Find session by bot message id
  const botReplyMsgId = msg.reply_to_message.message_id
  const chatId = String(msg.chat.id)
  const session = await prisma.groupGenSession.findFirst({
    where: {
      chatId,
      botMessageId: botReplyMsgId,
      status: 'AWAITING_PROMPT',
    },
  })
  if (!session) return
  if (session.expiresAt < new Date()) return

  const user = await getOrCreateUser(ctx.from)
  const lang = user.lang === 'en' ? 'en' : 'ru'
  const t = T(lang)

  const model = session.modelId ? getModel(session.modelId) : null
  if (!model) return

  const prompt = msg.text.trim()
  if (!prompt) return

  const price = calculatePrice(session.modelId!, session.settings as any)

  // Check balance
  const fresh = await prisma.user.findUnique({ where: { id: user.id } })
  if (!fresh || fresh.balance < price) {
    await ctx.reply(t.noBalance(price, fresh?.balance ?? 0), {
      reply_parameters: { message_id: msg.message_id },
    } as any)
    return
  }

  // Deduct
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { balance: { decrement: price }, totalSpent: { increment: price } },
    }),
    prisma.transaction.create({
      data: { userId: user.id, amount: -price, type: 'SPEND', description: `Group gen: ${model.name}` },
    }),
  ])

  // Create generation linked to the original message in chat for reply-back
  const generation = await prisma.generation.create({
    data: {
      userId: user.id,
      type: model.type,
      model: session.modelId!,
      prompt,
      imageUrl: session.refImageUrl,
      status: 'PENDING',
      tokensSpent: price,
      isPublic: session.isPublic,
      sourceChatId: chatId,
      sourceMessageId: session.originalMessageId,
    },
  })

  await prisma.groupGenSession.update({
    where: { id: session.id },
    data: { status: 'GENERATING' },
  })

  // Enqueue
  const workerSettings: any = { ...(session.settings as any) }
  if (session.refImageUrl) workerSettings._imageUrls = [session.refImageUrl]
  await generationQueue.add('generate', {
    generationId: generation.id,
    modelId: session.modelId,
    prompt,
    imageUrl: session.refImageUrl,
    settings: workerSettings,
  }, { attempts: 1 })

  // Notify chat
  await ctx.reply(t.generating(model.name), {
    parse_mode: 'HTML',
    reply_parameters: { message_id: msg.message_id },
  } as any)
}
