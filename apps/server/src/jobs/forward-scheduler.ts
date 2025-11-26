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

  // Process batch of messages
  const batchSize = rule.batchSize || 1
  const batch = messageQueue.splice(0, Math.min(batchSize, messageQueue.length))
  
  const sourceChatId = rule.sourceEntity.telegramId
  const destChatId = rule.destinationEntity.telegramId
  
  let successCount = 0
  let lastProcessedId = rule.lastProcessedMsgId

  // Forward each message in the batch
  for (const messageId of batch) {
    const success = await forwardMessageById(bot, sourceChatId, destChatId, messageId, rule)
    if (success) {
      successCount++
      lastProcessedId = messageId
    }
  }

  // Send broadcast message if enabled and batch is complete
  if (rule.broadcastEnabled && rule.broadcastMessage && successCount > 0) {
    await sendBroadcastMessage(bot, destChatId, rule.broadcastMessage, rule.broadcastParseMode)
  }

  // Calculate next run time based on interval unit
  const nextRunAt = calculateNextRunTime(rule.postInterval, rule.postIntervalUnit)

  // Update rule
  await db.forwardRule.update({
    where: { id: rule.id },
    data: {
      messageQueue: messageQueue,
      lastProcessedMsgId: lastProcessedId,
      nextRunAt,
      ...(successCount > 0 && {
        forwardedCount: { increment: successCount },
        lastForwardedAt: new Date(),
      }),
    },
  })

  if (successCount > 0) {
    console.log(`[FORWARD_SCHEDULER] Forwarded ${successCount}/${batch.length} messages for rule ${rule.id}`)
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
      const forwardedMsg = await bot.telegram.forwardMessage(destChatId, sourceChatId, messageId)
      
      // Schedule deletion if enabled
      if (rule.deleteAfterEnabled && rule.deleteInterval && rule.deleteIntervalUnit !== 4) {
        scheduleMessageDeletion(bot, destChatId, forwardedMsg.message_id, rule.deleteInterval, rule.deleteIntervalUnit)
      }
      
      return true
    }

    // Need to copy with modifications - this is more complex
    // For now, just forward directly
    // TODO: Implement copyMessage with modifications
    const forwardedMsg = await bot.telegram.forwardMessage(destChatId, sourceChatId, messageId)
    
    // Schedule deletion if enabled
    if (rule.deleteAfterEnabled && rule.deleteInterval && rule.deleteIntervalUnit !== 4) {
      scheduleMessageDeletion(bot, destChatId, forwardedMsg.message_id, rule.deleteInterval, rule.deleteIntervalUnit)
    }
    
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
 * Calculate next run time based on interval and unit
 * @param interval - The interval value
 * @param unit - 0=minutes, 1=hours, 2=days, 3=months
 */
function calculateNextRunTime(interval: number, unit: number): Date {
  const now = new Date()
  
  switch (unit) {
    case 0: // minutes
      return new Date(now.getTime() + interval * 60 * 1000)
    case 1: // hours
      return new Date(now.getTime() + interval * 60 * 60 * 1000)
    case 2: // days
      return new Date(now.getTime() + interval * 24 * 60 * 60 * 1000)
    case 3: // months
      const nextMonth = new Date(now)
      nextMonth.setMonth(nextMonth.getMonth() + interval)
      return nextMonth
    default:
      return new Date(now.getTime() + interval * 60 * 1000)
  }
}

/**
 * Schedule a message for deletion after specified interval
 */
function scheduleMessageDeletion(bot: any, chatId: string, messageId: number, interval: number, unit: number) {
  let delayMs = 0
  
  switch (unit) {
    case 0: // minutes
      delayMs = interval * 60 * 1000
      break
    case 1: // hours
      delayMs = interval * 60 * 60 * 1000
      break
    case 2: // days
      delayMs = interval * 24 * 60 * 60 * 1000
      break
    case 3: // months
      delayMs = interval * 30 * 24 * 60 * 60 * 1000 // Approximate
      break
  }
  
  setTimeout(async () => {
    try {
      await bot.telegram.deleteMessage(chatId, messageId)
      console.log(`[FORWARD_SCHEDULER] Deleted message ${messageId} from ${chatId}`)
    } catch (error) {
      console.error(`[FORWARD_SCHEDULER] Failed to delete message ${messageId}:`, error)
    }
  }, delayMs)
}

/**
 * Send broadcast message to destination chat
 */
async function sendBroadcastMessage(bot: any, chatId: string, message: string, parseMode?: string) {
  try {
    await bot.telegram.sendMessage(chatId, message, {
      parse_mode: parseMode as any,
    })
    console.log(`[FORWARD_SCHEDULER] Sent broadcast message to ${chatId}`)
  } catch (error) {
    console.error(`[FORWARD_SCHEDULER] Failed to send broadcast message:`, error)
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
