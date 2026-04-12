import type { FastifyInstance } from 'fastify'
import crypto from 'crypto'
import { prisma } from '../index'
import { getPlan } from '@aibot/shared'

const YUKASSA_API = 'https://api.yookassa.ru/v3'

export async function paymentRoutes(app: FastifyInstance) {
  // POST /payment/yukassa/create
  app.post('/yukassa/create', { onRequest: [(app as any).authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: string }
    const { planId } = req.body as { planId: string }

    const plan = getPlan(planId)
    if (!plan) return reply.code(400).send({ error: 'Unknown plan' })

    const idempotenceKey = crypto.randomUUID()

    const payment = await prisma.payment.create({
      data: {
        userId,
        amount: plan.priceRub,
        currency: 'RUB',
        provider: 'YUKASSA',
        status: 'PENDING',
        tokensGranted: plan.tokens + plan.bonusTokens,
        metadata: { planId },
      },
    })

    const ykRes = await fetch(`${YUKASSA_API}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotence-Key': idempotenceKey,
        Authorization: `Basic ${Buffer.from(`${process.env.YUKASSA_SHOP_ID}:${process.env.YUKASSA_SECRET_KEY}`).toString('base64')}`,
      },
      body: JSON.stringify({
        amount: { value: plan.priceRub.toFixed(2), currency: 'RUB' },
        payment_method_data: { type: 'bank_card' },
        confirmation: {
          type: 'redirect',
          return_url: `${process.env.MINIAPP_URL}/payment/success`,
        },
        description: `${plan.name} — ${plan.tokens + plan.bonusTokens} токенов`,
        metadata: { paymentId: payment.id },
        capture: true,
      }),
    })

    if (!ykRes.ok) {
      const err = await ykRes.text()
      return reply.code(500).send({ error: 'YuKassa error', details: err })
    }

    const ykData = await ykRes.json()

    await prisma.payment.update({
      where: { id: payment.id },
      data: { externalId: ykData.id },
    })

    return reply.send({
      paymentId: payment.id,
      confirmationUrl: ykData.confirmation.confirmation_url,
    })
  })

  // POST /payment/yukassa/webhook — called by YuKassa
  app.post('/yukassa/webhook', async (req, reply) => {
    // Verify webhook IP (YuKassa sends from specific IPs — add middleware in production)
    const body = req.body as Record<string, unknown>
    const event = body.event as string
    const obj = body.object as Record<string, unknown>

    if (event !== 'payment.succeeded') return reply.send({ ok: true })

    const externalId = obj.id as string
    const metadata = obj.metadata as Record<string, string>

    const payment = await prisma.payment.findUnique({ where: { externalId } })
    if (!payment || payment.status === 'SUCCEEDED') return reply.send({ ok: true })

    await prisma.$transaction([
      prisma.payment.update({ where: { id: payment.id }, data: { status: 'SUCCEEDED' } }),
      prisma.user.update({ where: { id: payment.userId }, data: { balance: { increment: payment.tokensGranted } } }),
      prisma.transaction.create({
        data: {
          userId: payment.userId,
          amount: payment.tokensGranted,
          type: 'PURCHASE',
          description: `Пополнение через ЮKassa — ${payment.tokensGranted} токенов`,
        },
      }),
    ])

    // Notify user via bot
    const user = await prisma.user.findUnique({ where: { id: payment.userId } })
    if (user) {
      await notifyUser(user.telegramId.toString(), payment.tokensGranted)
    }

    return reply.send({ ok: true })
  })
}

async function notifyUser(telegramId: string, tokens: number) {
  try {
    await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: telegramId,
        text: `✅ Оплата прошла успешно!\n\nНачислено: +${tokens} токенов 🪙\nПриятного использования!`,
        parse_mode: 'HTML',
      }),
    })
  } catch (e) {
    console.error('Failed to notify user:', e)
  }
}
