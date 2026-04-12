import type { Telegraf } from 'telegraf'
import type { Redis } from 'ioredis'
import { prisma } from '../index'

export function subscribeToResults(bot: Telegraf<any>, redis: Redis) {
  const subscriber = redis.duplicate()

  subscriber.subscribe('generation:done', (err) => {
    if (err) console.error('Redis subscribe error:', err)
  })

  subscriber.on('message', async (_channel, message) => {
    try {
      const { generationId } = JSON.parse(message)
      const gen = await prisma.generation.findUnique({
        where: { id: generationId },
        include: { user: true },
      })
      if (!gen || !gen.resultUrl) return

      const telegramId = gen.user.telegramId.toString()
      const typeLabel: Record<string, string> = {
        IMAGE: '🖼 Изображение',
        VIDEO: '🎬 Видео',
        MUSIC: '🎵 Музыка',
        MOTION: '🎥 Motion',
      }

      const caption = `✅ <b>${typeLabel[gen.type] ?? 'Генерация'} готова!</b>\n\n📝 ${gen.prompt.slice(0, 200)}`

      if (gen.type === 'IMAGE') {
        await bot.telegram.sendPhoto(telegramId, gen.resultUrl, {
          caption,
          parse_mode: 'HTML',
        })
      } else if (gen.type === 'VIDEO' || gen.type === 'MOTION') {
        await bot.telegram.sendVideo(telegramId, gen.resultUrl, {
          caption,
          parse_mode: 'HTML',
        })
      } else if (gen.type === 'MUSIC') {
        await bot.telegram.sendAudio(telegramId, gen.resultUrl, {
          caption,
          parse_mode: 'HTML',
        })
      }
    } catch (err) {
      console.error('Result notify error:', err)
    }
  })
}
