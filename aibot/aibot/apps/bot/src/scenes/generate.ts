import { Scenes, Markup } from 'telegraf'
import type { SceneContext } from 'telegraf/scenes'
import { prisma } from '../index'
import { getModelsByType, getModel, MODELS } from '@aibot/shared'

// POST to API to create generation
async function createGeneration(userId: string, modelId: string, prompt: string, imageUrl?: string) {
  const res = await fetch(`${process.env.API_URL}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-bot-secret': process.env.BOT_SECRET! },
    body: JSON.stringify({ userId, model: modelId, prompt, imageUrl, isPublic: true }),
  })
  if (!res.ok) {
    const err = await res.json() as { error: string; balance?: number; required?: number }
    throw Object.assign(new Error(err.error), err)
  }
  return res.json() as Promise<{ id: string }>
}

export const generateScene = new Scenes.BaseScene<SceneContext>('generate')

generateScene.enter(async (ctx) => {
  const type = (ctx.scene.state as { type: string }).type ?? 'IMAGE'
  const models = getModelsByType(type as any)

  const typeEmoji: Record<string, string> = { IMAGE: '🖼', VIDEO: '🎬', MUSIC: '🎵', MOTION: '🎥' }
  const emoji = typeEmoji[type] ?? '✨'

  await ctx.replyWithHTML(
    `${emoji} <b>Выберите модель:</b>`,
    Markup.inlineKeyboard(
      models.map(m => [
        Markup.button.callback(`${m.name}  —  ${m.tokensPerGeneration} 🪙`, `model:${m.id}`),
      ]).concat([[Markup.button.callback('❌ Отмена', 'cancel')]]),
    ),
  )
})

generateScene.action(/^model:(.+)$/, async (ctx) => {
  const modelId = ctx.match[1]
  const model = getModel(modelId)
  if (!model) return

  ctx.scene.state = { ...(ctx.scene.state as object), modelId }
  await ctx.answerCbQuery()
  await ctx.replyWithHTML(
    `<b>${model.name}</b> выбрана.\n\n` +
    (model.supportsImageInput
      ? '📎 Отправьте фото-референс (или напишите промпт без фото):\n\n'
      : '') +
    '✍️ Введите промпт на русском или английском:',
  )
})

generateScene.on('photo', async (ctx) => {
  const photo = ctx.message.photo.at(-1)!
  const file = await ctx.telegram.getFile(photo.file_id)
  const imageUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file.file_path}`
  ctx.scene.state = { ...(ctx.scene.state as object), imageUrl }
  await ctx.reply('📸 Фото получено! Теперь введите промпт:')
})

generateScene.on('text', async (ctx) => {
  const state = ctx.scene.state as { modelId?: string; imageUrl?: string; type: string }
  const prompt = ctx.message.text

  if (!state.modelId) {
    await ctx.reply('Сначала выберите модель. Нажмите /start для возврата.')
    return
  }

  const model = getModel(state.modelId)!

  // Check balance
  const telegramId = BigInt(ctx.from!.id)
  const user = await prisma.user.findUnique({ where: { telegramId } })
  if (!user || user.balance < model.tokensPerGeneration) {
    await ctx.replyWithHTML(
      `❌ Недостаточно токенов.\n\nНужно: <b>${model.tokensPerGeneration} 🪙</b>\nЕсть: <b>${user?.balance ?? 0} 🪙</b>`,
      Markup.inlineKeyboard([[Markup.button.webApp('💳 Пополнить', `${process.env.MINIAPP_URL}/plans`)]]),
    )
    return ctx.scene.leave()
  }

  const waitMsg = await ctx.replyWithHTML('⏳ <b>Генерирую...</b>\n\nЭто может занять до 2 минут. Уведомлю когда будет готово!')

  try {
    const gen = await createGeneration(user.id, state.modelId, prompt, state.imageUrl)
    // Store for result notification
    await prisma.generation.update({ where: { id: gen.id }, data: {} }) // no-op just to confirm
    await ctx.telegram.editMessageText(
      ctx.chat!.id,
      waitMsg.message_id,
      undefined,
      `⏳ Задача принята! ID: ${gen.id.slice(0, 8)}...\n\nОжидай результат — уведомлю в этом чате.`,
    )
  } catch (err: any) {
    await ctx.replyWithHTML(`❌ Ошибка: ${err.message}`)
  }

  ctx.scene.leave()
})

generateScene.action('cancel', async (ctx) => {
  await ctx.answerCbQuery('Отменено')
  await ctx.reply('Отменено. Нажми /start для главного меню.')
  ctx.scene.leave()
})
