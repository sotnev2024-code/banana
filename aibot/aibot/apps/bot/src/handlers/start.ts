import type { Context } from 'telegraf'
import { Markup } from 'telegraf'
import { prisma } from '../index'
import { WELCOME_BONUS, REFERRAL_BONUS } from '@aibot/shared'

const BRAND = 'PicPulse'

const labels = {
  ru: {
    chooseLang: 'Выберите язык / Choose language',
    bonusDesc: 'Приветственный бонус',
    openApp: 'Открыть приложение',
    channel: 'Канал',
    chat: 'Чат',
    instagram: 'Instagram',
    support: 'Поддержка',
    info: 'Информация',
    referral: 'Реферальная программа',
    referralNotify: (name: string, bonus: number) => `+${bonus} токенов — ${name} присоединился по вашей ссылке!`,
  },
  en: {
    chooseLang: 'Choose language / Выберите язык',
    bonusDesc: 'Welcome bonus',
    openApp: 'Open app',
    channel: 'Channel',
    chat: 'Chat',
    instagram: 'Instagram',
    support: 'Support',
    info: 'Info',
    referral: 'Referral program',
    referralNotify: (name: string, bonus: number) => `+${bonus} tokens — ${name} joined via your link!`,
  },
}

function welcomeText(name: string, balance: number, isNew: boolean, bonus: number, lang: 'ru' | 'en'): string {
  if (lang === 'ru') {
    return [
      `👋 Привет, <b>${name}</b> | ${BRAND}`,
      ``,
      `AI-студия для контента, бизнеса и развлечений.`,
      ``,
      `• Фото и видео по описанию`,
      `• Замена лица и редактирование деталей`,
      `• AI-аватары и видео-тренды`,
      `• Трансформация реальных продуктов`,
      `• Дизайн графики и визуалов для соцсетей`,
      ``,
      `🔥 21+ AI моделей`,
      `✨ Готовые идеи для генерации`,
      `💰 Ежедневные бонусы и достижения`,
      ``,
      `🎨 Nano Banana Pro, Veo 3, Kling 3, Seedance 2, Suno, GPT Image 2 — всё в одном месте.`,
      ``,
      isNew
        ? `🎁 <b>+${bonus} токенов</b> приветственный бонус начислен!`
        : `💰 Баланс: <b>${balance} токенов</b>`,
    ].join('\n')
  }
  return [
    `👋 Hi, <b>${name}</b> | ${BRAND}`,
    ``,
    `AI studio for content, business and entertainment.`,
    ``,
    `• Photo & video from a prompt`,
    `• Face swap and detail editing`,
    `• AI avatars & video trends`,
    `• Real product transformations`,
    `• Graphics & visuals for social media`,
    ``,
    `🔥 21+ AI models`,
    `✨ Ready-to-use prompt ideas`,
    `💰 Daily bonuses & achievements`,
    ``,
    `🎨 Nano Banana Pro, Veo 3, Kling 3, Seedance 2, Suno, GPT Image 2 — all in one place.`,
    ``,
    isNew
      ? `🎁 <b>+${bonus} tokens</b> welcome bonus credited!`
      : `💰 Balance: <b>${balance} tokens</b>`,
  ].join('\n')
}

function buildKeyboard(lang: 'ru' | 'en') {
  const t = labels[lang]
  const miniApp = process.env.MINIAPP_URL!

  const rows: any[][] = []

  // Main: Open app
  rows.push([Markup.button.webApp(`🎨 ${t.openApp}`, miniApp)])

  // Social row (Channel + Chat)
  const socialRow: any[] = []
  if (process.env.TG_CHANNEL_URL) socialRow.push(Markup.button.url(`📢 ${t.channel}`, process.env.TG_CHANNEL_URL))
  if (process.env.TG_CHAT_URL)    socialRow.push(Markup.button.url(`💬 ${t.chat}`,    process.env.TG_CHAT_URL))
  if (socialRow.length) rows.push(socialRow)

  // Info row (Instagram + Support)
  const infoRow: any[] = []
  if (process.env.INSTAGRAM_URL)  infoRow.push(Markup.button.url(`📷 Instagram`, process.env.INSTAGRAM_URL))
  infoRow.push(Markup.button.url(`💁 ${t.support}`, process.env.SUPPORT_URL || 'https://t.me/mnogoprofilnyi'))
  rows.push(infoRow)

  // Info button (optional)
  if (process.env.INFO_URL) {
    rows.push([Markup.button.url(`ℹ️ ${t.info}`, process.env.INFO_URL)])
  }

  // Referral — opens miniapp on /referral page
  rows.push([Markup.button.webApp(`💰 ${t.referral}`, `${miniApp}/referral`)])

  return Markup.inlineKeyboard(rows)
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

  if (isNew) {
    // New user — ask language first (then create user in langSelectHandler)
    await ctx.replyWithHTML(
      labels.ru.chooseLang,
      Markup.inlineKeyboard([
        [Markup.button.callback('🇷🇺 Русский', `lang:ru:${payload}`)],
        [Markup.button.callback('🇬🇧 English', `lang:en:${payload}`)],
      ]),
    )
    return
  }

  // Existing user — full welcome
  const lang = getLang(existing, tg.language_code)
  const text = welcomeText(tg.first_name, existing!.balance, false, 0, lang)
  await ctx.replyWithHTML(text, buildKeyboard(lang))
}

export async function langSelectHandler(ctx: Context) {
  const data = (ctx.callbackQuery as any)?.data as string
  if (!data?.startsWith('lang:')) return

  const parts = data.split(':')
  const lang = parts[1] as 'ru' | 'en'
  const payload = parts[2] ?? ''

  const tg = ctx.from!
  const telegramId = BigInt(tg.id)

  // Check if user already exists (double-click protection)
  const existing = await prisma.user.findUnique({ where: { telegramId } })
  if (existing) {
    await prisma.user.update({ where: { telegramId }, data: { lang } })
    await ctx.answerCbQuery()
    const text = welcomeText(tg.first_name, existing.balance, false, 0, lang)
    try { await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: buildKeyboard(lang).reply_markup }) }
    catch {
      // If edit fails (e.g. message too old), just send new
      await ctx.replyWithHTML(text, buildKeyboard(lang))
    }
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

  await prisma.transaction.create({
    data: { userId: user.id, amount: WELCOME_BONUS, type: 'BONUS', description: labels[lang].bonusDesc },
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
          labels[refLang].referralNotify(tg.first_name, REFERRAL_BONUS),
        )
      } catch {}
    }
  }

  await ctx.answerCbQuery()
  const text = welcomeText(tg.first_name, WELCOME_BONUS, true, WELCOME_BONUS, lang)
  try { await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: buildKeyboard(lang).reply_markup }) }
  catch { await ctx.replyWithHTML(text, buildKeyboard(lang)) }
}
