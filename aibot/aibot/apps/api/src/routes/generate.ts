import type { FastifyInstance } from 'fastify'
import { Queue } from 'bullmq'
import { prisma, redis } from '../index'
import { getModel, calculatePrice } from '@aibot/shared'
import { moderatePrompt } from '../moderation'

export const generationQueue = new Queue('generations', { connection: redis })

export async function generateRoutes(app: FastifyInstance) {
  // POST /generate
  app.post('/', { onRequest: [(app as any).authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: string }
    const { model: modelId, prompt, imageUrl, isPublic = true, settings = {} } = req.body as {
      model: string
      prompt: string
      imageUrl?: string
      isPublic?: boolean
      settings?: Record<string, string | number | boolean>
    }

    if (!prompt?.trim()) return reply.code(400).send({ error: 'prompt required' })

    // Moderation check
    const moderation = await moderatePrompt(prompt)
    if (!moderation.allowed) {
      return reply.code(403).send({ error: moderation.reason ?? 'Content not allowed' })
    }

    const model = getModel(modelId)
    if (!model) return reply.code(400).send({ error: 'Unknown model' })

    // Calculate dynamic price based on settings
    const price = calculatePrice(modelId, settings)

    // Check balance
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
    if (user.balance < price) {
      return reply.code(402).send({
        error: 'Insufficient tokens',
        required: price,
        balance: user.balance,
      })
    }

    // Deduct tokens immediately (refund if fails)
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { balance: { decrement: price }, totalSpent: { increment: price } },
      }),
      prisma.transaction.create({
        data: {
          userId,
          amount: -price,
          type: 'SPEND',
          description: `Генерация ${model.name}`,
        },
      }),
    ])

    // Create generation record
    const generation = await prisma.generation.create({
      data: {
        userId,
        type: model.type,
        model: modelId,
        prompt: prompt.trim(),
        imageUrl: imageUrl ?? null,
        status: 'PENDING',
        tokensSpent: price,
        isPublic,
      },
    })

    // Enqueue task
    await generationQueue.add('generate', { generationId: generation.id, modelId, prompt, imageUrl, settings }, {
      attempts: 1,
    })

    return reply.code(202).send({ id: generation.id, status: 'PENDING' })
  })

  // GET /generate/:id — poll status
  app.get('/:id', { onRequest: [(app as any).authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: string }
    const { id } = req.params as { id: string }

    const gen = await prisma.generation.findFirst({
      where: { id, userId },
      select: { id: true, status: true, resultUrl: true, type: true, model: true, prompt: true, createdAt: true, tokensSpent: true },
    })
    if (!gen) return reply.code(404).send({ error: 'Not found' })

    return reply.send(gen)
  })

  // DELETE /generate/:id — delete own generation
  app.delete('/:id', { onRequest: [(app as any).authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: string }
    const { id } = req.params as { id: string }

    const gen = await prisma.generation.findFirst({ where: { id, userId } })
    if (!gen) return reply.code(404).send({ error: 'Not found' })

    await prisma.favorite.deleteMany({ where: { generationId: id } })
    await prisma.like.deleteMany({ where: { generationId: id } })
    await prisma.comment.deleteMany({ where: { generationId: id } })
    await prisma.report.deleteMany({ where: { generationId: id } })
    await prisma.generation.delete({ where: { id } })

    return reply.send({ ok: true })
  })
}
