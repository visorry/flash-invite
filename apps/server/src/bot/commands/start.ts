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

      // Get botId from context (set by middleware in bot.ts)
      const dbBotId = (ctx as any).dbBotId as string

      // Track bot member on every /start interaction
      if (dbBotId) {
        await db.botMember.upsert({
          where: {
            botId_telegramUserId: {
              botId: dbBotId,
              telegramUserId: userId,
            },
          },
          update: {
            username,
            firstName: ctx.from.first_name,
            lastName: ctx.from.last_name ?? null,
            languageCode: ctx.from.language_code ?? null,
            isPremium: ctx.from.is_premium ?? false,
            isBot: ctx.from.is_bot ?? false,
            lastActiveAt: new Date(),
          },
          create: {
            botId: dbBotId,
            telegramUserId: userId,
            username,
            firstName: ctx.from.first_name,
            lastName: ctx.from.last_name ?? null,
            languageCode: ctx.from.language_code ?? null,
            isPremium: ctx.from.is_premium ?? false,
            isBot: ctx.from.is_bot ?? false,
            isActive: false, // Don't activate for auto drop by default
          },
        }).catch((botMemberError) => {
          console.error('Failed to track bot member:', botMemberError)
        })
      }

      if (!token) {
        console.log(`User ${userId} attempted to start without a token.`)
        return ctx.reply(
          '🚫 *Missing Token!*\n\nTo continue, please use the invite link provided to you.',
          {
            parse_mode: 'Markdown',
          }
        )
      }

      // Check if this is a login token
      if (token.startsWith('login_')) {
        const loginToken = token.replace('login_', '')
        console.log(`User ${userId} attempting login with token: ${loginToken}`)
        return await handleTelegramLogin(ctx, loginToken, userId, username, fullName)
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

        const { inviteLink, expiresAt, groupTitle, isRenewal } = result
        
        // Calculate duration for better clarity
        const durationMs = expiresAt.getTime() - Date.now()
        const days = Math.floor(durationMs / (1000 * 60 * 60 * 24))
        const hours = Math.floor((durationMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))
        
        let durationText = ''
        if (days > 0) {
          durationText = `${days} day${days > 1 ? 's' : ''} ${hours} hour${hours !== 1 ? 's' : ''}`
        } else if (hours > 0) {
          durationText = `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`
        } else {
          durationText = `${minutes} minute${minutes !== 1 ? 's' : ''}`
        }

        // Different messages for renewal vs first join
        const message = isRenewal
          ? `🔄 *Access Renewed!* Your membership has been extended.
                
� *Auccess valid for:* _${durationText}_
🔒 You will be automatically removed after this time.

� Cligck below to rejoin if needed:`
          : `🎉 *Welcome!* You've successfully unlocked access to the group.
                
🕒 *Access valid for:* _${durationText}_
🔒 You will be automatically removed after this time.

🚫 *Do not share this link!* It is uniquely generated for you.  
Sharing may cause it to become invalid or unusable.

👇 Click below to join:`

        await ctx.reply(message, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: isRenewal ? `🔄 Rejoin ${groupTitle}` : `🔗 Join ${groupTitle}`,
                  url: inviteLink || '',
                },
              ],
            ],
          },
        })
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
    // Find invite link by token (now a root column for fast queries)
    const inviteRecord = await db.inviteLink.findFirst({
      where: {
        token,
        status: InviteLinkStatus.ACTIVE,
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

    // Check if bot link expired
    if (inviteRecord.linkExpiresAt && inviteRecord.linkExpiresAt < new Date()) {
      console.log('[ERROR] Bot link expired')
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

    // Calculate when member access expires
    const memberExpiresAt = new Date(
      Date.now() + inviteRecord.durationSeconds * 1000
    )

    // Create one-time Telegram invite link for the user (expires in 1 hour or when used)
    const telegramLinkExpiry = Math.floor((Date.now() + 3600000) / 1000) // 1 hour from now
    const chatInviteLink = await ctx.telegram.createChatInviteLink(
      inviteRecord.telegramEntity.telegramId,
      {
        member_limit: 1, // ONE-TIME USE ONLY
        expire_date: telegramLinkExpiry,
      }
    )

    console.log('[INFO] Created one-time Telegram invite link:', chatInviteLink.invite_link)

    // Check if member already exists
    const existingMember = await db.groupMember.findUnique({
      where: {
        telegramUserId_telegramEntityId: {
          telegramUserId: userId,
          telegramEntityId: inviteRecord.telegramEntityId,
        },
      },
    })

    const isRenewal = !!existingMember
    const previousExpiresAt = existingMember?.memberExpiresAt

    // Only extend expiry if new time is later than current
    const finalMemberExpiresAt = existingMember?.memberExpiresAt && existingMember.memberExpiresAt > memberExpiresAt
      ? existingMember.memberExpiresAt
      : memberExpiresAt

    // Create or update group member record and log the join
    await db.$transaction([
      db.groupMember.upsert({
        where: {
          telegramUserId_telegramEntityId: {
            telegramUserId: userId,
            telegramEntityId: inviteRecord.telegramEntityId,
          },
        },
        update: {
          username,
          fullName,
          memberExpiresAt: finalMemberExpiresAt,
          telegramInviteLink: chatInviteLink.invite_link,
          isActive: true, // Reactivate if they were kicked
          kickedAt: null, // Clear kick status
        },
        create: {
          telegramUserId: userId,
          username,
          fullName,
          telegramEntityId: inviteRecord.telegramEntityId,
          telegramInviteLink: chatInviteLink.invite_link,
          memberExpiresAt: finalMemberExpiresAt,
          joinedAt: new Date(),
        },
      }),
      // Log this join for analytics
      db.joinLog.create({
        data: {
          telegramUserId: userId,
          telegramEntityId: inviteRecord.telegramEntityId,
          inviteLinkId: inviteRecord.id,
          username,
          fullName,
          durationType: inviteRecord.durationType,
          durationSeconds: inviteRecord.durationSeconds,
          tokensCost: inviteRecord.tokensCost,
          isRenewal,
          previousExpiresAt,
          newExpiresAt: finalMemberExpiresAt,
        },
      }),
    ])

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
      expiresAt: finalMemberExpiresAt,
      groupTitle: inviteRecord.telegramEntity.title,
      isRenewal,
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

async function handleTelegramLogin(
  ctx: any,
  loginToken: string,
  userId: string,
  username: string | null,
  fullName: string
) {
  try {
    // Find the login token
    const tokenRecord = await db.telegramLoginToken.findFirst({
      where: {
        token: loginToken,
        expiresAt: { gt: new Date() },
      },
    })

    if (!tokenRecord) {
      return ctx.reply(
        '❌ *Login Failed*\n\nThis login link has expired or is invalid.\n\nPlease go back to the website and try again.',
        { parse_mode: 'Markdown' }
      )
    }

    // Update the token with user info
    await db.telegramLoginToken.update({
      where: { id: tokenRecord.id },
      data: {
        telegramUserId: userId,
        username,
        fullName,
      },
    })

    // Get the API URL - redirect to API server which will set cookie and redirect to web app
    const apiUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3000'
    const callbackUrl = `${apiUrl}/api/v1/auth/telegram-complete?token=${loginToken}`

    // Telegram doesn't allow localhost URLs in inline buttons
    if (apiUrl.includes('localhost')) {
      return ctx.reply(
        `✅ *Login Successful!*\n\nWelcome, ${fullName}!\n\nCopy and paste this link in your browser to complete login:\n\n\`${callbackUrl}\``,
        {
          parse_mode: 'Markdown',
        }
      )
    }

    return ctx.reply(
      `✅ *Login Successful!*\n\nWelcome, ${fullName}!\n\nClick the button below to complete your login and access your dashboard.`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🚀 Go to Dashboard',
                url: callbackUrl,
              },
            ],
          ],
        },
      }
    )
  } catch (error) {
    console.error('Telegram login error:', error)
    return ctx.reply(
      '❌ *Login Failed*\n\nSomething went wrong. Please try again.',
      { parse_mode: 'Markdown' }
    )
  }
}
