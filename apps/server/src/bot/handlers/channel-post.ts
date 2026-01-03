import { Context } from 'telegraf'
import { Message } from 'telegraf/types'
import db from '@super-invite/db'
import forwardRuleService from '../../services/forward-rule.service'

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

  // Get active forward rules for this source
  const rules = await forwardRuleService.getActiveRulesForSource(dbBotId, chatId)

  if (rules.length === 0) return

  console.log(`[CHANNEL_POST] Processing message in ${chatId} with ${rules.length} active rules`)

  for (const rule of rules) {
    // Check message type filters
    if (!shouldForwardMessage(message, rule)) {
      continue
    }

    // Check keyword filters
    const messageText = getMessageText(message)
    if (!passesKeywordFilters(messageText, rule)) {
      continue
    }

    // Forward the message
    const destChatId = rule.destinationEntity.telegramId

    const forwardResult = await forwardMessage(ctx, message, destChatId, rule).catch((error) => {
      console.error(`[CHANNEL_POST] Failed to forward to ${destChatId}:`, error)
      return false
    })

    if (forwardResult) {
      await forwardRuleService.incrementForwardCount(rule.id)
      console.log(`[CHANNEL_POST] Forwarded message to ${destChatId}`)
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
    text = text.trim() + '\n\n' + rule.addWatermark
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
    await ctx.telegram.sendPhoto(destChatId, photo.file_id, {
      caption: text || undefined,
    })
    return true
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

  console.log(`[GROUP_MESSAGE] Received message in chat ${chatId} (type: ${message.chat.type})`)

  // Get active forward rules for this source
  const rules = await forwardRuleService.getActiveRulesForSource(dbBotId, chatId)

  console.log(`[GROUP_MESSAGE] Found ${rules.length} active rules for chat ${chatId}`)

  if (rules.length === 0) return

  for (const rule of rules) {
    console.log(`[GROUP_MESSAGE] Checking rule ${rule.id} for message`)

    if (!shouldForwardMessage(message, rule)) {
      console.log(`[GROUP_MESSAGE] Message filtered out by type filter`)
      continue
    }

    const messageText = getMessageText(message)
    if (!passesKeywordFilters(messageText, rule)) {
      console.log(`[GROUP_MESSAGE] Message filtered out by keyword filter`)
      continue
    }

    const destChatId = rule.destinationEntity.telegramId
    console.log(`[GROUP_MESSAGE] Forwarding to ${destChatId}`)

    const forwardResult = await forwardMessage(ctx, message, destChatId, rule).catch((error) => {
      console.error(`[GROUP_MESSAGE] Failed to forward to ${destChatId}:`, error)
      return false
    })

    if (forwardResult) {
      await forwardRuleService.incrementForwardCount(rule.id)
      console.log(`[GROUP_MESSAGE] Successfully forwarded to ${destChatId}`)
    }
  }
}
