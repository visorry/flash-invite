import { randomBytes } from 'crypto'
import { NotFoundError, BadRequestError } from '../errors/http-exception'
import type { RequestContext } from '../types/app'
import db from '@super-invite/db'
import type { Message } from 'telegraf/types'

// ============ TOKEN GENERATION AND VALIDATION ============

/**
 * Generate a cryptographically secure, URL-safe promotion token
 * Requirements: 4.1, 4.2, 4.3
 */
export const generateToken = async (): Promise<string> => {
  let token: string
  let attempts = 0
  const MAX_ATTEMPTS = 10

  do {
    // Generate 16 bytes (128 bits) of random data
    const buffer = randomBytes(16)
    
    // Convert to URL-safe base64
    token = buffer
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
    
    // Check uniqueness in database (Requirement 4.4)
    const existing = await db.promoterPost.findUnique({
      where: { token },
    })
    
    if (!existing) {
      return token
    }
    
    attempts++
  } while (attempts < MAX_ATTEMPTS)
  
  throw new Error('Failed to generate unique token after maximum attempts')
}

/**
 * Validate a promotion token
 * Requirements: 3.3, 4.6, 4.7
 */
export const validateToken = async (token: string): Promise<{
  valid: boolean
  expired: boolean
  post?: any
}> => {
  const post = await db.promoterPost.findUnique({
    where: { token },
    include: {
      config: true,
    },
  })
  
  if (!post) {
    return { valid: false, expired: false }
  }
  
  // Check if token is expired
  if (post.isExpired) {
    return { valid: false, expired: true, post }
  }
  
  // Check expiration date
  if (post.expiresAt && post.expiresAt < new Date()) {
    // Mark as expired
    await db.promoterPost.update({
      where: { id: post.id },
      data: { isExpired: true },
    })
    return { valid: false, expired: true, post }
  }
  
  return { valid: true, expired: false, post }
}

// ============ CONFIGURATION MANAGEMENT ============

interface CreatePromoterConfigData {
  botId: string
  vaultEntityId: string
  marketingEntityId: string
  name: string
  ctaTemplate?: string
  autoPostToMarketing?: boolean
  tokenExpirationEnabled?: boolean
  tokenExpirationDays?: number
  invalidTokenMessage?: string
  expiredTokenMessage?: string
}

interface UpdatePromoterConfigData {
  name?: string
  isActive?: boolean
  ctaTemplate?: string
  autoPostToMarketing?: boolean
  tokenExpirationEnabled?: boolean
  tokenExpirationDays?: number
  invalidTokenMessage?: string
  expiredTokenMessage?: string
}

/**
 * Create a new promoter configuration
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */
export const create = async (
  ctx: RequestContext,
  data: CreatePromoterConfigData
) => {
  if (!ctx.user) {
    throw new BadRequestError('User not authenticated')
  }
  
  // Validate bot ownership
  const bot = await db.bot.findFirst({
    where: {
      id: data.botId,
      userId: ctx.user.id,
      deletedAt: null,
    },
  })
  
  if (!bot) {
    throw new NotFoundError('Bot not found or not owned by user')
  }
  
  // Validate vault entity
  const vaultEntity = await db.telegramEntity.findFirst({
    where: {
      id: data.vaultEntityId,
      userId: ctx.user.id,
      deletedAt: null,
    },
  })
  
  if (!vaultEntity) {
    throw new NotFoundError('Vault group not found')
  }
  
  // Validate marketing entity
  const marketingEntity = await db.telegramEntity.findFirst({
    where: {
      id: data.marketingEntityId,
      userId: ctx.user.id,
      deletedAt: null,
    },
  })
  
  if (!marketingEntity) {
    throw new NotFoundError('Marketing group not found')
  }
  
  // Check bot admin permissions in both groups (Requirement 5.5)
  const vaultLink = await db.botTelegramEntity.findFirst({
    where: {
      botId: data.botId,
      telegramEntityId: data.vaultEntityId,
      isAdmin: true,
    },
  })
  
  if (!vaultLink) {
    throw new BadRequestError('Bot must be admin in vault group')
  }
  
  const marketingLink = await db.botTelegramEntity.findFirst({
    where: {
      botId: data.botId,
      telegramEntityId: data.marketingEntityId,
      isAdmin: true,
    },
  })
  
  if (!marketingLink) {
    throw new BadRequestError('Bot must be admin in marketing group')
  }
  
  // Check for duplicate configuration (Requirement 5.6)
  const existing = await db.promoterConfig.findFirst({
    where: {
      botId: data.botId,
      vaultEntityId: data.vaultEntityId,
      deletedAt: null,
    },
  })
  
  if (existing) {
    throw new BadRequestError('Configuration already exists for this bot and vault group')
  }
  
  // Create configuration
  const config = await db.promoterConfig.create({
    data: {
      userId: ctx.user.id,
      botId: data.botId,
      vaultEntityId: data.vaultEntityId,
      marketingEntityId: data.marketingEntityId,
      name: data.name,
      ctaTemplate: data.ctaTemplate,
      autoPostToMarketing: data.autoPostToMarketing,
      tokenExpirationEnabled: data.tokenExpirationEnabled,
      tokenExpirationDays: data.tokenExpirationDays,
      invalidTokenMessage: data.invalidTokenMessage,
      expiredTokenMessage: data.expiredTokenMessage,
    },
    include: {
      bot: true,
      vaultEntity: true,
      marketingEntity: true,
    },
  })
  
  return config
}

