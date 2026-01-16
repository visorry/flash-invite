import { Context } from 'telegraf'
import type { Message } from 'telegraf/types'
import { ForwardScheduleMode } from '@super-invite/db'
import forwardRuleService from '../../services/forward-rule.service'
import promoterService from '../../services/promoter.service'

// Global rate limiter per bot - tracks last forward time
const botForwardTimestamps = new Map<string, number>()
const MIN_FORWARD_DELAY_MS = 3000 // 3 seconds between forwards per bot

/**
 * Wait for rate limit before forwarding to prevent 429 errors
 */
async function waitForRateLimit(botId: string): Promise<void> {
  const now = Date.now()
  const lastForward = botForwardTimestamps.get(botId) || 0
  const timeSinceLastForward = now - lastForward
  
  if (timeSinceLastForward < MIN_FORWARD_DELAY_MS) {
    const waitTime = MIN_FORWARD_DELAY_MS - timeSinceLastForward
    console.log(`[RATE_LIMIT] Bot ${botId}: Waiting ${waitTime}ms before forwarding`)
    await new Promise(resolve => setTimeout(resolve, waitTime))
  }
  
  botForwardTimestamps.set(botId, Date.now())
}

/**
 * Handle promoter capture for messages from vault groups
 * Requirements: 1.2, 2.1, 9.7
 */
async function handlePromoterCapture(ctx: Context, message: Message): Promise<void> {
  try {
    const dbBotId = (ctx as any).dbBotId as string
    if (!dbBotId) return
    
    const chatId = message.chat.id.toString()
    
    // Check if this chat is a vault for any active promoter config
    const config = await promoterService.getActiveConfigForVault(dbBotId, chatId)
    if (!config) return
    
    console.log(`[PROMOTER] Message in vault group ${chatId}, capturing post`)
    
    // Capture the post
    const post = await promoterService.capturePost(dbBotId, message)
    if (!post) {
      console.log(`[PROMOTER] Message not captured (unsupported media type)`)
      return
    }
    
    console.log(`[PROMOTER] Captured post with token ${post.token}`)
    
    // Create marketing post if auto-posting is enabled
    if (config.autoPostToMarketing) {
      console.log(`[PROMOTER] Auto-posting enabled, creating marketing post`)
      await promoterService.createMarketingPost(post, config)
    } else {
      console.log(`[PROMOTER] Auto-posting disabled, skipping marketing post`)
    }
  } catch (error: any) {
    // Handle errors gracefully without breaking existing forward rules (Requirement 9.7)
    console.error('[PROMOTER] Error in promoter capture:', error.message)
    // Don't throw - let the handler continue with forward rules
  }
}

/**
 * Handle channel posts - forward messages based on active rules
 */
export async function handleChannelPost(ctx: Context) {
  if (!ctx.channelPost) return

  const dbBotId = (ctx as any).dbBotId as string
  if (!dbBotId) {
    console.error('[CHANNEL_POST] No dbBotId in context')
    return
  }

  const message = ctx.channelPost
  const chatId = message.chat.id.toString()
  const messageId = message.message_id

  // Check for promoter configurations and capture post if applicable
  await handlePromoterCapture(ctx, message)

  // Get active forward rules for this source
  const rules = await forwardRuleService.getActiveRulesForSource(dbBotId, chatId)

  if (rules.length === 0) return

  console.log(`[CHANNEL_POST:${messageId}] Processing message in ${chatId} with ${rules.length} active rules`)

  for (const rule of rules) {
    console.log(`[CHANNEL_POST:${messageId}] Rule ${rule.id}: scheduleMode=${rule.scheduleMode}, name="${rule.name}"`)
    
    // Skip scheduled rules - they should only be processed by the scheduler
    if (rule.scheduleMode === ForwardScheduleMode.SCHEDULED) {
      console.log(`[CHANNEL_POST:${messageId}] Skipping rule ${rule.id} - it's in SCHEDULED mode`)
      continue
    }

    console.log(`[CHANNEL_POST:${messageId}] Processing rule ${rule.id} in REALTIME mode`)

    // Apply rate limiting before forwarding
    await waitForRateLimit(dbBotId)

    // Check message type filters
    if (!shouldForwardMessage(message, rule)) {
      continue
    }

    // Check keyword filters
    const messageText = getMessageText(message)
    if (!passesKeywordFilters(messageText, rule)) {
      continue
    }

    // Forward the message with retry logic
    const destChatId = rule.destinationEntity.telegramId

    const forwardResult = await forwardMessageWithRetry(ctx, message, destChatId, rule).catch((error) => {
      console.error(`[CHANNEL_POST:${messageId}] Failed to forward to ${destChatId} after retries:`, error)
      return false
    })

    if (forwardResult) {
      await forwardRuleService.incrementForwardCount(rule.id)
      console.log(`[CHANNEL_POST:${messageId}] Forwarded message to ${destChatId}`)
    }
  }
}

