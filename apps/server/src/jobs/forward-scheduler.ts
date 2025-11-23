import db from '@super-invite/db'
import { ForwardScheduleMode, ForwardScheduleStatus } from '@super-invite/db'
import { getBot } from '../bot/bot-manager'

/**
 * Process scheduled forward rules
 * This job runs every minute and processes rules that are due to run
 */
export async function processScheduledForwards() {
  const now = new Date()

  // Get rules that are due to run
  const rules = await db.forwardRule.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      scheduleMode: ForwardScheduleMode.SCHEDULED,
      scheduleStatus: ForwardScheduleStatus.RUNNING,
      nextRunAt: {
        lte: now,
      },
    },
    include: {
      sourceEntity: true,
      destinationEntity: true,
      bot: true,
    },
  })

  if (rules.length === 0) return

  console.log(`[FORWARD_SCHEDULER] Processing ${rules.length} scheduled rules`)

  for (const rule of rules) {
    await processRule(rule).catch((error) => {
      console.error(`[FORWARD_SCHEDULER] Error processing rule ${rule.id}:`, error)
    })
  }
}

async function processRule(rule: any) {
  const bot = getBot(rule.botId)
  if (!bot) {
    console.error(`[FORWARD_SCHEDULER] Bot ${rule.botId} not found for rule ${rule.id}`)
    return
  }

  // Get next message from queue
  let messageQueue = [...rule.messageQueue]

  if (messageQueue.length === 0) {
    // Queue is empty - need to build it or mark as completed
    if (rule.repeatWhenDone) {
      // Rebuild queue
      messageQueue = await buildMessageQueue(rule)
      if (messageQueue.length === 0) {
        console.log(`[FORWARD_SCHEDULER] No messages to process for rule ${rule.id}`)
        return
      }
    } else {
      // Mark as completed
      await db.forwardRule.update({
        where: { id: rule.id },
        data: {
          scheduleStatus: ForwardScheduleStatus.COMPLETED,
          nextRunAt: null,
        },
      })
      console.log(`[FORWARD_SCHEDULER] Rule ${rule.id} completed`)
      return
    }
  }

  // Get next message ID
  const messageId = messageQueue.shift()!

  // Forward the message
  const sourceChatId = rule.sourceEntity.telegramId
  const destChatId = rule.destinationEntity.telegramId

  const success = await forwardMessageById(bot, sourceChatId, destChatId, messageId, rule)

  // Calculate next run time
  const nextRunAt = new Date(Date.now() + rule.intervalMinutes * 60 * 1000)

  // Update rule
  await db.forwardRule.update({
    where: { id: rule.id },
    data: {
      messageQueue: messageQueue,
      lastProcessedMsgId: messageId,
      nextRunAt,
      ...(success && {
        forwardedCount: { increment: 1 },
        lastForwardedAt: new Date(),
      }),
    },
  })

  if (success) {
    console.log(`[FORWARD_SCHEDULER] Forwarded message ${messageId} for rule ${rule.id}`)
  }
}

async function buildMessageQueue(rule: any): Promise<number[]> {
  // Build list of message IDs based on range
  const startId = rule.startFromMessageId || 1
  const endId = rule.endAtMessageId || startId + 999 // Default to 1000 messages

  const messageIds: number[] = []
  for (let i = startId; i <= endId; i++) {
    messageIds.push(i)
  }

  // Shuffle if needed
  if (rule.shuffle) {
    for (let i = messageIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[messageIds[i], messageIds[j]] = [messageIds[j], messageIds[i]]
    }
  }

  return messageIds
}

async function forwardMessageById(
  bot: any,
  sourceChatId: string,
  destChatId: string,
  messageId: number,
  rule: any
): Promise<boolean> {
  try {
    // If no modifications needed, just forward
    if (!rule.removeLinks && !rule.addWatermark) {
      await bot.telegram.forwardMessage(destChatId, sourceChatId, messageId)
      return true
    }

    // Need to copy with modifications - this is more complex
    // For now, just forward directly
    // TODO: Implement copyMessage with modifications
    await bot.telegram.forwardMessage(destChatId, sourceChatId, messageId)
    return true
  } catch (error: any) {
    // Handle "message not found" error - skip this message and continue
    if (error.response?.error_code === 400 &&
        error.response?.description?.includes('not found')) {
      console.log(`[FORWARD_SCHEDULER] Skipping message ${messageId} - not found in source channel`)
      return false
    }

    // Handle "message can't be forwarded" error
    if (error.response?.error_code === 400 &&
        error.response?.description?.includes("can't be forwarded")) {
      console.log(`[FORWARD_SCHEDULER] Skipping message ${messageId} - can't be forwarded`)
      return false
    }

    // Handle chat not found errors
    if (error.response?.error_code === 400 &&
        error.response?.description?.includes('chat not found')) {
      console.error(`[FORWARD_SCHEDULER] Chat not found for message ${messageId}`)
      throw error // Re-throw as this is a configuration error
    }

    // Re-throw other errors
    throw error
  }
}

/**
 * Start a scheduled forward rule
 */
export async function startScheduledRule(ruleId: string): Promise<void> {
  const rule = await db.forwardRule.findUnique({
    where: { id: ruleId },
  })

  if (!rule) {
    throw new Error('Rule not found')
  }

  // Build initial message queue
  const messageQueue = await buildMessageQueue(rule)

  // Update rule to start running
  await db.forwardRule.update({
    where: { id: ruleId },
    data: {
      scheduleStatus: ForwardScheduleStatus.RUNNING,
      messageQueue,
      nextRunAt: new Date(), // Run immediately
    },
  })

  console.log(`[FORWARD_SCHEDULER] Started rule ${ruleId} with ${messageQueue.length} messages`)
}

/**
 * Pause a scheduled forward rule
 */
export async function pauseScheduledRule(ruleId: string): Promise<void> {
  await db.forwardRule.update({
    where: { id: ruleId },
    data: {
      scheduleStatus: ForwardScheduleStatus.PAUSED,
      nextRunAt: null,
    },
  })
}

/**
 * Resume a paused forward rule
 */
export async function resumeScheduledRule(ruleId: string): Promise<void> {
  await db.forwardRule.update({
    where: { id: ruleId },
    data: {
      scheduleStatus: ForwardScheduleStatus.RUNNING,
      nextRunAt: new Date(),
    },
  })
}

/**
 * Reset a forward rule to start over
 */
export async function resetScheduledRule(ruleId: string): Promise<void> {
  const rule = await db.forwardRule.findUnique({
    where: { id: ruleId },
  })

  if (!rule) {
    throw new Error('Rule not found')
  }

  const messageQueue = await buildMessageQueue(rule)

  await db.forwardRule.update({
    where: { id: ruleId },
    data: {
      scheduleStatus: ForwardScheduleStatus.IDLE,
      messageQueue,
      lastProcessedMsgId: null,
      nextRunAt: null,
    },
  })
}
