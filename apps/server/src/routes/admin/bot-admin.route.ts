import Router from '../../lib/router'
import type { Request, Response } from 'express'
import {
    healthCheck,
    getStats,
    getAllBots,
    restartBot,
    restartBots,
    restartUnhealthyBots,
    resyncAllBots,
    getBotsFiltered,
    getBotDetails,
} from '../../bot/bot-manager'
import db from '@super-invite/db'

const router = Router()

export const name = 'bot-admin'

/**
 * Get all running bots with filtering and sorting
 * Query params: userId, healthStatus, sortBy (username, healthStatus), sortOrder (asc, desc)
 */
router.get('/', async (req: Request, res: Response) => {
    const {
        userId,
        healthStatus,
        sortBy = 'username',
        sortOrder = 'asc'
    } = req.query

    const filters: any = {}
    if (userId) filters.userId = userId as string
    if (healthStatus) filters.healthStatus = healthStatus as 'healthy' | 'unhealthy' | 'checking'

    let bots = getBotsFiltered(filters)

    // Sort bots
    const sortField = sortBy as string
    const order = sortOrder as string

    bots.sort((a, b) => {
        let aVal: any = a[sortField as keyof typeof a]
        let bVal: any = b[sortField as keyof typeof b]

        if (typeof aVal === 'string') aVal = aVal.toLowerCase()
        if (typeof bVal === 'string') bVal = bVal.toLowerCase()

        if (aVal < bVal) return order === 'asc' ? -1 : 1
        if (aVal > bVal) return order === 'asc' ? 1 : -1
        return 0
    })

    // Get group counts and database info for each bot
    const botsWithDetails = await Promise.all(
        bots.map(async (bot) => {
            const [groupCount, dbBot] = await Promise.all([
                db.botTelegramEntity.count({
                    where: { botId: bot.dbBotId },
                }),
                db.bot.findUnique({
                    where: { id: bot.dbBotId },
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        status: true,
                        errorMessage: true,
                        createdAt: true,
                        _count: {
                            select: {
                                inviteLinks: true,
                                botMembers: true,
                            }
                        }
                    }
                })
            ])

            return {
                id: bot.dbBotId,
                username: bot.username,
                firstName: dbBot?.firstName || '',
                telegramBotId: bot.telegramBotId,
                userId: bot.userId,
                healthStatus: bot.healthStatus,
                lastHealthCheck: bot.lastHealthCheck,
                errorMessage: dbBot?.errorMessage,
                groupCount,
                inviteLinkCount: dbBot?._count.inviteLinks || 0,
                memberCount: dbBot?._count.botMembers || 0,
                createdAt: dbBot?.createdAt,
            }
        })
    )

    res.json({
        success: true,
        data: {
            bots: botsWithDetails,
            total: botsWithDetails.length,
            stats: getStats(),
        },
        error: null,
    })
})

/**
 * Get detailed information about a specific bot
 */
router.get('/:botId', async (req: Request, res: Response) => {
    const { botId } = req.params

    if (!botId) {
        return res.status(400).json({
            success: false,
            error: { message: 'Bot ID is required' },
            data: null,
        })
    }

    const details = await getBotDetails(botId)

    if (!details || !details.bot) {
        return res.status(404).json({
            success: false,
            error: { message: 'Bot not found or not running' },
            data: null,
        })
    }

    // Get additional database info
    const dbBot = await db.bot.findUnique({
        where: { id: botId },
        include: {
            _count: {
                select: {
                    inviteLinks: true,
                    botMembers: true,
                    entityLinks: true,
                }
            }
        }
    })

    res.json({
        success: true,
        data: {
            id: details.bot.dbBotId,
            username: details.bot.username,
            telegramBotId: details.bot.telegramBotId,
            userId: details.bot.userId,
            healthStatus: details.bot.healthStatus,
            lastHealthCheck: details.bot.lastHealthCheck,
            firstName: dbBot?.firstName,
            status: dbBot?.status,
            errorMessage: dbBot?.errorMessage,
            createdAt: dbBot?.createdAt,
            isDefault: dbBot?.isDefault,
            groups: details.groups,
            groupCount: details.groups.length,
            inviteLinkCount: dbBot?._count.inviteLinks || 0,
            memberCount: dbBot?._count.botMembers || 0,
        },
        error: null,
    })
})

/**
 * Force health check on all bots
 */
router.post('/health-check', async (_req: Request, res: Response) => {
    const result = await healthCheck()

    res.json({
        success: true,
        data: {
            summary: {
                total: result.totalBots,
                healthy: result.healthy,
                unhealthy: result.unhealthy,
            },
            bots: result.details,
            timestamp: new Date().toISOString(),
        },
        error: null,
    })
})

