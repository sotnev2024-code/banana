import type { FastifyInstance } from 'fastify'
import { prisma } from '../index'

export async function ideasRoutes(app: FastifyInstance) {
  // GET /ideas/categories — public list (only categories that have at least 1 enabled idea)
  app.get('/categories', async (_req, reply) => {
    const cats = await prisma.ideaCategory.findMany({
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
      include: { _count: { select: { ideas: { where: { enabled: true } } } } },
    })
    return reply.send(cats)
  })

  // GET /ideas?categoryId=xxx — enabled ideas, newest first
  app.get('/', async (req, reply) => {
    const { categoryId } = req.query as { categoryId?: string }
    const ideas = await prisma.idea.findMany({
      where: { enabled: true, ...(categoryId ? { categoryId } : {}) },
      orderBy: { createdAt: 'desc' },
    })
    return reply.send(ideas)
  })
}
