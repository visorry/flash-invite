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
        expiresAt: {
          lte: new Date(), // Expired
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
      }
    }

    console.log(`[KICK_JOB] Found ${expiredMembers.length} expired members to process`)

    let kicked = 0
    let failed = 0

    // Process each expired member
    for (const member of expiredMembers) {
      try {
        // Kick member from Telegram group
        await telegramBot.banChatMember(
          member.telegramEntity.telegramId,
          parseInt(member.telegramUserId),
          Math.floor(Date.now() / 1000) + 60 // Ban for 60 seconds then auto-unban
        )

        // Immediately unban so they can rejoin with a new invite
        await telegramBot.unbanChatMember(
          member.telegramEntity.telegramId,
          parseInt(member.telegramUserId),
          true // only_if_banned
        )

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
      } catch (error: any) {
        failed++
        console.error(
          `[KICK_JOB] ❌ Failed to kick user ${member.telegramUserId} from ${member.telegramEntity.title}:`,
          error.message
        )

        // Still mark as kicked in DB even if Telegram API fails
        // This prevents retry loops for users who already left
        await db.groupMember.update({
          where: { id: member.id },
          data: {
            isActive: false,
            kickedAt: new Date(),
            metadata: {
              kickError: error.message,
            },
          },
        })
      }
    }

    const duration = Date.now() - startTime
    console.log(
      `[KICK_JOB] Completed in ${duration}ms - Kicked: ${kicked}, Failed: ${failed}`
    )

    return {
      success: true,
      processed: expiredMembers.length,
      kicked,
      failed,
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
            expiresAt: {
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
            expiresAt: {
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
        expiresAt: {
          gte: now,
          lte: oneHourFromNow,
        },
        isActive: true,
        metadata: {
          path: ['warningSent'],
          equals: null,
        },
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