/**
 * Update promoter configuration
 * Requirements: 7.1, 7.6
 */
export const update = async (
  ctx: RequestContext,
  configId: string,
  data: UpdatePromoterConfigData
) => {
  if (!ctx.user) {
    throw new BadRequestError('User not authenticated')
  }
  
  const config = await db.promoterConfig.findFirst({
    where: {
      id: configId,
      userId: ctx.user.id,
      deletedAt: null,
    },
  })
  
  if (!config) {
    throw new NotFoundError('Configuration not found')
  }
  
  const updated = await db.promoterConfig.update({
    where: { id: configId },
    data,
    include: {
      bot: true,
      vaultEntity: true,
      marketingEntity: true,
    },
  })
  
  return updated
}

/**
 * Delete promoter configuration
 * Requirements: 5.1
 */
export const deleteConfig = async (ctx: RequestContext, configId: string) => {
  if (!ctx.user) {
    throw new BadRequestError('User not authenticated')
  }
  
  const config = await db.promoterConfig.findFirst({
    where: {
      id: configId,
      userId: ctx.user.id,
      deletedAt: null,
    },
  })
  
  if (!config) {
    throw new NotFoundError('Configuration not found')
  }
  
  await db.promoterConfig.update({
    where: { id: configId },
    data: { deletedAt: new Date() },
  })
}

/**
 * List promoter configurations
 * Requirements: 5.1
 */
export const list = async (
  ctx: RequestContext,
  filters?: { botId?: string }
) => {
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
  
  const configs = await db.promoterConfig.findMany({
    where,
    include: {
      bot: true,
      vaultEntity: true,
      marketingEntity: true,
    },
    orderBy: { createdAt: 'desc' },
  })
  
  return configs
}

/**
 * Get promoter configuration by ID
 * Requirements: 5.1
 */
export const getById = async (ctx: RequestContext, configId: string) => {
  if (!ctx.user) {
    throw new BadRequestError('User not authenticated')
  }
  
  const config = await db.promoterConfig.findFirst({
    where: {
      id: configId,
      userId: ctx.user.id,
      deletedAt: null,
    },
    include: {
      bot: true,
      vaultEntity: true,
      marketingEntity: true,
    },
  })
  
  if (!config) {
    throw new NotFoundError('Configuration not found')
  }
  
  return config
}

/**
 * Toggle active status
 * Requirements: 7.7
 */
export const toggleActive = async (ctx: RequestContext, configId: string) => {
  if (!ctx.user) {
    throw new BadRequestError('User not authenticated')
  }
  
  const config = await db.promoterConfig.findFirst({
    where: {
      id: configId,
      userId: ctx.user.id,
      deletedAt: null,
    },
  })
  
  if (!config) {
    throw new NotFoundError('Configuration not found')
  }
  
  const updated = await db.promoterConfig.update({
    where: { id: configId },
    data: { isActive: !config.isActive },
    include: {
      bot: true,
      vaultEntity: true,
      marketingEntity: true,
    },
  })
  
  return updated
}

/**
 * Get active configuration for a vault
 * Requirements: 5.7
 */
export const getActiveConfigForVault = async (
  botId: string,
  vaultChatId: string
) => {
  const config = await db.promoterConfig.findFirst({
    where: {
      botId,
      vaultEntity: {
        telegramId: vaultChatId,
      },
      isActive: true,
      deletedAt: null,
    },
    include: {
      bot: true,
      vaultEntity: true,
      marketingEntity: true,
    },
  })
  
  return config
}

// ============ POST CAPTURE ============

enum PromoterMediaType {
  PHOTO = 0,
  VIDEO = 1,
  DOCUMENT = 2,
}

/**
 * Extract media information from a Telegram message
 */
const extractMediaInfo = (message: Message): {
  fileId: string
  mediaType: PromoterMediaType
  caption?: string
} | null => {
  let fileId: string | undefined
  let mediaType: PromoterMediaType | undefined
  let caption: string | undefined

  // Check for photo
  if ('photo' in message && message.photo && message.photo.length > 0) {
    // Get the largest photo size
    const largestPhoto = message.photo[message.photo.length - 1]
    if (largestPhoto) {
      fileId = largestPhoto.file_id
      mediaType = PromoterMediaType.PHOTO
      caption = 'caption' in message ? message.caption : undefined
    }
  }
  // Check for video
  else if ('video' in message && message.video) {
    fileId = message.video.file_id
    mediaType = PromoterMediaType.VIDEO
    caption = 'caption' in message ? message.caption : undefined
  }
  // Check for document
  else if ('document' in message && message.document) {
    fileId = message.document.file_id
    mediaType = PromoterMediaType.DOCUMENT
    caption = 'caption' in message ? message.caption : undefined
  }

  if (!fileId || mediaType === undefined) {
    return null
  }

  return { fileId, mediaType, caption }
}

/**
 * Capture a media post from the vault group
 * Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 8.1, 9.1
 */
