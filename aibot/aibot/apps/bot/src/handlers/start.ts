import type { Context } from 'telegraf'
import { Markup } from 'telegraf'
import { prisma } from '../index'
import { WELCOME_BONUS, REFERRAL_BONUS } from '@aibot/shared'

export async function startHandler(ctx: Context) {
  const tg = ctx.from!
  const telegramId = BigInt(tg.id)

  const existing = await prisma.user.findUnique({ where: { telegramId } })
  const isNew = !existing

  // Parse deep link payload (ref_XXXX or buy_XXXX)
  const payload = (ctx.message as any)?.text?.split(' ')[1] ?? ''
  let referrerId: string | null = null

  if (isNew && payload.startsWith('ref_')) {
    const refCode = payload.slice(4)
    const referrer = await prisma.user.findUnique({ where: { referralCode: refCode } })
    if (referrer && referrer.telegramId !== telegramId) {
      referrerId = referrer.id
    }
  }

  const user = await prisma.user.upsert({
    where: { telegramId },
    update: { firstName: tg.first_name, username: tg.username ?? null },
    create: {
      telegramId,
      firstName: tg.first_name,
      lastName: tg.last_name ?? null,
      username: tg.username ?? null,
      balance: WELCOME_BONUS,
      referrerId,
    },
  })

  if (isNew) {
    await prisma.transaction.create({
      data: { userId: user.id, amount: WELCOME_BONUS, type: 'BONUS', description: 'Welcome bonus' },
    })

    // Credit referrer
    if (referrerId) {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: referrerId },
          data: { balance: { increment: REFERRAL_BONUS } },
        }),
        prisma.transaction.create({
          data: { userId: referrerId, amount: REFERRAL_BONUS, type: 'REFERRAL', description: `Referral: ${tg.first_name}` },
        }),
      ])

      // Notify referrer
      try {
        const referrer = await prisma.user.findUnique({ where: { id: referrerId } })
        if (referrer) {
          await ctx.telegram.sendMessage(
            referrer.telegramId.toString(),
            `+${REFERRAL_BONUS} tokens — ${tg.first_name} joined via your link!`,
          )
        }
      } catch {}
    }
  }

  const miniAppUrl = process.env.MINIAPP_URL!

  const welcomeText = isNew
    ? `<b>${tg.first_name}</b>, welcome to PicPulse AI Studio!\n\n+${WELCOME_BONUS} tokens credited.`
    : `<b>${tg.first_name}</b>, welcome back!\n\nBalance: <b>${user.balance} tokens</b>`

  await ctx.replyWithHTML(
    welcomeText,
    Markup.inlineKeyboard([
      [Markup.button.webApp('Open Studio', miniAppUrl)],
      [
        Markup.button.callback('Photo',  'cat:image'),
        Markup.button.callback('Video', 'cat:video'),
      ],
      [
        Markup.button.callback('Music',  'cat:music'),
        Markup.button.callback('Motion',  'cat:motion'),
      ],
      [
        Markup.button.callback('Buy tokens', 'cat:buy'),
        Markup.button.callback('Profile', 'cat:profile'),
      ],
    ]),
  )
}
