import { NotFoundError, BadRequestError } from '../errors/http-exception'
import type { RequestContext } from '../types/app'
import db from '@super-invite/db'
import { AutomationFeatureType, TransactionType, TransactionStatus } from '@super-invite/db'
import { getBot } from '../bot/bot-manager'
import tokenService from './token.service'

interface CreateAutoApprovalData {
  botId: string
  telegramEntityId: string
  name: string
  approvalMode?: number
  delaySeconds?: number
  requirePremium?: boolean
  requireUsername?: boolean
  minAccountAge?: number
  blockedCountries?: string[]
  sendWelcomeMsg?: boolean
  welcomeMessage?: string
}

interface UpdateAutoApprovalData {
  name?: string
  isActive?: boolean
  approvalMode?: number
  delaySeconds?: number
  requirePremium?: boolean
  requireUsername?: boolean
  minAccountAge?: number | null
  blockedCountries?: string[]
  sendWelcomeMsg?: boolean
  welcomeMessage?: string | null
}

// List auto-approval rules
const list = async (ctx: RequestContext, params?: { botId?: string }) => {
  if (!ctx.user) {
    throw new BadRequestError('User not authenticated')
  }

  const where: any = {
    userId: ctx.user.id,
  }

  if (params?.botId) {
    where.botId = params.botId
  }

  const rules = await db.autoApprovalRule.findMany({
    where,
    include: {
      bot: {
        select: {
          id: true,
          username: true,
        },
      },
      telegramEntity: {
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

// Get a specific rule by ID
const getById = async (ctx: RequestContext, ruleId: string) => {
  if (!ctx.user) {
    throw new BadRequestError('User not authenticated')
  }

  const rule = await db.autoApprovalRule.findFirst({
    where: {
      id: ruleId,
      userId: ctx.user.id,
    },
    include: {
      bot: {
        select: {
          id: true,
          username: true,
        },
      },
      telegramEntity: {
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
    throw new NotFoundError('Auto-approval rule not found')
  }

  return rule
}

// Create a new auto-approval rule
const create = async (ctx: RequestContext, data: CreateAutoApprovalData) => {
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

  // Verify entity belongs to user and bot is linked
  const entity = await db.telegramEntity.findFirst({
    where: {
      id: data.telegramEntityId,
      userId: ctx.user.id,
      deletedAt: null,
      botLinks: {
        some: {
          botId: data.botId,
        },
      },
    },
  })

  if (!entity) {
    throw new NotFoundError('Entity not found or not linked to this bot')
  }

  // Check for existing rule
  const existingRule = await db.autoApprovalRule.findFirst({
    where: {
      botId: data.botId,
      telegramEntityId: data.telegramEntityId,
    },
  })

  if (existingRule) {
    throw new BadRequestError('An auto-approval rule already exists for this entity')
  }

  // Calculate token cost for automation
  const { cost: tokensCost } = await tokenService.calculateAutomationCost(
    ctx.user.id,
    AutomationFeatureType.AUTO_APPROVAL
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
          description: `Auto-approval rule: ${data.name}`,
        },
      })
    }

    // Create the rule
    return tx.autoApprovalRule.create({
      data: {
        userId: ctx.user!.id,
        botId: data.botId,
        telegramEntityId: data.telegramEntityId,
        name: data.name,
        approvalMode: data.approvalMode ?? 0,
        delaySeconds: data.delaySeconds ?? 0,
        requirePremium: data.requirePremium ?? false,
        requireUsername: data.requireUsername ?? false,
        minAccountAge: data.minAccountAge,
        blockedCountries: data.blockedCountries ?? [],
        sendWelcomeMsg: data.sendWelcomeMsg ?? false,
        welcomeMessage: data.welcomeMessage,
      },
      include: {
        bot: {
          select: {
            id: true,
            username: true,
          },
        },
        telegramEntity: {
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

// Update an auto-approval rule
const update = async (ctx: RequestContext, ruleId: string, data: UpdateAutoApprovalData) => {
  if (!ctx.user) {
    throw new BadRequestError('User not authenticated')
  }

  const rule = await db.autoApprovalRule.findFirst({
    where: {
      id: ruleId,
      userId: ctx.user.id,
    },
  })

  if (!rule) {
    throw new NotFoundError('Auto-approval rule not found')
  }

  const updatedRule = await db.autoApprovalRule.update({
    where: { id: ruleId },
    data: {
      name: data.name,
      isActive: data.isActive,
      approvalMode: data.approvalMode,
      delaySeconds: data.delaySeconds,
      requirePremium: data.requirePremium,
      requireUsername: data.requireUsername,
      minAccountAge: data.minAccountAge,
      blockedCountries: data.blockedCountries,
      sendWelcomeMsg: data.sendWelcomeMsg,
      welcomeMessage: data.welcomeMessage,
    },
    include: {
      bot: {
        select: {
          id: true,
          username: true,
        },
      },
      telegramEntity: {
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

// Delete an auto-approval rule
const deleteRule = async (ctx: RequestContext, ruleId: string) => {
  if (!ctx.user) {
    throw new BadRequestError('User not authenticated')
  }

  const rule = await db.autoApprovalRule.findFirst({
    where: {
      id: ruleId,
      userId: ctx.user.id,
    },
  })

  if (!rule) {
    throw new NotFoundError('Auto-approval rule not found')
  }

  await db.autoApprovalRule.delete({
    where: { id: ruleId },
  })

  return { success: true }
}

// Toggle rule active status
const toggleActive = async (ctx: RequestContext, ruleId: string) => {
  if (!ctx.user) {
    throw new BadRequestError('User not authenticated')
  }

  const rule = await db.autoApprovalRule.findFirst({
    where: {
      id: ruleId,
      userId: ctx.user.id,
    },
  })

  if (!rule) {
    throw new NotFoundError('Auto-approval rule not found')
  }

  const updatedRule = await db.autoApprovalRule.update({
    where: { id: ruleId },
    data: {
      isActive: !rule.isActive,
    },
  })

  return updatedRule
}

// Process a join request (called from bot handler)
const processJoinRequest = async (
  botId: string,
  chatId: string,
  userId: string,
  userInfo: {
    username?: string
    firstName?: string
    isPremium?: boolean
  }
) => {
  // Find the auto-approval rule for this chat
  const rule = await db.autoApprovalRule.findFirst({
    where: {
      botId,
      telegramEntity: {
        telegramId: chatId,
      },
      isActive: true,
    },
    include: {
      telegramEntity: true,
    },
  })

  if (!rule) {
    return { action: 'none', reason: 'No active rule found' }
  }

  // Check filters
  if (rule.requireUsername && !userInfo.username) {
    await db.autoApprovalRule.update({
      where: { id: rule.id },
      data: { rejectedCount: { increment: 1 } },
    })
    return { action: 'reject', reason: 'Username required' }
  }

  if (rule.requirePremium && !userInfo.isPremium) {
    await db.autoApprovalRule.update({
      where: { id: rule.id },
      data: { rejectedCount: { increment: 1 } },
    })
    return { action: 'reject', reason: 'Premium required' }
  }

  // Get the bot
  const bot = getBot(botId)
  if (!bot) {
    return { action: 'error', reason: 'Bot not found' }
  }

  // Approve based on mode
  if (rule.approvalMode === 0) {
    // Instant approval
    try {
      await bot.telegram.approveChatJoinRequest(chatId, userId)

      // Update stats
      await db.autoApprovalRule.update({
        where: { id: rule.id },
        data: {
          approvedCount: { increment: 1 },
          lastApprovedAt: new Date(),
        },
      })

      // Send welcome message if enabled
      if (rule.sendWelcomeMsg && rule.welcomeMessage) {
        try {
          await bot.telegram.sendMessage(userId, rule.welcomeMessage)
        } catch (e) {
          console.error('[AUTO_APPROVAL] Failed to send welcome message:', e)
        }
      }

      return { action: 'approved', reason: 'Instant approval' }
    } catch (error: any) {
      console.error('[AUTO_APPROVAL] Failed to approve:', error)
      return { action: 'error', reason: error.message }
    }
  } else if (rule.approvalMode === 1) {
    // Delayed approval - schedule for later
    setTimeout(async () => {
      try {
        await bot.telegram.approveChatJoinRequest(chatId, userId)
        await db.autoApprovalRule.update({
          where: { id: rule.id },
          data: {
            approvedCount: { increment: 1 },
            lastApprovedAt: new Date(),
          },
        })

        if (rule.sendWelcomeMsg && rule.welcomeMessage) {
          try {
            await bot.telegram.sendMessage(userId, rule.welcomeMessage)
          } catch (e) {
            console.error('[AUTO_APPROVAL] Failed to send welcome message:', e)
          }
        }
      } catch (error) {
        console.error('[AUTO_APPROVAL] Delayed approval failed:', error)
      }
    }, rule.delaySeconds * 1000)

    return { action: 'scheduled', reason: `Approval scheduled in ${rule.delaySeconds}s` }
  }

  return { action: 'none', reason: 'Unknown approval mode' }
}

export default {
  list,
  getById,
  create,
  update,
  delete: deleteRule,
  toggleActive,
  processJoinRequest,
}
