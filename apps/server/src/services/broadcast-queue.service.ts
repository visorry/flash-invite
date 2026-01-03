/**
 * Broadcast Queue Manager
 * Handles background processing of broadcasts with rate limiting and progress tracking
 */

import db from '@super-invite/db'
import { BroadcastStatus } from '@super-invite/db'
import { getBot } from '../bot/bot-manager'

// Configuration
const CONFIG = {
    BATCH_SIZE: 25,           // Messages per batch
    BATCH_DELAY_MS: 1000,     // Delay between batches (1 second)
    MESSAGE_DELAY_MS: 200,    // Delay between messages (5 msg/sec)
    MAX_RETRIES: 3,           // Max retries per message
    INITIAL_BACKOFF_MS: 1000, // Initial backoff for 429 errors
    MAX_BACKOFF_MS: 30000,    // Max backoff (30 seconds)
}

// Active broadcasts being processed
const activeJobs = new Map<string, { cancelled: boolean }>()

/**
 * Queue a broadcast for background processing
 */
export async function queueBroadcast(broadcastId: string): Promise<void> {
    // Check if already processing
    if (activeJobs.has(broadcastId)) {
        throw new Error('Broadcast is already being processed')
    }

    // Mark as active
    activeJobs.set(broadcastId, { cancelled: false })

    // Process in background (don't await)
    processBroadcast(broadcastId).catch((error) => {
        console.error(`[BROADCAST] Error processing ${broadcastId}:`, error)
    }).finally(() => {
        activeJobs.delete(broadcastId)
    })
}

/**
 * Cancel an active broadcast
 */
export function cancelBroadcastJob(broadcastId: string): boolean {
    const job = activeJobs.get(broadcastId)
    if (job) {
        job.cancelled = true
        return true
    }
    return false
}

/**
 * Check if a broadcast is currently being processed
 */
export function isBroadcastActive(broadcastId: string): boolean {
    return activeJobs.has(broadcastId)
}

/**
 * Process a broadcast with optimized rate limiting
 */
async function processBroadcast(broadcastId: string): Promise<void> {
    console.log(`[BROADCAST] Starting broadcast ${broadcastId}`)

    const broadcast = await db.broadcast.findUnique({
        where: { id: broadcastId },
    })

    if (!broadcast) {
        console.error(`[BROADCAST] Broadcast ${broadcastId} not found`)
        return
    }

    // Update status to in progress
    await db.broadcast.update({
        where: { id: broadcastId },
        data: {
            status: BroadcastStatus.IN_PROGRESS,
            startedAt: new Date(),
        },
    })

    // Get the bot instance
    const botInstance = getBot(broadcast.botId)
    if (!botInstance) {
        await db.broadcast.update({
            where: { id: broadcastId },
            data: {
                status: BroadcastStatus.FAILED,
                completedAt: new Date(),
                errorLog: { error: 'Bot not running' },
            },
        })
        console.error(`[BROADCAST] Bot not running for broadcast ${broadcastId}`)
        return
    }

    // Get all recipients
    const members = await db.botMember.findMany({
        where: {
            id: { in: broadcast.recipientIds },
        },
        select: {
            id: true,
            telegramUserId: true,
        },
    })

    let sentCount = 0
    let failedCount = 0
    let blockedCount = 0
    const errorLog: Record<string, string> = {}
    let currentBackoff = CONFIG.INITIAL_BACKOFF_MS

    // Build message options
    const options: any = {}
    if (broadcast.parseMode) {
        options.parse_mode = broadcast.parseMode
    }
    if (broadcast.buttons && Array.isArray(broadcast.buttons) && broadcast.buttons.length > 0) {
        // Convert buttons array to Telegram inline keyboard format
        // Frontend sends: [{ name: 'Button 1', url: 'https://...' }, ...]
        // Telegram expects: [[{ text: 'Button 1', url: 'https://...' }], ...]
        const inlineKeyboard = broadcast.buttons.map((btn: any) => {
            // Check if button is already in Telegram format or needs conversion
            if (btn.text && btn.url) {
                return [btn] // Already in correct format
            } else if (btn.name && btn.url) {
                return [{ text: btn.name, url: btn.url }] // Convert from frontend format
            }
            return null
        }).filter(Boolean) // Remove any null entries

        if (inlineKeyboard.length > 0) {
            options.reply_markup = { inline_keyboard: inlineKeyboard }
        }
    }

    // Process in batches
    const batches = chunkArray(members, CONFIG.BATCH_SIZE)
    let processedCount = 0

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex]
        const job = activeJobs.get(broadcastId)

        // Check for cancellation
        if (job?.cancelled) {
            console.log(`[BROADCAST] Broadcast ${broadcastId} was cancelled`)
            await db.broadcast.update({
                where: { id: broadcastId },
                data: {
                    status: BroadcastStatus.CANCELLED,
                    sentCount,
                    failedCount,
                    blockedCount,
                    completedAt: new Date(),
                },
            })
            return
        }

        // Process each message in the batch
        if (!batch) continue
        for (const member of batch) {
            const result = await sendMessageWithRetry(
                botInstance,
                member,
                broadcast,
                options,
                currentBackoff
            )

            if (result.success) {
                sentCount++
                currentBackoff = CONFIG.INITIAL_BACKOFF_MS // Reset backoff on success
            } else if (result.blocked) {
                blockedCount++
                // Mark user as blocked
                await db.botMember.update({
                    where: { id: member.id },
                    data: {
                        isBlocked: true,
                        blockedAt: new Date(),
                        isSubscribed: false,
                    },
                }).catch(() => { })
            } else {
                failedCount++
                errorLog[member.telegramUserId] = result.error || 'Unknown error'
            }

            // Update backoff if we hit rate limit
            if (result.rateLimited) {
                currentBackoff = Math.min(currentBackoff * 2, CONFIG.MAX_BACKOFF_MS)
                console.log(`[BROADCAST] Rate limited, backoff increased to ${currentBackoff}ms`)
            }

            processedCount++

            // Delay between messages
            await sleep(CONFIG.MESSAGE_DELAY_MS)
        }

        // Update progress in database periodically (every batch)
        await db.broadcast.update({
            where: { id: broadcastId },
            data: {
                sentCount,
                failedCount,
                blockedCount,
            },
        })

        console.log(`[BROADCAST] Progress: ${processedCount}/${members.length} (sent: ${sentCount}, failed: ${failedCount}, blocked: ${blockedCount})`)

        // Delay between batches (unless last batch)
        if (batchIndex < batches.length - 1) {
            await sleep(CONFIG.BATCH_DELAY_MS)
        }
    }

    // Final update
    const finalStatus =
        failedCount + blockedCount === broadcast.totalRecipients
            ? BroadcastStatus.FAILED
            : BroadcastStatus.COMPLETED

    await db.broadcast.update({
        where: { id: broadcastId },
        data: {
            status: finalStatus,
            sentCount,
            failedCount,
            blockedCount,
            completedAt: new Date(),
            errorLog: Object.keys(errorLog).length > 0 ? errorLog : undefined,
        },
    })

    console.log(`[BROADCAST] Completed broadcast ${broadcastId}: sent=${sentCount}, failed=${failedCount}, blocked=${blockedCount}`)
}

