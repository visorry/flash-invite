import { NotFoundError, BadRequestError } from '../errors/http-exception'
import type { RequestContext } from '../types/app'
import db from '@super-invite/db'
import { AutomationFeatureType, TransactionType, TransactionStatus } from '@super-invite/db'
import tokenService from './token.service'

interface CreateAutoDropData {
  botId: string
  sourceEntityId: string
  name: string
  command: string
  rateLimitEnabled?: boolean
  rateLimitCount?: number
  rateLimitWindow?: number
  rateLimitWindowUnit?: number
  rateLimitMessage?: string
  postsPerDrop?: number
  randomOrder?: boolean
  startFromMessageId?: number
  endAtMessageId?: number
  deleteAfterEnabled?: boolean
  deleteInterval?: number
  deleteIntervalUnit?: number
  forwardMedia?: boolean
  forwardText?: boolean
  forwardDocuments?: boolean
  forwardStickers?: boolean
  forwardPolls?: boolean
  removeLinks?: boolean
  addWatermark?: string
  deleteWatermark?: boolean
  hideSenderName?: boolean
  copyMode?: boolean
  includeKeywords?: string[]
  excludeKeywords?: string[]
}

interface UpdateAutoDropData {
  name?: string
  isActive?: boolean
  command?: string
  rateLimitEnabled?: boolean
  rateLimitCount?: number
  rateLimitWindow?: number
  rateLimitWindowUnit?: number
  rateLimitMessage?: string | null
  postsPerDrop?: number
  randomOrder?: boolean
  startFromMessageId?: number | null
  endAtMessageId?: number | null
  deleteAfterEnabled?: boolean
  deleteInterval?: number | null
  deleteIntervalUnit?: number | null
  forwardMedia?: boolean
  forwardText?: boolean
  forwardDocuments?: boolean
  forwardStickers?: boolean
  forwardPolls?: boolean
  removeLinks?: boolean
  addWatermark?: string | null
  deleteWatermark?: boolean
  hideSenderName?: boolean
  copyMode?: boolean
  includeKeywords?: string[]
  excludeKeywords?: string[]
}


// List all auto drop rules for the current user
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

  const rules = await db.autoDropRule.findMany({
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
    },
    orderBy: { createdAt: 'desc' },
  })

  return rules
}

// Get a single auto drop rule by ID
const getById = async (ctx: RequestContext, ruleId: string) => {
  if (!ctx.user) {
    throw new BadRequestError('User not authenticated')
  }

  const rule = await db.autoDropRule.findFirst({
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
    },
  })

  if (!rule) {
    throw new NotFoundError('Auto drop rule not found')
  }

  return rule
}

// Create a new auto drop rule
const create = async (ctx: RequestContext, data: CreateAutoDropData) => {
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

  // Check for duplicate command for this bot
  const existingRule = await db.autoDropRule.findFirst({
    where: {
      botId: data.botId,
      command: data.command,
      deletedAt: null,
    },
  })

  if (existingRule) {
    throw new BadRequestError(`Command ${data.command} is already used by another rule for this bot`)
  }

  // Calculate token cost for automation
  const { cost: tokensCost } = await tokenService.calculateAutomationCost(
    ctx.user.id,
    AutomationFeatureType.AUTO_DROP
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
          description: `Auto drop rule: ${data.name}`,
        },
      })
    }

    // Create the rule
    return tx.autoDropRule.create({
      data: {
        userId: ctx.user!.id,
        botId: data.botId,
        sourceEntityId: data.sourceEntityId,
        name: data.name,
        command: data.command,
        rateLimitEnabled: data.rateLimitEnabled ?? true,
        rateLimitCount: data.rateLimitCount ?? 5,
        rateLimitWindow: data.rateLimitWindow ?? 60,
        rateLimitWindowUnit: data.rateLimitWindowUnit ?? 0,
        rateLimitMessage: data.rateLimitMessage,
        postsPerDrop: data.postsPerDrop ?? 1,
        randomOrder: data.randomOrder ?? false,
        startFromMessageId: data.startFromMessageId,
        endAtMessageId: data.endAtMessageId,
        deleteAfterEnabled: data.deleteAfterEnabled ?? false,
        deleteInterval: data.deleteInterval,
        deleteIntervalUnit: data.deleteIntervalUnit,
        forwardMedia: data.forwardMedia ?? true,
        forwardText: data.forwardText ?? true,
        forwardDocuments: data.forwardDocuments ?? true,
        forwardStickers: data.forwardStickers ?? false,
        forwardPolls: data.forwardPolls ?? true,
        removeLinks: data.removeLinks ?? false,
        addWatermark: data.addWatermark,
        deleteWatermark: data.deleteWatermark ?? true,
        hideSenderName: data.hideSenderName ?? false,
        copyMode: data.copyMode ?? false,
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
      },
    })
  })

  return rule
}


