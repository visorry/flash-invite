import { Telegraf } from 'telegraf'
import db from '@super-invite/db'
import { InviteLinkStatus } from '@super-invite/db'

export function registerStartCommand(bot: Telegraf) {
  bot.start(async (ctx) => {
    try {
      const messageText = ctx.message?.text ?? ''
      const [, token] = messageText.split(' ')
      const userId = ctx.from.id.toString()
      const fullName = [ctx.from.first_name, ctx.from.last_name]
        .filter(Boolean)
        .join(' ')
      const username = ctx.from.username ?? null

      if (!token) {
        console.log(`User ${userId} attempted to start without a token.`)
        return ctx.reply(
          '🚫 *Missing Token!*\n\nTo continue, please use the invite link provided to you.\n\nExample:\n`https://t.me/yourbot?start=token`',
          {
            parse_mode: 'Markdown',
          }
        )
      }

      try {
        const result = await processStartToken(
          token,
          userId,
          username,
          fullName,
          ctx
        )
        
        if (!result) {
          return ctx.reply('❌ Invalid or expired invite link.')
        }

        const { inviteLink, expiresAt, groupTitle } = result
        const formattedExpiry = expiresAt.toLocaleString('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short',
        })

        await ctx.reply(
          `🎉 *Welcome!* You've successfully unlocked access to the group.
                
🕒 *Access valid until:* _${formattedExpiry}_
🔒 You will be automatically removed after this time.

🚫 *Do not share this link!* It is uniquely generated for you.  
Sharing may cause it to become invalid or unusable.

👇 Click below to join:`,
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: `🔗 Join ${groupTitle}`,
                    url: inviteLink || '',
                  },
                ],
              ],
            },
          }
        )
      } catch (error) {
        console.error('Error processing start token:', error)
        await ctx.reply('❌ Invalid or expired invite link.')
      }
    } catch (err) {
      console.error('Handler error:', err)
      await ctx.reply('Oops, something went wrong.')
    }
  })
}

async function processStartToken(
  token: string,
  userId: string,
  username: string | null,
  fullName: string,
  ctx: any
) {
  console.log('[START] processStartToken', {
    token,
    userId,
    username,
    fullName,
  })

  try {
    // Find invite link by token in metadata
    const inviteRecord = await db.inviteLink.findFirst({
      where: {
        status: InviteLinkStatus.ACTIVE,
        metadata: {
          path: ['token'],
          equals: token,
        },
      },
      include: {
        telegramEntity: true,
        user: true,
      },
    })

    if (!inviteRecord) {
      console.log('[ERROR] Invite link not found for token:', token)
      return null
    }

    console.log('[INFO] Invite link found:', inviteRecord.id)

    // Check if expired
    if (inviteRecord.expiresAt && inviteRecord.expiresAt < new Date()) {
      console.log('[ERROR] Invite link expired')
      await db.inviteLink.update({
        where: { id: inviteRecord.id },
        data: { status: InviteLinkStatus.EXPIRED },
      })
      return null
    }

    // Check member limit
    if (
      inviteRecord.memberLimit &&
      inviteRecord.currentUses >= inviteRecord.memberLimit
    ) {
      console.log('[ERROR] Member limit reached')
      await db.inviteLink.update({
        where: { id: inviteRecord.id },
        data: { status: InviteLinkStatus.EXPIRED },
      })
      return null
    }

    // Check if entity is active
    if (!inviteRecord.telegramEntity.isActive) {
      console.log('[ERROR] Telegram entity is not active')
      return null
    }

    const expiresAt = new Date(
      Date.now() + inviteRecord.durationSeconds * 1000
    )

    // Create one-time invite link for the user (expires in 1 hour or when used)
    const inviteLinkExpiry = Math.floor((Date.now() + 3600000) / 1000) // 1 hour from now
    const chatInviteLink = await ctx.telegram.createChatInviteLink(
      inviteRecord.telegramEntity.telegramId,
      {
        member_limit: 1, // ONE-TIME USE ONLY
        expire_date: inviteLinkExpiry,
      }
    )

    console.log('[INFO] Created one-time invite link:', chatInviteLink.invite_link)

    // Create or update group member record
    await db.groupMember.upsert({
      where: {
        telegramUserId_telegramEntityId: {
          telegramUserId: userId,
          telegramEntityId: inviteRecord.telegramEntityId,
        },
      },
      update: {
        username,
        fullName,
        expiresAt,
        inviteLink: chatInviteLink.invite_link,
      },
      create: {
        telegramUserId: userId,
        username,
        fullName,
        telegramEntityId: inviteRecord.telegramEntityId,
        inviteLink: chatInviteLink.invite_link,
        expiresAt,
        joinedAt: new Date(),
      },
    })

    // Increment usage count
    await db.inviteLink.update({
      where: { id: inviteRecord.id },
      data: {
        currentUses: {
          increment: 1,
        },
      },
    })

    console.log('[SUCCESS] processStartToken completed')

    return {
      inviteLink: chatInviteLink.invite_link,
      expiresAt,
      groupTitle: inviteRecord.telegramEntity.title,
    }
  } catch (error) {
    console.error('[ERROR] processStartToken failed:', {
      error: error instanceof Error ? error.message : String(error),
      token,
      userId,
      username,
      fullName,
    })
    throw error
  }
}
