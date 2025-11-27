import { Telegraf } from 'telegraf'
import db from '@super-invite/db'
import { BotStatus } from '@super-invite/db'
import { initBot } from './bot'
import { config } from '../config/configuration'

interface BotInstance {
  bot: Telegraf
  dbBotId: string
  telegramBotId: string
  username: string
  userId: string
  lastHealthCheck?: Date
  healthStatus?: 'healthy' | 'unhealthy' | 'checking'
}

// State
const bots = new Map<string, BotInstance>()
const botsByTelegramId = new Map<string, string>()

// Initialize all active bots from database
export async function initializeAllBots(): Promise<void> {
  console.log('Initializing all bots from database...')
  console.log('Bot mode: WEBHOOK (webhook-only mode)')

  // Validate webhook configuration
  if (!config.TELEGRAM_WEBHOOK_DOMAIN) {
    console.error('❌ TELEGRAM_WEBHOOK_DOMAIN is not configured!')
    console.error('   Please set TELEGRAM_WEBHOOK_DOMAIN in your .env file')
    console.error('   For local development, use ngrok: ngrok http 3000')
    throw new Error('TELEGRAM_WEBHOOK_DOMAIN is required for webhook mode')
  }

  if (!config.TELEGRAM_WEBHOOK_SECRET) {
    console.warn('⚠️  TELEGRAM_WEBHOOK_SECRET is not set - using empty secret (not recommended)')
  }

  console.log(`✅ Webhook domain configured: ${config.TELEGRAM_WEBHOOK_DOMAIN}`)

  // First, let's check ALL bots in the database for debugging
  const allBots = await db.bot.findMany({
    where: { deletedAt: null },
    select: { id: true, username: true, status: true, errorMessage: true }
  })
  console.log(`[DEBUG] Total bots in database: ${allBots.length}`)
  allBots.forEach(bot => {
    const statusName = bot.status === 0 ? 'ACTIVE' : bot.status === 1 ? 'INACTIVE' : 'ERROR'
    console.log(`  - @${bot.username || 'unknown'} (${bot.id.substring(0, 8)}): ${statusName}${bot.errorMessage ? ` (Error: ${bot.errorMessage})` : ''}`)
  })

  const dbBots = await db.bot.findMany({
    where: {
      status: BotStatus.ACTIVE,
      deletedAt: null,
    },
  })

  console.log(`Found ${dbBots.length} ACTIVE bots to initialize`)

  // Initialize bots with a small delay between each to avoid API rate limits
  // Don't await - let them initialize in the background
  for (let i = 0; i < dbBots.length; i++) {
    const dbBot = dbBots[i]

    // Add a small delay between each bot initialization (500ms)
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    // Start initialization in background (don't await)
    addBot({
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

  // Wait a bit for initial bots to start
  await new Promise(resolve => setTimeout(resolve, 3000))

  console.log(`Bot initialization started for ${dbBots.length} bots (${bots.size} currently running)`)

  // Run initial health check after all bots have had time to initialize
  if (dbBots.length > 0) {
    console.log('Scheduling health check...')
    setTimeout(() => {
      healthCheck().catch(error => {
        console.error('Initial health check failed:', error)
      })
    }, 10000) // Wait 10 seconds for bots to fully start
  }
}

// Add a bot to the manager
export async function addBot(botConfig: {
  dbBotId: string
  token: string
  userId: string
}): Promise<BotInstance> {
  const { dbBotId, token, userId } = botConfig

  // Check if bot already exists
  if (bots.has(dbBotId)) {
    console.log(`[ADD_BOT] Bot ${dbBotId} already running, returning existing instance`)
    return bots.get(dbBotId)!
  }

  console.log(`[ADD_BOT] Adding bot ${dbBotId}...`)

  try {
    // Initialize bot and get info with timeout
    const bot = initBot(token, dbBotId)

    // CRITICAL: Delete any existing webhook first to prevent conflicts
    // This is essential when switching from webhook to polling or after restart
    console.log(`[ADD_BOT] Cleaning up any existing webhook...`)
    try {
      await bot.telegram.deleteWebhook({ drop_pending_updates: true })
      console.log(`[ADD_BOT] Webhook cleaned up successfully`)
    } catch (webhookError) {
      console.log(`[ADD_BOT] Webhook cleanup skipped (likely none existed):`, webhookError instanceof Error ? webhookError.message : webhookError)
    }

    const botInfoPromise = bot.telegram.getMe()
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Bot info fetch timeout after 10 seconds')), 10000)
    })

    const botInfo = await Promise.race([botInfoPromise, timeoutPromise])

    console.log(`[ADD_BOT] Bot @${botInfo.username} info fetched successfully`)

    const instance: BotInstance = {
      bot,
      dbBotId,
      telegramBotId: botInfo.id.toString(),
      username: botInfo.username || '',
      userId,
      healthStatus: 'checking',
    }

    bots.set(dbBotId, instance)
    botsByTelegramId.set(instance.telegramBotId, dbBotId)

    // Launch bot in webhook mode
    console.log(`[ADD_BOT] Setting up webhook for bot @${instance.username}...`)
    await launchBotWebhook(instance)

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
    }).catch(dbError => {
      console.error(`[ADD_BOT] Failed to update DB for bot ${dbBotId}:`, dbError)
    })

    console.log(`[ADD_BOT] ✅ Bot @${instance.username} added successfully in webhook mode`)
    return instance
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[ADD_BOT] ❌ Failed to add bot ${dbBotId}:`, errorMessage)

    // Clean up if bot was partially added
    bots.delete(dbBotId)

    // Update database with error but KEEP status as ACTIVE for retry on next restart
    await db.bot.update({
      where: { id: dbBotId },
      data: {
        errorMessage,
        lastHealthCheck: new Date(),
      },
    }).catch(dbError => {
      console.error(`[ADD_BOT] Failed to update DB with error for bot ${dbBotId}:`, dbError)
    })

    throw error
  }
}
// Launch bot in webhook mode
async function launchBotWebhook(instance: BotInstance): Promise<void> {
  console.log(`[WEBHOOK] Setting up webhook for bot @${instance.username}...`)

  if (!config.TELEGRAM_WEBHOOK_DOMAIN) {
    const error = new Error('TELEGRAM_WEBHOOK_DOMAIN not configured for webhook mode')
    instance.healthStatus = 'unhealthy'
    console.error(`[WEBHOOK] ❌ Configuration error:`, error.message)
    bots.delete(instance.dbBotId)
    botsByTelegramId.delete(instance.telegramBotId)
    await db.bot.update({
      where: { id: instance.dbBotId },
      data: {
        errorMessage: error.message,
        lastHealthCheck: new Date(),
      },
    }).catch(dbError => {
      console.error(`[WEBHOOK] Failed to update DB for bot ${instance.dbBotId}:`, dbError)
    })
    throw error
  }

  const webhookUrl = `${config.TELEGRAM_WEBHOOK_DOMAIN}/api/v1/telegram/webhook/${instance.dbBotId}`

  // Create a timeout promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error('Webhook setup timeout after 10 seconds'))
    }, 10000) // 10 second timeout
  })

  // Set webhook with timeout
  return Promise.race([
    instance.bot.telegram.setWebhook(webhookUrl, {
      secret_token: config.TELEGRAM_WEBHOOK_SECRET,
      allowed_updates: [
        'message',
        'chat_member',
        'my_chat_member',
        'channel_post',
        'chat_join_request',
      ],
    }),
    timeoutPromise
  ])
    .then(() => {
      instance.healthStatus = 'healthy'
      console.log(`[WEBHOOK] ✅ Bot @${instance.username} webhook set to: ${webhookUrl}`)
    })
    .catch(async (error) => {
      instance.healthStatus = 'unhealthy'
      const errorMessage = error instanceof Error ? error.message : 'Failed to set webhook'
      console.error(`[WEBHOOK] ❌ Failed to set webhook for bot @${instance.username}:`, errorMessage)

      bots.delete(instance.dbBotId)
      botsByTelegramId.delete(instance.telegramBotId)

      await db.bot.update({
        where: { id: instance.dbBotId },
        data: {
          errorMessage,
          lastHealthCheck: new Date(),
        },
      }).catch(dbError => {
        console.error(`[WEBHOOK] Failed to update DB for bot ${instance.dbBotId}:`, dbError)
      })

      throw error
    })
}


// Remove a bot from the manager
export async function removeBot(dbBotId: string): Promise<void> {
  const instance = bots.get(dbBotId)
  if (!instance) {
    console.log(`Bot ${dbBotId} not found`)
    return
  }

  console.log(`Removing bot @${instance.username}...`)

  // Delete webhook (webhook mode only)
  await instance.bot.telegram.deleteWebhook()
    .then(() => {
      console.log(`Webhook deleted for bot @${instance.username}`)
    })
    .catch((error) => {
      console.error(`Failed to delete webhook for bot @${instance.username}:`, error)
    })

  // Stop the bot if it's running
  try {
    await instance.bot.stop()
    console.log(`Bot @${instance.username} stopped`)
  } catch (error) {
    // Ignore "Bot is not running" errors
    console.log(`Bot @${instance.username} was not running, skipping stop`)
  }

  bots.delete(dbBotId)
  botsByTelegramId.delete(instance.telegramBotId)
  console.log(`Bot @${instance.username} removed from manager`)
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

// Enhanced health check with automatic recovery
export async function healthCheck(): Promise<{
  totalBots: number
  healthy: number
  unhealthy: number
  details: Array<{
    botId: string
    username: string
    status: 'healthy' | 'unhealthy'
    lastCheck: Date
    error?: string
  }>
}> {
  console.log('[HEALTH_CHECK] Starting bot health check...')

  const results = {
    totalBots: bots.size,
    healthy: 0,
    unhealthy: 0,
    details: [] as Array<{
      botId: string
      username: string
      status: 'healthy' | 'unhealthy'
      lastCheck: Date
      error?: string
    }>,
  }

  for (const [dbBotId, instance] of bots) {
    instance.healthStatus = 'checking'
    const checkTime = new Date()

    await instance.bot.telegram.getMe()
      .then(async (botInfo) => {
        // Verify webhook status (webhook mode only)
        return instance.bot.telegram.getWebhookInfo()
          .then((webhookInfo) => {
            if (!webhookInfo.url) {
              throw new Error('Webhook not set')
            }
            return botInfo
          })
      })
      .then(async (botInfo) => {
        instance.healthStatus = 'healthy'
        instance.lastHealthCheck = checkTime
        results.healthy++

        results.details.push({
          botId: dbBotId,
          username: instance.username,
          status: 'healthy',
          lastCheck: checkTime,
        })

        // Update database
        await db.bot.update({
          where: { id: dbBotId },
          data: {
            lastHealthCheck: checkTime,
            status: BotStatus.ACTIVE,
            errorMessage: null,
          },
        })

        console.log(`[HEALTH_CHECK] ✅ Bot @${botInfo.username} is healthy (webhook mode)`)
      })
      .catch(async (error) => {
        instance.healthStatus = 'unhealthy'
        instance.lastHealthCheck = checkTime
        results.unhealthy++

        const errorMessage = error instanceof Error ? error.message : 'Unknown error'

        results.details.push({
          botId: dbBotId,
          username: instance.username,
          status: 'unhealthy',
          lastCheck: checkTime,
          error: errorMessage,
        })

        console.error(`[HEALTH_CHECK] ❌ Bot ${dbBotId} health check failed:`, errorMessage)

        // Update database with error
        await db.bot.update({
          where: { id: dbBotId },
          data: {
            errorMessage,
            lastHealthCheck: checkTime,
          },
        })

        // Try to reconnect
        console.log(`[HEALTH_CHECK] Attempting to reconnect bot ${dbBotId}...`)
        const dbBot = await db.bot.findUnique({ where: { id: dbBotId } })
        if (dbBot) {
          await removeBot(dbBotId)
          await addBot({
            dbBotId: dbBot.id,
            token: dbBot.token,
            userId: dbBot.userId,
          }).catch((reconnectError) => {
            console.error(`[HEALTH_CHECK] Failed to reconnect bot ${dbBotId}:`, reconnectError)
          })
        }
      })
  }

  console.log(
    `[HEALTH_CHECK] Completed - Total: ${results.totalBots}, Healthy: ${results.healthy}, Unhealthy: ${results.unhealthy}`
  )

  return results
}

// Get stats about running bots
export function getStats() {
  const instances = Array.from(bots.values())
  return {
    totalBots: bots.size,
    active: instances.filter(b => b.healthStatus === 'healthy').length,
    unhealthy: instances.filter(b => b.healthStatus === 'unhealthy').length,
    checking: instances.filter(b => b.healthStatus === 'checking').length,
  }
}

// Stop all bots
export async function stopAllBots(): Promise<void> {
  console.log('Stopping all bots...')

  const stopPromises = Array.from(bots.values()).map(async (instance) => {
    // Delete webhook (webhook mode only)
    await instance.bot.telegram.deleteWebhook()
      .then(() => {
        console.log(`Webhook deleted for bot @${instance.username}`)
      })
      .catch((error) => {
        console.error(`Failed to delete webhook for bot @${instance.username}:`, error)
      })

    // Stop the bot if it's running
    try {
      await instance.bot.stop()
      console.log(`Bot @${instance.username} stopped`)
    } catch (error) {
      // Ignore "Bot is not running" errors
      console.log(`Bot @${instance.username} was not running, skipping stop`)
    }
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

  // Add timeout to prevent hanging
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Token validation timeout')), 5000)
  })

  return Promise.race([
    tempBot.telegram.getMe(),
    timeoutPromise
  ])
    .then((botInfo) => ({
      valid: true,
      botId: botInfo.id.toString(),
      username: botInfo.username,
      firstName: botInfo.first_name,
    }))
    .catch((error) => ({
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid token',
    }))
}

// Force restart a single bot
export async function restartBot(dbBotId: string): Promise<{
  success: boolean
  error?: string
}> {
  console.log(`[RESTART] Force restarting bot ${dbBotId}...`)

  const dbBot = await db.bot.findUnique({ where: { id: dbBotId } })
  if (!dbBot) {
    return { success: false, error: 'Bot not found in database' }
  }

  return removeBot(dbBotId)
    .then(() => addBot({
      dbBotId: dbBot.id,
      token: dbBot.token,
      userId: dbBot.userId,
    }))
    .then(() => {
      console.log(`[RESTART] ✅ Bot ${dbBotId} restarted successfully`)
      return { success: true }
    })
    .catch((error) => {
      console.error(`[RESTART] ❌ Failed to restart bot ${dbBotId}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to restart bot',
      }
    })
}

