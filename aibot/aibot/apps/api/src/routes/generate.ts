import type { FastifyInstance } from 'fastify'
import { Queue } from 'bullmq'
import { prisma, redis } from '../index'
import { getModel } from '@aibot/shared'

export const generationQueue = new Queue('generations', { connection: redis })

export async function generateRoutes(app: FastifyInstance) {
  // POST /generate
  app.post('/', { onRequest: [(app as any).authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: string }
    const { model: modelId, prompt, imageUrl, isPublic = true } = req.body as {
      model: string
      prompt: string
      imageUrl?: string
      isPublic?: boolean
    }

    if (!prompt?.trim()) return reply.code(400).send({ error: 'prompt required' })

    const model = getModel(modelId)
    if (!model) return reply.code(400).send({ error: 'Unknown model' })

    // Check balance
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
    if (user.balance < model.tokensPerGeneration) {
      return reply.code(402).send({
        error: 'Insufficient tokens',
        required: model.tokensPerGeneration,
        balance: user.balance,
      })
    }

    // Deduct tokens immediately (refund if fails)
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { balance: { decrement: model.tokensPerGeneration }, totalSpent: { increment: model.tokensPerGeneration } },
      }),
      prisma.transaction.create({
        data: {
          userId,
          amount: -model.tokensPerGeneration,
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
        tokensSpent: model.tokensPerGeneration,
        isPublic,
      },
    })

    // Enqueue task
    await generationQueue.add('generate', { generationId: generation.id, modelId, prompt, imageUrl }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
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
}
