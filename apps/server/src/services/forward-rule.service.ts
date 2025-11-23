import { NotFoundError, BadRequestError } from '../errors/http-exception'
import type { RequestContext } from '../types/app'
import db from '@super-invite/db'
import { ForwardScheduleMode, ForwardScheduleStatus } from '@super-invite/db'
import {
  startScheduledRule,
  pauseScheduledRule,
  resumeScheduledRule,
  resetScheduledRule,
} from '../jobs/forward-scheduler'

interface CreateForwardRuleData {
  botId: string
  sourceEntityId: string
  destinationEntityId: string
  name: string
  scheduleMode?: number
  intervalMinutes?: number
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
}

interface UpdateForwardRuleData {
  name?: string
  isActive?: boolean
  scheduleMode?: number
  intervalMinutes?: number
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
      deletedAt: null,
    },
  })

  if (existingRule) {
    throw new BadRequestError('A forward rule with these source and destination already exists')
  }

  // Create the rule
  const rule = await db.forwardRule.create({
    data: {
      userId: ctx.user.id,
      botId: data.botId,
      sourceEntityId: data.sourceEntityId,
      destinationEntityId: data.destinationEntityId,
      name: data.name,
      scheduleMode: data.scheduleMode ?? ForwardScheduleMode.REALTIME,
      intervalMinutes: data.intervalMinutes ?? 30,
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

  const updatedRule = await db.forwardRule.update({
    where: { id: ruleId },
    data: {
      name: data.name,
      isActive: data.isActive,
      scheduleMode: data.scheduleMode,
      intervalMinutes: data.intervalMinutes,
      startFromMessageId: data.startFromMessageId,
      endAtMessageId: data.endAtMessageId,
      shuffle: data.shuffle,
      repeatWhenDone: data.repeatWhenDone,
      forwardMedia: data.forwardMedia,
      forwardText: data.forwardText,
      forwardDocuments: data.forwardDocuments,
      forwardStickers: data.forwardStickers,
      forwardPolls: data.forwardPolls,
      removeLinks: data.removeLinks,
      addWatermark: data.addWatermark,
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

// Delete a forward rule (soft delete)
const deleteRule = async (ctx: RequestContext, ruleId: string) => {
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

  await db.forwardRule.update({
    where: { id: ruleId },
    data: { deletedAt: new Date() },
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
