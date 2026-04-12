import type { Context } from 'telegraf'
import { Markup } from 'telegraf'
import { prisma } from '../index'
import { WELCOME_BONUS } from '@aibot/shared'

export async function startHandler(ctx: Context) {
  const tg = ctx.from!
  const telegramId = BigInt(tg.id)

  const existing = await prisma.user.findUnique({ where: { telegramId } })
  const isNew = !existing

  const user = await prisma.user.upsert({
    where: { telegramId },
    update: { firstName: tg.first_name, username: tg.username ?? null },
    create: {
      telegramId,
      firstName: tg.first_name,
      lastName: tg.last_name ?? null,
      username: tg.username ?? null,
      balance: WELCOME_BONUS,
    },
  })

  if (isNew) {
    await prisma.transaction.create({
      data: { userId: user.id, amount: WELCOME_BONUS, type: 'BONUS', description: 'Приветственный бонус' },
    })
  }

  const welcomeText = isNew
    ? `👋 Привет, <b>${tg.first_name}</b>!\n\nДобро пожаловать в AI-студию.\nТебе начислено <b>${WELCOME_BONUS} токенов</b> 🎁\n\nВыбери что хочешь создать:`
    : `👋 С возвращением, <b>${tg.first_name}</b>!\n\n🪙 Баланс: <b>${user.balance} токенов</b>\n\nЧто создаём сегодня?`

  const miniAppUrl = process.env.MINIAPP_URL!

  await ctx.replyWithHTML(
    welcomeText,
    Markup.inlineKeyboard([
      [Markup.button.webApp('🚀 Открыть студию', miniAppUrl)],
      [
        Markup.button.callback('🖼 Фото',  'cat:image'),
        Markup.button.callback('🎬 Видео', 'cat:video'),
      ],
      [
        Markup.button.callback('🎵 Музыка',  'cat:music'),
        Markup.button.callback('🎥 Motion',  'cat:motion'),
      ],
      [
        Markup.button.callback('💰 Купить токены', 'cat:buy'),
        Markup.button.callback('👤 Профиль', 'cat:profile'),
      ],
    ]),
  )
}