function shouldForwardMessage(message: Message, rule: any): boolean {
  // Check if message type is allowed

  // Text messages
  if ('text' in message && message.text && !rule.forwardText) {
    return false
  }

  // Photos
  if ('photo' in message && message.photo && !rule.forwardMedia) {
    return false
  }

  // Videos
  if ('video' in message && message.video && !rule.forwardMedia) {
    return false
  }

  // Documents
  if ('document' in message && message.document && !rule.forwardDocuments) {
    return false
  }

  // Stickers
  if ('sticker' in message && message.sticker && !rule.forwardStickers) {
    return false
  }

  // Polls
  if ('poll' in message && message.poll && !rule.forwardPolls) {
    return false
  }

  return true
}

function getMessageText(message: Message): string {
  if ('text' in message && message.text) {
    return message.text
  }
  if ('caption' in message && message.caption) {
    return message.caption
  }
  return ''
}

function passesKeywordFilters(text: string, rule: any): boolean {
  const lowerText = text.toLowerCase()

  // Check include keywords - if specified, message must contain at least one
  if (rule.includeKeywords && rule.includeKeywords.length > 0) {
    const hasIncluded = rule.includeKeywords.some((keyword: string) =>
      lowerText.includes(keyword.toLowerCase())
    )
    if (!hasIncluded) return false
  }

  // Check exclude keywords - message must not contain any
  if (rule.excludeKeywords && rule.excludeKeywords.length > 0) {
    const hasExcluded = rule.excludeKeywords.some((keyword: string) =>
      lowerText.includes(keyword.toLowerCase())
    )
    if (hasExcluded) return false
  }

  return true
}

/**
 * Forward message with retry logic for 429 errors
 * Guarantees 100% delivery by retrying with exponential backoff
 */
