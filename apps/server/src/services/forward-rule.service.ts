import { NotFoundError, BadRequestError } from '../errors/http-exception'
import type { RequestContext } from '../types/app'
import db from '@super-invite/db'
import { ForwardScheduleMode, ForwardScheduleStatus, AutomationFeatureType, TransactionType, TransactionStatus } from '@super-invite/db'
import {
  startScheduledRule,
  pauseScheduledRule,
  resumeScheduledRule,
  resetScheduledRule,
} from '../jobs/forward-scheduler'
import tokenService from './token.service'

interface CreateForwardRuleData {
  botId: string
  sourceEntityId: string
  destinationEntityId: string
  name: string
  scheduleMode?: number
  batchSize?: number
  postInterval?: number
  postIntervalUnit?: number
  deleteAfterEnabled?: boolean
  deleteInterval?: number
  deleteIntervalUnit?: number
  broadcastEnabled?: boolean
  broadcastMessage?: string
  broadcastParseMode?: string
  broadcastDeleteAfter?: boolean
  broadcastDeleteInterval?: number
  broadcastDeleteUnit?: number
  startFromMessageId?: number
  endAtMessageId?: number
  shuffle?: boolean
  repeatWhenDone?: boolean
  forwardMedia?: boolean
  forwardText?: boolean
  forwardDocuments?: boolean
  forwardStickers?: boolean
  forwardPolls?: boolean
  removeLinks?: boolean
  addWatermark?: string
  includeKeywords?: string[]
  excludeKeywords?: string[]
  hideAuthorSignature?: boolean
}

interface UpdateForwardRuleData {
  name?: string
  isActive?: boolean
  scheduleMode?: number
  batchSize?: number
  postInterval?: number
  postIntervalUnit?: number
  deleteAfterEnabled?: boolean
  deleteInterval?: number | null
  deleteIntervalUnit?: number | null
  broadcastEnabled?: boolean
  broadcastMessage?: string | null
  broadcastParseMode?: string | null
  broadcastDeleteAfter?: boolean
  broadcastDeleteInterval?: number | null
  broadcastDeleteUnit?: number | null
  startFromMessageId?: number | null
  endAtMessageId?: number | null
  shuffle?: boolean
  repeatWhenDone?: boolean
  forwardMedia?: boolean
  forwardText?: boolean
  forwardDocuments?: boolean
  forwardStickers?: boolean
  forwardPolls?: boolean
  removeLinks?: boolean
  addWatermark?: string | null
  includeKeywords?: string[]
  excludeKeywords?: string[]
  hideAuthorSignature?: boolean
}

