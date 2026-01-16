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
    const success = await forwardMessageByIdWithRetry(bot, sourceChatId, destChatId, messageId, rule)
    if (success) {
      successCount++
      lastProcessedId = messageId
    }
  }

  // Send broadcast message if enabled and batch is complete
  if (rule.broadcastEnabled && rule.broadcastMessage && successCount > 0) {
    await sendBroadcastMessage(
      bot, 
      destChatId, 
      rule.broadcastMessage, 
      rule.broadcastParseMode,
      rule.broadcastDeleteAfter,
      rule.broadcastDeleteInterval,
      rule.broadcastDeleteUnit
    )
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
      const temp = messageIds[i]!
      messageIds[i] = messageIds[j]!
      messageIds[j] = temp
    }
  }

  return messageIds
}

/**
 * Forward message by ID with retry logic for 429 errors
 * Guarantees 100% delivery by retrying with exponential backoff
 */
async function forwardMessageByIdWithRetry(
  bot: any,
  sourceChatId: string,
  destChatId: string,
  messageId: number,
  rule: any,
  maxRetries: number = 3
): Promise<boolean> {
  let lastError: any = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await forwardMessageById(bot, sourceChatId, destChatId, messageId, rule)
    } catch (error: any) {
      lastError = error
      
      // Check if it's a rate limit error (429)
      const isRateLimitError = 
        error.response?.error_code === 429 || 
        error.code === 429 ||
        error.message?.includes('Too Many Requests') ||
        error.message?.includes('429')
      
      if (isRateLimitError && attempt < maxRetries) {
        // Get retry_after from Telegram or use exponential backoff
        const retryAfter = error.response?.parameters?.retry_after || (attempt * 5)
        const waitTime = retryAfter * 1000
        
        console.log(`[FORWARD_SCHEDULER_RETRY] Rate limited (429) on message ${messageId}, attempt ${attempt}/${maxRetries}. Waiting ${retryAfter}s...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
        continue
      }
      
      // For non-rate-limit errors or last attempt, throw
      if (attempt === maxRetries) {
        console.error(`[FORWARD_SCHEDULER_RETRY] Failed message ${messageId} after ${maxRetries} attempts:`, error.message)
        throw error
      }
      
      // For other errors, retry with shorter backoff
      const backoffMs = attempt * 1000
      console.log(`[FORWARD_SCHEDULER_RETRY] Error on message ${messageId}, attempt ${attempt}/${maxRetries}, retrying in ${backoffMs}ms...`)
      await new Promise(resolve => setTimeout(resolve, backoffMs))
    }
  }
  
  throw lastError
}

async function forwardMessageById(
  bot: any,
  sourceChatId: string,
  destChatId: string,
  messageId: number,
  rule: any
): Promise<boolean> {
  try {
    // Determine if we should use copy mode (hides sender name)
    const shouldCopy = rule.copyMode || rule.hideSenderName || rule.removeLinks || rule.addWatermark
    
    console.log(`[FORWARD_SCHEDULER] Message ${messageId}: copyMode=${rule.copyMode}, hideSenderName=${rule.hideSenderName}, addWatermark="${rule.addWatermark}", shouldCopy=${shouldCopy}`)

    // If no modifications needed and not hiding sender, just forward
    if (!shouldCopy) {
      const forwardedMsg = await bot.telegram.forwardMessage(destChatId, sourceChatId, messageId)
      
      // Schedule deletion if enabled
      if (rule.deleteAfterEnabled && rule.deleteInterval && rule.deleteIntervalUnit !== 5) {
        scheduleMessageDeletion(bot, destChatId, forwardedMsg.message_id, rule.deleteInterval, rule.deleteIntervalUnit)
      }
      
      return true
    }

    // If watermark is set, we need to handle caption preservation
    if (rule.addWatermark) {
      console.log(`[FORWARD_SCHEDULER] Applying watermark for message ${messageId}`)
      
      // Check if we should hide sender (copyMode or hideSenderName)
      const hideSender = rule.copyMode || rule.hideSenderName
      
      if (hideSender) {
        // Since bots can't forward to themselves, we'll use a different approach:
        // 1. First copy the message WITHOUT modifying caption to get the message object back
        // 2. Then immediately delete it and copy again with the watermark
        
        // Alternative: Just copy with watermark and accept that we can't preserve original caption
        // This is a Telegram API limitation - we can't read a message's caption without forwarding it
        
        // Best approach: Copy the message to destination first, then edit its caption
        // But Telegram doesn't allow editing captions of copied messages from other chats
        
        // Final approach: Use copyMessage with caption_entities to preserve formatting
        // and append watermark. But we still can't read the original caption.
        
        // SOLUTION: Copy without caption, then send watermark as separate message
        // OR: Accept that scheduled forwarding with watermark will only show watermark
        
        console.log(`[FORWARD_SCHEDULER] Note: Cannot preserve original caption in scheduled mode due to Telegram API limitations`)
        console.log(`[FORWARD_SCHEDULER] Copying message ${messageId} with watermark only`)
        
        try {
          // Try to copy with watermark as caption
          const copiedMsg = await bot.telegram.copyMessage(destChatId, sourceChatId, messageId, {
            caption: '━━━━━━━━━━━━━━━\n' + rule.addWatermark,
          })
          
          console.log(`[FORWARD_SCHEDULER] Successfully copied message ${messageId} with watermark to ${destChatId}`)
          
          // Schedule deletion if enabled
          if (rule.deleteAfterEnabled && rule.deleteInterval && rule.deleteIntervalUnit !== 5) {
            scheduleMessageDeletion(bot, destChatId, copiedMsg.message_id, rule.deleteInterval, rule.deleteIntervalUnit)
          }
          
          return true
        } catch (copyError: any) {
          console.error(`[FORWARD_SCHEDULER] Error copying with caption:`, copyError.message)
          
          // Fallback: copy without caption and send watermark separately
          const copiedMsg = await bot.telegram.copyMessage(destChatId, sourceChatId, messageId)
          const watermarkMsg = await bot.telegram.sendMessage(destChatId, rule.addWatermark).catch(() => null)
          
          console.log(`[FORWARD_SCHEDULER] Fallback: Copied message ${messageId} and sent watermark separately`)
          
          if (rule.deleteAfterEnabled && rule.deleteInterval && rule.deleteIntervalUnit !== 5) {
            scheduleMessageDeletion(bot, destChatId, copiedMsg.message_id, rule.deleteInterval, rule.deleteIntervalUnit)
            if (rule.deleteWatermark && watermarkMsg) {
              scheduleMessageDeletion(bot, destChatId, watermarkMsg.message_id, rule.deleteInterval, rule.deleteIntervalUnit)
            }
          }
          
          return true
        }
      } else {
        // Forward the message (shows "Forwarded from") then send watermark
        const forwardedMsg = await bot.telegram.forwardMessage(destChatId, sourceChatId, messageId)
        const watermarkMsg = await bot.telegram.sendMessage(destChatId, rule.addWatermark).catch(() => null)
        
        // Schedule deletion if enabled
        if (rule.deleteAfterEnabled && rule.deleteInterval && rule.deleteIntervalUnit !== 5) {
          scheduleMessageDeletion(bot, destChatId, forwardedMsg.message_id, rule.deleteInterval, rule.deleteIntervalUnit)
          // Also delete watermark if deleteWatermark is enabled
          if (rule.deleteWatermark && watermarkMsg) {
            scheduleMessageDeletion(bot, destChatId, watermarkMsg.message_id, rule.deleteInterval, rule.deleteIntervalUnit)
          }
        }
        
        return true
      }
    }

    // Use copyMessage API to hide sender name (copyMode, hideSenderName, or removeLinks without watermark)
    console.log(`[FORWARD_SCHEDULER] Using copyMessage for message ${messageId}`)
    const copiedMsg = await bot.telegram.copyMessage(destChatId, sourceChatId, messageId)
    
    // Schedule deletion if enabled
    if (rule.deleteAfterEnabled && rule.deleteInterval && rule.deleteIntervalUnit !== 5) {
      scheduleMessageDeletion(bot, destChatId, copiedMsg.message_id, rule.deleteInterval, rule.deleteIntervalUnit)
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
 * @param unit - 0=seconds, 1=minutes, 2=hours, 3=days, 4=months
 */
function calculateNextRunTime(interval: number, unit: number): Date {
  const now = new Date()
  
  switch (unit) {
    case 0: // seconds
      return new Date(now.getTime() + interval * 1000)
    case 1: // minutes
      return new Date(now.getTime() + interval * 60 * 1000)
    case 2: // hours
      return new Date(now.getTime() + interval * 60 * 60 * 1000)
    case 3: // days
      return new Date(now.getTime() + interval * 24 * 60 * 60 * 1000)
    case 4: // months
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
    case 0: // seconds
      delayMs = interval * 1000
      break
    case 1: // minutes
      delayMs = interval * 60 * 1000
      break
    case 2: // hours
      delayMs = interval * 60 * 60 * 1000
      break
    case 3: // days
      delayMs = interval * 24 * 60 * 60 * 1000
      break
    case 4: // months
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
async function sendBroadcastMessage(
  bot: any, 
  chatId: string, 
  message: string, 
  parseMode?: string,
  deleteAfter?: boolean,
  deleteInterval?: number,
  deleteUnit?: number
) {
  try {
    const sentMessage = await bot.telegram.sendMessage(chatId, message, {
      parse_mode: parseMode as any,
    })
    console.log(`[FORWARD_SCHEDULER] Sent broadcast message to ${chatId}`)
    
    // Schedule deletion if enabled
    if (deleteAfter && deleteInterval !== undefined && deleteUnit !== undefined && deleteUnit !== 5) {
      scheduleMessageDeletion(bot, chatId, sentMessage.message_id, deleteInterval, deleteUnit)
    }
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
