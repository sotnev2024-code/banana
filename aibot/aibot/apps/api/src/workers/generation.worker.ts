import { Worker, type ConnectionOptions } from 'bullmq'
import { prisma } from '../index'
import { generate, pollTask, getModel } from '@aibot/shared'

const POLL_INTERVAL = 5000   // 5 sec
const MAX_POLL_TIME = 600000 // 10 min timeout

async function waitForResult(taskId: string): Promise<{ resultUrl: string } | null> {
  const deadline = Date.now() + MAX_POLL_TIME
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, POLL_INTERVAL))
    try {
      const result = await pollTask(taskId)
      if (result.status === 'DONE' && result.resultUrl) return { resultUrl: result.resultUrl }
      if (result.status === 'FAILED') return null
    } catch {
      // poll error, retry
    }
  }
  return null // timeout
}

async function refundTokens(generationId: string) {
  const gen = await prisma.generation.findUnique({ where: { id: generationId } })
  if (!gen || gen.status === 'REFUNDED') return

  // Atomic: only refund if status is not already REFUNDED
  const updated = await prisma.generation.updateMany({
    where: { id: generationId, status: { not: 'REFUNDED' } },
    data: { status: 'REFUNDED' },
  })

  // If no rows updated, someone else already refunded
  if (updated.count === 0) return

  await prisma.$transaction([
    prisma.user.update({ where: { id: gen.userId }, data: { balance: { increment: gen.tokensSpent }, totalSpent: { decrement: gen.tokensSpent } } }),
    prisma.transaction.create({ data: { userId: gen.userId, amount: gen.tokensSpent, type: 'REFUND', description: 'Возврат — ошибка генерации' } }),
  ])
}

export function startGenerationWorker(connection: ConnectionOptions) {
  const worker = new Worker(
    'generations',
    async (job) => {
      const { generationId, modelId, prompt, imageUrl, settings = {} } = job.data
      const model = getModel(modelId)
      if (!model) {
        await refundTokens(generationId)
        return
      }

      await prisma.generation.update({ where: { id: generationId }, data: { status: 'PROCESSING' } })

      console.log(`Generation ${generationId}: model=${modelId}, settings=${JSON.stringify(settings)}`)

      let taskId: string
      try {
        taskId = await generate(modelId, prompt, imageUrl, settings)
      } catch (err) {
        console.error(`Generation ${generationId} API error:`, err)
        await prisma.generation.update({ where: { id: generationId }, data: { status: 'FAILED', errorMsg: String(err) } })
        await refundTokens(generationId)
        return // don't throw — no retry
      }

      await prisma.generation.update({ where: { id: generationId }, data: { kieTaskId: taskId } })

      const result = await waitForResult(taskId)
      if (!result) {
        await prisma.generation.update({ where: { id: generationId }, data: { status: 'FAILED', errorMsg: 'Timeout or upstream error' } })
        await refundTokens(generationId)
        return
      }

      // Download result to local server for fast delivery
      let localUrl = result.resultUrl
      try {
        const { execSync } = require('child_process')
        const ext = result.resultUrl.match(/\.(jpeg|jpg|png|webp|mp4|mp3|wav)/)?.[0] ?? '.bin'
        const filename = `${generationId}${ext}`
        execSync(`mkdir -p /opt/banana/uploads/gen/thumb`)
        execSync(`curl -s -4 -o /opt/banana/uploads/gen/${filename} "${result.resultUrl}"`, { timeout: 30000 })
        // Create thumbnail for images
        if (['.jpeg', '.jpg', '.png', '.webp'].includes(ext)) {
          execSync(`convert /opt/banana/uploads/gen/${filename} -resize 400x -quality 80 /opt/banana/uploads/gen/thumb/${filename} 2>/dev/null || true`, { timeout: 10000 })
        }
        localUrl = `${process.env.API_URL ?? 'https://picpulse.fun'}/uploads/gen/${filename}`
      } catch (e) {
        console.error('Failed to download result locally:', e)
      }

      await prisma.generation.update({
        where: { id: generationId },
        data: { status: 'DONE', resultUrl: localUrl },
      })

      // Send result to user via Telegram
      try {
        const gen = await prisma.generation.findUnique({
          where: { id: generationId },
          include: { user: true },
        })
        if (gen?.user) {
          await sendResultToUser(gen, localUrl, result.resultUrl)
        }
      } catch (e) {
        console.error('Failed to notify user:', e)
      }
    },
    { connection, concurrency: 5 },
  )

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err.message)
  })

  return worker
}

async function sendResultToUser(gen: any, localUrl: string, originalUrl: string) {
  const BOT_TOKEN = process.env.BOT_TOKEN
  if (!BOT_TOKEN) return

  const chatId = gen.user.telegramId.toString()
  const baseUrl = process.env.MINIAPP_URL ?? 'https://picpulse.fun'
  const viewUrl = `${baseUrl}/generation/${gen.id}`

  const typeLabel: Record<string, string> = {
    IMAGE: 'Image', VIDEO: 'Video', MUSIC: 'Music', MOTION: 'Motion',
  }

  const caption = `${typeLabel[gen.type] ?? 'Generation'} — ${gen.model.replace(/-/g, ' ')}\n\n${gen.prompt.slice(0, 200)}`

  const inlineKeyboard = JSON.stringify({
    inline_keyboard: [
      [{ text: 'HD', url: originalUrl }],
      [{ text: 'Open in app', web_app: { url: viewUrl } }],
    ],
  })

  const tgApi = `https://api.telegram.org/bot${BOT_TOKEN}`

  if (gen.type === 'IMAGE') {
    await fetch(`${tgApi}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        photo: localUrl,
        caption,
        reply_markup: inlineKeyboard,
      }),
    })
  } else if (gen.type === 'VIDEO' || gen.type === 'MOTION') {
    await fetch(`${tgApi}/sendVideo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        video: localUrl,
        caption,
        reply_markup: inlineKeyboard,
      }),
    })
  } else if (gen.type === 'MUSIC') {
    await fetch(`${tgApi}/sendAudio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        audio: localUrl,
        caption,
        reply_markup: inlineKeyboard,
      }),
    })
  }
}
