import { Telegraf } from 'telegraf'
import db from '@super-invite/db'
import { BotStatus } from '@super-invite/db'
import { initBot } from './bot'

interface BotInstance {
  bot: Telegraf
  dbBotId: string
  telegramBotId: string
  username: string
  userId: string
}

// State
const bots = new Map<string, BotInstance>()
const botsByTelegramId = new Map<string, string>()

// Initialize all active bots from database
export async function initializeAllBots(): Promise<void> {
  console.log('Initializing all bots from database...')

  const dbBots = await db.bot.findMany({
    where: {
      status: BotStatus.ACTIVE,
      deletedAt: null,
    },
  })

  console.log(`Found ${dbBots.length} active bots to initialize`)

  for (const dbBot of dbBots) {
    await addBot({
      dbBotId: dbBot.id,
      token: dbBot.token,
      userId: dbBot.userId,
    }).catch(async (error) => {
      console.error(`Failed to initialize bot ${dbBot.id} (@${dbBot.username}):`, error)
      // Don't set ERROR status - keep ACTIVE so it retries on next restart
      await db.bot.update({
        where: { id: dbBot.id },
        data: {
          errorMessage: error instanceof Error ? error.message : 'Failed to initialize',
        },
      })
    })
  }

  console.log(`Successfully initialized ${bots.size} bots`)
}

// Add a bot to the manager
export async function addBot(config: {
  dbBotId: string
  token: string
  userId: string
}): Promise<BotInstance> {
  const { dbBotId, token, userId } = config

  // Check if bot already exists
  if (bots.has(dbBotId)) {
    console.log(`Bot ${dbBotId} already running, returning existing instance`)
    return bots.get(dbBotId)!
  }

  console.log(`Adding bot ${dbBotId}...`)

  const bot = initBot(token, dbBotId)
  const botInfo = await bot.telegram.getMe()

  const instance: BotInstance = {
    bot,
    dbBotId,
    telegramBotId: botInfo.id.toString(),
    username: botInfo.username || '',
    userId,
  }

  bots.set(dbBotId, instance)
  botsByTelegramId.set(instance.telegramBotId, dbBotId)

  // Launch bot (non-blocking)
  bot.launch().then(() => {
    console.log(`Bot @${instance.username} launched successfully`)
  }).catch(async (error) => {
    console.error(`Failed to launch bot @${instance.username}:`, error)
    // Remove from memory since launch failed
    bots.delete(dbBotId)
    botsByTelegramId.delete(instance.telegramBotId)
    // Update DB with error but keep as ACTIVE so it retries on next restart
    await db.bot.update({
      where: { id: dbBotId },
      data: {
        errorMessage: error instanceof Error ? error.message : 'Failed to launch',
      },
    })
  })

  // Update database
  await db.bot.update({
    where: { id: dbBotId },
    data: {
      status: BotStatus.ACTIVE,
      lastHealthCheck: new Date(),
      errorMessage: null,
      username: botInfo.username || '',
      firstName: botInfo.first_name,
      botId: botInfo.id.toString(),
    },
  })

  console.log(`Bot @${instance.username} added successfully`)
  return instance
}

// Remove a bot from the manager
export async function removeBot(dbBotId: string): Promise<void> {
  const instance = bots.get(dbBotId)
  if (!instance) {
    console.log(`Bot ${dbBotId} not found`)
    return
  }

  console.log(`Removing bot @${instance.username}...`)
  await instance.bot.stop()
  bots.delete(dbBotId)
  botsByTelegramId.delete(instance.telegramBotId)
  console.log(`Bot @${instance.username} removed`)
}

// Get bot by database ID
export function getBot(dbBotId: string): Telegraf | null {
  const instance = bots.get(dbBotId)
  return instance?.bot || null
}

// Get full bot instance by database ID
export function getBotInstance(dbBotId: string): BotInstance | null {
  return bots.get(dbBotId) || null
}

// Get bot instance by Telegram bot ID
export function getBotByTelegramId(telegramBotId: string): BotInstance | null {
  const dbBotId = botsByTelegramId.get(telegramBotId)
  if (!dbBotId) return null
  return bots.get(dbBotId) || null
}

// Get all bot instances
export function getAllBots(): BotInstance[] {
  return Array.from(bots.values())
}

// Get all bots for a specific user
export function getUserBots(userId: string): BotInstance[] {
  return Array.from(bots.values()).filter(b => b.userId === userId)
}

// Handle bot error - update error message in database (but keep ACTIVE for retry)
async function handleBotError(dbBotId: string, error: any): Promise<void> {
  await db.bot.update({
    where: { id: dbBotId },
    data: {
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    },
  })
}

// Perform health check on all bots
export async function healthCheck(): Promise<void> {
  console.log('Performing bot health check...')

  for (const [dbBotId, instance] of bots) {
    const botInfo = await instance.bot.telegram.getMe().catch(async (error) => {
      console.error(`Bot ${dbBotId} health check failed:`, error)
      await handleBotError(dbBotId, error)

      // Try to reconnect
      const dbBot = await db.bot.findUnique({ where: { id: dbBotId } })
      if (dbBot) {
        await removeBot(dbBotId)
        await addBot({
          dbBotId: dbBot.id,
          token: dbBot.token,
          userId: dbBot.userId,
        }).catch((reconnectError) => {
          console.error(`Failed to reconnect bot ${dbBotId}:`, reconnectError)
        })
      }
      return null
    })

    if (botInfo) {
      console.log(`Bot @${botInfo.username} health check passed`)
      await db.bot.update({
        where: { id: dbBotId },
        data: {
          lastHealthCheck: new Date(),
          status: BotStatus.ACTIVE,
          errorMessage: null,
        },
      })
    }
  }
}

// Get stats about running bots
export function getStats() {
  return {
    totalBots: bots.size,
    active: bots.size,
  }
}

// Stop all bots
export async function stopAllBots(): Promise<void> {
  console.log('Stopping all bots...')

  const stopPromises = Array.from(bots.values()).map(async (instance) => {
    await instance.bot.stop()
    console.log(`Bot @${instance.username} stopped`)
  })

  await Promise.all(stopPromises)

  bots.clear()
  botsByTelegramId.clear()
  console.log('All bots stopped')
}

// Validate a bot token without adding to manager
export async function validateBotToken(token: string): Promise<{
  valid: boolean
  botId?: string
  username?: string
  firstName?: string
  error?: string
}> {
  const tempBot = new Telegraf(token)
  const botInfo = await tempBot.telegram.getMe().catch((error) => {
    return null
  })

  if (!botInfo) {
    return {
      valid: false,
      error: 'Invalid token',
    }
  }

  return {
    valid: true,
    botId: botInfo.id.toString(),
    username: botInfo.username,
    firstName: botInfo.first_name,
  }
}

// Legacy export for backward compatibility
export const botManager = {
  initializeAllBots,
  addBot,
  removeBot,
  getBot,
  getBotInstance,
  getBotByTelegramId,
  getAllBots,
  getUserBots,
  healthCheck,
  getStats,
  stop: stopAllBots,
  validateBotToken,
}
