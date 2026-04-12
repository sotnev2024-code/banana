import type { FastifyInstance } from 'fastify'
import { prisma } from '../index'
import { TOKEN_PLANS, getDailyBonus, ACHIEVEMENTS, REFERRAL_BONUS } from '@aibot/shared'
import { sanitizeUser } from './auth'

export async function plansRoutes(app: FastifyInstance) {
  app.get('/', async (_req, reply) => {
    return reply.send(TOKEN_PLANS)
  })
}

export async function profileRoutes(app: FastifyInstance) {
  // GET /me — current user
  app.get('/', { onRequest: [(app as any).authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: string }
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
    return reply.send(sanitizeUser(user))
  })

  // GET /me/generations — user's generations
  app.get('/generations', { onRequest: [(app as any).authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: string }
    const { cursor, limit = '20' } = req.query as Record<string, string>
    const take = Math.min(Number(limit), 50)

    const items = await prisma.generation.findMany({
      where: { userId },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
    })

    const hasMore = items.length > take
    if (hasMore) items.pop()

    return reply.send({ items, nextCursor: hasMore ? items[items.length - 1].id : null })
  })

  // GET /me/transactions — transaction history
  app.get('/transactions', { onRequest: [(app as any).authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: string }
    const txs = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    return reply.send(txs)
  })

  // PUT /me/settings — update user settings
  app.put('/settings', { onRequest: [(app as any).authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: string }
    const { lang, theme } = req.body as { lang?: string; theme?: string }
    const data: Record<string, string> = {}
    if (lang && ['ru', 'en'].includes(lang)) data.lang = lang
    if (theme && ['auto', 'light', 'dark'].includes(theme)) data.theme = theme

    const user = await prisma.user.update({ where: { id: userId }, data })
    return reply.send(sanitizeUser(user))
  })

  // POST /me/daily — claim daily bonus
  app.post('/daily', { onRequest: [(app as any).authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: string }
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })

    // Check if already claimed today
    if (user.lastDailyAt) {
      const last = new Date(user.lastDailyAt)
      const now = new Date()
      if (last.toDateString() === now.toDateString()) {
        return reply.code(400).send({ error: 'Бонус уже получен сегодня' })
      }

      // Check streak: if last claim was yesterday, increment; otherwise reset
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      const isConsecutive = last.toDateString() === yesterday.toDateString()
      var newStreak = isConsecutive ? user.dailyStreak + 1 : 1
    } else {
      var newStreak = 1
    }

    const tokens = getDailyBonus(newStreak - 1)

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        balance: { increment: tokens },
        dailyStreak: newStreak,
        lastDailyAt: new Date(),
      },
    })

    await prisma.transaction.create({
      data: { userId, amount: tokens, type: 'DAILY', description: `Ежедневный бонус (день ${newStreak})` },
    })

    const nextClaimAt = new Date()
    nextClaimAt.setDate(nextClaimAt.getDate() + 1)
    nextClaimAt.setHours(0, 0, 0, 0)

    return reply.send({ tokens, streak: newStreak, nextClaimAt: nextClaimAt.toISOString() })
  })

  // GET /me/referrals — referral stats
  app.get('/referrals', { onRequest: [(app as any).authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: string }
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        referrals: {
          select: { firstName: true, username: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    })

    const count = user.referrals.length
    const earned = count * REFERRAL_BONUS

    return reply.send({
      code: user.referralCode,
      count,
      earned,
      referrals: user.referrals.map(r => ({
        firstName: r.firstName,
        username: r.username,
        createdAt: r.createdAt.toISOString(),
      })),
    })
  })

  // GET /me/achievements — user achievements
  app.get('/achievements', { onRequest: [(app as any).authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: string }
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId },
    })

    const unlockedIds = new Set(userAchievements.map(ua => ua.achievementId))

    const all = ACHIEVEMENTS.map(a => ({
      ...a,
      unlocked: unlockedIds.has(a.id),
      unlockedAt: userAchievements.find(ua => ua.achievementId === a.id)?.unlockedAt?.toISOString(),
    }))

    return reply.send({ unlocked: [...unlockedIds], all })
  })

  // GET /me/favorites — user favorites
  app.get('/favorites', { onRequest: [(app as any).authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: string }
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: { generation: true },
      orderBy: { createdAt: 'desc' },
    })
    return reply.send(favorites.map(f => f.generation))
  })

  // POST /me/favorites — add favorite
  app.post('/favorites', { onRequest: [(app as any).authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: string }
    const { generationId } = req.body as { generationId: string }

    await prisma.favorite.create({
      data: { userId, generationId },
    }).catch(() => {}) // ignore duplicate

    return reply.send({ ok: true })
  })

  // DELETE /me/favorites/:id — remove favorite
  app.delete('/favorites/:id', { onRequest: [(app as any).authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: string }
    const { id: generationId } = req.params as { id: string }

    await prisma.favorite.deleteMany({
      where: { userId, generationId },
    })

    return reply.send({ ok: true })
  })

  // POST /me/promo — redeem promo code
  app.post('/promo', { onRequest: [(app as any).authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: string }
    const { code } = req.body as { code: string }

    const promo = await prisma.promoCode.findUnique({ where: { code: code.toUpperCase() } })
    if (!promo || !promo.isActive) {
      return reply.code(404).send({ error: 'Промокод не найден' })
    }

    if (promo.expiresAt && promo.expiresAt < new Date()) {
      return reply.code(400).send({ error: 'Промокод истёк' })
    }

    if (promo.maxUses > 0 && promo.usedCount >= promo.maxUses) {
      return reply.code(400).send({ error: 'Промокод использован максимальное количество раз' })
    }

    // Check if already used by this user
    const existing = await prisma.promoCodeUsage.findUnique({
      where: { userId_promoCodeId: { userId, promoCodeId: promo.id } },
    })
    if (existing) {
      return reply.code(400).send({ error: 'Вы уже использовали этот промокод' })
    }

    // Apply promo
    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { balance: { increment: promo.tokens } } }),
      prisma.transaction.create({
        data: { userId, amount: promo.tokens, type: 'PROMO', description: `Промокод ${promo.code}` },
      }),
      prisma.promoCodeUsage.create({ data: { userId, promoCodeId: promo.id } }),
      prisma.promoCode.update({ where: { id: promo.id }, data: { usedCount: { increment: 1 } } }),
    ])

    return reply.send({ tokens: promo.tokens, message: 'Промокод активирован!' })
  })

  // GET /me/stats — usage statistics
  app.get('/stats', { onRequest: [(app as any).authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: string }
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })

    const totalGenerations = await prisma.generation.count({ where: { userId, status: 'DONE' } })

    const byTypeRaw = await prisma.generation.groupBy({
      by: ['type'],
      where: { userId, status: 'DONE' },
      _count: true,
    })
    const byType: Record<string, number> = {}
    for (const row of byTypeRaw) byType[row.type] = row._count

    // Most used model
    const topModel = await prisma.generation.groupBy({
      by: ['model'],
      where: { userId, status: 'DONE' },
      _count: true,
      orderBy: { _count: { model: 'desc' } },
      take: 1,
    })

    return reply.send({
      totalGenerations,
      byType,
      favoriteModel: topModel[0]?.model ?? null,
      totalSpent: user.totalSpent,
      memberSince: user.createdAt.toISOString(),
    })
  })
}