/**
 * Restart a single bot
 */
router.post('/:botId/restart', async (req: Request, res: Response) => {
    const { botId } = req.params

    if (!botId) {
        return res.status(400).json({
            success: false,
            error: { message: 'Bot ID is required' },
            data: null,
        })
    }

    const result = await restartBot(botId)

    if (!result.success) {
        return res.status(500).json({
            success: false,
            error: { message: result.error || 'Failed to restart bot' },
            data: null,
        })
    }

    res.json({
        success: true,
        data: {
            message: 'Bot restarted successfully',
            botId,
        },
        error: null,
    })
})

/**
 * Restart multiple bots
 */
router.post('/restart-multiple', async (req: Request, res: Response) => {
    const { botIds } = req.body

    if (!botIds || !Array.isArray(botIds) || botIds.length === 0) {
        return res.status(400).json({
            success: false,
            error: { message: 'Bot IDs array is required' },
            data: null,
        })
    }

    const result = await restartBots(botIds)

    res.json({
        success: result.success,
        data: {
            total: botIds.length,
            successful: result.results.filter(r => r.success).length,
            failed: result.results.filter(r => !r.success).length,
            results: result.results,
        },
        error: result.success ? null : { message: 'Some bots failed to restart' },
    })
})

/**
 * Restart all unhealthy bots
 */
router.post('/restart-unhealthy', async (_req: Request, res: Response) => {
    const result = await restartUnhealthyBots()

    res.json({
        success: result.success,
        data: {
            restarted: result.restarted,
            results: result.results,
            message: `${result.restarted} unhealthy bot(s) restarted`,
        },
        error: result.success ? null : { message: 'Some bots failed to restart' },
    })
})

/**
 * Resync all bots from database
 */
router.post('/resync-all', async (_req: Request, res: Response) => {
    const result = await resyncAllBots()

    res.json({
        success: result.success,
        data: {
            total: result.total,
            restarted: result.restarted,
            failed: result.total - result.restarted,
            results: result.results,
            message: `${result.restarted}/${result.total} bots resynced successfully`,
        },
        error: result.success ? null : { message: 'Some bots failed to resync' },
    })
})

/**
 * Get all bots with their managed groups
 */
router.get('/by-groups/list', async (_req: Request, res: Response) => {
    const allBots = getAllBots()

    const botsWithGroups = await Promise.all(
        allBots.map(async (bot) => {
            const groups = await db.botTelegramEntity.findMany({
                where: { botId: bot.dbBotId },
                include: {
                    telegramEntity: {
                        select: {
                            id: true,
                            telegramId: true,
                            title: true,
                            username: true,
                            type: true,
                        },
                    },
                },
            })

            return {
                botId: bot.dbBotId,
                username: bot.username,
                healthStatus: bot.healthStatus,
                groups: groups.map(g => ({
                    id: g.telegramEntity.id,
                    telegramId: g.telegramEntity.telegramId,
                    title: g.telegramEntity.title,
                    username: g.telegramEntity.username,
                    type: g.telegramEntity.type.toString(),
                    isPrimary: g.isPrimary,
                    isAdmin: g.isAdmin,
                })),
                groupCount: groups.length,
            }
        })
    )

    res.json({
        success: true,
        data: {
            bots: botsWithGroups,
            total: botsWithGroups.length,
        },
        error: null,
    })
})

/**
 * Get comprehensive statistics
 */
router.get('/stats/summary', async (_req: Request, res: Response) => {
    const stats = getStats()
    const allBots = getAllBots()

    // Get database-level statistics
    const [totalBotsInDb, activeBotsInDb, inactiveBotsInDb, totalGroups, totalMembers] = await Promise.all([
        db.bot.count({ where: { deletedAt: null } }),
        db.bot.count({ where: { deletedAt: null, status: 0 } }), // ACTIVE
        db.bot.count({ where: { deletedAt: null, status: 1 } }), // INACTIVE
        db.botTelegramEntity.count(),
        db.botMember.count(),
    ])

    const summary = {
        runtime: {
            ...stats,
            mode: 'webhook',
        },
        database: {
            totalBots: totalBotsInDb,
            activeBots: activeBotsInDb,
            inactiveBots: inactiveBotsInDb,
            totalGroups,
            totalMembers,
        },
        bots: allBots.map(b => ({
            id: b.dbBotId,
            username: b.username,
            healthStatus: b.healthStatus,
            lastHealthCheck: b.lastHealthCheck,
        })),
        timestamp: new Date().toISOString(),
    }

    res.json({
        success: true,
        data: summary,
        error: null,
    })
})