// Update an auto drop rule
const update = async (ctx: RequestContext, ruleId: string, data: UpdateAutoDropData) => {
  if (!ctx.user) {
    throw new BadRequestError('User not authenticated')
  }

  const rule = await db.autoDropRule.findFirst({
    where: {
      id: ruleId,
      userId: ctx.user.id,
      deletedAt: null,
    },
  })

  if (!rule) {
    throw new NotFoundError('Auto drop rule not found')
  }

  // Check for duplicate command if command is being changed
  if (data.command && data.command !== rule.command) {
    const existingRule = await db.autoDropRule.findFirst({
      where: {
        botId: rule.botId,
        command: data.command,
        deletedAt: null,
        id: { not: ruleId },
      },
    })

    if (existingRule) {
      throw new BadRequestError(`Command ${data.command} is already used by another rule for this bot`)
    }
  }

  const updatedRule = await db.autoDropRule.update({
    where: { id: ruleId },
    data: {
      name: data.name,
      isActive: data.isActive,
      command: data.command,
      rateLimitEnabled: data.rateLimitEnabled,
      rateLimitCount: data.rateLimitCount,
      rateLimitWindow: data.rateLimitWindow,
      rateLimitWindowUnit: data.rateLimitWindowUnit,
      rateLimitMessage: data.rateLimitMessage,
      postsPerDrop: data.postsPerDrop,
      randomOrder: data.randomOrder,
      startFromMessageId: data.startFromMessageId,
      endAtMessageId: data.endAtMessageId,
      deleteAfterEnabled: data.deleteAfterEnabled,
      deleteInterval: data.deleteInterval,
      deleteIntervalUnit: data.deleteIntervalUnit,
      forwardMedia: data.forwardMedia,
      forwardText: data.forwardText,
      forwardDocuments: data.forwardDocuments,
      forwardStickers: data.forwardStickers,
      forwardPolls: data.forwardPolls,
      removeLinks: data.removeLinks,
      addWatermark: data.addWatermark,
      deleteWatermark: data.deleteWatermark,
      hideSenderName: data.hideSenderName,
      copyMode: data.copyMode,
      includeKeywords: data.includeKeywords,
      excludeKeywords: data.excludeKeywords,
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
    },
  })

  return updatedRule
}

// Toggle rule active status
const toggleActive = async (ctx: RequestContext, ruleId: string) => {
  if (!ctx.user) {
    throw new BadRequestError('User not authenticated')
  }

  const rule = await db.autoDropRule.findFirst({
    where: {
      id: ruleId,
      userId: ctx.user.id,
      deletedAt: null,
    },
  })

  if (!rule) {
    throw new NotFoundError('Auto drop rule not found')
  }

  const updatedRule = await db.autoDropRule.update({
    where: { id: ruleId },
    data: {
      isActive: !rule.isActive,
    },
  })

  return updatedRule
}

// Delete an auto drop rule
const deleteRule = async (ctx: RequestContext, ruleId: string) => {
  if (!ctx.user) {
    throw new BadRequestError('User not authenticated')
  }

  const rule = await db.autoDropRule.findFirst({
    where: {
      id: ruleId,
      userId: ctx.user.id,
      deletedAt: null,
    },
  })

  if (!rule) {
    throw new NotFoundError('Auto drop rule not found')
  }

  await db.autoDropRule.delete({
    where: { id: ruleId },
  })

  return { success: true }
}

// Get active rules for a bot (used by bot handler)
const getActiveRulesForBot = async (botId: string) => {
  const rules = await db.autoDropRule.findMany({
    where: {
      botId,
      isActive: true,
      deletedAt: null,
    },
    include: {
      sourceEntity: true,
    },
  })

  return rules
}

