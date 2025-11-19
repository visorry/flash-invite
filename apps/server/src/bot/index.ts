import { config } from '../config/configuration'
import db from '@super-invite/db'
import { telegramBot } from '../lib/telegram'

interface StartCommandContext {
  userId: number
  username?: string
  firstName?: string
  lastName?: string
  token?: string
}

/**
 * Handle /start command with token
 */
export async function handleStartCommand(ctx: StartCommandContext) {
  const { userId, username, firstName, lastName, token } = ctx

  if (!token) {
    return {
      success: false,
      message: '🚫 Missing Token!\n\nPlease use a valid invite link to join the group.',
    }
  }

  try {
    // Find invite link by token
    const invite = await db.inviteLink.findFirst({
      where: {
        metadata: {
          path: ['token'],
          equals: token,
        },
        status: 0, // ACTIVE
      },
      include: {
        telegramEntity: true,
        user: true,
      },
    })

    if (!invite) {
      return {
        success: false,
        message: '❌ Invalid or expired invite link.\n\nPlease request a new invite link.',
      }
    }

    // Check if expired
    if (invite.expiresAt && new Date() > invite.expiresAt) {
      await db.inviteLink.update({
        where: { id: invite.id },
        data: { status: 1 }, // EXPIRED
      })

      return {
        success: false,
        message: '⏰ This invite link has expired.\n\nPlease request a new invite link.',
      }
    }

    // Check member limit
    if (invite.memberLimit && invite.currentUses >= invite.memberLimit) {
      await db.inviteLink.update({
        where: { id: invite.id },
        data: { status: 2 }, // REVOKED
      })

      return {
        success: false,
        message: '👥 This invite link has reached its member limit.\n\nPlease request a new invite link.',
      }
    }

    // Create one-time Telegram invite link
    const telegramInvite = await telegramBot.createChatInviteLink(
      invite.telegramEntity.telegramId,
      {
        member_limit: 1, // One-time use
        expire_date: Math.floor((Date.now() + 3600000) / 1000), // 1 hour expiry
      }
    )

    // Calculate member expiry
    const memberExpiresAt = new Date(Date.now() + invite.durationSeconds * 1000)

    // Create member join record
    await db.$transaction(async (tx) => {
      // Create or update group member
      await tx.groupMember.upsert({
        where: {
          telegramUserId_telegramEntityId: {
            telegramUserId: userId.toString(),
            telegramEntityId: invite.telegramEntityId,
          },
        },
        update: {
          username: username || null,
          fullName: `${firstName || ''} ${lastName || ''}`.trim(),
          inviteLink: telegramInvite.invite_link,
          expiresAt: memberExpiresAt,
          joinedAt: new Date(),
        },
        create: {
          telegramUserId: userId.toString(),
          telegramEntityId: invite.telegramEntityId,
          username: username || null,
          fullName: `${firstName || ''} ${lastName || ''}`.trim(),
          inviteLink: telegramInvite.invite_link,
          expiresAt: memberExpiresAt,
          joinedAt: new Date(),
        },
      })

      // Increment invite usage
      await tx.inviteLink.update({
        where: { id: invite.id },
        data: {
          currentUses: { increment: 1 },
        },
      })
    })

    return {
      success: true,
      inviteLink: telegramInvite.invite_link,
      expiresAt: memberExpiresAt,
      groupTitle: invite.telegramEntity.title,
      message: `✅ Welcome!\n\nClick the link below to join **${invite.telegramEntity.title}**\n\n🔗 ${telegramInvite.invite_link}\n\n⏰ Your access expires: ${memberExpiresAt.toLocaleString()}\n\n⚠️ This link is for one-time use only.`,
    }
  } catch (error: any) {
    console.error('Error processing start command:', error)
    return {
      success: false,
      message: '❌ An error occurred while processing your request.\n\nPlease try again later or contact support.',
    }
  }
}

/**
 * Initialize bot webhook/polling
 */
export async function initializeBot() {
  console.log('Bot handlers initialized')
  // TODO: Set up webhook or polling based on your deployment
}
