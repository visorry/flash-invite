import Router from '../lib/router'
import type { Request, Response } from 'express'
import { getBotInstance, healthCheck, getStats, getAllBots } from '../bot/bot-manager'
import { config } from '../config/configuration'

const router = Router()

export const name = 'telegram'

/**
 * Telegram Webhook Verification Endpoint
 * Telegram sends GET requests to verify the webhook is accessible
 */
router.get('/webhook/:botId', async (req: Request, res: Response) => {
    const { botId } = req.params

    if (!botId) {
        return res.status(400).json({
            success: false,
            error: { message: 'Bot ID is required', status: 400, path: req.path, method: req.method },
            data: null,
        })
    }

    // Verify bot exists
    const botInstance = getBotInstance(botId)
    if (!botInstance) {
        return res.status(404).json({
            success: false,
            error: { message: 'Bot not found', status: 404, path: req.path, method: req.method },
            data: null,
        })
    }

    // Return success for webhook verification
    res.status(200).json({
        success: true,
        data: { botId, status: 'ready' },
        error: null,
    })
})

/**
 * Telegram Webhook Endpoint
 * Receives updates from Telegram for a specific bot
 */
router.post('/webhook/:botId', async (req: Request, res: Response) => {
    const { botId } = req.params
    const secretToken = req.headers['x-telegram-bot-api-secret-token']

    if (!botId) {
        return res.status(400).json({ error: 'Bot ID is required' })
    }

    // Verify secret token
    if (config.TELEGRAM_WEBHOOK_SECRET && secretToken !== config.TELEGRAM_WEBHOOK_SECRET) {
        console.error(`[WEBHOOK] Invalid secret token for bot ${botId}`)
        return res.status(403).json({ error: 'Invalid secret token' })
    }

    // Get bot instance
    const botInstance = getBotInstance(botId)
    if (!botInstance) {
        // Known old bot IDs that we want to ignore in logs
        const KNOWN_OLD_BOTS = [
            '76a1aa4a-f045-48d3-90d2-ca478c0897d5',
            '34906bc0-e7b0-4e54-982a-d77b54604b3c',
            '32addc8d-47da-4f1a-8e65-91f41306b578'
        ]
        
        // Only log if it's not a known old bot
        if (!KNOWN_OLD_BOTS.includes(botId)) {
            console.error(`[WEBHOOK] Bot ${botId} not found`)
        }
        return res.status(404).json({ error: 'Bot not found' })
    }

    try {
        // Process update with Telegraf
        console.log(`[WEBHOOK] Received update for bot ${botId}:`, JSON.stringify(req.body).substring(0, 200))
        await botInstance.bot.handleUpdate(req.body)
        res.status(200).json({ ok: true })
    } catch (error) {
        console.error(`[WEBHOOK] Error processing update for bot ${botId}:`, error)
        res.status(500).json({ error: 'Internal server error' })
    }
})

/**
 * Get webhook info for a bot
 */
router.get('/webhook/:botId/info', async (req: Request, res: Response) => {
    const { botId } = req.params

    if (!botId) {
        return res.status(400).json({
            success: false,
            error: { message: 'Bot ID is required' },
            data: null,
        })
    }

    const botInstance = getBotInstance(botId)
    if (!botInstance) {
        return res.status(404).json({
            success: false,
            error: { message: 'Bot not found' },
            data: null,
        })
    }

    try {
        const webhookInfo = await botInstance.bot.telegram.getWebhookInfo()
        res.json({
            success: true,
            data: {
                botId,
                username: botInstance.username,
                mode: botInstance.mode,
                webhookInfo,
            },
            error: null,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                message: error instanceof Error ? error.message : 'Failed to get webhook info',
            },
            data: null,
        })
    }
})

/**
 * Comprehensive bot health check
 * Checks all bots and attempts to reconnect unhealthy ones
 */
router.get('/health', async (_req: Request, res: Response) => {
    try {
        const healthResult = await healthCheck()
        const stats = getStats()

        res.json({
            success: true,
            data: {
                summary: stats,
                bots: healthResult.details,
                timestamp: new Date().toISOString(),
            },
            error: null,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                message: error instanceof Error ? error.message : 'Health check failed',
            },
            data: null,
        })
    }
})

/**
 * Get bot statistics without running health check
 */
router.get('/health/stats', (_req: Request, res: Response) => {
    const stats = getStats()
    const allBots = getAllBots()

    res.json({
        success: true,
        data: {
            stats,
            bots: allBots.map(bot => ({
                botId: bot.dbBotId,
                username: bot.username,
                telegramBotId: bot.telegramBotId,
                mode: bot.mode,
                healthStatus: bot.healthStatus,
                lastHealthCheck: bot.lastHealthCheck,
            })),
            timestamp: new Date().toISOString(),
        },
        error: null,
    })
})

/**
 * Get health status for a specific bot
 */
router.get('/health/:botId', async (req: Request, res: Response) => {
    const { botId } = req.params
    const allBots = getAllBots()
    const bot = allBots.find(b => b.dbBotId === botId)

    if (!bot) {
        return res.status(404).json({
            success: false,
            error: { message: 'Bot not found' },
            data: null,
        })
    }

    try {
        // Perform health check for this specific bot
        const botInfo = await bot.bot.telegram.getMe()

        let webhookInfo = null
        if (bot.mode === 'webhook') {
            webhookInfo = await bot.bot.telegram.getWebhookInfo()
        }

        res.json({
            success: true,
            data: {
                botId: bot.dbBotId,
                username: bot.username,
                telegramBotId: bot.telegramBotId,
                mode: bot.mode,
                healthStatus: bot.healthStatus,
                lastHealthCheck: bot.lastHealthCheck,
                botInfo,
                webhookInfo,
                timestamp: new Date().toISOString(),
            },
            error: null,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                message: error instanceof Error ? error.message : 'Failed to check bot health',
            },
            data: {
                botId: bot.dbBotId,
                username: bot.username,
                healthStatus: 'unhealthy',
            },
        })
    }
})

export { router }