// Check and update rate limit for a user
const checkRateLimit = async (ruleId: string, telegramUserId: string): Promise<{ allowed: boolean; remaining: number; resetIn: number }> => {
  const rule = await db.autoDropRule.findUnique({
    where: { id: ruleId },
  })

  if (!rule || !rule.rateLimitEnabled) {
    return { allowed: true, remaining: -1, resetIn: 0 }
  }

  // Calculate window in seconds based on unit
  let windowSeconds = rule.rateLimitWindow
  switch (rule.rateLimitWindowUnit) {
    case 0: // seconds
      windowSeconds = rule.rateLimitWindow
      break
    case 1: // minutes
      windowSeconds = rule.rateLimitWindow * 60
      break
    case 2: // hours
      windowSeconds = rule.rateLimitWindow * 60 * 60
      break
    case 3: // days
      windowSeconds = rule.rateLimitWindow * 24 * 60 * 60
      break
  }

  const now = new Date()
  const windowStart = new Date(now.getTime() - windowSeconds * 1000)

  // Get or create rate limit record
  let rateLimit = await db.autoDropUserRateLimit.findUnique({
    where: {
      ruleId_telegramUserId: {
        ruleId,
        telegramUserId,
      },
    },
  })

  if (!rateLimit || rateLimit.windowStart < windowStart) {
    // Create new window or reset expired window
    rateLimit = await db.autoDropUserRateLimit.upsert({
      where: {
        ruleId_telegramUserId: {
          ruleId,
          telegramUserId,
        },
      },
      create: {
        ruleId,
        telegramUserId,
        requestCount: 1,
        windowStart: now,
      },
      update: {
        requestCount: 1,
        windowStart: now,
      },
    })

    return {
      allowed: true,
      remaining: rule.rateLimitCount - 1,
      resetIn: windowSeconds,
    }
  }

  // Check if within limit
  if (rateLimit.requestCount >= rule.rateLimitCount) {
    const resetIn = Math.ceil((rateLimit.windowStart.getTime() + windowSeconds * 1000 - now.getTime()) / 1000)
    return {
      allowed: false,
      remaining: 0,
      resetIn: Math.max(0, resetIn),
    }
  }

  // Increment counter
  await db.autoDropUserRateLimit.update({
    where: {
      ruleId_telegramUserId: {
        ruleId,
        telegramUserId,
      },
    },
    data: {
      requestCount: { increment: 1 },
    },
  })

  return {
    allowed: true,
    remaining: rule.rateLimitCount - rateLimit.requestCount - 1,
    resetIn: Math.ceil((rateLimit.windowStart.getTime() + windowSeconds * 1000 - now.getTime()) / 1000),
  }
}

// Get next message ID for a user
const getNextMessageId = async (ruleId: string, telegramUserId: string): Promise<number | null> => {
  const rule = await db.autoDropRule.findUnique({
    where: { id: ruleId },
  })

  if (!rule) return null

  const startId = rule.startFromMessageId || 1
  const endId = rule.endAtMessageId || startId + 999

  // Get user's last message ID
  const rateLimit = await db.autoDropUserRateLimit.findUnique({
    where: {
      ruleId_telegramUserId: {
        ruleId,
        telegramUserId,
      },
    },
  })

  let nextId: number

  if (rule.randomOrder) {
    // Random message within range
    nextId = Math.floor(Math.random() * (endId - startId + 1)) + startId
  } else {
    // Sequential - get next after last sent
    const lastId = rateLimit?.lastMessageId || startId - 1
    nextId = lastId + 1

    // Wrap around if reached end
    if (nextId > endId) {
      nextId = startId
    }
  }

  return nextId
}

// Update last message ID for a user
const updateLastMessageId = async (ruleId: string, telegramUserId: string, messageId: number) => {
  await db.autoDropUserRateLimit.upsert({
    where: {
      ruleId_telegramUserId: {
        ruleId,
        telegramUserId,
      },
    },
    create: {
      ruleId,
      telegramUserId,
      requestCount: 0,
      windowStart: new Date(),
      lastMessageId: messageId,
    },
    update: {
      lastMessageId: messageId,
    },
  })
}

// Increment drop count
const incrementDropCount = async (ruleId: string) => {
  await db.autoDropRule.update({
    where: { id: ruleId },
    data: {
      totalDrops: { increment: 1 },
      lastDropAt: new Date(),
    },
  })
}

// Reset auto drop rule - clears all user progress and stats
const reset = async (ctx: RequestContext, ruleId: string) => {
  if (!ctx.user) {
    throw new BadRequestError('User not authenticated')
  }

  const rule = await db.autoDropRule.findFirst({
    where: {
      id: ruleId,
      userId: ctx.user.id,
      deletedAt: null,
    },
  })

  if (!rule) {
    throw new NotFoundError('Auto drop rule not found')
  }

  // Delete all user rate limits/progress for this rule
  await db.autoDropUserRateLimit.deleteMany({
    where: { ruleId },
  })

  // Reset rule stats
  await db.autoDropRule.update({
    where: { id: ruleId },
    data: {
      totalDrops: 0,
      lastDropAt: null,
    },
  })

  return { success: true }
}

export default {
  list,
  getById,
  create,
  update,
  toggleActive,
  delete: deleteRule,
  reset,
  getActiveRulesForBot,
  checkRateLimit,
  getNextMessageId,
  updateLastMessageId,
  incrementDropCount,
}
