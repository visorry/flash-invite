import type { RequestContext } from '../types/app'
import db, { BroadcastStatus } from '@super-invite/db'
import { getBot } from '../bot/bot-manager'

interface SubscriberFilters {
    isSubscribed?: boolean
    isPremium?: boolean
    languageCode?: string
    activeWithinDays?: number
    search?: string
}

interface BroadcastData {
    botId: string
    name?: string
    content?: string
    parseMode?: string
    buttons?: any
    sourceGroupId?: string
    sourceMessageIds?: number[]
    watermarkEnabled?: boolean
    watermarkText?: string
    watermarkPosition?: string
    forwardMedia?: boolean
    copyMode?: boolean
    removeLinks?: boolean
    filterCriteria?: {
        isPremium?: boolean
        languageCode?: string
        activeWithinDays?: number
        isSubscribed?: boolean
    }
    recipientIds?: string[]
    scheduledFor?: string
}

// List user's bots with subscriber counts
const listBotsWithSubscribers = async (ctx: RequestContext) => {
    const userId = ctx.user!.id

    const bots = await db.bot.findMany({
        where: {
            userId,
            deletedAt: null,
        },
        select: {
            id: true,
            username: true,
            firstName: true,
            status: true,
            _count: {
                select: {
                    botMembers: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    })

    // Get subscriber counts for each bot
    const botsWithStats = await Promise.all(
        bots.map(async (bot) => {
            // Use try-catch to handle any potential issues with new fields
            try {
                const [totalMembers, blockedCount, premiumCount] = await Promise.all([
                    db.botMember.count({
                        where: { botId: bot.id },
                    }),
                    db.botMember.count({
                        where: {
                            botId: bot.id,
                            isBlocked: true,
                        },
                    }).catch(() => 0),
                    db.botMember.count({
                        where: {
                            botId: bot.id,
                            isPremium: true,
                        },
                    }),
                ])

                // subscriberCount = total - blocked
                const subscriberCount = totalMembers - blockedCount

                return {
                    ...bot,
                    totalMembers,
                    subscriberCount,
                    blockedCount,
                    premiumCount,
                }
            } catch (error) {
                // Fallback if any query fails
                return {
                    ...bot,
                    totalMembers: bot._count.botMembers,
                    subscriberCount: bot._count.botMembers,
                    blockedCount: 0,
                    premiumCount: 0,
                }
            }
        })
    )

    return botsWithStats
}

// Get subscribers for a specific bot
const getSubscribers = async (
    ctx: RequestContext,
    botId: string,
    filters?: SubscriberFilters
) => {
    const userId = ctx.user!.id
    const pagination = ctx.pagination || {}

    // Verify bot ownership
    const bot = await db.bot.findFirst({
        where: {
            id: botId,
            userId,
            deletedAt: null,
        },
    })

    if (!bot) {
        throw new Error('Bot not found')
    }

    const where: any = { botId }

    if (filters?.isPremium !== undefined) {
        where.isPremium = filters.isPremium
    }

    if (filters?.languageCode) {
        where.languageCode = filters.languageCode
    }

    if (filters?.activeWithinDays) {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - filters.activeWithinDays)
        where.lastActiveAt = { gte: cutoffDate }
    }

    if (filters?.search) {
        where.OR = [
            { username: { contains: filters.search, mode: 'insensitive' } },
            { firstName: { contains: filters.search, mode: 'insensitive' } },
            { lastName: { contains: filters.search, mode: 'insensitive' } },
            { telegramUserId: { contains: filters.search } },
        ]
    }

    try {
        const [items, total] = await Promise.all([
            db.botMember.findMany({
                where,
                select: {
                    id: true,
                    telegramUserId: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                    languageCode: true,
                    isPremium: true,
                    lastActiveAt: true,
                    createdAt: true,
                },
                skip: pagination.skip,
                take: pagination.take || 50,
                orderBy: pagination.orderBy || { lastActiveAt: 'desc' },
            }),
            db.botMember.count({ where }),
        ])

        // Add default values for new fields
        const itemsWithDefaults = items.map(item => ({
            ...item,
            isSubscribed: true,
            isBlocked: false,
            subscribedAt: item.createdAt,
        }))

        return {
            items: itemsWithDefaults,
            total,
            page: pagination.current || 1,
            size: pagination.take || 50,
        }
    } catch (error) {
        console.error('Error fetching subscribers:', error)
        return {
            items: [],
            total: 0,
            page: 1,
            size: 50,
        }
    }
}

// Get subscriber statistics for a bot
const getSubscriberStats = async (ctx: RequestContext, botId: string) => {
    const userId = ctx.user!.id

    // Verify bot ownership
    const bot = await db.bot.findFirst({
        where: {
            id: botId,
            userId,
            deletedAt: null,
        },
    })

    if (!bot) {
        throw new Error('Bot not found')
    }

    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    try {
        const [
            total,
            blocked,
            subscribed,
            premium,
            activeToday,
            activeWeek,
            activeMonth,
            newToday,
            newWeek,
            languageStats,
        ] = await Promise.all([
            db.botMember.count({ where: { botId } }),
            db.botMember.count({ where: { botId, isBlocked: true } }),
            db.botMember.count({ where: { botId, isBlocked: false } }),
            db.botMember.count({ where: { botId, isPremium: true, isBlocked: false } }),
            db.botMember.count({ where: { botId, lastActiveAt: { gte: oneDayAgo }, isBlocked: false } }),
            db.botMember.count({ where: { botId, lastActiveAt: { gte: sevenDaysAgo }, isBlocked: false } }),
            db.botMember.count({ where: { botId, lastActiveAt: { gte: thirtyDaysAgo }, isBlocked: false } }),
            db.botMember.count({ where: { botId, createdAt: { gte: oneDayAgo } } }),
            db.botMember.count({ where: { botId, createdAt: { gte: sevenDaysAgo } } }),
            db.botMember.groupBy({
                by: ['languageCode'],
                where: { botId, isBlocked: false },
                _count: true,
                orderBy: { _count: { languageCode: 'desc' } },
                take: 10,
            }),
        ])

        return {
            total,
            subscribed,
            blocked,
            premium,
            activeToday,
            activeWeek,
            activeMonth,
            newToday,
            newWeek,
            languageStats: languageStats.map((s) => ({
                language: s.languageCode || 'unknown',
                count: s._count,
            })),
        }
    } catch (error) {
        console.error('Error fetching subscriber stats:', error)
        return {
            total: 0,
            subscribed: 0,
            blocked: 0,
            premium: 0,
            activeToday: 0,
            activeWeek: 0,
            activeMonth: 0,
            newToday: 0,
            newWeek: 0,
            languageStats: [],
        }
    }
}


// Get source groups available for a bot
const getSourceGroups = async (ctx: RequestContext, botId: string) => {
    const userId = ctx.user!.id

    // Verify bot ownership
    const bot = await db.bot.findFirst({
        where: {
            id: botId,
            userId,
            deletedAt: null,
        },
    })

    if (!bot) {
        throw new Error('Bot not found')
    }

    // Get all telegram entities linked to this bot where it's an admin
    const groups = await db.botTelegramEntity.findMany({
        where: {
            botId,
            isAdmin: true,
        },
        include: {
            telegramEntity: {
                select: {
                    id: true,
                    telegramId: true,
                    title: true,
                    type: true,
                    username: true,
                    memberCount: true,
                },
            },
        },
    })

    return groups.map((g) => ({
        id: g.telegramEntity.id,
        telegramId: g.telegramEntity.telegramId,
        title: g.telegramEntity.title,
        type: g.telegramEntity.type,
        username: g.telegramEntity.username,
        memberCount: g.telegramEntity.memberCount,
        isAdmin: g.isAdmin,
    }))
}

// Get recent messages from a source group
const getSourceMessages = async (
    ctx: RequestContext,
    botId: string,
    groupId: string,
    _limit: number = 20
) => {
    const userId = ctx.user!.id

    // Verify bot ownership
    const bot = await db.bot.findFirst({
        where: {
            id: botId,
            userId,
            deletedAt: null,
        },
    })

    if (!bot) {
        throw new Error('Bot not found')
    }

    // Get the telegram entity
    const entity = await db.telegramEntity.findFirst({
        where: {
            id: groupId,
            userId,
        },
    })

    if (!entity) {
        throw new Error('Group not found')
    }

    // Get bot instance and fetch messages
    const botInstance = getBot(botId)
    if (!botInstance) {
        throw new Error('Bot is not running')
    }

    // Note: Telegram API doesn't have a direct method to get message history for bots
    // This will return an empty array for now - messages need to be tracked as they come in
    // In a real implementation, you would store messages in a separate table
    return {
        messages: [],
        note: 'Message history requires forwarding or tracking messages as they arrive',
    }
}

// List user's broadcasts
const listBroadcasts = async (ctx: RequestContext, botId?: string) => {
    const userId = ctx.user!.id
    const pagination = ctx.pagination || {}

    const where: any = { userId }
    if (botId) {
        where.botId = botId
    }

    const [items, total] = await Promise.all([
        db.broadcast.findMany({
            where,
            include: {
                bot: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                    },
                },
                template: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            skip: pagination.skip,
            take: pagination.take || 20,
            orderBy: pagination.orderBy || { createdAt: 'desc' },
        }),
        db.broadcast.count({ where }),
    ])

    return {
        items,
        total,
        page: pagination.current || 1,
        size: pagination.take || 20,
    }
}

// Get broadcast by ID
const getBroadcastById = async (ctx: RequestContext, id: string) => {
    const userId = ctx.user!.id

    const broadcast = await db.broadcast.findFirst({
        where: {
            id,
            userId,
        },
        include: {
            bot: {
                select: {
                    id: true,
                    username: true,
                    firstName: true,
                },
            },
            template: true,
        },
    })

    if (!broadcast) {
        throw new Error('Broadcast not found')
    }

    return broadcast
}

// Create a new broadcast
const createBroadcast = async (ctx: RequestContext, data: BroadcastData) => {
    const userId = ctx.user!.id

    // Verify bot ownership
    const bot = await db.bot.findFirst({
        where: {
            id: data.botId,
            userId,
            deletedAt: null,
        },
    })

    if (!bot) {
        throw new Error('Bot not found')
    }

    // Get recipients based on filters or provided IDs
    let recipientIds: string[] = data.recipientIds || []

    if (!data.recipientIds || data.recipientIds.length === 0) {
        // Get all active subscribers if no specific recipients
        const where: any = {
            botId: data.botId,
            isSubscribed: true,
            isBlocked: false,
        }

        if (data.filterCriteria?.isPremium) {
            where.isPremium = true
        }

        if (data.filterCriteria?.languageCode) {
            where.languageCode = data.filterCriteria.languageCode
        }

        if (data.filterCriteria?.activeWithinDays) {
            const cutoffDate = new Date()
            cutoffDate.setDate(cutoffDate.getDate() - data.filterCriteria.activeWithinDays)
            where.lastActiveAt = { gte: cutoffDate }
        }

        const subscribers = await db.botMember.findMany({
            where,
            select: { id: true },
        })

        recipientIds = subscribers.map((s) => s.id)
    }

    const broadcast = await db.broadcast.create({
        data: {
            userId,
            botId: data.botId,
            name: data.name,
            content: data.content,
            parseMode: data.parseMode,
            buttons: data.buttons,
            sourceGroupId: data.sourceGroupId,
            sourceMessageIds: data.sourceMessageIds || [],
            watermarkEnabled: data.watermarkEnabled || false,
            watermarkText: data.watermarkText,
            watermarkPosition: data.watermarkPosition || 'bottom',
            forwardMedia: data.forwardMedia ?? true,
            copyMode: data.copyMode ?? true,
            removeLinks: data.removeLinks || false,
            status: BroadcastStatus.PENDING,
            totalRecipients: recipientIds.length,
            recipientIds,
            filterCriteria: data.filterCriteria,
            scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
        },
        include: {
            bot: {
                select: {
                    id: true,
                    username: true,
                    firstName: true,
                },
            },
        },
    })

    return broadcast
}

// Send a broadcast (non-blocking - queues for background processing)
const sendBroadcast = async (ctx: RequestContext, broadcastId: string) => {
    const userId = ctx.user!.id

    const broadcast = await db.broadcast.findFirst({
        where: {
            id: broadcastId,
            userId,
        },
    })

    if (!broadcast) {
        throw new Error('Broadcast not found')
    }

    if (broadcast.status !== BroadcastStatus.PENDING) {
        throw new Error('Broadcast has already been processed')
    }

    // Import and use the queue manager
    const { queueBroadcast } = await import('./broadcast-queue.service')

    // Queue the broadcast for background processing
    await queueBroadcast(broadcastId)

    // Return immediately with the broadcast info
    return {
        id: broadcast.id,
        status: 'queued',
        message: 'Broadcast has been queued for processing',
        totalRecipients: broadcast.totalRecipients,
    }
}

// Cancel a broadcast
const cancelBroadcast = async (ctx: RequestContext, broadcastId: string) => {
    const userId = ctx.user!.id

    const broadcast = await db.broadcast.findFirst({
        where: {
            id: broadcastId,
            userId,
        },
    })

    if (!broadcast) {
        throw new Error('Broadcast not found')
    }

    if (broadcast.status !== BroadcastStatus.PENDING && broadcast.status !== BroadcastStatus.IN_PROGRESS) {
        throw new Error('Broadcast cannot be cancelled')
    }

    // If broadcast is in progress, cancel the job in the queue manager
    if (broadcast.status === BroadcastStatus.IN_PROGRESS) {
        const { cancelBroadcastJob } = await import('./broadcast-queue.service')
        cancelBroadcastJob(broadcastId)
        // The queue manager will update the status to CANCELLED
        return { id: broadcastId, status: 'cancelling', message: 'Broadcast is being cancelled' }
    }

    // If pending, just update the status directly
    return db.broadcast.update({
        where: { id: broadcastId },
        data: {
            status: BroadcastStatus.CANCELLED,
            completedAt: new Date(),
        },
    })
}

// Delete a broadcast
const deleteBroadcast = async (ctx: RequestContext, broadcastId: string) => {
    const userId = ctx.user!.id

    const broadcast = await db.broadcast.findFirst({
        where: {
            id: broadcastId,
            userId,
        },
    })

    if (!broadcast) {
        throw new Error('Broadcast not found')
    }

    await db.broadcast.delete({
        where: { id: broadcastId },
    })

    return { success: true }
}

// Preview a broadcast
const previewBroadcast = async (ctx: RequestContext, data: BroadcastData) => {
    const userId = ctx.user!.id

    // Verify bot ownership
    const bot = await db.bot.findFirst({
        where: {
            id: data.botId,
            userId,
            deletedAt: null,
        },
    })

    if (!bot) {
        throw new Error('Bot not found')
    }

    // Calculate recipient count based on filters
    const where: any = {
        botId: data.botId,
        isSubscribed: true,
        isBlocked: false,
    }

    if (data.filterCriteria?.isPremium) {
        where.isPremium = true
    }

    if (data.filterCriteria?.languageCode) {
        where.languageCode = data.filterCriteria.languageCode
    }

    if (data.filterCriteria?.activeWithinDays) {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - data.filterCriteria.activeWithinDays)
        where.lastActiveAt = { gte: cutoffDate }
    }

    const recipientCount = await db.botMember.count({ where })

    let previewContent = data.content || ''

    // Add watermark preview
    if (data.watermarkEnabled && data.watermarkText) {
        if (data.watermarkPosition === 'top') {
            previewContent = `${data.watermarkText}\n\n${previewContent}`
        } else {
            previewContent = `${previewContent}\n\n${data.watermarkText}`
        }
    }

    // Remove links preview
    if (data.removeLinks && previewContent) {
        previewContent = previewContent.replace(/https?:\/\/[^\s]+/gi, '[link removed]')
    }

    return {
        recipientCount,
        previewContent,
        parseMode: data.parseMode,
        buttons: data.buttons,
        sourceGroupId: data.sourceGroupId,
        sourceMessagesCount: data.sourceMessageIds?.length || 0,
    }
}

