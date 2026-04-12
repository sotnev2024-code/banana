import { Telegraf, session, Scenes } from 'telegraf'
import { PrismaClient } from '@prisma/client'
import { Redis } from 'ioredis'
import { startHandler } from './handlers/start'
import { generateScene } from './scenes/generate'
import { buyHandler } from './handlers/buy'
import { profileHandler } from './handlers/profile'
import { historyHandler } from './handlers/history'
import { subscribeToResults } from './handlers/results'

export const prisma = new PrismaClient()
export const redis = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null })

const bot = new Telegraf(process.env.BOT_TOKEN!)

const stage = new Scenes.Stage([generateScene])
bot.use(session())
bot.use(stage.middleware())

bot.start(startHandler)
bot.command('buy', buyHandler)
bot.command('balance', profileHandler)
bot.command('history', historyHandler)

// Category buttons from main menu
bot.action('cat:image',  (ctx) => (ctx as any).scene.enter('generate', { type: 'IMAGE' }))
bot.action('cat:video',  (ctx) => (ctx as any).scene.enter('generate', { type: 'VIDEO' }))
bot.action('cat:music',  (ctx) => (ctx as any).scene.enter('generate', { type: 'MUSIC' }))
bot.action('cat:motion', (ctx) => (ctx as any).scene.enter('generate', { type: 'MOTION' }))
bot.action('cat:buy',    buyHandler)
bot.action('cat:profile', profileHandler)

// Subscribe to completed generations via Redis pub/sub
subscribeToResults(bot, redis)

bot.launch({ dropPendingUpdates: true })
console.log('Bot started')

process.once('SIGINT',  () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
