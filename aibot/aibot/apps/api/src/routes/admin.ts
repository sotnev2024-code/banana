import type { FastifyInstance } from 'fastify'
import { prisma } from '../index'

const ADMIN_IDS = ['1724263429']

function isAdmin(telegramId: string): boolean {
  return ADMIN_IDS.includes(telegramId)
}

export async function adminRoutes(app: FastifyInstance) {
  // Admin check middleware
  app.addHook('onRequest', async (req, reply) => {
    try {
      await (req as any).jwtVerify()
      const { telegramId } = req.user as { telegramId: string }
      if (!isAdmin(telegramId)) {
        return reply.code(403).send({ error: 'Forbidden' })
      }
    } catch {
      return reply.code(401).send({ error: 'Unauthorized' })
    }
  })

  // ═══ DASHBOARD ═══

  app.get('/dashboard', async (_req, reply) => {
    const [totalUsers, totalGenerations, totalPayments, totalRevenue, todayUsers, todayGens, todayRevenue, pendingReports] = await Promise.all([
      prisma.user.count(),
      prisma.generation.count({ where: { status: 'DONE' } }),
      prisma.payment.count({ where: { status: 'SUCCEEDED' } }),
      prisma.payment.aggregate({ where: { status: 'SUCCEEDED' }, _sum: { amount: true } }),
      prisma.user.count({ where: { createdAt: { gte: startOfDay() } } }),
      prisma.generation.count({ where: { status: 'DONE', createdAt: { gte: startOfDay() } } }),
      prisma.payment.aggregate({ where: { status: 'SUCCEEDED', createdAt: { gte: startOfDay() } }, _sum: { amount: true } }),
      prisma.generation.count({ where: { reportsCount: { gte: 1 }, isPublic: true } }),
    ])

    // Popular models
    const popularModels = await prisma.generation.groupBy({
      by: ['model'],
      where: { status: 'DONE' },
      _count: true,
      orderBy: { _count: { model: 'desc' } },
      take: 5,
    })

    // Last 7 days stats
    const days: { date: string; users: number; gens: number; revenue: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const start = new Date(); start.setDate(start.getDate() - i); start.setHours(0, 0, 0, 0)
      const end = new Date(start); end.setDate(end.getDate() + 1)
      const [u, g, r] = await Promise.all([
        prisma.user.count({ where: { createdAt: { gte: start, lt: end } } }),
        prisma.generation.count({ where: { status: 'DONE', createdAt: { gte: start, lt: end } } }),
        prisma.payment.aggregate({ where: { status: 'SUCCEEDED', createdAt: { gte: start, lt: end } }, _sum: { amount: true } }),
      ])
      days.push({ date: start.toISOString().slice(0, 10), users: u, gens: g, revenue: r._sum.amount ?? 0 })
    }

    return reply.send({
      totalUsers,
      totalGenerations,
      totalPayments,
      totalRevenue: totalRevenue._sum.amount ?? 0,
      todayUsers,
      todayGens,
      todayRevenue: todayRevenue._sum.amount ?? 0,
      pendingReports,
      popularModels: popularModels.map(m => ({ model: m.model, count: m._count })),
      days,
    })
  })

  // ═══ USERS ═══

  app.get('/users', async (req, reply) => {
    const { search, page = '1', limit = '20' } = req.query as Record<string, string>
    const take = Math.min(Number(limit), 100)
    const skip = (Number(page) - 1) * take

    const where: any = {}
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { telegramId: isNaN(Number(search)) ? undefined : BigInt(search) },
      ].filter(Boolean)
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, telegramId: true, firstName: true, username: true,
          balance: true, totalSpent: true, isBlocked: true, createdAt: true,
          _count: { select: { generations: true, referrals: true } },
        },
      }),
      prisma.user.count({ where }),
    ])

    return reply.send({
      users: users.map(u => ({ ...u, telegramId: u.telegramId.toString(), generationsCount: u._count.generations, referralsCount: u._count.referrals, _count: undefined })),
      total,
      pages: Math.ceil(total / take),
    })
  })

  app.get('/users/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: { select: { generations: true, referrals: true, payments: true } },
      },
    })
    if (!user) return reply.code(404).send({ error: 'Not found' })
    return reply.send({ ...user, telegramId: user.telegramId.toString() })
  })

  // Block/unblock user
  app.post('/users/:id/block', async (req, reply) => {
    const { id } = req.params as { id: string }
    const user = await prisma.user.update({
      where: { id },
      data: { isBlocked: true },
    })
    return reply.send({ ok: true, isBlocked: user.isBlocked })
  })

  app.post('/users/:id/unblock', async (req, reply) => {
    const { id } = req.params as { id: string }
    const user = await prisma.user.update({
      where: { id },
      data: { isBlocked: false },
    })
    return reply.send({ ok: true, isBlocked: user.isBlocked })
  })

  // Adjust balance
  app.post('/users/:id/balance', async (req, reply) => {
    const { id } = req.params as { id: string }
    const { amount, description } = req.body as { amount: number; description: string }

    await prisma.$transaction([
      prisma.user.update({ where: { id }, data: { balance: { increment: amount } } }),
      prisma.transaction.create({
        data: { userId: id, amount, type: 'BONUS', description: description || 'Admin adjustment' },
      }),
    ])

    const user = await prisma.user.findUnique({ where: { id }, select: { balance: true } })
    return reply.send({ ok: true, balance: user?.balance })
  })

  // ═══ FEED / MODERATION ═══

  app.get('/feed', async (req, reply) => {
    const { page = '1', reported } = req.query as Record<string, string>
    const take = 20
    const skip = (Number(page) - 1) * take

    const where: any = { status: 'DONE' }
    if (reported === 'true') where.reportsCount = { gte: 1 }

    const [items, total] = await Promise.all([
      prisma.generation.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, username: true } },
          _count: { select: { reports: true, likes: true, comments: true } },
        },
      }),
      prisma.generation.count({ where }),
    ])

    return reply.send({
      items: items.map(i => ({
        ...i,
        reportsCount: i._count.reports,
        likesCount: i._count.likes,
        commentsCount: i._count.comments,
        _count: undefined,
      })),
      total,
      pages: Math.ceil(total / take),
    })
  })

  // Hide/show post
  app.post('/feed/:id/hide', async (req, reply) => {
    const { id } = req.params as { id: string }
    await prisma.generation.update({ where: { id }, data: { isPublic: false } })
    return reply.send({ ok: true })
  })

  app.post('/feed/:id/show', async (req, reply) => {
    const { id } = req.params as { id: string }
    await prisma.generation.update({ where: { id }, data: { isPublic: true, reportsCount: 0 } })
    return reply.send({ ok: true })
  })

  // Delete post
  app.delete('/feed/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    await prisma.favorite.deleteMany({ where: { generationId: id } })
    await prisma.like.deleteMany({ where: { generationId: id } })
    await prisma.comment.deleteMany({ where: { generationId: id } })
    await prisma.report.deleteMany({ where: { generationId: id } })
    await prisma.generation.delete({ where: { id } })
    return reply.send({ ok: true })
  })

  // ═══ REPORTS ═══

  app.get('/reports', async (req, reply) => {
    const { page = '1' } = req.query as Record<string, string>
    const take = 20
    const skip = (Number(page) - 1) * take

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        take, skip,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, username: true } },
          generation: { select: { id: true, model: true, prompt: true, resultUrl: true, isPublic: true, reportsCount: true } },
        },
      }),
      prisma.report.count(),
    ])

    return reply.send({ reports, total, pages: Math.ceil(total / take) })
  })

  // ═══ PAYMENTS ═══

  app.get('/payments', async (req, reply) => {
    const { page = '1' } = req.query as Record<string, string>
    const take = 20
    const skip = (Number(page) - 1) * take

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        take, skip,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { firstName: true, username: true } } },
      }),
      prisma.payment.count(),
    ])

    return reply.send({ payments, total, pages: Math.ceil(total / take) })
  })

  // ═══ PROMO CODES ═══

  app.get('/promos', async (_req, reply) => {
    const promos = await prisma.promoCode.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { usages: true } } },
    })
    return reply.send(promos.map(p => ({ ...p, usedCount: p._count.usages, _count: undefined })))
  })

  app.post('/promos', async (req, reply) => {
    const { code, tokens, maxUses, expiresAt } = req.body as {
      code: string; tokens: number; maxUses?: number; expiresAt?: string
    }

    const promo = await prisma.promoCode.create({
      data: {
        code: code.toUpperCase(),
        tokens,
        maxUses: maxUses ?? 0,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: true,
      },
    })
    return reply.send(promo)
  })

  app.post('/promos/:id/toggle', async (req, reply) => {
    const { id } = req.params as { id: string }
    const promo = await prisma.promoCode.findUnique({ where: { id } })
    if (!promo) return reply.code(404).send({ error: 'Not found' })

    const updated = await prisma.promoCode.update({
      where: { id },
      data: { isActive: !promo.isActive },
    })
    return reply.send(updated)
  })

  // ═══ BROADCAST ═══

  app.post('/broadcast', async (req, reply) => {
    const { message } = req.body as { message: string }
    if (!message?.trim()) return reply.code(400).send({ error: 'Message required' })

    const users = await prisma.user.findMany({
      where: { isBlocked: false },
      select: { telegramId: true },
    })

    let sent = 0
    let failed = 0
    const BOT_TOKEN = process.env.BOT_TOKEN

    for (const user of users) {
      try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: user.telegramId.toString(), text: message, parse_mode: 'HTML' }),
        })
        sent++
      } catch {
        failed++
      }
      // Rate limit
      if (sent % 25 === 0) await new Promise(r => setTimeout(r, 1000))
    }

    return reply.send({ sent, failed, total: users.length })
  })
}

function startOfDay(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}