export const capturePost = async (
  botId: string,
  message: Message
): Promise<any | null> => {
  // Get the active config for this vault
  const chatId = message.chat.id.toString()
  const config = await getActiveConfigForVault(botId, chatId)
  
  if (!config) {
    return null
  }

  // Check if bot can access vault group (Requirement 9.1)
  try {
    const { getBotInstance } = await import('../bot/bot-manager')
    const botInstance = getBotInstance(botId)
    
    if (!botInstance) {
      throw new Error('Bot instance not found')
    }

    // Try to get chat to verify access
    await botInstance.bot.telegram.getChat(chatId)
  } catch (error: any) {
    // Bot cannot access vault group - mark config as inactive and log error
    console.error(`[PROMOTER_ERROR] Bot ${botId} cannot access vault group ${chatId}: ${error.message}`)
    
    await db.promoterConfig.update({
      where: { id: config.id },
      data: { isActive: false },
    }).catch((dbError) => {
      console.error(`[PROMOTER_ERROR] Failed to mark config ${config.id} as inactive:`, dbError)
    })
    
    return null
  }

  // Extract media information (Requirements 1.3, 1.4, 1.5)
  const mediaInfo = extractMediaInfo(message)
  if (!mediaInfo) {
    // Not a supported media type
    return null
  }

  // Generate unique promotion token (Requirement 1.6)
  const token = await generateToken()

  // Calculate expiration date if enabled
  let expiresAt: Date | undefined
  if (config.tokenExpirationEnabled && config.tokenExpirationDays) {
    expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + config.tokenExpirationDays)
  }

  // Store post in database with all metadata (Requirement 1.7)
  // and increment totalCaptures counter (Requirement 8.1)
  const post = await db.$transaction(async (tx) => {
    // Create the post
    const newPost = await tx.promoterPost.create({
      data: {
        configId: config.id,
        token,
        fileId: mediaInfo.fileId,
        mediaType: mediaInfo.mediaType,
        caption: mediaInfo.caption,
        sourceMessageId: message.message_id,
        sourceChatId: chatId,
        expiresAt,
      },
    })

    // Increment totalCaptures counter
    await tx.promoterConfig.update({
      where: { id: config.id },
      data: {
        totalCaptures: {
          increment: 1,
        },
      },
    })

    return newPost
  })

  return post
}

// ============ MARKETING POST CREATION ============

// Global rate limiter per bot - tracks last marketing post time
const botMarketingTimestamps = new Map<string, number>()
const MIN_MARKETING_DELAY_MS = 3000 // 3 seconds between marketing posts

/**
 * Wait for rate limit before posting to prevent 429 errors
 * Requirements: 6.1, 6.7
 */
async function waitForMarketingRateLimit(botId: string): Promise<void> {
  const now = Date.now()
  const lastPost = botMarketingTimestamps.get(botId) || 0
  const timeSinceLastPost = now - lastPost
  
  if (timeSinceLastPost < MIN_MARKETING_DELAY_MS) {
    const waitTime = MIN_MARKETING_DELAY_MS - timeSinceLastPost
    console.log(`[PROMOTER_RATE_LIMIT] Bot ${botId}: Waiting ${waitTime}ms before marketing post`)
    await new Promise(resolve => setTimeout(resolve, waitTime))
  }
  
  botMarketingTimestamps.set(botId, Date.now())
}

/**
 * Retry a Telegram API operation with exponential backoff
 * Requirements: 6.3, 6.4, 6.5, 6.6, 9.3
 */
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  botId: string,
  operationName: string,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: any
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error: any) {
      lastError = error
      
      // Check for Telegram rate limit (429) error (Requirement 6.3)
      const isRateLimit = 
        error.response?.error_code === 429 ||
        error.code === 429 ||
        error.message?.includes('Too Many Requests') ||
        error.message?.includes('429')
      
      // Check for network errors (Requirement 9.3)
      const isNetworkError =
        error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ENOTFOUND' ||
        error.code === 'ECONNREFUSED' ||
        error.message?.includes('network') ||
        error.message?.includes('timeout') ||
        error.message?.includes('ECONNRESET')
      
      if (isRateLimit) {
        // Respect retry_after parameter from Telegram (Requirement 6.4)
        const retryAfter = error.response?.parameters?.retry_after || (attempt * 5)
        const waitTime = retryAfter * 1000
        
        // Log rate limit event (Requirement 6.6)
        console.warn(
          `[PROMOTER_RATE_LIMIT] Bot ${botId}: Rate limited on ${operationName}, ` +
          `attempt ${attempt}/${maxRetries}, waiting ${retryAfter}s before retry`
        )
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, waitTime))
          continue
        }
      } else if (isNetworkError) {
        // For network errors, use exponential backoff (Requirement 9.3)
        if (attempt < maxRetries) {
          const backoffMs = baseDelayMs * Math.pow(2, attempt - 1)
          console.warn(
            `[PROMOTER_NETWORK_ERROR] Bot ${botId}: Network error on ${operationName}, ` +
            `attempt ${attempt}/${maxRetries}, retrying in ${backoffMs}ms: ${error.message}`
          )
          await new Promise(resolve => setTimeout(resolve, backoffMs))
          continue
        }
      } else {
        // For other errors, use exponential backoff (Requirement 6.5)
        if (attempt < maxRetries) {
          const backoffMs = baseDelayMs * Math.pow(2, attempt - 1)
          console.warn(
            `[PROMOTER_ERROR] Bot ${botId}: Error on ${operationName}, ` +
            `attempt ${attempt}/${maxRetries}, retrying in ${backoffMs}ms: ${error.message}`
          )
          await new Promise(resolve => setTimeout(resolve, backoffMs))
          continue
        }
      }
      
      // Max retries reached, throw the last error
      console.error(
        `[PROMOTER_ERROR] Bot ${botId}: Failed ${operationName} after ${maxRetries} attempts: ${error.message}`
      )
      throw lastError
    }
  }
  
  throw lastError
}

