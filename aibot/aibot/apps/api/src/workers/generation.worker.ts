import { Worker, type ConnectionOptions } from 'bullmq'
import { prisma } from '../index'
import { generateImage, generateVideo, generateMusic, pollTask, getModel } from '@aibot/shared'

const POLL_INTERVAL = 5000   // 5 sec
const MAX_POLL_TIME = 600000 // 10 min timeout

async function waitForResult(taskId: string): Promise<{ resultUrl: string } | null> {
  const deadline = Date.now() + MAX_POLL_TIME
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, POLL_INTERVAL))
    const result = await pollTask(taskId)
    if (result.status === 'DONE' && result.resultUrl) return { resultUrl: result.resultUrl }
    if (result.status === 'FAILED') return null
  }
  return null // timeout
}

async function refundTokens(generationId: string) {
  const gen = await prisma.generation.findUnique({ where: { id: generationId } })
  if (!gen || gen.status === 'REFUNDED') return
  await prisma.$transaction([
    prisma.generation.update({ where: { id: generationId }, data: { status: 'REFUNDED' } }),
    prisma.user.update({ where: { id: gen.userId }, data: { balance: { increment: gen.tokensSpent }, totalSpent: { decrement: gen.tokensSpent } } }),
    prisma.transaction.create({ data: { userId: gen.userId, amount: gen.tokensSpent, type: 'REFUND', description: 'Возврат — ошибка генерации' } }),
  ])
}

export function startGenerationWorker(connection: ConnectionOptions) {
  const worker = new Worker(
    'generations',
    async (job) => {
      const { generationId, modelId, prompt, imageUrl } = job.data
      const model = getModel(modelId)
      if (!model) throw new Error(`Unknown model: ${modelId}`)

      await prisma.generation.update({ where: { id: generationId }, data: { status: 'PROCESSING' } })

      let taskId: string
      try {
        if (model.type === 'IMAGE' || model.type === 'MOTION') {
          taskId = await (model.type === 'MOTION'
            ? generateVideo(prompt, modelId, imageUrl)
            : generateImage(prompt, modelId, imageUrl))
        } else if (model.type === 'VIDEO') {
          taskId = await generateVideo(prompt, modelId, imageUrl)
        } else {
          taskId = await generateMusic(prompt, modelId)
        }
      } catch (err) {
        await prisma.generation.update({ where: { id: generationId }, data: { status: 'FAILED', errorMsg: String(err) } })
        await refundTokens(generationId)
        throw err
      }

      await prisma.generation.update({ where: { id: generationId }, data: { kieTaskId: taskId } })

      const result = await waitForResult(taskId)
      if (!result) {
        await prisma.generation.update({ where: { id: generationId }, data: { status: 'FAILED', errorMsg: 'Timeout or upstream error' } })
        await refundTokens(generationId)
        return
      }

      await prisma.generation.update({
        where: { id: generationId },
        data: { status: 'DONE', resultUrl: result.resultUrl },
      })

      // Notify via bot (publish to Redis pub/sub)
      await (connection as any).publish?.('generation:done', JSON.stringify({ generationId }))
    },
    { connection, concurrency: 5 },
  )

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err.message)
  })

  return worker
}