// Force restart multiple bots
export async function restartBots(dbBotIds: string[]): Promise<{
  success: boolean
  results: Array<{ botId: string; success: boolean; error?: string }>
}> {
  console.log(`[RESTART] Force restarting ${dbBotIds.length} bots...`)

  const results = await Promise.all(
    dbBotIds.map(async (botId) => {
      const result = await restartBot(botId)
      return {
        botId,
        ...result,
      }
    })
  )

  const successCount = results.filter(r => r.success).length
  console.log(`[RESTART] Completed - ${successCount}/${dbBotIds.length} bots restarted successfully`)

  return {
    success: successCount === dbBotIds.length,
    results,
  }
}

// Restart all unhealthy bots
export async function restartUnhealthyBots(): Promise<{
  success: boolean
  restarted: number
  results: Array<{ botId: string; success: boolean; error?: string }>
}> {
  console.log('[RESTART] Restarting all unhealthy bots...')

  const unhealthyBots = Array.from(bots.values())
    .filter(b => b.healthStatus === 'unhealthy')
    .map(b => b.dbBotId)

  if (unhealthyBots.length === 0) {
    console.log('[RESTART] No unhealthy bots found')
    return { success: true, restarted: 0, results: [] }
  }

  const restartResult = await restartBots(unhealthyBots)

  return {
    success: restartResult.success,
    restarted: restartResult.results.filter(r => r.success).length,
    results: restartResult.results,
  }
}

