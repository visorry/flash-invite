import { NotFoundError, BadRequestError } from '../errors/http-exception'
import type { RequestContext } from '../types/app'
import db from '@super-invite/db'
import { TransactionType } from '@super-invite/db'
import { getBot } from '../bot/bot-manager'
import tokenService from './token.service'
import cooldownService from './auto-drop-cooldown.service'
import type { AutoDropRequestResult } from '../types/auto-drop.types'

/**
 * Calculate delay in milliseconds based on interval and unit
 * @param interval - The interval value
 * @param unit - 0=seconds, 1=minutes, 2=hours, 3=days
 */
function calculateDelayInMs(interval: number, unit: number): number {
  switch (unit) {
    case 0: // seconds
      return interval * 1000
    case 1: // minutes
      return interval * 60 * 1000
    case 2: // hours
      return interval * 60 * 60 * 1000
    case 3: // days
      return interval * 24 * 60 * 60 * 1000
    default:
      return interval * 1000
  }
}

/**
 * Format delay text for display
 */
function formatDelayText(interval: number, unit: number): string {
  const units = ['second', 'minute', 'hour', 'day']
  const unitName = units[unit] || 'second'
  return `${interval} ${unitName}${interval !== 1 ? 's' : ''}`
}

interface CreateAutoDropData {
  botId: string
  telegramEntityId: string
  name: string
  startPostId?: number
  endPostId?: number
  batchSize?: number
  dropInterval?: number
  dropUnit?: number
  deliveryMode?: number
  randomSelection?: boolean
  totalPostsInSource?: number
  deleteAfterEnabled?: boolean
  deleteTimeout?: number
  vipMessageEnabled?: boolean
  vipMessage?: string
  cooldownEnabled?: boolean
  cooldownSeconds?: number
  welcomeMessage?: string
  hideAuthorSignature?: boolean
}

interface UpdateAutoDropData {
  name?: string
  isActive?: boolean
  startPostId?: number | null
  endPostId?: number | null
  batchSize?: number
  dropInterval?: number
  dropUnit?: number
  deliveryMode?: number
  randomSelection?: boolean
  totalPostsInSource?: number | null
  deleteAfterEnabled?: boolean
  deleteTimeout?: number
  vipMessageEnabled?: boolean
  vipMessage?: string | null
  cooldownEnabled?: boolean
  cooldownSeconds?: number
  welcomeMessage?: string | null
  hideAuthorSignature?: boolean
}

// List auto-drop rules
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

  const rules = await db.autoDropRule.findMany({
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

  return rules.map(rule => ({
    ...rule,
    delayText: formatDelayText(rule.dropInterval, rule.dropUnit),
  }))
}

// Get auto-drop rule by ID
const getById = async (ctx: RequestContext, id: string) => {
  if (!ctx.user) {
    throw new BadRequestError('User not authenticated')
  }

  const rule = await db.autoDropRule.findFirst({
    where: {
      id,
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
        },
      },
    },
  })

  if (!rule) {
    throw new NotFoundError('Auto-drop rule not found')
  }

  return {
    ...rule,
    delayText: formatDelayText(rule.dropInterval, rule.dropUnit),
  }
}

