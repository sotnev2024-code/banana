import type { Context } from 'telegraf'
import { Markup } from 'telegraf'
import { prisma } from '../index'
import { WELCOME_BONUS, REFERRAL_BONUS } from '@aibot/shared'

const texts = {
  ru: {
    welcome: (name: string, bonus: number) => `<b>${name}</b>, добро пожаловать в PicPulse AI Studio!\n\n+${bonus} токенов начислено.`,
    welcomeBack: (name: string, balance: number) => `<b>${name}</b>, с возвращением!\n\nБаланс: <b>${balance} токенов</b>`,
    openStudio: 'Открыть студию',
    chooseLang: 'Выберите язык / Choose language',
    bonusDesc: 'Приветственный бонус',
    referralNotify: (name: string, bonus: number) => `+${bonus} токенов — ${name} присоединился по вашей ссылке!`,
  },
  en: {
    welcome: (name: string, bonus: number) => `<b>${name}</b>, welcome to PicPulse AI Studio!\n\n+${bonus} tokens credited.`,
    welcomeBack: (name: string, balance: number) => `<b>${name}</b>, welcome back!\n\nBalance: <b>${balance} tokens</b>`,
    openStudio: 'Open Studio',
    chooseLang: 'Choose language / Выберите язык',
    bonusDesc: 'Welcome bonus',
    referralNotify: (name: string, bonus: number) => `+${bonus} tokens — ${name} joined via your link!`,
  },
}

function getLang(user: any, tgLangCode?: string): 'ru' | 'en' {
  if (user?.lang && ['ru', 'en'].includes(user.lang)) return user.lang as 'ru' | 'en'
  if (tgLangCode?.startsWith('ru')) return 'ru'
  return 'en'
}

export async function startHandler(ctx: Context) {
  const tg = ctx.from!
  const telegramId = BigInt(tg.id)

  const existing = await prisma.user.findUnique({ where: { telegramId } })
  const isNew = !existing

  // Parse deep link payload
  const payload = (ctx.message as any)?.text?.split(' ')[1] ?? ''
  let referrerId: string | null = null

  if (isNew && payload.startsWith('ref_')) {
    const refCode = payload.slice(4)
    const referrer = await prisma.user.findUnique({ where: { referralCode: refCode } })
    if (referrer && referrer.telegramId !== telegramId) {
      referrerId = referrer.id
    }
  }

  // Detect language from Telegram
  const detectedLang = tg.language_code?.startsWith('ru') ? 'ru' : 'en'

  if (isNew) {
    // New user — ask language first
    await ctx.replyWithHTML(
      texts.en.chooseLang,
      Markup.inlineKeyboard([
        [Markup.button.callback('Русский', `lang:ru:${payload}`)],
        [Markup.button.callback('English', `lang:en:${payload}`)],
      ]),
    )
    return
  }

  // Existing user — show menu
  const lang = getLang(existing, tg.language_code)
  const t = texts[lang]

  const miniAppUrl = process.env.MINIAPP_URL!
  const welcomeText = t.welcomeBack(tg.first_name, existing!.balance)

  await ctx.replyWithHTML(
    welcomeText,
    Markup.inlineKeyboard([
      [Markup.button.webApp(t.openStudio, miniAppUrl)],
    ]),
  )
}

export async function langSelectHandler(ctx: Context) {
  const data = (ctx.callbackQuery as any)?.data as string
  if (!data?.startsWith('lang:')) return

  const parts = data.split(':')
  const lang = parts[1] as 'ru' | 'en'
  const payload = parts[2] ?? ''

  const tg = ctx.from!
  const telegramId = BigInt(tg.id)

  // Check if user already exists (double click protection)
  const existing = await prisma.user.findUnique({ where: { telegramId } })
  if (existing) {
    await prisma.user.update({ where: { telegramId }, data: { lang } })
    await ctx.answerCbQuery()
    const t = texts[lang]
    await ctx.editMessageText(t.welcomeBack(tg.first_name, existing.balance), { parse_mode: 'HTML' })
    await ctx.replyWithHTML(
      t.welcomeBack(tg.first_name, existing.balance),
      Markup.inlineKeyboard([
        [Markup.button.webApp(t.openStudio, process.env.MINIAPP_URL!)],
      ]),
    )
    return
  }

  // Parse referral from payload
  let referrerId: string | null = null
  if (payload.startsWith('ref_')) {
    const refCode = payload.slice(4)
    const referrer = await prisma.user.findUnique({ where: { referralCode: refCode } })
    if (referrer && referrer.telegramId !== telegramId) {
      referrerId = referrer.id
    }
  }

  // Create user with selected language
  const user = await prisma.user.create({
    data: {
      telegramId,
      firstName: tg.first_name,
      lastName: tg.last_name ?? null,
      username: tg.username ?? null,
      balance: WELCOME_BONUS,
      lang,
      referrerId,
    },
  })

  const t = texts[lang]

  await prisma.transaction.create({
    data: { userId: user.id, amount: WELCOME_BONUS, type: 'BONUS', description: t.bonusDesc },
  })

  // Credit referrer
  if (referrerId) {
    const referrer = await prisma.user.findUnique({ where: { id: referrerId } })
    if (referrer) {
      const refLang = getLang(referrer)
      await prisma.$transaction([
        prisma.user.update({ where: { id: referrerId }, data: { balance: { increment: REFERRAL_BONUS } } }),
        prisma.transaction.create({
          data: { userId: referrerId, amount: REFERRAL_BONUS, type: 'REFERRAL', description: `Referral: ${tg.first_name}` },
        }),
      ])
      try {
        await ctx.telegram.sendMessage(
          referrer.telegramId.toString(),
          texts[refLang].referralNotify(tg.first_name, REFERRAL_BONUS),
        )
      } catch {}
    }
  }

  await ctx.answerCbQuery()
  await ctx.editMessageText(t.welcome(tg.first_name, WELCOME_BONUS), { parse_mode: 'HTML' })

  const miniAppUrl = process.env.MINIAPP_URL!
  await ctx.replyWithHTML(
    t.welcome(tg.first_name, WELCOME_BONUS),
    Markup.inlineKeyboard([
      [Markup.button.webApp(t.openStudio, miniAppUrl)],
    ]),
  )
}