/**
 * Create a marketing post in the marketing group
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 6.1, 8.2, 9.2
 */
export const createMarketingPost = async (
  post: any,
  config: any
): Promise<void> => {
  // Get bot instance
  const { getBotInstance } = await import('../bot/bot-manager')
  const botInstance = getBotInstance(config.botId)
  
  if (!botInstance) {
    throw new Error('Bot instance not found')
  }

  // Get bot username for deep link
  const botUsername = botInstance.username
  if (!botUsername) {
    throw new Error('Bot username not available')
  }

  // Generate deep link (Requirement 2.3)
  const deepLink = `https://t.me/${botUsername}?start=${post.token}`

  // Format CTA message using template (Requirement 2.2, 2.4)
  // Use original caption if present AND includeCaptionInCta is true
  let messageText: string
  if (post.caption && config.includeCaptionInCta) {
    // If there's a caption and user wants it included, use it and append the CTA template
    messageText = post.caption + '\n\n' + config.ctaTemplate
  } else {
    // No caption or user doesn't want it included, just use the CTA template
    messageText = config.ctaTemplate
  }

  // Replace template variables
  messageText = messageText
    .replace(/\{link\}/g, deepLink)
    .replace(/\{token\}/g, post.token)

  // Apply rate limiting (Requirement 6.1)
  await waitForMarketingRateLimit(config.botId)

  // Send text-only message to marketing group with retry logic (Requirements 2.5, 2.6, 2.7, 6.3, 6.4, 6.5, 9.2)
  const marketingChatId = config.marketingEntity.telegramId
  
  try {
    const sentMessage = await retryWithBackoff(
      () => botInstance.bot.telegram.sendMessage(marketingChatId, messageText),
      config.botId,
      'createMarketingPost'
    )

    // Store marketing message ID and timestamp, increment counter (Requirement 8.2)
    await db.$transaction(async (tx) => {
      // Update post with marketing message info
      await tx.promoterPost.update({
        where: { id: post.id },
        data: {
          marketingMessageId: sentMessage.message_id,
          marketingChatId: marketingChatId,
          marketingPostedAt: new Date(),
        },
      })

      // Increment totalMarketingPosts counter
      await tx.promoterConfig.update({
        where: { id: config.id },
        data: {
          totalMarketingPosts: {
            increment: 1,
          },
        },
      })
    })

    console.log(`[PROMOTER] Created marketing post for token ${post.token} in chat ${marketingChatId}`)
  } catch (error: any) {
    // Handle marketing group access errors (Requirement 9.2)
    console.error(
      `[PROMOTER_ERROR] Failed to create marketing post for token ${post.token} in chat ${marketingChatId}: ${error.message}`
    )
    
    // Check if it's an access error
    const isAccessError = 
      error.response?.error_code === 403 ||
      error.response?.description?.includes('bot was kicked') ||
      error.response?.description?.includes('not enough rights') ||
      error.response?.description?.includes('chat not found')
    
    if (isAccessError) {
      console.error(
        `[PROMOTER_ERROR] Bot ${config.botId} cannot access marketing group ${marketingChatId}. ` +
        `Marketing post queued for retry (or logged for manual intervention).`
      )
    }
    
    // Re-throw to allow caller to handle
    throw error
  }
}

// ============ CONTENT DELIVERY ============

// Global rate limiter per bot - tracks last delivery time
const botDeliveryTimestamps = new Map<string, number>()
const MIN_DELIVERY_DELAY_MS = 1000 // 1 second between deliveries

/**
 * Wait for rate limit before delivery to prevent 429 errors
 * Requirements: 6.2, 6.7
 */
async function waitForDeliveryRateLimit(botId: string): Promise<void> {
  const now = Date.now()
  const lastDelivery = botDeliveryTimestamps.get(botId) || 0
  const timeSinceLastDelivery = now - lastDelivery
  
  if (timeSinceLastDelivery < MIN_DELIVERY_DELAY_MS) {
    const waitTime = MIN_DELIVERY_DELAY_MS - timeSinceLastDelivery
    console.log(`[PROMOTER_RATE_LIMIT] Bot ${botId}: Waiting ${waitTime}ms before delivery`)
    await new Promise(resolve => setTimeout(resolve, waitTime))
  }
  
  botDeliveryTimestamps.set(botId, Date.now())
}

interface UserInfo {
  username?: string
  firstName?: string
  lastName?: string
}

interface DeliveryResult {
  success: boolean
  error?: string
  post?: any
}

/**
 * Deliver content to a user via deep link token
 * Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 6.2, 8.3, 8.4, 8.5
 */
