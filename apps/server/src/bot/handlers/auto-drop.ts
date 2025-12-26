import { Context } from 'telegraf'
import autoDropService from '../../services/auto-drop.service'

/**
 * Calculate delay in milliseconds based on interval and unit
 */
function calculateDelayMs(interval: number, unit: number): number {
  switch (unit) {
    case 0: // seconds
      return interval * 1000
    case 1: // minutes
      return interval * 60 * 1000
    case 2: // hours
      return interval * 60 * 60 * 1000
    case 3: // days
      return interval * 24 * 60 * 60 * 1000
    case 4: // months (approximate)
      return interval * 30 * 24 * 60 * 60 * 1000
    default:
      return interval * 1000
  }
}

/**
 * Schedule a message for deletion after specified interval
 */
function scheduleMessageDeletion(ctx: Context, chatId: number, messageId: number, interval: number, unit: number) {
  const delayMs = calculateDelayMs(interval, unit)
  
  setTimeout(async () => {
    try {
      await ctx.telegram.deleteMessage(chatId, messageId)
      console.log(`[AUTO_DROP] Deleted message ${messageId} from ${chatId}`)
    } catch (error) {
      console.error(`[AUTO_DROP] Failed to delete message ${messageId}:`, error)
    }
  }, delayMs)
}

/**
 * Handle auto drop commands from users
 */
export async function handleAutoDropCommand(ctx: Context, command: string) {
  const dbBotId = (ctx as any).dbBotId as string
  if (!dbBotId) {
    console.error('[AUTO_DROP] No dbBotId in context')
    return false
  }

  if (!ctx.from) {
    return false
  }

  const telegramUserId = ctx.from.id.toString()

  // Get active rules for this bot with matching command
  const rules = await autoDropService.getActiveRulesForBot(dbBotId)
  const rule = rules.find(r => r.command === command)

  if (!rule) {
    return false // No matching rule, let other handlers process
  }

  console.log(`[AUTO_DROP] Processing command ${command} for user ${telegramUserId}`)

  // Check rate limit
  const rateLimitResult = await autoDropService.checkRateLimit(rule.id, telegramUserId)

  if (!rateLimitResult.allowed) {
    // Format the wait time nicely
    const waitTime = rateLimitResult.resetIn
    let timeString: string
    if (waitTime >= 3600) {
      const hours = Math.floor(waitTime / 3600)
      const mins = Math.floor((waitTime % 3600) / 60)
      timeString = mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
    } else if (waitTime >= 60) {
      const mins = Math.floor(waitTime / 60)
      const secs = waitTime % 60
      timeString = secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
    } else {
      timeString = `${waitTime}s`
    }

    const message = rule.rateLimitMessage || 
      `⏳ Slow down! Please wait ${timeString} before trying again.`
    
    await ctx.reply(message)
    return true
  }

  // Get messages to send
  const postsToSend = rule.postsPerDrop || 1
  let sentCount = 0

  for (let i = 0; i < postsToSend; i++) {
    const messageId = await autoDropService.getNextMessageId(rule.id, telegramUserId)
    
    if (!messageId) {
      console.log(`[AUTO_DROP] No message ID available for rule ${rule.id}`)
      break
    }

    const success = await sendDropMessage(ctx, rule, messageId)
    
    if (success) {
      await autoDropService.updateLastMessageId(rule.id, telegramUserId, messageId)
      sentCount++
    }
  }

  if (sentCount > 0) {
    await autoDropService.incrementDropCount(rule.id)
    console.log(`[AUTO_DROP] Sent ${sentCount} messages to user ${telegramUserId}`)
  } else {
    await ctx.reply('❌ No posts available at the moment. Please try again later.')
  }

  return true
}

