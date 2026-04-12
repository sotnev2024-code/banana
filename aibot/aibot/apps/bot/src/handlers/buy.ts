import type { Context } from 'telegraf'
import { Markup } from 'telegraf'
import { prisma } from '../index'
import { TOKEN_PLANS } from '@aibot/shared'

export async function buyHandler(ctx: Context) {
  const miniAppUrl = process.env.MINIAPP_URL!
  const plansText = TOKEN_PLANS.map(p => {
    const total = p.tokens + p.bonusTokens
    const bonus = p.bonusTokens > 0 ? ` (+${p.bonusTokens} бонус)` : ''
    return `${p.popular ? '⭐ ' : ''}${p.name}: ${total}${bonus} 🪙 — ${p.priceRub} ₽`
  }).join('\n')

  await ctx.replyWithHTML(
    `💳 <b>Пополнение токенов</b>\n\n${plansText}\n\nОткройте студию для оплаты:`,
    Markup.inlineKeyboard([[
      Markup.button.webApp('💳 Пополнить токены', `${miniAppUrl}/plans`),
    ]]),
  )
}

export async function profileHandler(ctx: Context) {
  const telegramId = BigInt(ctx.from!.id)
  const user = await prisma.user.findUnique({ where: { telegramId } })
  if (!user) return ctx.reply('Сначала нажмите /start')

  const totalGens = await prisma.generation.count({ where: { userId: user.id, status: 'DONE' } })

  await ctx.replyWithHTML(
    `👤 <b>Профиль</b>\n\n` +
    `Имя: ${user.firstName}\n` +
    `🪙 Баланс: <b>${user.balance} токенов</b>\n` +
    `📊 Генераций: <b>${totalGens}</b>\n` +
    `💸 Потрачено: <b>${user.totalSpent} токенов</b>`,
    Markup.inlineKeyboard([[
      Markup.button.callback('💳 Пополнить', 'cat:buy'),
    ]]),
  )
}

export async function historyHandler(ctx: Context) {
  const telegramId = BigInt(ctx.from!.id)
  const user = await prisma.user.findUnique({ where: { telegramId } })
  if (!user) return ctx.reply('Сначала нажмите /start')

  const gens = await prisma.generation.findMany({
    where: { userId: user.id, status: 'DONE' },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  if (gens.length === 0) return ctx.reply('Генераций пока нет. Создайте первую!')

  const typeEmoji: Record<string, string> = { IMAGE: '🖼', VIDEO: '🎬', MUSIC: '🎵', MOTION: '🎥' }
  const lines = gens.map((g, i) =>
    `${i + 1}. ${typeEmoji[g.type] ?? '✨'} ${g.model} — ${g.prompt.slice(0, 40)}...`
  )

  await ctx.replyWithHTML(
    `📋 <b>Последние генерации:</b>\n\n${lines.join('\n')}\n\nВся история в студии:`,
    Markup.inlineKeyboard([[
      Markup.button.webApp('📋 Открыть историю', `${process.env.MINIAPP_URL}/history`),
    ]]),
  )
}
