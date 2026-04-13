import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import { PrismaClient } from '@prisma/client'
import { Redis } from 'ioredis'

import multipart from '@fastify/multipart'
import { authRoutes } from './routes/auth'
import { feedRoutes } from './routes/feed'
import { generateRoutes } from './routes/generate'
import { paymentRoutes } from './routes/payment'
import { plansRoutes, profileRoutes } from './routes/profile'
import { uploadRoutes } from './routes/upload'
import { usersRoutes } from './routes/users'
import { adminRoutes } from './routes/admin'
import { logError, logApi } from './logger'
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
  await app.register(multipart, { limits: { fileSize: 30 * 1024 * 1024 } })

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
  app.register(uploadRoutes,  { prefix: '/upload' })
  app.register(usersRoutes,   { prefix: '/users' })
  app.register(adminRoutes,   { prefix: '/admin' })

  // Global error handler
  app.setErrorHandler((error, req, reply) => {
    logError('api', error, { method: req.method, url: req.url })
    reply.code(error.statusCode ?? 500).send({ error: error.message })
  })

  // Request logging
  app.addHook('onResponse', (req, reply, done) => {
    const userId = (req.user as any)?.userId
    logApi(req.method, req.url, reply.statusCode, reply.elapsedTime, userId)
    done()
  })

  app.get('/health', async () => ({ ok: true }))

  // Start BullMQ worker
  startGenerationWorker(redis)

  const port = Number(process.env.PORT ?? 3001)
  await app.listen({ port, host: '0.0.0.0' })
  console.log(`API running on :${port}`)
}

main()