export const deliverContent = async (
  botId: string,
  token: string,
  telegramUserId: string,
  userInfo: UserInfo
): Promise<DeliveryResult> => {
  try {
    // Validate token and check expiration (Requirements 3.3)
    const validation = await validateToken(token)
    
    if (!validation.valid) {
      // Get config for error messages
      const post = validation.post
      let errorMessage: string
      
      if (validation.expired && post) {
        // Expired token (Requirement 3.8)
        errorMessage = post.config.expiredTokenMessage || '⏰ This link has expired.'
      } else {
        // Invalid token (Requirement 3.7)
        // Try to find any config for this bot to get the error message
        const anyConfig = await db.promoterConfig.findFirst({
          where: {
            botId,
            isActive: true,
            deletedAt: null,
          },
        })
        errorMessage = anyConfig?.invalidTokenMessage || '❌ This link is invalid or has been removed.'
      }
      
      return {
        success: false,
        error: errorMessage,
      }
    }
    
    // Retrieve post data from database (Requirement 3.4)
    const post = validation.post
    if (!post) {
      return {
        success: false,
        error: '❌ This link is invalid or has been removed.',
      }
    }
    
    // Get bot instance
    const { getBotInstance } = await import('../bot/bot-manager')
    const botInstance = getBotInstance(botId)
    
    if (!botInstance) {
      throw new Error('Bot instance not found')
    }
    
    // Apply rate limiting (Requirement 6.2)
    await waitForDeliveryRateLimit(botId)
    
    // Prepare caption with modifications
    let finalCaption = post.caption || ''
    
    // Remove links if configured
    if (post.config.removeLinks && finalCaption) {
      // Remove URLs
      finalCaption = finalCaption.replace(/https?:\/\/[^\s]+/g, '')
      // Remove @mentions
      finalCaption = finalCaption.replace(/@\w+/g, '')
      finalCaption = finalCaption.trim()
    }
    
    // Add watermark if configured
    if (post.config.addWatermark) {
      finalCaption = finalCaption 
        ? `${finalCaption}\n\n${post.config.addWatermark}`
        : post.config.addWatermark
    }
    
    const captionToSend = finalCaption || undefined
    
    // Determine delivery method: copy mode or forward mode
    const deliveredMessageIds: number[] = []
    
    if (post.config.copyMode || post.config.hideSenderName) {
      // Use copyMessage or send directly (copy mode)
      // Send media to user using stored file_id with retry logic (Requirements 3.5, 3.6, 6.3, 6.4, 6.5)
      let sentMessage: any
      
      switch (post.mediaType) {
        case PromoterMediaType.PHOTO:
          sentMessage = await retryWithBackoff(
            () => botInstance.bot.telegram.sendPhoto(telegramUserId, post.fileId, { caption: captionToSend }),
            botId,
            'deliverPhoto'
          )
          deliveredMessageIds.push(sentMessage.message_id)
          break
        
        case PromoterMediaType.VIDEO:
          sentMessage = await retryWithBackoff(
            () => botInstance.bot.telegram.sendVideo(telegramUserId, post.fileId, { caption: captionToSend }),
            botId,
            'deliverVideo'
          )
          deliveredMessageIds.push(sentMessage.message_id)
          break
        
        case PromoterMediaType.DOCUMENT:
          sentMessage = await retryWithBackoff(
            () => botInstance.bot.telegram.sendDocument(telegramUserId, post.fileId, { caption: captionToSend }),
            botId,
            'deliverDocument'
          )
          deliveredMessageIds.push(sentMessage.message_id)
          break
        
        default:
          throw new Error(`Unsupported media type: ${post.mediaType}`)
      }
    } else {
      // Use forwardMessage (shows "Forwarded from" label)
      const forwardedMessage = await retryWithBackoff(
        () => botInstance.bot.telegram.forwardMessage(
          telegramUserId,
          post.sourceChatId,
          post.sourceMessageId
        ),
        botId,
        'deliverForward'
      )
      deliveredMessageIds.push(forwardedMessage.message_id)
      
      // If caption was modified, send it as a separate message
      if (captionToSend && captionToSend !== post.caption) {
        const captionMessage = await retryWithBackoff(
          () => botInstance.bot.telegram.sendMessage(telegramUserId, captionToSend),
          botId,
          'deliverModifiedCaption'
        )
        deliveredMessageIds.push(captionMessage.message_id)
      }
    }
    
    // Create PromoterDelivery record and increment counters (Requirements 8.3, 8.4, 8.5)
    await db.$transaction(async (tx) => {
      // Create delivery record with message IDs for auto-delete
      await tx.promoterDelivery.create({
        data: {
          postId: post.id,
          telegramUserId,
          username: userInfo.username,
          firstName: userInfo.firstName,
          lastName: userInfo.lastName,
          deliveredMessageIds,
          chatId: telegramUserId,
        },
      })
      
      // Increment deliveryCount for the post
      await tx.promoterPost.update({
        where: { id: post.id },
        data: {
          deliveryCount: {
            increment: 1,
          },
          lastDeliveredAt: new Date(),
        },
      })
      
      // Increment totalDeliveries for the config
      await tx.promoterConfig.update({
        where: { id: post.configId },
        data: {
          totalDeliveries: {
            increment: 1,
          },
        },
      })
    })
    
    console.log(`[PROMOTER] Delivered content for token ${token} to user ${telegramUserId}`)
    
    return {
      success: true,
      post,
    }
  } catch (error: any) {
    console.error('[PROMOTER] Error delivering content:', error)
    return {
      success: false,
      error: 'An error occurred while delivering content. Please try again later.',
    }
  }
}

