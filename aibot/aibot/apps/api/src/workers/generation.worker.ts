import { Worker, type ConnectionOptions } from 'bullmq'
import { prisma } from '../index'
import { generate, pollTask, getModel } from '@aibot/shared'
import { checkAchievements } from '../achievements'
import { logError } from '../logger'

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
  if (!gen) return
  // Never refund a successfully completed or already-refunded generation.
  // (BullMQ "stalled" false positives can re-trigger failure handlers
  //  AFTER status was already set to DONE — without this guard, the user
  //  gets refunded for a generation they actually received.)
  if (gen.status === 'DONE' || gen.status === 'REFUNDED') return

  // Atomic: only refund if status is still PENDING/PROCESSING/FAILED
  const updated = await prisma.generation.updateMany({
    where: { id: generationId, status: { in: ['PENDING', 'PROCESSING', 'FAILED'] } },
    data: { status: 'REFUNDED' },
  })

  // If no rows updated, someone else already refunded or it's DONE
  if (updated.count === 0) return

  await prisma.$transaction([
    prisma.user.update({ where: { id: gen.userId }, data: { balance: { increment: gen.tokensSpent }, totalSpent: { decrement: gen.tokensSpent } } }),
    prisma.transaction.create({ data: { userId: gen.userId, amount: gen.tokensSpent, type: 'REFUND', description: 'Возврат — ошибка генерации' } }),
  ])

  // Notify source group chat if generation came from there
  if (gen.sourceChatId && process.env.BOT_TOKEN) {
    try {
      await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: gen.sourceChatId,
          text: `❌ Генерация не удалась. ${gen.tokensSpent} 🪙 возвращены.`,
          reply_parameters: gen.sourceMessageId ? { message_id: gen.sourceMessageId, allow_sending_without_reply: true } : undefined,
        }),
      })
    } catch {}
  }
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
        logError('generation.api', err, { generationId, modelId })
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
        const origFilename = `${generationId}${ext}`
        const isImage = ['.jpeg', '.jpg', '.png', '.webp'].includes(ext)
        const isVideo = ['.mp4'].includes(ext)

        execSync(`mkdir -p /opt/banana/uploads/gen/thumb`)
        // Longer timeout for videos (up to 120s for large files)
        const dlTimeout = isVideo ? 120000 : 30000
        execSync(`curl -s -4 -o /opt/banana/uploads/gen/${origFilename} "${result.resultUrl}"`, { timeout: dlTimeout })

        let filename = origFilename

        if (isImage) {
          // Convert images to WebP
          const webpName = `${generationId}.webp`
          execSync(`cwebp -q 85 /opt/banana/uploads/gen/${origFilename} -o /opt/banana/uploads/gen/${webpName} 2>/dev/null || true`, { timeout: 15000 })
          execSync(`cwebp -q 75 -resize 400 0 /opt/banana/uploads/gen/${origFilename} -o /opt/banana/uploads/gen/thumb/${webpName} 2>/dev/null || true`, { timeout: 10000 })
          try { execSync(`test -s /opt/banana/uploads/gen/${webpName}`); filename = webpName } catch { filename = origFilename }
          execSync(`convert /opt/banana/uploads/gen/${origFilename} -resize 400x -quality 80 /opt/banana/uploads/gen/thumb/${origFilename} 2>/dev/null || true`, { timeout: 10000 })
        } else if (isVideo) {
          // Create video thumbnail (first frame as image)
          execSync(`ffmpeg -y -i /opt/banana/uploads/gen/${origFilename} -vframes 1 -vf scale=400:-2 /opt/banana/uploads/gen/thumb/${generationId}.jpg 2>/dev/null || true`, { timeout: 10000 })
        }

        localUrl = `${process.env.API_URL ?? 'https://picpulse.fun'}/uploads/gen/${filename}`
      } catch (e) {
        logError('generation.download', e, { generationId })
      }

      await prisma.generation.update({
        where: { id: generationId },
        data: { status: 'DONE', resultUrl: localUrl },
      })

      // Check achievements
      try {
        const genData = await prisma.generation.findUnique({ where: { id: generationId }, select: { userId: true } })
        if (genData) await checkAchievements(genData.userId)
      } catch {}

      // Auto-post to channel if public
      if (process.env.TG_CHANNEL_ID) {
        try {
          const genForChannel = await prisma.generation.findUnique({ where: { id: generationId }, select: { isPublic: true, type: true, model: true } })
          if (genForChannel?.isPublic) {
            const BOT_TOKEN = process.env.BOT_TOKEN
            const channelId = process.env.TG_CHANNEL_ID
            const caption = `${genForChannel.model.replace(/-/g, ' ')}\n\npicpulse.fun`
            if (genForChannel.type === 'IMAGE') {
              await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: channelId, photo: localUrl, caption }),
              })
            } else if (genForChannel.type === 'VIDEO' || genForChannel.type === 'MOTION') {
              await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendVideo`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: channelId, video: localUrl, caption }),
              })
            }
          }
        } catch {}
      }

      // Send result to user via Telegram
      try {
        const gen = await prisma.generation.findUnique({
          where: { id: generationId },
          include: { user: true },
        })
        if (gen?.user) {
          // If generation originated from a group chat (via /pic), send result there
          if (gen.sourceChatId) {
            console.log(`Sending result to group chat ${gen.sourceChatId} (msg ${gen.sourceMessageId})`)
            await sendResultToGroupChat(gen, localUrl, result.resultUrl)
          } else {
            console.log(`Sending result to user ${gen.user.telegramId}, localUrl=${localUrl}`)
            await sendResultToUser(gen, localUrl, result.resultUrl)
          }
        } else {
          console.log(`No user found for generation ${generationId}`)
        }
      } catch (e) {
        logError('generation.notify', e, { generationId })
      }
    },
    {
      connection,
      concurrency: 5,
      // Generation jobs can take up to 10 min (KIE polling + download + ffmpeg).
      // Default lockDuration is 30s — too short, causes "stalled" false positives
      // which mark the job failed and refund tokens after a successful generation.
      lockDuration: 15 * 60 * 1000,         // 15 min
      lockRenewTime: 5 * 60 * 1000,         // renew every 5 min
      stalledInterval: 60 * 1000,           // check stalled every minute
      maxStalledCount: 0,                   // never re-process a "stalled" job
    },
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

  const caption = `${typeLabel[gen.type] ?? 'Generation'} — ${gen.model.replace(/-/g, ' ')}`

  const inlineKeyboard = JSON.stringify({
    inline_keyboard: [
      [{ text: 'HD', url: originalUrl }],
      [{ text: 'Open in app', web_app: { url: viewUrl } }],
    ],
  })

  const tgApi = `https://api.telegram.org/bot${BOT_TOKEN}`

  let tgRes: any
  if (gen.type === 'IMAGE') {
    tgRes = await fetch(`${tgApi}/sendPhoto`, {
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
    tgRes = await fetch(`${tgApi}/sendVideo`, {
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
    tgRes = await fetch(`${tgApi}/sendAudio`, {
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

  // Log result
  if (tgRes) {
    const body = await tgRes.json().catch(() => ({}))
    if (!body.ok) console.error('Telegram send failed:', JSON.stringify(body))
    else console.log('Telegram send ok')
  }
}

async function sendResultToGroupChat(gen: any, localUrl: string, originalUrl: string) {
  const BOT_TOKEN = process.env.BOT_TOKEN
  if (!BOT_TOKEN || !gen.sourceChatId) return

  const baseUrl = process.env.MINIAPP_URL ?? 'https://picpulse.fun'
  const viewUrl = `${baseUrl}/generation/${gen.id}`

  const byName = gen.user.username ? `@${gen.user.username}` : gen.user.firstName
  const caption = `✨ <b>${gen.model.replace(/-/g, ' ')}</b> — ${byName}\n\n${gen.prompt.slice(0, 300)}`

  const inlineKeyboard = JSON.stringify({
    inline_keyboard: [
      [{ text: 'HD', url: originalUrl }],
      [{ text: 'Open in app', url: viewUrl }],
    ],
  })

  const tgApi = `https://api.telegram.org/bot${BOT_TOKEN}`
  const replyParams = gen.sourceMessageId
    ? { reply_parameters: { message_id: gen.sourceMessageId, allow_sending_without_reply: true } }
    : {}

  let tgRes: any
  if (gen.type === 'IMAGE') {
    tgRes = await fetch(`${tgApi}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: gen.sourceChatId,
        photo: localUrl,
        caption,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard,
        ...replyParams,
      }),
    })
  } else if (gen.type === 'VIDEO' || gen.type === 'MOTION') {
    tgRes = await fetch(`${tgApi}/sendVideo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: gen.sourceChatId,
        video: localUrl,
        caption,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard,
        ...replyParams,
      }),
    })
  } else if (gen.type === 'MUSIC') {
    tgRes = await fetch(`${tgApi}/sendAudio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: gen.sourceChatId,
        audio: localUrl,
        caption,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard,
        ...replyParams,
      }),
    })
  }

  if (tgRes) {
    const body = await tgRes.json().catch(() => ({}))
    if (!body.ok) console.error('Group chat send failed:', JSON.stringify(body))
    else console.log('Group chat send ok')
  }
}
