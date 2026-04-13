import { Telegraf, session, Scenes } from 'telegraf'
import type { SceneContext } from 'telegraf/scenes'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { PrismaClient } from '@prisma/client'
import { Redis } from 'ioredis'
import { startHandler, langSelectHandler } from './handlers/start'
import { generateScene } from './scenes/generate'
import { buyHandler, profileHandler, historyHandler } from './handlers/buy'
import { subscribeToResults } from './handlers/results'

export const prisma = new PrismaClient()
export const redis = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null })

const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY
const telegrafOptions: any = {}
if (proxyUrl) {
  telegrafOptions.telegram = { agent: new HttpsProxyAgent(proxyUrl) }
}

const bot = new Telegraf<SceneContext>(process.env.BOT_TOKEN!, telegrafOptions)

const stage = new Scenes.Stage([generateScene])
bot.use(session())
bot.use(stage.middleware())

bot.start(startHandler)
bot.command('buy', buyHandler)
bot.command('balance', profileHandler)
bot.command('history', historyHandler)

// Language selection for new users
bot.action(/^lang:/, langSelectHandler)

// Subscribe to completed generations via Redis pub/sub
subscribeToResults(bot, redis)

bot.launch({ dropPendingUpdates: true })
console.log('Bot started')

process.once('SIGINT',  () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
