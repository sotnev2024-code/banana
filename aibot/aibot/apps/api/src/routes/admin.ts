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

  // ═══ LOGS ═══

  app.get('/logs/errors', async (req, reply) => {
    const { lines = '50' } = req.query as Record<string, string>
    try {
      const { readFileSync } = require('fs')
      const content = readFileSync('/opt/banana/logs/errors.log', 'utf8')
      const allLines = content.trim().split('\n').filter(Boolean)
      const last = allLines.slice(-Number(lines))
      return reply.send(last.map((l: string) => { try { return JSON.parse(l) } catch { return { raw: l } } }))
    } catch {
      return reply.send([])
    }
  })

  app.get('/logs/api', async (req, reply) => {
    const { lines = '50' } = req.query as Record<string, string>
    try {
      const { readFileSync } = require('fs')
      const content = readFileSync('/opt/banana/logs/api.log', 'utf8')
      const allLines = content.trim().split('\n').filter(Boolean)
      const last = allLines.slice(-Number(lines))
      return reply.send(last.map((l: string) => { try { return JSON.parse(l) } catch { return { raw: l } } }))
    } catch {
      return reply.send([])
    }
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

  // ═══ FEATURED BLOCKS ═══

  app.get('/featured', async (_req, reply) => {
    const blocks = await prisma.featuredBlock.findMany({
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    })
    return reply.send(blocks)
  })

  app.post('/featured', async (req, reply) => {
    const body = req.body as Partial<FeaturedBlockBody>
    const last = await prisma.featuredBlock.findFirst({ orderBy: { position: 'desc' } })
    const position = (last?.position ?? -1) + 1
    const block = await prisma.featuredBlock.create({
      data: {
        position,
        mediaUrl: body.mediaUrl ?? null,
        mediaType: body.mediaType ?? 'image',
        badge: body.badge ?? null,
        titleRu: body.titleRu ?? null,
        titleEn: body.titleEn ?? null,
        descriptionRu: body.descriptionRu ?? null,
        descriptionEn: body.descriptionEn ?? null,
        modelId: body.modelId ?? null,
        externalUrl: body.externalUrl ?? null,
        enabled: body.enabled ?? true,
      },
    })
    return reply.send(block)
  })

  app.put('/featured/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = req.body as Partial<FeaturedBlockBody>
    const block = await prisma.featuredBlock.update({
      where: { id },
      data: {
        ...(body.mediaUrl !== undefined && { mediaUrl: body.mediaUrl }),
        ...(body.mediaType !== undefined && { mediaType: body.mediaType }),
        ...(body.badge !== undefined && { badge: body.badge }),
        ...(body.titleRu !== undefined && { titleRu: body.titleRu }),
        ...(body.titleEn !== undefined && { titleEn: body.titleEn }),
        ...(body.descriptionRu !== undefined && { descriptionRu: body.descriptionRu }),
        ...(body.descriptionEn !== undefined && { descriptionEn: body.descriptionEn }),
        ...(body.modelId !== undefined && { modelId: body.modelId }),
        ...(body.externalUrl !== undefined && { externalUrl: body.externalUrl }),
        ...(body.enabled !== undefined && { enabled: body.enabled }),
        ...(body.position !== undefined && { position: body.position }),
      },
    })
    return reply.send(block)
  })

  app.delete('/featured/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    await prisma.featuredBlock.delete({ where: { id } })
    return reply.send({ ok: true })
  })

  // POST /admin/featured/seed — create the 8 default blocks if list is empty
  app.post('/featured/seed', async (_req, reply) => {
    const existing = await prisma.featuredBlock.count()
    if (existing > 0) {
      return reply.code(400).send({ error: 'Список не пуст. Удали существующие блоки перед сидингом.' })
    }
    const defaults = [
      { id: 'nano-banana-pro', badge: 'NEW', title: 'Nano Banana Pro', desc: 'Google Imagen — быстро, до 4K' },
      { id: 'veo3-fast',       badge: 'HOT', title: 'Veo 3.1 Fast',    desc: 'Google Veo — быстрый, 1080p + аудио' },
      { id: 'kling-3-0',       badge: null,  title: 'Kling 3.0',       desc: 'Мультишот, элементы, до 15 сек' },
      { id: 'seedance-2',      badge: null,  title: 'Seedance 2.0',    desc: 'ByteDance — аудио, 4-15 сек' },
      { id: 'nano-banana-2',   badge: null,  title: 'Nano Banana 2',   desc: 'Дешевая генерация, до 14 референсов' },
      { id: 'suno-v5-5',       badge: 'PRO', title: 'Suno V5.5',       desc: 'Топовая версия, до 8 минут' },
      { id: 'kling-3-0-motion',badge: null,  title: 'Kling 3.0 Motion',desc: 'Motion control v3, фото+видео' },
      { id: 'grok-image-to-video', badge: null, title: 'Grok Animate', desc: 'xAI — анимация фото, до 30 сек' },
    ]
    await prisma.featuredBlock.createMany({
      data: defaults.map((d, i) => ({
        position: i,
        mediaUrl: null,
        mediaType: 'image',
        badge: d.badge,
        titleRu: d.title,
        titleEn: d.title,
        descriptionRu: d.desc,
        descriptionEn: d.desc,
        modelId: d.id,
        externalUrl: null,
        enabled: true,
      })),
    })
    const blocks = await prisma.featuredBlock.findMany({
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    })
    return reply.send(blocks)
  })

  // ═══ MODEL PREVIEWS ═══

  app.get('/model-previews', async (_req, reply) => {
    const previews = await prisma.modelPreview.findMany()
    return reply.send(previews)
  })

  app.put('/model-previews/:modelId', async (req, reply) => {
    const { modelId } = req.params as { modelId: string }
    const body = req.body as { mediaUrl?: string | null; mediaType?: 'image' | 'video'; hidden?: boolean }
    const preview = await prisma.modelPreview.upsert({
      where: { modelId },
      create: {
        modelId,
        mediaUrl: body.mediaUrl ?? null,
        mediaType: body.mediaType ?? 'image',
        hidden: body.hidden ?? false,
      },
      update: {
        ...(body.mediaUrl !== undefined && { mediaUrl: body.mediaUrl }),
        ...(body.mediaType !== undefined && { mediaType: body.mediaType }),
        ...(body.hidden !== undefined && { hidden: body.hidden }),
      },
    })
    return reply.send(preview)
  })

  app.delete('/model-previews/:modelId', async (req, reply) => {
    const { modelId } = req.params as { modelId: string }
    await prisma.modelPreview.deleteMany({ where: { modelId } })
    return reply.send({ ok: true })
  })

  // ═══ MEDIA UPLOAD (with compression) ═══

  // POST /admin/upload-media — accepts image or video, compresses, stores in /uploads/featured/
  app.post('/upload-media', async (req, reply) => {
    const data = await (req as any).file()
    if (!data) return reply.code(400).send({ error: 'No file' })
    const mime = (data.mimetype as string | undefined) ?? ''
    const isImage = mime.startsWith('image/')
    const isVideo = mime.startsWith('video/')
    if (!isImage && !isVideo) return reply.code(400).send({ error: 'Only image or video' })

    const { execSync } = require('child_process')
    const fs = require('fs')
    const crypto = require('crypto')
    const baseId = crypto.randomBytes(8).toString('hex')

    const featuredDir = '/opt/banana/uploads/featured'
    execSync(`mkdir -p ${featuredDir}`)

    if (isImage) {
      // Save raw → convert to WebP (max width 800)
      const tmpPath = `${featuredDir}/_tmp_${baseId}.bin`
      const finalName = `${baseId}.webp`
      const finalPath = `${featuredDir}/${finalName}`
      const ws = fs.createWriteStream(tmpPath)
      await new Promise<void>((resolve, reject) => {
        data.file.pipe(ws)
        ws.on('finish', () => resolve())
        ws.on('error', reject)
      })
      try {
        execSync(`cwebp -q 80 -resize 800 0 ${tmpPath} -o ${finalPath} 2>/dev/null`, { timeout: 20000 })
        fs.unlinkSync(tmpPath)
        const url = `${process.env.API_URL ?? 'https://picpulse.fun'}/uploads/featured/${finalName}`
        return reply.send({ url, mediaType: 'image' as const })
      } catch (e) {
        try { fs.unlinkSync(tmpPath) } catch {}
        return reply.code(500).send({ error: 'Image compression failed' })
      }
    }

    // Video: save → ffmpeg compress to 720p, mp4, ~1Mbps
    const tmpPath = `${featuredDir}/_tmp_${baseId}.bin`
    const finalName = `${baseId}.mp4`
    const finalPath = `${featuredDir}/${finalName}`
    const ws = fs.createWriteStream(tmpPath)
    await new Promise<void>((resolve, reject) => {
      data.file.pipe(ws)
      ws.on('finish', () => resolve())
      ws.on('error', reject)
    })
    try {
      execSync(
        `ffmpeg -y -i ${tmpPath} -vf "scale='min(720,iw)':-2" -c:v libx264 -preset veryfast -crf 28 -movflags +faststart -an -t 30 ${finalPath} 2>/dev/null`,
        { timeout: 60000 },
      )
      fs.unlinkSync(tmpPath)
      const url = `${process.env.API_URL ?? 'https://picpulse.fun'}/uploads/featured/${finalName}`
      return reply.send({ url, mediaType: 'video' as const })
    } catch (e) {
      try { fs.unlinkSync(tmpPath) } catch {}
      return reply.code(500).send({ error: 'Video compression failed' })
    }
  })
}

interface FeaturedBlockBody {
  position: number
  mediaUrl: string | null
  mediaType: 'image' | 'video'
  badge: string | null
  titleRu: string | null
  titleEn: string | null
  descriptionRu: string | null
  descriptionEn: string | null
  modelId: string | null
  externalUrl: string | null
  enabled: boolean
}

function startOfDay(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}