// Duplicate a broadcast for re-sending
const duplicateBroadcast = async (ctx: RequestContext, broadcastId: string) => {
    const userId = ctx.user!.id

    const broadcast = await db.broadcast.findFirst({
        where: {
            id: broadcastId,
            userId,
        },
    })

    if (!broadcast) {
        throw new Error('Broadcast not found')
    }

    // Get fresh recipient IDs based on the same criteria
    let recipientIds: string[] = []

    if (broadcast.recipientIds && broadcast.recipientIds.length > 0) {
        // Re-fetch recipients that are still active and not blocked
        const members = await db.botMember.findMany({
            where: {
                botId: broadcast.botId,
                id: { in: broadcast.recipientIds },
                isBlocked: false,
            },
            select: { id: true },
        })
        recipientIds = members.map(m => m.id)
    }

    // If no recipients from original, get all non-blocked subscribers
    if (recipientIds.length === 0) {
        const members = await db.botMember.findMany({
            where: {
                botId: broadcast.botId,
                isBlocked: false,
            },
            select: { id: true },
        })
        recipientIds = members.map(m => m.id)
    }

    // Create a new broadcast with same content
    const newBroadcast = await db.broadcast.create({
        data: {
            userId,
            botId: broadcast.botId,
            name: `${broadcast.name || 'Broadcast'} (Copy)`,
            content: broadcast.content,
            parseMode: broadcast.parseMode,
            buttons: broadcast.buttons as any,
            sourceGroupId: broadcast.sourceGroupId,
            sourceMessageIds: broadcast.sourceMessageIds || [],
            watermarkEnabled: broadcast.watermarkEnabled,
            watermarkText: broadcast.watermarkText,
            watermarkPosition: broadcast.watermarkPosition,
            forwardMedia: broadcast.forwardMedia,
            copyMode: broadcast.copyMode,
            removeLinks: broadcast.removeLinks,
            status: BroadcastStatus.PENDING,
            totalRecipients: recipientIds.length,
            recipientIds,
            filterCriteria: broadcast.filterCriteria as any,
        },
        include: {
            bot: {
                select: {
                    id: true,
                    username: true,
                    firstName: true,
                },
            },
        },
    })

    return newBroadcast
}

export default {
    listBotsWithSubscribers,
    getSubscribers,
    getSubscriberStats,
    getSourceGroups,
    getSourceMessages,
    listBroadcasts,
    getBroadcastById,
    createBroadcast,
    sendBroadcast,
    cancelBroadcast,
    deleteBroadcast,
    previewBroadcast,
    duplicateBroadcast,
}