/**
 * Send a message with retry and exponential backoff
 */
async function sendMessageWithRetry(
    botInstance: any,
    member: { id: string; telegramUserId: string },
    broadcast: any,
    options: any,
    backoff: number
): Promise<{ success: boolean; blocked?: boolean; rateLimited?: boolean; error?: string }> {
    let lastError = ''

    for (let attempt = 0; attempt < CONFIG.MAX_RETRIES; attempt++) {
        try {
            // Build message content
            let messageContent = broadcast.content || ''

            // Add watermark
            if (broadcast.watermarkEnabled && broadcast.watermarkText) {
                const watermark = broadcast.watermarkText
                if (broadcast.watermarkPosition === 'top') {
                    messageContent = `${watermark}\n\n${messageContent}`
                } else {
                    messageContent = `${messageContent}\n\n${watermark}`
                }
            }

            // Remove links if enabled
            if (broadcast.removeLinks && messageContent) {
                messageContent = messageContent.replace(/https?:\/\/[^\s]+/gi, '[link removed]')
            }

            // Send main message
            if (messageContent) {
                await botInstance.telegram.sendMessage(
                    member.telegramUserId,
                    messageContent,
                    options
                )
            }

            // Forward from source group if configured
            if (broadcast.sourceGroupId && broadcast.sourceMessageIds?.length > 0) {
                const sourceEntity = await db.telegramEntity.findUnique({
                    where: { id: broadcast.sourceGroupId },
                })

                if (sourceEntity) {
                    for (const msgId of broadcast.sourceMessageIds) {
                        try {
                            if (broadcast.copyMode) {
                                await botInstance.telegram.copyMessage(
                                    member.telegramUserId,
                                    sourceEntity.telegramId,
                                    msgId
                                )
                            } else {
                                await botInstance.telegram.forwardMessage(
                                    member.telegramUserId,
                                    sourceEntity.telegramId,
                                    msgId
                                )
                            }
                        } catch (msgError: any) {
                            console.error(`[BROADCAST] Failed to forward message ${msgId}:`, msgError.message)
                        }
                    }
                }
            }

            return { success: true }
        } catch (error: any) {
            lastError = error.message || 'Unknown error'

            // User blocked the bot
            if (lastError.includes('bot was blocked') || error.code === 403) {
                return { success: false, blocked: true, error: lastError }
            }

            // Rate limited - wait and retry
            if (error.code === 429 || lastError.includes('Too Many Requests')) {
                const retryAfter = error.parameters?.retry_after || Math.ceil(backoff / 1000)
                console.log(`[BROADCAST] Rate limited, waiting ${retryAfter}s before retry`)
                await sleep(retryAfter * 1000)
                return { success: false, rateLimited: true, error: lastError }
            }

            // Other error - retry with backoff
            if (attempt < CONFIG.MAX_RETRIES - 1) {
                await sleep(backoff * (attempt + 1))
            }
        }
    }

    return { success: false, error: lastError }
}

/**
 * Split array into chunks
 */
function chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size))
    }
    return chunks
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export default {
    queueBroadcast,
    cancelBroadcastJob,
    isBroadcastActive,
}