// Create auto-drop rule
const create = async (ctx: RequestContext, data: CreateAutoDropData) => {
  if (!ctx.user) {
    throw new BadRequestError('User not authenticated')
  }

  // Verify bot ownership
  const bot = await db.bot.findFirst({
    where: {
      id: data.botId,
      userId: ctx.user.id,
    },
  })

  if (!bot) {
    throw new NotFoundError('Bot not found')
  }

  // Verify telegram entity ownership
  const telegramEntity = await db.telegramEntity.findFirst({
    where: {
      id: data.telegramEntityId,
      userId: ctx.user.id,
    },
  })

  if (!telegramEntity) {
    throw new NotFoundError('Telegram entity not found')
  }

  // Check if rule already exists for this bot-entity combination
  const existingRule = await db.autoDropRule.findFirst({
    where: {
      botId: data.botId,
      telegramEntityId: data.telegramEntityId,
    },
  })

  if (existingRule) {
    throw new BadRequestError('Auto-drop rule already exists for this bot and group')
  }

  // Check automation cost and user's token balance
  const automationCost = await db.automationCostConfig.findFirst({
    where: {
      featureType: 2, // AUTO_DROP
      isActive: true,
    },
  })

  if (!automationCost) {
    throw new BadRequestError('Auto-drop feature is not available')
  }

  // Count existing rules for this user
  const existingRulesCount = await db.autoDropRule.count({
    where: {
      userId: ctx.user.id,
    },
  })

  const tokensRequired = Math.max(0, (existingRulesCount + 1 - automationCost.freeRulesAllowed) * automationCost.costPerRule)

  if (tokensRequired > 0) {
    const balance = await tokenService.getBalance(ctx)
    if (balance.balance < tokensRequired) {
      throw new BadRequestError(`Insufficient tokens. Required: ${tokensRequired}, Available: ${balance.balance}`)
    }
  }

  // Create rule and deduct tokens in transaction
  const result = await db.$transaction(async (tx) => {
    // Create the rule
    const rule = await tx.autoDropRule.create({
      data: {
        userId: ctx.user!.id,
        botId: data.botId,
        telegramEntityId: data.telegramEntityId,
        name: data.name,
        startPostId: data.startPostId,
        endPostId: data.endPostId,
        batchSize: data.batchSize || 1,
        dropInterval: data.dropInterval || 1,
        dropUnit: data.dropUnit || 1,
        currentPostId: data.startPostId,
        deliveryMode: data.deliveryMode || 0,
        randomSelection: data.randomSelection || false,
        totalPostsInSource: data.totalPostsInSource,
        deleteAfterEnabled: data.deleteAfterEnabled || false,
        deleteTimeout: data.deleteTimeout || 1200,
        vipMessageEnabled: data.vipMessageEnabled || false,
        vipMessage: data.vipMessage,
        cooldownEnabled: data.cooldownEnabled || false,
        cooldownSeconds: data.cooldownSeconds || 480,
        welcomeMessage: data.welcomeMessage,
        hideAuthorSignature: data.hideAuthorSignature || false,
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

    // Deduct tokens if required
    if (tokensRequired > 0) {
      await tokenService.deductTokens(
        ctx,
        ctx.user!.id,
        tokensRequired,
        TransactionType.AUTOMATION_COST,
        `Auto-drop rule: ${data.name}`
      )
    }

    return rule
  })

  return {
    ...result,
    delayText: formatDelayText(result.dropInterval, result.dropUnit),
  }
}

// Update auto-drop rule
const update = async (ctx: RequestContext, id: string, data: UpdateAutoDropData) => {
  if (!ctx.user) {
    throw new BadRequestError('User not authenticated')
  }

  const existingRule = await db.autoDropRule.findFirst({
    where: {
      id,
      userId: ctx.user.id,
    },
  })

  if (!existingRule) {
    throw new NotFoundError('Auto-drop rule not found')
  }

  console.log('[AUTO_DROP_UPDATE] Received data:', {
    hideAuthorSignature: data.hideAuthorSignature,
    typeof: typeof data.hideAuthorSignature,
    allData: data
  })

  const rule = await db.autoDropRule.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date(),
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

  console.log('[AUTO_DROP_UPDATE] Saved rule:', {
    hideAuthorSignature: rule.hideAuthorSignature,
    typeof: typeof rule.hideAuthorSignature
  })

  return {
    ...rule,
    delayText: formatDelayText(rule.dropInterval, rule.dropUnit),
  }
}

// Toggle active status
const toggleActive = async (ctx: RequestContext, id: string) => {
  if (!ctx.user) {
    throw new BadRequestError('User not authenticated')
  }

  const existingRule = await db.autoDropRule.findFirst({
    where: {
      id,
      userId: ctx.user.id,
    },
  })

  if (!existingRule) {
    throw new NotFoundError('Auto-drop rule not found')
  }

  const rule = await db.autoDropRule.update({
    where: { id },
    data: {
      isActive: !existingRule.isActive,
      updatedAt: new Date(),
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

  return {
    ...rule,
    delayText: formatDelayText(rule.dropInterval, rule.dropUnit),
  }
}

// Delete auto-drop rule
const deleteRule = async (ctx: RequestContext, id: string) => {
  if (!ctx.user) {
    throw new BadRequestError('User not authenticated')
  }

  const existingRule = await db.autoDropRule.findFirst({
    where: {
      id,
      userId: ctx.user.id,
    },
  })

  if (!existingRule) {
    throw new NotFoundError('Auto-drop rule not found')
  }

  await db.autoDropRule.delete({
    where: { id },
  })

  return { success: true }
}

// Start auto-drop rule
const start = async (ctx: RequestContext, id: string) => {
  if (!ctx.user) {
    throw new BadRequestError('User not authenticated')
  }

  const rule = await db.autoDropRule.findFirst({
    where: {
      id,
      userId: ctx.user.id,
    },
  })

  if (!rule) {
    throw new NotFoundError('Auto-drop rule not found')
  }

  if (!rule.isActive) {
    throw new BadRequestError('Rule must be active to start')
  }

  const nextRunAt = new Date(Date.now() + calculateDelayInMs(rule.dropInterval, rule.dropUnit))

  const updatedRule = await db.autoDropRule.update({
    where: { id },
    data: {
      status: 'running',
      nextRunAt,
      currentPostId: rule.currentPostId || rule.startPostId,
      updatedAt: new Date(),
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

  return {
    ...updatedRule,
    delayText: formatDelayText(updatedRule.dropInterval, updatedRule.dropUnit),
  }
}

// Pause auto-drop rule
const pause = async (ctx: RequestContext, id: string) => {
  if (!ctx.user) {
    throw new BadRequestError('User not authenticated')
  }

  const rule = await db.autoDropRule.findFirst({
    where: {
      id,
      userId: ctx.user.id,
    },
  })

  if (!rule) {
    throw new NotFoundError('Auto-drop rule not found')
  }

  const updatedRule = await db.autoDropRule.update({
    where: { id },
    data: {
      status: 'paused',
      nextRunAt: null,
      updatedAt: new Date(),
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

  return {
    ...updatedRule,
    delayText: formatDelayText(updatedRule.dropInterval, updatedRule.dropUnit),
  }
}

// Resume auto-drop rule
const resume = async (ctx: RequestContext, id: string) => {
  if (!ctx.user) {
    throw new BadRequestError('User not authenticated')
  }

  const rule = await db.autoDropRule.findFirst({
    where: {
      id,
      userId: ctx.user.id,
    },
  })

  if (!rule) {
    throw new NotFoundError('Auto-drop rule not found')
  }

  if (rule.status !== 'paused') {
    throw new BadRequestError('Rule must be paused to resume')
  }

  const nextRunAt = new Date(Date.now() + calculateDelayInMs(rule.dropInterval, rule.dropUnit))

  const updatedRule = await db.autoDropRule.update({
    where: { id },
    data: {
      status: 'running',
      nextRunAt,
      updatedAt: new Date(),
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

  return {
    ...updatedRule,
    delayText: formatDelayText(updatedRule.dropInterval, updatedRule.dropUnit),
  }
}

// Reset auto-drop rule
const reset = async (ctx: RequestContext, id: string) => {
  if (!ctx.user) {
    throw new BadRequestError('User not authenticated')
  }

  const rule = await db.autoDropRule.findFirst({
    where: {
      id,
      userId: ctx.user.id,
    },
  })

  if (!rule) {
    throw new NotFoundError('Auto-drop rule not found')
  }

  const updatedRule = await db.autoDropRule.update({
    where: { id },
    data: {
      status: 'stopped',
      nextRunAt: null,
      currentPostId: rule.startPostId,
      updatedAt: new Date(),
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

  return {
    ...updatedRule,
    delayText: formatDelayText(updatedRule.dropInterval, updatedRule.dropUnit),
  }
}

// Process scheduled drops (called by job scheduler)
const processScheduledDrops = async () => {
  const now = new Date()

  const dueRules = await db.autoDropRule.findMany({
    where: {
      isActive: true,
      status: 'running',
      nextRunAt: {
        lte: now,
      },
    },
    include: {
      bot: true,
      telegramEntity: true,
    },
  })

  console.log(`[AUTO_DROP] Found ${dueRules.length} rules ready for processing`)

  for (const rule of dueRules) {
    try {
      await processDropRule(rule)
    } catch (error) {
      console.error(`[AUTO_DROP] Error processing rule ${rule.id}:`, error)
    }
  }

  console.log(`[AUTO_DROP] Processed ${dueRules.length} scheduled drops`)
}

// Process individual drop rule
const processDropRule = async (rule: any) => {
  try {
    const bot = getBot(rule.botId)
    if (!bot) {
      console.error(`[AUTO_DROP] Bot not found: ${rule.botId}`)
      return
    }

    const currentPostId = rule.currentPostId || rule.startPostId
    if (!currentPostId) {
      console.error(`[AUTO_DROP] No current post ID for rule: ${rule.id}`)
      return
    }

    // Check if we've reached the end
    if (rule.endPostId && currentPostId > rule.endPostId) {
      await db.autoDropRule.update({
        where: { id: rule.id },
        data: {
          status: 'completed',
          nextRunAt: null,
        },
      })
      console.log(`[AUTO_DROP] Rule ${rule.id} completed`)
      return
    }

    // Get bot members to send posts to
    const botMembers = await db.botMember.findMany({
      where: {
        botId: rule.botId,
        isActive: true,
      },
      take: 100, // Limit to prevent overwhelming
    })

    if (botMembers.length === 0) {
      console.log(`[AUTO_DROP] No active bot members for rule ${rule.id}`)
      return
    }

    // Process batch of posts
    let postsProcessed = 0
    let nextPostId = currentPostId

    for (let i = 0; i < rule.batchSize && (!rule.endPostId || nextPostId <= rule.endPostId); i++) {
      try {
        // Send post to all bot members (choose between forward or copy)
        for (const member of botMembers) {
          try {
            if (rule.hideAuthorSignature) {
              // Copy message - hides "Forwarded from" attribution
              await bot.telegram.copyMessage(
                member.telegramUserId,
                rule.telegramEntity.telegramId,
                nextPostId
              )
            } else {
              // Forward message - shows "Forwarded from" attribution
              await bot.telegram.forwardMessage(
                member.telegramUserId,
                rule.telegramEntity.telegramId,
                nextPostId
              )
            }
          } catch (error) {
            // Log but continue with other members
            console.error(`[AUTO_DROP] Failed to send to ${member.telegramUserId}:`, error)
          }
        }

        postsProcessed++
        nextPostId++
      } catch (error) {
        console.error(`[AUTO_DROP] Error processing post ${nextPostId}:`, error)
        nextPostId++
      }
    }

    // Update rule with new position and next run time
    const nextRunAt = new Date(Date.now() + calculateDelayInMs(rule.dropInterval, rule.dropUnit))

    await db.autoDropRule.update({
      where: { id: rule.id },
      data: {
        currentPostId: nextPostId,
        droppedCount: rule.droppedCount + postsProcessed,
        lastDroppedAt: new Date(),
        nextRunAt: (!rule.endPostId || nextPostId <= rule.endPostId) ? nextRunAt : null,
        status: (!rule.endPostId || nextPostId <= rule.endPostId) ? 'running' : 'completed',
      },
    })

    console.log(`[AUTO_DROP] Rule ${rule.id}: Processed ${postsProcessed} posts, next post ID: ${nextPostId}`)

  } catch (error) {
    console.error(`[AUTO_DROP] Error in processDropRule for ${rule.id}:`, error)

    // Update rule status to indicate error
    await db.autoDropRule.update({
      where: { id: rule.id },
      data: {
        status: 'paused',
        nextRunAt: null,
      },
    })
  }
}

// ============ ON-DEMAND DELIVERY FUNCTIONS ============

/**
 * Select random posts from a range
 */
function selectRandomPosts(startId: number, endId: number, count: number): number[] {
  const totalPosts = endId - startId + 1
  const actualCount = Math.min(count, totalPosts)

  // Generate array of all post IDs
  const allIds = Array.from({ length: totalPosts }, (_, i) => startId + i)

  // Shuffle and take random subset
  const shuffled = allIds.sort(() => 0.5 - Math.random())
  return shuffled.slice(0, actualCount)
}

/**
 * Schedule deletion of messages after timeout
 */
function schedulePostDeletion(
  bot: any,
  chatId: string,
  messageIds: number[],
  timeoutSeconds: number
): void {
  setTimeout(async () => {
    console.log(`[AUTO_DROP] Deleting ${messageIds.length} messages from chat ${chatId}`)
    for (const msgId of messageIds) {
      try {
        await bot.telegram.deleteMessage(chatId, msgId)
      } catch (error) {
        console.warn(`[AUTO_DROP] Could not delete message ${msgId}:`, error)
      }
    }
  }, timeoutSeconds * 1000)
}

/**
 * Handle on-demand post delivery request from a user
 */
const handleOnDemandRequest = async (
  ctx: RequestContext,
  ruleId: string,
  telegramUserId: string
): Promise<AutoDropRequestResult> => {
  if (!ctx.user) {
    throw new BadRequestError('User not authenticated')
  }

  // Get the rule
  const rule = await db.autoDropRule.findFirst({
    where: {
      id: ruleId,
      userId: ctx.user.id,
    },
    include: {
      bot: true,
      telegramEntity: true,
    },
  })

  if (!rule) {
    throw new NotFoundError('Auto-drop rule not found')
  }

  if (!rule.isActive) {
    return {
      success: false,
      messagesSent: 0,
      error: 'Rule is not active',
    }
  }

  if (rule.deliveryMode !== 1) {
    return {
      success: false,
      messagesSent: 0,
      error: 'Rule is not in on-demand mode',
    }
  }

  // Check cooldown
  if (rule.cooldownEnabled) {
    const remaining = cooldownService.checkAndSetCooldown(
      ruleId,
      telegramUserId,
      rule.cooldownSeconds
    )

    if (remaining > 0) {
      return {
        success: false,
        messagesSent: 0,
        cooldownRemaining: remaining,
        error: `Please wait ${remaining} seconds before requesting again`,
      }
    }
  }

  // Get bot instance
  const bot = getBot(rule.botId)
  if (!bot) {
    console.error(`[AUTO_DROP] Bot not found: ${rule.botId}`)
    return {
      success: false,
      messagesSent: 0,
      error: 'Bot not found',
    }
  }

  try {
    // Send welcome message if configured
    if (rule.welcomeMessage) {
      const username = telegramUserId // In real scenario, fetch actual user info
      const welcomeText = rule.welcomeMessage.replace('{user}', username)

      try {
        await bot.telegram.sendMessage(telegramUserId, welcomeText, {
          protect_content: true,
        })
      } catch (error) {
        console.error(`[AUTO_DROP] Failed to send welcome message:`, error)
      }
    }

    let postIds: number[]

    // Determine which posts to send
    if (rule.randomSelection && rule.startPostId && rule.totalPostsInSource) {
      // Random selection mode
      const endId = rule.endPostId || rule.totalPostsInSource
      postIds = selectRandomPosts(rule.startPostId, endId, rule.batchSize)
    } else if (rule.startPostId) {
      // Sequential selection
      const currentPos = rule.currentPostId || rule.startPostId
      postIds = []
      for (let i = 0; i < rule.batchSize; i++) {
        const postId = currentPos + i
        if (!rule.endPostId || postId <= rule.endPostId) {
          postIds.push(postId)
        }
      }
    } else {
      return {
        success: false,
        messagesSent: 0,
        error: 'No posts configured for delivery',
      }
    }

    // Send posts (choose between forward or copy based on settings)
    const sentMessageIds: number[] = []
    for (const postId of postIds) {
      try {
        let result

        if (rule.hideAuthorSignature) {
          // Copy message - hides "Forwarded from" attribution
          result = await bot.telegram.copyMessage(
            telegramUserId,
            rule.telegramEntity.telegramId,
            postId
          )
        } else {
          // Forward message - shows "Forwarded from" attribution
          result = await bot.telegram.forwardMessage(
            telegramUserId,
            rule.telegramEntity.telegramId,
            postId
          )
        }

        if (result?.message_id) {
          sentMessageIds.push(result.message_id)
        }
      } catch (error) {
        console.error(`[AUTO_DROP] Failed to send post ${postId}:`, error)
      }
    }

    // Send VIP message if configured
    let vipMessageSent = false
    if (rule.vipMessageEnabled && rule.vipMessage) {
      try {
        await bot.telegram.sendMessage(telegramUserId, rule.vipMessage, {
          protect_content: true,
        })
        vipMessageSent = true
      } catch (error) {
        console.error(`[AUTO_DROP] Failed to send VIP message:`, error)
      }
    }

    // Schedule deletion if configured
    if (rule.deleteAfterEnabled && sentMessageIds.length > 0) {
      schedulePostDeletion(bot, telegramUserId, sentMessageIds, rule.deleteTimeout)
    }

    // Update stats
    await db.autoDropRule.update({
      where: { id: ruleId },
      data: {
        droppedCount: rule.droppedCount + sentMessageIds.length,
        lastDroppedAt: new Date(),
      },
    })

    console.log(
      `[AUTO_DROP] On-demand delivery: sent ${sentMessageIds.length} posts to user ${telegramUserId}`
    )

    return {
      success: true,
      messagesSent: sentMessageIds.length,
      vipMessageSent,
    }
  } catch (error) {
    console.error(`[AUTO_DROP] Error in handleOnDemandRequest:`, error)
    return {
      success: false,
      messagesSent: 0,
      error: 'Failed to deliver posts',
    }
  }
}

export default {
  list,
  getById,
  create,
  update,
  toggleActive,
  delete: deleteRule,
  start,
  pause,
  resume,
  reset,
  processScheduledDrops,
  handleOnDemandRequest,
}