// Resync all bots from database (restart all active bots)
export async function resyncAllBots(): Promise<{
  success: boolean
  total: number
  restarted: number
  results: Array<{ botId: string; success: boolean; error?: string }>
}> {
  console.log('[RESYNC] Resyncing all bots from database...')

  // Stop all currently running bots
  await stopAllBots()

  // Reinitialize all bots from database
  const dbBots = await db.bot.findMany({
    where: {
      status: BotStatus.ACTIVE,
      deletedAt: null,
    },
  })

  console.log(`[RESYNC] Found ${dbBots.length} active bots to resync`)

  const results = await Promise.all(
    dbBots.map(async (dbBot) => {
      return addBot({
        dbBotId: dbBot.id,
        token: dbBot.token,
        userId: dbBot.userId,
      })
        .then(() => ({
          botId: dbBot.id,
          success: true,
        }))
        .catch((error) => ({
          botId: dbBot.id,
          success: false,
          error: error instanceof Error ? error.message : 'Failed to add bot',
        }))
    })
  )

  const successCount = results.filter(r => r.success).length
  console.log(`[RESYNC] Completed - ${successCount}/${dbBots.length} bots resynced successfully`)

  return {
    success: successCount === dbBots.length,
    total: dbBots.length,
    restarted: successCount,
    results,
  }
}