// ============ ANALYTICS ============

interface PromoterStats {
  totalCaptures: number
  totalMarketingPosts: number
  totalDeliveries: number
  uniqueRecipients: number
  avgDeliveriesPerPost: number
  recentPosts: any[]
}

/**
 * Get analytics stats for a promoter configuration
 * Requirements: 8.6
 */
export const getStats = async (
  ctx: RequestContext,
  configId: string
): Promise<PromoterStats> => {
  if (!ctx.user) {
    throw new BadRequestError('User not authenticated')
  }
  
  // Get the configuration
  const config = await db.promoterConfig.findFirst({
    where: {
      id: configId,
      userId: ctx.user.id,
      deletedAt: null,
    },
  })
  
  if (!config) {
    throw new NotFoundError('Configuration not found')
  }
  
  // Get unique recipients count
  const uniqueRecipientsResult = await db.promoterDelivery.groupBy({
    by: ['telegramUserId'],
    where: {
      post: {
        configId,
      },
    },
  })
  const uniqueRecipients = uniqueRecipientsResult.length
  
  // Calculate average deliveries per post
  const postCount = await db.promoterPost.count({
    where: { configId },
  })
  const avgDeliveriesPerPost = postCount > 0 
    ? config.totalDeliveries / postCount 
    : 0
  
  // Fetch recent posts (last 10)
  const recentPosts = await db.promoterPost.findMany({
    where: { configId },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      _count: {
        select: { deliveries: true },
      },
    },
  })
  
  return {
    totalCaptures: config.totalCaptures,
    totalMarketingPosts: config.totalMarketingPosts,
    totalDeliveries: config.totalDeliveries,
    uniqueRecipients,
    avgDeliveriesPerPost,
    recentPosts,
  }
}

interface PostStats {
  post: any
  deliveryCount: number
  uniqueRecipients: number
  recentDeliveries: any[]
}

/**
 * Get analytics stats for a specific post
 * Requirements: 8.7
 */
export const getPostStats = async (
  ctx: RequestContext,
  postId: string
): Promise<PostStats> => {
  if (!ctx.user) {
    throw new BadRequestError('User not authenticated')
  }
  
  // Get the post with config to verify ownership
  const post = await db.promoterPost.findFirst({
    where: {
      id: postId,
      config: {
        userId: ctx.user.id,
        deletedAt: null,
      },
    },
    include: {
      config: true,
    },
  })
  
  if (!post) {
    throw new NotFoundError('Post not found')
  }
  
  // Get delivery count (should match post.deliveryCount)
  const deliveryCount = post.deliveryCount
  
  // Get unique recipients count
  const uniqueRecipientsResult = await db.promoterDelivery.groupBy({
    by: ['telegramUserId'],
    where: {
      postId,
    },
  })
  const uniqueRecipients = uniqueRecipientsResult.length
  
  // Fetch recent deliveries (last 20)
  const recentDeliveries = await db.promoterDelivery.findMany({
    where: { postId },
    orderBy: { deliveredAt: 'desc' },
    take: 20,
  })
  
  return {
    post,
    deliveryCount,
    uniqueRecipients,
    recentDeliveries,
  }
}

// ============ TOKEN EXPIRATION ============

/**
 * Expire old tokens that have passed their expiration date
 * Requirements: 4.6
 */
export const expireOldTokens = async (): Promise<number> => {
  const now = new Date()

  // Find all posts that have an expiration date in the past and are not yet marked as expired
  const expiredPosts = await db.promoterPost.findMany({
    where: {
      isExpired: false,
      expiresAt: {
        lte: now,
      },
    },
  })

  if (expiredPosts.length === 0) {
    console.log('[PROMOTER_EXPIRATION] No tokens to expire')
    return 0
  }

  console.log(`[PROMOTER_EXPIRATION] Found ${expiredPosts.length} tokens to expire`)

  // Mark all expired posts as expired
  const result = await db.promoterPost.updateMany({
    where: {
      id: {
        in: expiredPosts.map(post => post.id),
      },
    },
    data: {
      isExpired: true,
    },
  })

  console.log(`[PROMOTER_EXPIRATION] Marked ${result.count} tokens as expired`)

  return result.count
}

/**
 * Delete old marketing posts based on configuration
 * This runs periodically to clean up marketing posts after their configured deletion time
 */