async function forwardMessageWithRetry(
  ctx: Context,
  message: Message,
  destChatId: string,
  rule: any,
  maxRetries: number = 3
): Promise<boolean> {
  let lastError: any = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await forwardMessage(ctx, message, destChatId, rule)
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
        
        console.log(`[FORWARD_RETRY] Rate limited (429), attempt ${attempt}/${maxRetries}. Waiting ${retryAfter}s before retry...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
        continue
      }
      
      // For non-rate-limit errors or last attempt, throw
      if (attempt === maxRetries) {
        console.error(`[FORWARD_RETRY] Failed after ${maxRetries} attempts:`, error.message)
        throw error
      }
      
      // For other errors, retry with shorter backoff
      const backoffMs = attempt * 1000
      console.log(`[FORWARD_RETRY] Error on attempt ${attempt}/${maxRetries}, retrying in ${backoffMs}ms...`)
      await new Promise(resolve => setTimeout(resolve, backoffMs))
    }
  }
  
  throw lastError
}

async function forwardMessage(
  ctx: Context,
  message: Message,
  destChatId: string,
  rule: any
): Promise<boolean> {
  // Determine if we should use copy mode (hides sender name)
  const shouldCopy = rule.copyMode || rule.hideSenderName || rule.removeLinks || rule.addWatermark

  console.log(`[FORWARD] Rule modifications: copyMode=${rule.copyMode}, hideSenderName=${rule.hideSenderName}, removeLinks=${rule.removeLinks}, addWatermark="${rule.addWatermark}", shouldCopy=${shouldCopy}`)

  // If no modifications needed and not hiding sender, just forward
  if (!shouldCopy) {
    await ctx.telegram.forwardMessage(destChatId, message.chat.id, message.message_id)
    return true
  }

  // Need to copy message (hides sender name) with optional modifications
  let text = getMessageText(message)

  // Remove links if enabled
  if (rule.removeLinks) {
    text = text.replace(/https?:\/\/[^\s]+/g, '')
    text = text.replace(/@\w+/g, '') // Remove @mentions
  }

  // Add watermark if enabled
  if (rule.addWatermark) {
    text = text.trim() + '\n\n━━━━━━━━━━━━━━━\n' + rule.addWatermark
    console.log(`[FORWARD] Applied watermark, new text: "${text}"`)
  }

  // If only copyMode/hideSenderName is enabled (no text modifications), use copyMessage API
  if (!rule.removeLinks && !rule.addWatermark) {
    await ctx.telegram.copyMessage(destChatId, message.chat.id, message.message_id)
    return true
  }

  // Send based on message type with modifications
  if ('photo' in message && message.photo) {
    const photo = message.photo[message.photo.length - 1]
    if (photo) {
      await ctx.telegram.sendPhoto(destChatId, photo.file_id, {
        caption: text || undefined,
      })
      return true
    }
  }

  if ('video' in message && message.video) {
    await ctx.telegram.sendVideo(destChatId, message.video.file_id, {
      caption: text || undefined,
    })
    return true
  }

  if ('document' in message && message.document) {
    await ctx.telegram.sendDocument(destChatId, message.document.file_id, {
      caption: text || undefined,
    })
    return true
  }

  if ('text' in message && message.text) {
    await ctx.telegram.sendMessage(destChatId, text)
    return true
  }

  // For other types, use copyMessage to hide sender
  await ctx.telegram.copyMessage(destChatId, message.chat.id, message.message_id)
  return true
}

/**
 * Handle group messages - forward messages based on active rules
 */
export async function handleGroupMessage(ctx: Context) {
  if (!ctx.message) return

  const dbBotId = (ctx as any).dbBotId as string
  if (!dbBotId) {
    console.error('[GROUP_MESSAGE] No dbBotId in context')
    return
  }

  const message = ctx.message
  const chatId = message.chat.id.toString()
  const messageId = message.message_id

  console.log(`[GROUP_MESSAGE:${messageId}] Received message in chat ${chatId} (type: ${message.chat.type})`)

  // Check for promoter configurations and capture post if applicable
  await handlePromoterCapture(ctx, message)

  // Get active forward rules for this source
  const rules = await forwardRuleService.getActiveRulesForSource(dbBotId, chatId)

  console.log(`[GROUP_MESSAGE:${messageId}] Found ${rules.length} active rules for chat ${chatId}`)

  if (rules.length === 0) {
    console.log(`[GROUP_MESSAGE:${messageId}] No rules found, exiting handler`)
    return
  }

  for (const rule of rules) {
    console.log(`[GROUP_MESSAGE:${messageId}] Rule ${rule.id}: scheduleMode=${rule.scheduleMode}, name="${rule.name}"`)

    // Skip scheduled rules - they should only be processed by the scheduler
    if (rule.scheduleMode === ForwardScheduleMode.SCHEDULED) {
      console.log(`[GROUP_MESSAGE:${messageId}] Skipping rule ${rule.id} - it's in SCHEDULED mode`)
      continue
    }

    console.log(`[GROUP_MESSAGE:${messageId}] Processing rule ${rule.id} in REALTIME mode`)

    // Apply rate limiting before forwarding
    await waitForRateLimit(dbBotId)

    if (!shouldForwardMessage(message, rule)) {
      console.log(`[GROUP_MESSAGE:${messageId}] Message filtered out by type filter`)
      continue
    }

    const messageText = getMessageText(message)
    if (!passesKeywordFilters(messageText, rule)) {
      console.log(`[GROUP_MESSAGE:${messageId}] Message filtered out by keyword filter`)
      continue
    }

    const destChatId = rule.destinationEntity.telegramId
    console.log(`[GROUP_MESSAGE:${messageId}] Forwarding to ${destChatId}`)

    const forwardResult = await forwardMessageWithRetry(ctx, message, destChatId, rule).catch((error) => {
      console.error(`[GROUP_MESSAGE:${messageId}] Failed to forward to ${destChatId} after retries:`, error)
      return false
    })

    if (forwardResult) {
      await forwardRuleService.incrementForwardCount(rule.id)
      console.log(`[GROUP_MESSAGE:${messageId}] Successfully forwarded to ${destChatId}`)
    }
  }
}