// Get bots filtered by various criteria
export function getBotsFiltered(filters: {
  userId?: string
  healthStatus?: 'healthy' | 'unhealthy' | 'checking'
  groupIds?: string[] // Filter by groups they manage
}): BotInstance[] {
  let filtered = Array.from(bots.values())

  if (filters.userId) {
    filtered = filtered.filter(b => b.userId === filters.userId)
  }

  if (filters.healthStatus) {
    filtered = filtered.filter(b => b.healthStatus === filters.healthStatus)
  }

  return filtered
}

// Get detailed bot information with group associations
export async function getBotDetails(dbBotId: string): Promise<{
  bot: BotInstance | null
  groups: Array<{
    id: string
    telegramId: string
    title: string
    type: string
    isPrimary: boolean
  }>
} | null> {
  const instance = bots.get(dbBotId)
  if (!instance) return null

  // Get all groups this bot manages
  const botLinks = await db.botTelegramEntity.findMany({
    where: { botId: dbBotId },
    include: {
      telegramEntity: {
        select: {
          id: true,
          telegramId: true,
          title: true,
          type: true,
        },
      },
    },
  })

  return {
    bot: instance,
    groups: botLinks.map(link => ({
      id: link.telegramEntity.id,
      telegramId: link.telegramEntity.telegramId,
      title: link.telegramEntity.title,
      type: link.telegramEntity.type.toString(),
      isPrimary: link.isPrimary,
    })),
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
  restartBot,
  restartBots,
  restartUnhealthyBots,
  resyncAllBots,
  getBotsFiltered,
  getBotDetails,
}

