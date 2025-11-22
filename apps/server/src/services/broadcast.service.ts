import type { RequestContext } from '../types/app'
import db, { BroadcastStatus } from '@super-invite/db'
import { botManager } from '../bot'

// Template operations
const listTemplates = async (ctx: RequestContext) => {
  const pagination = ctx.pagination || {}

  const [items, total] = await Promise.all([
    db.broadcastTemplate.findMany({
      where: { deletedAt: null },
      skip: pagination.skip,
      take: pagination.take,
      orderBy: pagination.orderBy || { createdAt: 'desc' },
    }),
    db.broadcastTemplate.count({
      where: { deletedAt: null },
    }),
  ])

  return {
    items,
    total,
    page: pagination.current || 1,
    size: pagination.take || 20,
  }
}

const getTemplateById = async (id: string) => {
  return db.broadcastTemplate.findFirst({
    where: { id, deletedAt: null },
  })
}

const createTemplate = async (data: {
  name: string
  content: string
  parseMode?: string
  buttons?: any
}) => {
  return db.broadcastTemplate.create({
    data: {
      name: data.name,
      content: data.content,
      parseMode: data.parseMode || null,
      buttons: data.buttons || null,
    },
  })
}

const updateTemplate = async (
  id: string,
  data: {
    name?: string
    content?: string
    parseMode?: string
    buttons?: any
    isActive?: boolean
  }
) => {
  return db.broadcastTemplate.update({
    where: { id },
    data,
  })
}

const deleteTemplate = async (id: string) => {
  return db.broadcastTemplate.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
}

// Broadcast operations
const listBroadcasts = async (ctx: RequestContext) => {
  const pagination = ctx.pagination || {}

  const [items, total] = await Promise.all([
    db.broadcast.findMany({
      include: { template: true },
      skip: pagination.skip,
      take: pagination.take,
      orderBy: pagination.orderBy || { createdAt: 'desc' },
    }),
    db.broadcast.count(),
  ])

  return {
    items,
    total,
    page: pagination.current || 1,
    size: pagination.take || 20,
  }
}

const getBroadcastById = async (id: string) => {
  return db.broadcast.findUnique({
    where: { id },
    include: { template: true },
  })
}

interface BroadcastFilter {
  isPremium?: boolean
  languageCode?: string
  activeWithinDays?: number
}

const getFilteredBotMembers = async (ctx: RequestContext, filter?: BroadcastFilter) => {
  const pagination = ctx.pagination || {}
  const where: any = {}

  if (filter?.isPremium !== undefined) {
    where.isPremium = filter.isPremium
  }

  if (filter?.languageCode) {
    where.languageCode = filter.languageCode
  }

  if (filter?.activeWithinDays) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - filter.activeWithinDays)
    where.lastActiveAt = { gte: cutoffDate }
  }

  const [items, total] = await Promise.all([
    db.botMember.findMany({
      where,
      skip: pagination.skip,
      take: pagination.take,
      orderBy: pagination.orderBy || { lastActiveAt: 'desc' },
      select: {
        id: true,
        telegramUserId: true,
        username: true,
        firstName: true,
        lastName: true,
        isPremium: true,
        languageCode: true,
        lastActiveAt: true,
      },
    }),
    db.botMember.count({ where }),
  ])

  return {
    items,
    total,
    page: pagination.current || 1,
    size: pagination.take || 20,
  }
}

const createBroadcast = async (data: {
  templateId?: string
  content: string
  parseMode?: string
  buttons?: any
  recipientIds: string[]
  filterCriteria?: BroadcastFilter
}) => {
  return db.broadcast.create({
    data: {
      templateId: data.templateId || null,
      content: data.content,
      parseMode: data.parseMode || null,
      buttons: data.buttons || null,
      status: BroadcastStatus.PENDING,
      totalRecipients: data.recipientIds.length,
      recipientIds: data.recipientIds,
      filterCriteria: data.filterCriteria || null,
    },
  })
}

const sendBroadcast = async (broadcastId: string) => {
  // Get the broadcast
  const broadcast = await db.broadcast.findUnique({
    where: { id: broadcastId },
  })

  if (!broadcast) {
    throw new Error('Broadcast not found')
  }

  if (broadcast.status !== BroadcastStatus.PENDING) {
    throw new Error('Broadcast has already been processed')
  }

  // Update status to in progress
  await db.broadcast.update({
    where: { id: broadcastId },
    data: {
      status: BroadcastStatus.IN_PROGRESS,
      startedAt: new Date(),
    },
  })

  // Get bot members by IDs
  const botMembers = await db.botMember.findMany({
    where: {
      id: { in: broadcast.recipientIds },
    },
  })

  let sentCount = 0
  let failedCount = 0

  // Build message options
  const options: any = {}
  if (broadcast.parseMode) {
    options.parse_mode = broadcast.parseMode
  }

  // Add inline keyboard if buttons exist
  if (broadcast.buttons && Array.isArray(broadcast.buttons)) {
    options.reply_markup = {
      inline_keyboard: broadcast.buttons,
    }
  }

  // Get the default bot
  const bot = botManager.getDefaultBot()
  if (!bot) {
    throw new Error('No bot available for broadcasting')
  }

  // Send messages
  for (const member of botMembers) {
    try {
      await bot.telegram.sendMessage(
        member.telegramUserId,
        broadcast.content,
        options
      )
      sentCount++
    } catch (error) {
      console.error(`Failed to send to ${member.telegramUserId}:`, error)
      failedCount++
    }

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 50))
  }

  // Update broadcast with results
  const finalStatus =
    failedCount === broadcast.totalRecipients
      ? BroadcastStatus.FAILED
      : BroadcastStatus.COMPLETED

  return db.broadcast.update({
    where: { id: broadcastId },
    data: {
      status: finalStatus,
      sentCount,
      failedCount,
      completedAt: new Date(),
    },
  })
}

const cancelBroadcast = async (id: string) => {
  return db.broadcast.update({
    where: { id },
    data: {
      status: BroadcastStatus.CANCELLED,
      completedAt: new Date(),
    },
  })
}

// Get broadcast stats
const getStats = async () => {
  const [totalBroadcasts, totalSent, recentBroadcasts] = await Promise.all([
    db.broadcast.count(),
    db.broadcast.aggregate({
      _sum: { sentCount: true },
    }),
    db.broadcast.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
    }),
  ])

  return {
    totalBroadcasts,
    totalMessagesSent: totalSent._sum.sentCount || 0,
    recentBroadcasts,
  }
}

export default {
  // Templates
  listTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  // Broadcasts
  listBroadcasts,
  getBroadcastById,
  getFilteredBotMembers,
  createBroadcast,
  sendBroadcast,
  cancelBroadcast,
  getStats,
}
