import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import { PrismaClient } from '@prisma/client'
import { Redis } from 'ioredis'

import { authRoutes } from './routes/auth'
import { feedRoutes } from './routes/feed'
import { generateRoutes } from './routes/generate'
import { paymentRoutes } from './routes/payment'
import { plansRoutes, profileRoutes } from './routes/profile'
import { startGenerationWorker } from './workers/generation.worker'

export const prisma = new PrismaClient()
export const redis = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null })

async function main() {
  const app = Fastify({ logger: { level: 'info' } })

  await app.register(cors, {
    origin: [process.env.MINIAPP_URL!, 'https://web.telegram.org'],
    credentials: true,
  })

  await app.register(jwt, { secret: process.env.JWT_SECRET! })

  // Auth decorator
  app.decorate('authenticate', async (request: any, reply: any) => {
    try {
      await request.jwtVerify()
    } catch {
      reply.code(401).send({ error: 'Unauthorized' })
    }
  })

  // Routes
  app.register(authRoutes,    { prefix: '/auth' })
  app.register(feedRoutes,    { prefix: '/feed' })
  app.register(generateRoutes,{ prefix: '/generate' })
  app.register(plansRoutes,   { prefix: '/plans' })
  app.register(paymentRoutes, { prefix: '/payment' })
  app.register(profileRoutes, { prefix: '/me' })

  app.get('/health', async () => ({ ok: true }))

  // Start BullMQ worker
  startGenerationWorker(redis)

  const port = Number(process.env.PORT ?? 3001)
  await app.listen({ port, host: '0.0.0.0' })
  console.log(`API running on :${port}`)
}

main()