/**
 * Get all bots from database (including inactive/not running)
 */
router.get('/database/all', async (_req: Request, res: Response) => {
    const bots = await db.bot.findMany({
        where: { deletedAt: null },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    name: true,
                }
            },
            _count: {
                select: {
                    inviteLinks: true,
                    botMembers: true,
                    entityLinks: true,
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    })

    const botsWithStatus = bots.map(bot => {
        const allBots = getAllBots()
        const runningBot = allBots.find(b => b.dbBotId === bot.id)

        return {
            id: bot.id,
            username: bot.username,
            firstName: bot.firstName,
            telegramBotId: bot.botId,
            userId: bot.userId,
            userEmail: bot.user.email,
            userName: bot.user.name,
            status: bot.status,
            statusText: bot.status === 0 ? 'ACTIVE' : bot.status === 1 ? 'INACTIVE' : 'ERROR',
            isRunning: !!runningBot,
            healthStatus: runningBot?.healthStatus || null,
            errorMessage: bot.errorMessage,
            lastHealthCheck: bot.lastHealthCheck,
            isDefault: bot.isDefault,
            createdAt: bot.createdAt,
            inviteLinkCount: bot._count.inviteLinks,
            memberCount: bot._count.botMembers,
            groupCount: bot._count.entityLinks,
        }
    })

    res.json({
        success: true,
        data: {
            bots: botsWithStatus,
            total: botsWithStatus.length,
        },
        error: null,
    })
})

/**
 * Delete a bot permanently (admin only)
 */
router.delete('/:botId', async (req: Request, res: Response) => {
    const { botId } = req.params

    if (!botId) {
        return res.status(400).json({
            success: false,
            error: { message: 'Bot ID is required' },
            data: null,
        })
    }

    const bot = await db.bot.findUnique({
        where: { id: botId }
    })

    if (!bot) {
        return res.status(404).json({
            success: false,
            error: { message: 'Bot not found' },
            data: null,
        })
    }

    // Import removeBot from bot-manager
    const { removeBot } = await import('../../bot/bot-manager')

    // Remove from running instance if it's running
    await removeBot(botId).catch(() => {
        // Ignore errors if bot is not running
    })

    // Soft delete the bot
    await db.bot.update({
        where: { id: botId },
        data: {
            deletedAt: new Date(),
            status: 1, // INACTIVE
        }
    })

    res.json({
        success: true,
        data: {
            message: 'Bot deleted successfully',
            botId,
        },
        error: null,
    })
})

/**
 * Get webhook info for a specific bot
 */
router.get('/:botId/webhook-info', async (req: Request, res: Response) => {
    const { botId } = req.params

    if (!botId) {
        return res.status(400).json({
            success: false,
            error: { message: 'Bot ID is required' },
            data: null,
        })
    }

    const details = await getBotDetails(botId)

    if (!details || !details.bot) {
        return res.status(404).json({
            success: false,
            error: { message: 'Bot not found or not running' },
            data: null,
        })
    }

    try {
        const webhookInfo = await details.bot.bot.telegram.getWebhookInfo()

        res.json({
            success: true,
            data: {
                botId,
                username: details.bot.username,
                webhook: {
                    url: webhookInfo.url,
                    hasCustomCertificate: webhookInfo.has_custom_certificate,
                    pendingUpdateCount: webhookInfo.pending_update_count,
                    lastErrorDate: webhookInfo.last_error_date,
                    lastErrorMessage: webhookInfo.last_error_message,
                    maxConnections: webhookInfo.max_connections,
                    allowedUpdates: webhookInfo.allowed_updates,
                }
            },
            error: null,
        })
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: { message: error.message || 'Failed to get webhook info' },
            data: null,
        })
    }
})

/**
 * Clear webhook and reset for a bot
 */
router.post('/:botId/clear-webhook', async (req: Request, res: Response) => {
    const { botId } = req.params

    if (!botId) {
        return res.status(400).json({
            success: false,
            error: { message: 'Bot ID is required' },
            data: null,
        })
    }

    const details = await getBotDetails(botId)

    if (!details || !details.bot) {
        return res.status(404).json({
            success: false,
            error: { message: 'Bot not found or not running' },
            data: null,
        })
    }

    try {
        await details.bot.bot.telegram.deleteWebhook({ drop_pending_updates: true })

        res.json({
            success: true,
            data: {
                message: 'Webhook cleared successfully. Use restart to set it again.',
                botId,
            },
            error: null,
        })
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: { message: error.message || 'Failed to clear webhook' },
            data: null,
        })
    }
})

export { router }