// List all forward rules for the current user
const list = async (ctx: RequestContext, filters?: { botId?: string }) => {
  if (!ctx.user) {
    throw new BadRequestError('User not authenticated')
  }

  const where: any = {
    userId: ctx.user.id,
    deletedAt: null,
  }

  if (filters?.botId) {
    where.botId = filters.botId
  }

  const rules = await db.forwardRule.findMany({
    where,
    include: {
      bot: {
        select: {
          id: true,
          username: true,
        },
      },
      sourceEntity: {
        select: {
          id: true,
          title: true,
          username: true,
          type: true,
        },
      },
      destinationEntity: {
        select: {
          id: true,
          title: true,
          username: true,
          type: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return rules
}

// Get a specific forward rule by ID
const getById = async (ctx: RequestContext, ruleId: string) => {
  if (!ctx.user) {
    throw new BadRequestError('User not authenticated')
  }

  const rule = await db.forwardRule.findFirst({
    where: {
      id: ruleId,
      userId: ctx.user.id,
      deletedAt: null,
    },
    include: {
      bot: {
        select: {
          id: true,
          username: true,
        },
      },
      sourceEntity: {
        select: {
          id: true,
          title: true,
          username: true,
          type: true,
          telegramId: true,
        },
      },
      destinationEntity: {
        select: {
          id: true,
          title: true,
          username: true,
          type: true,
          telegramId: true,
        },
      },
    },
  })

  if (!rule) {
    throw new NotFoundError('Forward rule not found')
  }

  return rule
}

// Create a new forward rule
const create = async (ctx: RequestContext, data: CreateForwardRuleData) => {
  if (!ctx.user) {
    throw new BadRequestError('User not authenticated')
  }

  // Verify bot belongs to user
  const bot = await db.bot.findFirst({
    where: {
      id: data.botId,
      userId: ctx.user.id,
      deletedAt: null,
    },
  })

  if (!bot) {
    throw new NotFoundError('Bot not found')
  }

  // Verify source entity belongs to user and bot is linked
  const sourceEntity = await db.telegramEntity.findFirst({
    where: {
      id: data.sourceEntityId,
      userId: ctx.user.id,
      deletedAt: null,
    },
    include: {
      botLinks: {
        where: { botId: data.botId },
      },
    },
  })

  if (!sourceEntity) {
    throw new NotFoundError('Source entity not found')
  }

  if (sourceEntity.botLinks.length === 0) {
    throw new BadRequestError('Bot is not linked to the source entity')
  }

  // Verify destination entity belongs to user and bot is linked as admin
  const destEntity = await db.telegramEntity.findFirst({
    where: {
      id: data.destinationEntityId,
      userId: ctx.user.id,
      deletedAt: null,
    },
    include: {
      botLinks: {
        where: { botId: data.botId },
      },
    },
  })

  if (!destEntity) {
    throw new NotFoundError('Destination entity not found')
  }

  if (destEntity.botLinks.length === 0) {
    throw new BadRequestError('Bot is not linked to the destination entity')
  }

  if (!destEntity.botLinks[0].isAdmin) {
    throw new BadRequestError('Bot must be admin in destination entity to forward messages')
  }

  // Check for duplicate rule
  const existingRule = await db.forwardRule.findFirst({
    where: {
      botId: data.botId,
      sourceEntityId: data.sourceEntityId,
      destinationEntityId: data.destinationEntityId,
    },
  })

  if (existingRule) {
    throw new BadRequestError('A forward rule with these source and destination already exists')
  }

  // Calculate token cost for automation
  const { cost: tokensCost } = await tokenService.calculateAutomationCost(
    ctx.user.id,
    AutomationFeatureType.FORWARD_RULE
  )

  // Check user balance if tokens are required
  if (tokensCost > 0) {
    const balance = await db.tokenBalance.findUnique({
      where: { userId: ctx.user.id },
    })

    if (!balance || balance.balance < tokensCost) {
      throw new BadRequestError(
        `Insufficient tokens. Required: ${tokensCost}, Available: ${balance?.balance || 0}`
      )
    }
  }

  // Create the rule and deduct tokens in a transaction
  const rule = await db.$transaction(async (tx) => {
    // Deduct tokens if cost > 0
    if (tokensCost > 0) {
      const balance = await tx.tokenBalance.findUnique({
        where: { userId: ctx.user!.id },
      })

      const newBalance = balance!.balance - tokensCost

      await tx.tokenBalance.update({
        where: { userId: ctx.user!.id },
        data: {
          balance: newBalance,
          totalSpent: { increment: tokensCost },
        },
      })

      // Record the transaction
      await tx.tokenTransaction.create({
        data: {
          userId: ctx.user!.id,
          type: TransactionType.AUTOMATION_COST,
          status: TransactionStatus.COMPLETED,
          amount: -tokensCost,
          balanceAfter: newBalance,
          description: `Forward rule: ${data.name}`,
        },
      })
    }

    // Create the rule
    return tx.forwardRule.create({
      data: {
        userId: ctx.user!.id,
        botId: data.botId,
        sourceEntityId: data.sourceEntityId,
        destinationEntityId: data.destinationEntityId,
        name: data.name,
        scheduleMode: data.scheduleMode ?? ForwardScheduleMode.REALTIME,
        batchSize: data.batchSize ?? 1,
        postInterval: data.postInterval ?? 30,
        postIntervalUnit: data.postIntervalUnit ?? 1,
        deleteAfterEnabled: data.deleteAfterEnabled ?? false,
        deleteInterval: data.deleteInterval,
        deleteIntervalUnit: data.deleteIntervalUnit,
        broadcastEnabled: data.broadcastEnabled ?? false,
        broadcastMessage: data.broadcastMessage,
        broadcastParseMode: data.broadcastParseMode,
        broadcastDeleteAfter: data.broadcastDeleteAfter ?? false,
        broadcastDeleteInterval: data.broadcastDeleteInterval,
        broadcastDeleteUnit: data.broadcastDeleteUnit,
        startFromMessageId: data.startFromMessageId,
        endAtMessageId: data.endAtMessageId,
        shuffle: data.shuffle ?? false,
        repeatWhenDone: data.repeatWhenDone ?? false,
        forwardMedia: data.forwardMedia ?? true,
        forwardText: data.forwardText ?? true,
        forwardDocuments: data.forwardDocuments ?? true,
        forwardStickers: data.forwardStickers ?? false,
        forwardPolls: data.forwardPolls ?? true,
        removeLinks: data.removeLinks ?? false,
        addWatermark: data.addWatermark,
        includeKeywords: data.includeKeywords ?? [],
        excludeKeywords: data.excludeKeywords ?? [],
      },
      include: {
        bot: {
          select: {
            id: true,
            username: true,
          },
        },
        sourceEntity: {
          select: {
            id: true,
            title: true,
            username: true,
            type: true,
          },
        },
        destinationEntity: {
          select: {
            id: true,
            title: true,
            username: true,
            type: true,
          },
        },
      },
    })
  })

  return rule
}

// Update a forward rule
const update = async (ctx: RequestContext, ruleId: string, data: UpdateForwardRuleData) => {
  if (!ctx.user) {
    throw new BadRequestError('User not authenticated')
  }

  const rule = await db.forwardRule.findFirst({
    where: {
      id: ruleId,
      userId: ctx.user.id,
      deletedAt: null,
    },
  })

  if (!rule) {
    throw new NotFoundError('Forward rule not found')
  }

  // Filter out null and undefined values from the update data
  const updateData: any = {}

  if (data.name !== undefined) updateData.name = data.name
  if (data.isActive !== undefined) updateData.isActive = data.isActive
  if (data.scheduleMode !== undefined) updateData.scheduleMode = data.scheduleMode
  if (data.batchSize !== undefined) updateData.batchSize = data.batchSize
  if (data.postInterval !== undefined) updateData.postInterval = data.postInterval
  if (data.postIntervalUnit !== undefined) updateData.postIntervalUnit = data.postIntervalUnit
  if (data.deleteAfterEnabled !== undefined) updateData.deleteAfterEnabled = data.deleteAfterEnabled
  if (data.deleteInterval !== undefined) updateData.deleteInterval = data.deleteInterval
  if (data.deleteIntervalUnit !== undefined) updateData.deleteIntervalUnit = data.deleteIntervalUnit
  if (data.broadcastEnabled !== undefined) updateData.broadcastEnabled = data.broadcastEnabled
  if (data.broadcastMessage !== undefined) updateData.broadcastMessage = data.broadcastMessage
  if (data.broadcastParseMode !== undefined) updateData.broadcastParseMode = data.broadcastParseMode
  if (data.broadcastDeleteAfter !== undefined && data.broadcastDeleteAfter !== null) updateData.broadcastDeleteAfter = data.broadcastDeleteAfter
  if (data.broadcastDeleteInterval !== undefined) updateData.broadcastDeleteInterval = data.broadcastDeleteInterval
  if (data.broadcastDeleteUnit !== undefined) updateData.broadcastDeleteUnit = data.broadcastDeleteUnit
  if (data.startFromMessageId !== undefined) updateData.startFromMessageId = data.startFromMessageId
  if (data.endAtMessageId !== undefined) updateData.endAtMessageId = data.endAtMessageId
  if (data.shuffle !== undefined) updateData.shuffle = data.shuffle
  if (data.repeatWhenDone !== undefined) updateData.repeatWhenDone = data.repeatWhenDone
  if (data.forwardMedia !== undefined) updateData.forwardMedia = data.forwardMedia
  if (data.forwardText !== undefined) updateData.forwardText = data.forwardText
  if (data.forwardDocuments !== undefined) updateData.forwardDocuments = data.forwardDocuments
  if (data.forwardStickers !== undefined) updateData.forwardStickers = data.forwardStickers
  if (data.forwardPolls !== undefined) updateData.forwardPolls = data.forwardPolls
  if (data.removeLinks !== undefined) updateData.removeLinks = data.removeLinks
  if (data.addWatermark !== undefined) updateData.addWatermark = data.addWatermark
  if (data.includeKeywords !== undefined) updateData.includeKeywords = data.includeKeywords
  if (data.excludeKeywords !== undefined) updateData.excludeKeywords = data.excludeKeywords
  if (data.hideAuthorSignature !== undefined) updateData.hideAuthorSignature = data.hideAuthorSignature

  const updatedRule = await db.forwardRule.update({
    where: { id: ruleId },
    data: updateData,
    include: {
      bot: {
        select: {
          id: true,
          username: true,
        },
      },
      sourceEntity: {
        select: {
          id: true,
          title: true,
          username: true,
          type: true,
        },
      },
      destinationEntity: {
        select: {
          id: true,
          title: true,
          username: true,
          type: true,
        },
      },
    },
  })

  return updatedRule
}

// Delete a forward rule (hard delete)
const deleteRule = async (ctx: RequestContext, ruleId: string) => {
  if (!ctx.user) {
    throw new BadRequestError('User not authenticated')
  }

  const rule = await db.forwardRule.findFirst({
    where: {
      id: ruleId,
      userId: ctx.user.id,
    },
  })

  if (!rule) {
    throw new NotFoundError('Forward rule not found')
  }

  await db.forwardRule.delete({
    where: { id: ruleId },
  })

  return { success: true }
}

// Toggle rule active status
const toggleActive = async (ctx: RequestContext, ruleId: string) => {
  if (!ctx.user) {
    throw new BadRequestError('User not authenticated')
  }

  const rule = await db.forwardRule.findFirst({
    where: {
      id: ruleId,
      userId: ctx.user.id,
      deletedAt: null,
    },
  })

  if (!rule) {
    throw new NotFoundError('Forward rule not found')
  }

  const updatedRule = await db.forwardRule.update({
    where: { id: ruleId },
    data: { isActive: !rule.isActive },
  })

  return updatedRule
}

// Get active rules for a source entity (used by message handler)
const getActiveRulesForSource = async (botId: string, sourceTelegramId: string) => {
  const rules = await db.forwardRule.findMany({
    where: {
      botId,
      isActive: true,
      deletedAt: null,
      sourceEntity: {
        telegramId: sourceTelegramId,
      },
    },
    include: {
      destinationEntity: {
        select: {
          telegramId: true,
        },
      },
    },
  })

  return rules
}

// Increment forward count
const incrementForwardCount = async (ruleId: string) => {
  await db.forwardRule.update({
    where: { id: ruleId },
    data: {
      forwardedCount: { increment: 1 },
      lastForwardedAt: new Date(),
    },
  })
}

// Start a scheduled rule
const startRule = async (ctx: RequestContext, ruleId: string) => {
  if (!ctx.user) {
    throw new BadRequestError('User not authenticated')
  }

  const rule = await db.forwardRule.findFirst({
    where: {
      id: ruleId,
      userId: ctx.user.id,
      deletedAt: null,
    },
  })

  if (!rule) {
    throw new NotFoundError('Forward rule not found')
  }

  if (rule.scheduleMode !== ForwardScheduleMode.SCHEDULED) {
    throw new BadRequestError('Rule is not in scheduled mode')
  }

  await startScheduledRule(ruleId)
  return { success: true }
}

// Pause a scheduled rule
const pauseRule = async (ctx: RequestContext, ruleId: string) => {
  if (!ctx.user) {
    throw new BadRequestError('User not authenticated')
  }

  const rule = await db.forwardRule.findFirst({
    where: {
      id: ruleId,
      userId: ctx.user.id,
      deletedAt: null,
    },
  })

  if (!rule) {
    throw new NotFoundError('Forward rule not found')
  }

  await pauseScheduledRule(ruleId)
  return { success: true }
}

// Resume a paused rule
const resumeRule = async (ctx: RequestContext, ruleId: string) => {
  if (!ctx.user) {
    throw new BadRequestError('User not authenticated')
  }

  const rule = await db.forwardRule.findFirst({
    where: {
      id: ruleId,
      userId: ctx.user.id,
      deletedAt: null,
    },
  })

  if (!rule) {
    throw new NotFoundError('Forward rule not found')
  }

  await resumeScheduledRule(ruleId)
  return { success: true }
}

// Reset a rule to start over
const resetRule = async (ctx: RequestContext, ruleId: string) => {
  if (!ctx.user) {
    throw new BadRequestError('User not authenticated')
  }

  const rule = await db.forwardRule.findFirst({
    where: {
      id: ruleId,
      userId: ctx.user.id,
      deletedAt: null,
    },
  })

  if (!rule) {
    throw new NotFoundError('Forward rule not found')
  }

  await resetScheduledRule(ruleId)
  return { success: true }
}

export default {
  list,
  getById,
  create,
  update,
  delete: deleteRule,
  toggleActive,
  getActiveRulesForSource,
  incrementForwardCount,
  startRule,
  pauseRule,
  resumeRule,
  resetRule,
}