export const deleteOldMarketingPosts = async (): Promise<number> => {
  const now = new Date()
  let deletedCount = 0

  // Get all active configs with auto-delete enabled
  const configs = await db.promoterConfig.findMany({
    where: {
      isActive: true,
      deleteMarketingAfterEnabled: true,
      deletedAt: null,
    },
    include: {
      bot: true,
      posts: {
        where: {
          marketingMessageId: { not: null },
          marketingPostedAt: { not: null },
        },
      },
    },
  })

  for (const config of configs) {
    if (!config.deleteMarketingInterval || config.deleteMarketingIntervalUnit === null) {
      continue
    }

    // Calculate deletion time based on interval unit
    let deletionTimeMs = 0
    switch (config.deleteMarketingIntervalUnit) {
      case 0: // seconds
        deletionTimeMs = config.deleteMarketingInterval * 1000
        break
      case 1: // minutes
        deletionTimeMs = config.deleteMarketingInterval * 60 * 1000
        break
      case 2: // hours
        deletionTimeMs = config.deleteMarketingInterval * 60 * 60 * 1000
        break
      case 3: // days
        deletionTimeMs = config.deleteMarketingInterval * 24 * 60 * 60 * 1000
        break
      case 4: // months (30 days)
        deletionTimeMs = config.deleteMarketingInterval * 30 * 24 * 60 * 60 * 1000
        break
      case 5: // never
        continue
      default:
        continue
    }

    // Get bot instance
    const { getBotInstance } = await import('../bot/bot-manager')
    const botInstance = getBotInstance(config.botId)
    
    if (!botInstance) {
      console.warn(`[PROMOTER_DELETION] Bot instance not found for config ${config.id}`)
      continue
    }

    // Find posts that should be deleted
    for (const post of config.posts) {
      if (!post.marketingPostedAt || !post.marketingMessageId || !post.marketingChatId) {
        continue
      }

      const timeSincePosted = now.getTime() - post.marketingPostedAt.getTime()
      
      if (timeSincePosted >= deletionTimeMs) {
        try {
          // Delete the marketing message
          await botInstance.bot.telegram.deleteMessage(
            post.marketingChatId,
            post.marketingMessageId
          )
          
          // Clear the marketing message info from the post
          await db.promoterPost.update({
            where: { id: post.id },
            data: {
              marketingMessageId: null,
              marketingChatId: null,
            },
          })
          
          deletedCount++
          console.log(`[PROMOTER_DELETION] Deleted marketing post ${post.marketingMessageId} from config ${config.name}`)
        } catch (error: any) {
          console.error(`[PROMOTER_DELETION] Error deleting marketing post ${post.marketingMessageId}:`, error.message)
        }
      }
    }
  }

  return deletedCount
}

/**
 * Delete old delivered content based on configuration
 * This runs periodically to clean up content sent to users after their configured deletion time
 */
export const deleteOldDeliveredContent = async (): Promise<number> => {
  const now = new Date()
  let deletedCount = 0

  // Get all active configs with delivered content auto-delete enabled
  const configs = await db.promoterConfig.findMany({
    where: {
      isActive: true,
      deleteDeliveredAfterEnabled: true,
      deletedAt: null,
    },
    include: {
      bot: true,
      posts: {
        include: {
          deliveries: {
            where: {
              deliveredMessageIds: { isEmpty: false },
            },
          },
        },
      },
    },
  })

  for (const config of configs) {
    if (!config.deleteDeliveredInterval || config.deleteDeliveredIntervalUnit === null) {
      continue
    }

    // Calculate deletion time based on interval unit
    let deletionTimeMs = 0
    switch (config.deleteDeliveredIntervalUnit) {
      case 0: // seconds
        deletionTimeMs = config.deleteDeliveredInterval * 1000
        break
      case 1: // minutes
        deletionTimeMs = config.deleteDeliveredInterval * 60 * 1000
        break
      case 2: // hours
        deletionTimeMs = config.deleteDeliveredInterval * 60 * 60 * 1000
        break
      case 3: // days
        deletionTimeMs = config.deleteDeliveredInterval * 24 * 60 * 60 * 1000
        break
      case 4: // months (30 days)
        deletionTimeMs = config.deleteDeliveredInterval * 30 * 24 * 60 * 60 * 1000
        break
      case 5: // never
        continue
      default:
        continue
    }

    // Get bot instance
    const { getBotInstance } = await import('../bot/bot-manager')
    const botInstance = getBotInstance(config.botId)
    
    if (!botInstance) {
      console.warn(`[PROMOTER_DELIVERED_DELETION] Bot instance not found for config ${config.id}`)
      continue
    }

    // Find deliveries that should be deleted
    for (const post of config.posts) {
      for (const delivery of post.deliveries) {
        if (!delivery.deliveredAt || !delivery.chatId || delivery.deliveredMessageIds.length === 0) {
          continue
        }

        const timeSinceDelivered = now.getTime() - delivery.deliveredAt.getTime()
        
        if (timeSinceDelivered >= deletionTimeMs) {
          // Delete all messages sent to this user
          let deletedMessages = 0
          for (const messageId of delivery.deliveredMessageIds) {
            try {
              await botInstance.bot.telegram.deleteMessage(delivery.chatId, messageId)
              deletedMessages++
            } catch (error: any) {
              console.error(`[PROMOTER_DELIVERED_DELETION] Error deleting message ${messageId}:`, error.message)
            }
          }
          
          if (deletedMessages > 0) {
            // Clear the message IDs from the delivery record
            await db.promoterDelivery.update({
              where: { id: delivery.id },
              data: {
                deliveredMessageIds: [],
              },
            })
            
            deletedCount += deletedMessages
            console.log(`[PROMOTER_DELIVERED_DELETION] Deleted ${deletedMessages} messages for delivery ${delivery.id} from config ${config.name}`)
          }
        }
      }
    }
  }

  return deletedCount
}

