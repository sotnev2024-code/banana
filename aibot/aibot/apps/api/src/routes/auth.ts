import type { FastifyInstance } from 'fastify'
import crypto from 'crypto'
import { prisma } from '../index'
import { WELCOME_BONUS } from '@aibot/shared'

function verifyTelegramInitData(initData: string, botToken: string): Record<string, string> | null {
  const params = new URLSearchParams(initData)
  const hash = params.get('hash')
  if (!hash) return null

  params.delete('hash')
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n')

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest()
  const expectedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex')

  if (expectedHash !== hash) return null

  const result: Record<string, string> = {}
  for (const [k, v] of params.entries()) result[k] = v
  return result
}

export async function authRoutes(app: FastifyInstance) {
  // POST /auth/telegram — called by Mini App on launch
  app.post('/telegram', async (req, reply) => {
    const { initData } = req.body as { initData: string }
    if (!initData) return reply.code(400).send({ error: 'initData required' })

    const parsed = verifyTelegramInitData(initData, process.env.BOT_TOKEN!)
    if (!parsed) return reply.code(401).send({ error: 'Invalid initData' })

    let userData: Record<string, string>
    try {
      userData = JSON.parse(parsed.user)
    } catch {
      return reply.code(400).send({ error: 'Invalid user data' })
    }

    const telegramId = BigInt(userData.id)
    const isNew = !(await prisma.user.findUnique({ where: { telegramId } }))

    const user = await prisma.user.upsert({
      where: { telegramId },
      update: {
        firstName: userData.first_name,
        lastName: userData.last_name ?? null,
        username: userData.username ?? null,
        photoUrl: userData.photo_url ?? null,
      },
      create: {
        telegramId,
        firstName: userData.first_name,
        lastName: userData.last_name ?? null,
        username: userData.username ?? null,
        photoUrl: userData.photo_url ?? null,
        balance: WELCOME_BONUS,
      },
    })

    if (isNew) {
      await prisma.transaction.create({
        data: {
          userId: user.id,
          amount: WELCOME_BONUS,
          type: 'BONUS',
          description: 'Приветственный бонус',
        },
      })
    }

    const token = app.jwt.sign({ userId: user.id, telegramId: user.telegramId.toString() })
    return reply.send({ token, user: sanitizeUser(user), isNew })
  })
}

export function sanitizeUser(user: any) {
  return {
    id: user.id,
    telegramId: user.telegramId.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    photoUrl: user.photoUrl,
    balance: user.balance,
    totalSpent: user.totalSpent ?? 0,
    referralCode: user.referralCode,
    dailyStreak: user.dailyStreak ?? 0,
    lastDailyAt: user.lastDailyAt?.toISOString() ?? null,
    lang: user.lang ?? 'ru',
    theme: user.theme ?? 'auto',
    minDonate: user.minDonate ?? 1,
    createdAt: user.createdAt?.toISOString(),
  }
}