async function sendDropMessage(
  ctx: Context,
  rule: any,
  messageId: number
): Promise<boolean> {
  try {
    const sourceChatId = rule.sourceEntity.telegramId
    const destChatId = ctx.from!.id // Send to the user who requested

    // Determine if we should use copy mode
    const shouldCopy = rule.copyMode || rule.hideSenderName || rule.removeLinks || rule.addWatermark

    // Check if auto-delete is enabled
    const shouldDelete = rule.deleteAfterEnabled && rule.deleteInterval && rule.deleteIntervalUnit !== 5

    if (!shouldCopy) {
      // Forward message (shows "Forwarded from")
      const sentMsg = await ctx.telegram.forwardMessage(destChatId, sourceChatId, messageId)
      
      // Schedule deletion if enabled
      if (shouldDelete) {
        scheduleMessageDeletion(ctx, destChatId, sentMsg.message_id, rule.deleteInterval, rule.deleteIntervalUnit)
      }
      
      return true
    }

    // If watermark is set
    if (rule.addWatermark) {
      console.log(`[AUTO_DROP] Applying watermark for message ${messageId}`)
      
      // Check if we should hide sender (copyMode or hideSenderName)
      const hideSender = rule.copyMode || rule.hideSenderName
      
      if (hideSender) {
        // Try to copy with caption (works for media - photo, video, gif, document)
        // For text messages, this will fail and we'll fall back to separate message
        try {
          const sentMsg = await ctx.telegram.copyMessage(destChatId, sourceChatId, messageId, {
            caption: rule.addWatermark,
          })
          
          // Schedule deletion if enabled
          if (shouldDelete) {
            scheduleMessageDeletion(ctx, destChatId, sentMsg.message_id, rule.deleteInterval, rule.deleteIntervalUnit)
          }
          
          return true
        } catch {
          // If caption fails (text message), copy without caption and send watermark separately
          const sentMsg = await ctx.telegram.copyMessage(destChatId, sourceChatId, messageId)
          const watermarkMsg = await ctx.telegram.sendMessage(destChatId, rule.addWatermark).catch(() => null)
          
          // Schedule deletion if enabled
          if (shouldDelete) {
            scheduleMessageDeletion(ctx, destChatId, sentMsg.message_id, rule.deleteInterval, rule.deleteIntervalUnit)
            // Also delete watermark if deleteWatermark is enabled
            if (rule.deleteWatermark && watermarkMsg) {
              scheduleMessageDeletion(ctx, destChatId, watermarkMsg.message_id, rule.deleteInterval, rule.deleteIntervalUnit)
            }
          }
          
          return true
        }
      } else {
        // Forward the message (shows "Forwarded from") then send watermark
        const sentMsg = await ctx.telegram.forwardMessage(destChatId, sourceChatId, messageId)
        const watermarkMsg = await ctx.telegram.sendMessage(destChatId, rule.addWatermark).catch(() => null)
        
        // Schedule deletion if enabled
        if (shouldDelete) {
          scheduleMessageDeletion(ctx, destChatId, sentMsg.message_id, rule.deleteInterval, rule.deleteIntervalUnit)
          // Also delete watermark if deleteWatermark is enabled
          if (rule.deleteWatermark && watermarkMsg) {
            scheduleMessageDeletion(ctx, destChatId, watermarkMsg.message_id, rule.deleteInterval, rule.deleteIntervalUnit)
          }
        }
        
        return true
      }
    }

    // Copy message (hides sender) - copyMode, hideSenderName, or removeLinks without watermark
    const sentMsg = await ctx.telegram.copyMessage(destChatId, sourceChatId, messageId)
    
    // Schedule deletion if enabled
    if (shouldDelete) {
      scheduleMessageDeletion(ctx, destChatId, sentMsg.message_id, rule.deleteInterval, rule.deleteIntervalUnit)
    }
    
    return true
  } catch (error: any) {
    // Handle common errors
    if (error.response?.error_code === 400) {
      const desc = error.response?.description || ''
      
      if (desc.includes('not found') || desc.includes("can't be forwarded")) {
        console.log(`[AUTO_DROP] Skipping message ${messageId} - ${desc}`)
        return false
      }
    }

    console.error(`[AUTO_DROP] Error sending message ${messageId}:`, error)
    return false
  }
}

/**
 * Get all registered auto drop commands for a bot
 */
export async function getAutoDropCommands(botId: string): Promise<string[]> {
  const rules = await autoDropService.getActiveRulesForBot(botId)
  return rules.map(r => r.command)
}
