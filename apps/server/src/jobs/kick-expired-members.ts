import db from '@super-invite/db'
import { telegramBot } from '../lib/telegram'

/**
 * Kick expired members from groups
 * Runs every minute to check for expired memberships
 */
export async function kickExpiredMembers() {
  const startTime = Date.now()
  console.log('[KICK_JOB] Starting expired members check...')

  try {
    // Find all members whose access has expired
    const expiredMembers = await db.groupMember.findMany({
      where: {
        memberExpiresAt: {
          lte: new Date(), // Member access expired
        },
        isActive: true, // Still active (not kicked yet)
        kickedAt: null, // Not already kicked
      },
      include: {
        telegramEntity: true,
      },
      take: 100, // Process in batches to avoid overload
    })

    if (expiredMembers.length === 0) {
      console.log('[KICK_JOB] No expired members found')
      return {
        success: true,
        processed: 0,
        kicked: 0,
        failed: 0,
        notified: 0,
      }
    }

    console.log(`[KICK_JOB] Found ${expiredMembers.length} expired members to process`)

    // Group members by chat for batch processing
    const membersByChat = expiredMembers.reduce((acc, member) => {
      const chatId = member.telegramEntity.telegramId
      if (!acc[chatId]) {
        acc[chatId] = []
      }
      acc[chatId]!.push(member)
      return acc
    }, {} as Record<string, typeof expiredMembers>)

    let kicked = 0
    let failed = 0
    let notified = 0

    // Process each chat's members in batch
    for (const [chatId, members] of Object.entries(membersByChat)) {
      console.log(`[KICK_JOB] Processing ${members.length} members from chat ${chatId}`)

      // Process members with staggered delays
      for (let i = 0; i < members.length; i++) {
        const member = members[i]!
        const userId = parseInt(member.telegramUserId)

        // Stagger requests to avoid rate limiting
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }

        try {
          // Ban member from Telegram group
          await telegramBot.banChatMember(
            chatId,
            userId,
            Math.floor(Date.now() / 1000) + 60 // Ban for 60 seconds
          )

          // Wait 2 seconds before unbanning
          await new Promise(resolve => setTimeout(resolve, 2000))

          // Unban so they can rejoin with a new invite
          await telegramBot.unbanChatMember(chatId, userId, true)

          // Update member record
          await db.groupMember.update({
            where: { id: member.id },
            data: {
              isActive: false,
              kickedAt: new Date(),
            },
          })

          kicked++
          console.log(
            `[KICK_JOB] ✅ Kicked user ${member.telegramUserId} from ${member.telegramEntity.title}`
          )

          // Send notification message
          try {
            await new Promise(resolve => setTimeout(resolve, 200))
            await (telegramBot as any).sendMessage(
              userId,
              `👋 Your access to *${member.telegramEntity.title}* has expired and you've been removed.\n\nThank you for being part of the community!`,
              { parse_mode: 'Markdown' }
            )
            notified++
            console.log(`[KICK_JOB] 📧 Notification sent to user ${member.telegramUserId}`)
          } catch (notifyError: any) {
            const errorCode = notifyError.response?.error_code
            if (errorCode === 403) {
              console.log(`[KICK_JOB] ⚠️ User ${member.telegramUserId} has blocked the bot`)
            } else {
              console.error(
                `[KICK_JOB] ⚠️ Failed to notify user ${member.telegramUserId}:`,
                notifyError.message
              )
            }
          }
        } catch (error: any) {
          const errorCode = error.response?.error_code
          const errorMessage = error.message || ''

          // Smart error handling - determine if it's a permanent failure
          const isPermanentFailure =
            errorCode === 400 &&
            (errorMessage.includes('user not found') ||
              errorMessage.includes('user_not_participant') ||
              errorMessage.includes('USER_NOT_PARTICIPANT') ||
              errorMessage.includes('chat not found'))

          const isBotPermissionIssue =
            errorCode === 403 &&
            (errorMessage.includes('bot was kicked') ||
              errorMessage.includes('bot is not a member') ||
              errorMessage.includes('not enough rights'))

          if (isPermanentFailure) {
            if (errorMessage.includes('chat not found')) {
              console.log(
                `[KICK_JOB] ⚠️ Group ${member.telegramEntity.title} no longer exists or bot was removed`
              )
            } else {
              console.log(
                `[KICK_JOB] ⚠️ User ${member.telegramUserId} already left ${member.telegramEntity.title}`
              )
            }

            // Mark as kicked in DB since they're already gone
            await db.groupMember.update({
              where: { id: member.id },
              data: {
                isActive: false,
                kickedAt: new Date(),
                metadata: {
                  kickError: 'User already left or group not found',
                },
              },
            })
            kicked++
          } else if (isBotPermissionIssue) {
            console.error(
              `[KICK_JOB] ❌ Bot lacks permissions in ${member.telegramEntity.title} for user ${member.telegramUserId}`
            )

            // Mark as kicked to prevent retry loops
            await db.groupMember.update({
              where: { id: member.id },
              data: {
                isActive: false,
                kickedAt: new Date(),
                metadata: {
                  kickError: 'Bot lacks permissions',
                },
              },
            })
            failed++
          } else {
            // Temporary error - don't update DB, will retry next run
            console.error(
              `[KICK_JOB] ❌ Temporary error kicking user ${member.telegramUserId} from ${member.telegramEntity.title}:`,
              errorMessage
            )
            failed++
          }
        }
      }
    }

    const duration = Date.now() - startTime
    console.log(
      `[KICK_JOB] Completed in ${duration}ms - Kicked: ${kicked}, Failed: ${failed}, Notified: ${notified}`
    )

    return {
      success: true,
      processed: expiredMembers.length,
      kicked,
      failed,
      notified,
      duration,
    }
  } catch (error: any) {
    console.error('[KICK_JOB] Fatal error:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Clean up old invite links
 * Delete unused or expired invite links after 60 days
 * GroupMember records are kept permanently for analytics
 */
export async function cleanupOldInvites() {
  console.log('[CLEANUP_JOB] Starting cleanup of old invite links...')

  try {
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)

    // Delete expired or revoked invite links older than 60 days
    const result = await db.inviteLink.deleteMany({
      where: {
        OR: [
          {
            // Expired invites
            status: 1, // EXPIRED
            linkExpiresAt: {
              lte: sixtyDaysAgo,
            },
          },
          {
            // Revoked invites
            status: 2, // REVOKED
            updatedAt: {
              lte: sixtyDaysAgo,
            },
          },
          {
            // Unused active invites that expired
            status: 0, // ACTIVE
            currentUses: 0,
            linkExpiresAt: {
              lte: sixtyDaysAgo,
            },
          },
        ],
      },
    })

    console.log(`[CLEANUP_JOB] Deleted ${result.count} old invite links`)
    console.log('[CLEANUP_JOB] GroupMember records kept permanently for analytics')

    return {
      success: true,
      deleted: result.count,
    }
  } catch (error: any) {
    console.error('[CLEANUP_JOB] Error:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Send expiry warnings to members (optional enhancement)
 * Run this to notify users before their access expires
 */
export async function sendExpiryWarnings() {
  console.log('[WARNING_JOB] Checking for members expiring soon...')

  try {
    // Find members expiring in the next hour
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000)
    const now = new Date()

    const expiringMembers = await db.groupMember.findMany({
      where: {
        memberExpiresAt: {
          gte: now,
          lte: oneHourFromNow,
        },
        isActive: true,
        // Only members who haven't been warned yet
        // metadata: {
        //   path: ['warningSent'],
        //   equals: null,
        // },
      },
      include: {
        telegramEntity: true,
      },
      take: 50,
    })

    if (expiringMembers.length === 0) {
      console.log('[WARNING_JOB] No members expiring soon')
      return { success: true, warned: 0 }
    }

    let warned = 0

    for (const member of expiringMembers) {
      try {
        // TODO: Send warning message via Telegram bot
        // await telegramBot.sendMessage(member.telegramUserId, warningMessage)

        // Mark warning as sent
        await db.groupMember.update({
          where: { id: member.id },
          data: {
            metadata: {
              ...((member.metadata as any) || {}),
              warningSent: true,
              warningSentAt: new Date().toISOString(),
            },
          },
        })

        warned++
      } catch (error: any) {
        console.error(`[WARNING_JOB] Failed to warn user ${member.telegramUserId}:`, error.message)
      }
    }

    console.log(`[WARNING_JOB] Sent warnings to ${warned} members`)

    return {
      success: true,
      warned,
    }
  } catch (error: any) {
    console.error('[WARNING_JOB] Error:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}