// ============ ADMIN PERMISSION DETECTION ============

/**
 * Check bot admin permissions for all active promoter configurations
 * Requirements: 9.5
 */
export const checkAdminPermissions = async (): Promise<{
  checked: number
  permissionLost: Array<{ configId: string; configName: string; groupType: 'vault' | 'marketing'; groupName: string }>
}> => {
  const results = {
    checked: 0,
    permissionLost: [] as Array<{ configId: string; configName: string; groupType: 'vault' | 'marketing'; groupName: string }>,
  }

  // Get all active promoter configurations
  const configs = await db.promoterConfig.findMany({
    where: {
      isActive: true,
      deletedAt: null,
    },
    include: {
      bot: true,
      vaultEntity: true,
      marketingEntity: true,
    },
  })

  console.log(`[PROMOTER_ADMIN_CHECK] Checking admin permissions for ${configs.length} active configurations`)

  for (const config of configs) {
    results.checked++

    try {
      const { getBotInstance } = await import('../bot/bot-manager')
      const botInstance = getBotInstance(config.botId)

      if (!botInstance) {
        console.warn(`[PROMOTER_ADMIN_CHECK] Bot instance not found for config ${config.id}`)
        continue
      }

      // Check vault group admin status
      try {
        const vaultChatId = config.vaultEntity.telegramId
        const vaultMember = await botInstance.bot.telegram.getChatMember(vaultChatId, parseInt(botInstance.telegramBotId))

        if (vaultMember.status !== 'administrator' && vaultMember.status !== 'creator') {
          console.warn(
            `[PROMOTER_ADMIN_CHECK] Bot ${config.botId} lost admin permissions in vault group ${vaultChatId} ` +
            `(config: ${config.name}). Current status: ${vaultMember.status}`
          )

          results.permissionLost.push({
            configId: config.id,
            configName: config.name,
            groupType: 'vault',
            groupName: config.vaultEntity.title || config.vaultEntity.telegramId,
          })

          // Mark configuration as inactive
          await db.promoterConfig.update({
            where: { id: config.id },
            data: { isActive: false },
          })
        }
      } catch (error: any) {
        console.error(
          `[PROMOTER_ADMIN_CHECK] Error checking vault group permissions for config ${config.id}: ${error.message}`
        )

        // If we can't check permissions (e.g., bot was kicked), mark as inactive
        if (
          error.response?.error_code === 403 ||
          error.response?.description?.includes('bot was kicked') ||
          error.response?.description?.includes('chat not found')
        ) {
          results.permissionLost.push({
            configId: config.id,
            configName: config.name,
            groupType: 'vault',
            groupName: config.vaultEntity.title || config.vaultEntity.telegramId,
          })

          await db.promoterConfig.update({
            where: { id: config.id },
            data: { isActive: false },
          })
        }
      }

      // Check marketing group admin status
      try {
        const marketingChatId = config.marketingEntity.telegramId
        const marketingMember = await botInstance.bot.telegram.getChatMember(marketingChatId, parseInt(botInstance.telegramBotId))

        if (marketingMember.status !== 'administrator' && marketingMember.status !== 'creator') {
          console.warn(
            `[PROMOTER_ADMIN_CHECK] Bot ${config.botId} lost admin permissions in marketing group ${marketingChatId} ` +
            `(config: ${config.name}). Current status: ${marketingMember.status}`
          )

          results.permissionLost.push({
            configId: config.id,
            configName: config.name,
            groupType: 'marketing',
            groupName: config.marketingEntity.title || config.marketingEntity.telegramId,
          })

          // Mark configuration as inactive
          await db.promoterConfig.update({
            where: { id: config.id },
            data: { isActive: false },
          })
        }
      } catch (error: any) {
        console.error(
          `[PROMOTER_ADMIN_CHECK] Error checking marketing group permissions for config ${config.id}: ${error.message}`
        )

        // If we can't check permissions (e.g., bot was kicked), mark as inactive
        if (
          error.response?.error_code === 403 ||
          error.response?.description?.includes('bot was kicked') ||
          error.response?.description?.includes('chat not found')
        ) {
          results.permissionLost.push({
            configId: config.id,
            configName: config.name,
            groupType: 'marketing',
            groupName: config.marketingEntity.title || config.marketingEntity.telegramId,
          })

          await db.promoterConfig.update({
            where: { id: config.id },
            data: { isActive: false },
          })
        }
      }
    } catch (error: any) {
      console.error(`[PROMOTER_ADMIN_CHECK] Error processing config ${config.id}: ${error.message}`)
    }
  }

  if (results.permissionLost.length > 0) {
    console.warn(
      `[PROMOTER_ADMIN_CHECK] Found ${results.permissionLost.length} configurations with lost permissions`
    )
  } else {
    console.log(`[PROMOTER_ADMIN_CHECK] All ${results.checked} configurations have valid admin permissions`)
  }

  return results
}

export default {
  generateToken,
  validateToken,
  create,
  update,
  delete: deleteConfig,
  list,
  getById,
  toggleActive,
  getActiveConfigForVault,
  capturePost,
  createMarketingPost,
  deliverContent,
  getStats,
  getPostStats,
  checkAdminPermissions,
  expireOldTokens,
  deleteOldMarketingPosts,
  deleteOldDeliveredContent,
}
