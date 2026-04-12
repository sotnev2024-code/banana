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

      await prisma.generation.update({
        where: { id: generationId },
        data: { status: 'DONE', resultUrl: result.resultUrl },
      })

      // Notify via bot (publish to Redis pub/sub)
      try {
        await (connection as any).publish?.('generation:done', JSON.stringify({ generationId }))
      } catch {}
    },
    { connection, concurrency: 5 },
  )

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err.message)
  })

  return worker
}
