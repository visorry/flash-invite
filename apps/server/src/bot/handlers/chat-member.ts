import { Context } from 'telegraf'
import db from '@super-invite/db'

/**
 * Handle chat member updates - detect unauthorized joins
 * This prevents users from sharing invite links
 */
export async function handleChatMember(ctx: Context) {
  if (!ctx.chatMember) return

  const oldStatus = ctx.chatMember.old_chat_member.status
  const newStatus = ctx.chatMember.new_chat_member.status

  // Only proceed if user is joining the group
  if ((oldStatus === 'left' || oldStatus === 'kicked') && newStatus === 'member') {
    try {
      const userId = ctx.chatMember.new_chat_member.user.id.toString()
      const username = ctx.chatMember.new_chat_member.user.username || null
      const inviteLinkUsed = ctx.chatMember.invite_link?.invite_link
      const chatId = ctx.chat?.id?.toString()

      if (!chatId) {
        console.log('[CHAT_MEMBER] Chat ID is undefined, skipping')
        return
      }

      console.log(`[CHAT_MEMBER] User ${userId} (@${username}) joined chat ${chatId}`)

      if (!inviteLinkUsed) {
        console.log('[CHAT_MEMBER] No invite link found, skipping verification')
        return
      }

      console.log(`[CHAT_MEMBER] Invite link used: ${inviteLinkUsed}`)

      // Find the group member record for this invite link
      const dbUser = await db.groupMember.findFirst({
        where: {
          inviteLink: inviteLinkUsed,
        },
      })

      if (!dbUser) {
        console.log(
          `[CHAT_MEMBER] ⚠️ No matching member found for invite link - likely admin/regular invite link, allowing join`
        )
        return
      }

      console.log(
        `[CHAT_MEMBER] Found member record: ${dbUser.telegramUserId} for group ${dbUser.telegramEntityId}`
      )

      // Check if the user who joined matches the authorized user
      if (dbUser.telegramUserId === userId) {
        console.log(`[CHAT_MEMBER] ✅ User ${userId} authenticated correctly`)

        // Revoke the invite link to prevent reuse
        try {
          await ctx.telegram.revokeChatInviteLink(chatId, inviteLinkUsed)
          console.log(`[CHAT_MEMBER] 🔒 Invite link revoked: ${inviteLinkUsed}`)
        } catch (error: any) {
          console.error(`[CHAT_MEMBER] ❌ Failed to revoke invite link:`, error.message)
        }
      } else {
        // Unauthorized user - kick them immediately
        console.log(
          `[CHAT_MEMBER] ⚠️ UNAUTHORIZED: User ${userId} tried to use invite link for ${dbUser.telegramUserId}`
        )

        try {
          await ctx.banChatMember(parseInt(userId))
          await ctx.unbanChatMember(parseInt(userId))
          console.log(`[CHAT_MEMBER] ✅ Kicked unauthorized user ${userId}`)

          // Try to notify the unauthorized user
          try {
            await ctx.telegram.sendMessage(
              userId,
              '⚠️ *Unauthorized Access*\n\nYou tried to use someone else\'s invite link. Please get your own invite link to join this group.',
              { parse_mode: 'Markdown' }
            )
          } catch (notifyError) {
            console.log(`[CHAT_MEMBER] Could not notify user ${userId}`)
          }

          // Optionally notify the authorized user
          try {
            await ctx.telegram.sendMessage(
              dbUser.telegramUserId,
              '⚠️ *Security Alert*\n\nSomeone tried to use your invite link. Your link has been secured. Please do not share your invite links!',
              { parse_mode: 'Markdown' }
            )
          } catch (notifyError) {
            console.log(`[CHAT_MEMBER] Could not notify authorized user ${dbUser.telegramUserId}`)
          }
        } catch (error: any) {
          console.error(`[CHAT_MEMBER] ❌ Failed to kick unauthorized user ${userId}:`, error.message)
        }
      }
    } catch (error: any) {
      console.error(`[CHAT_MEMBER] ❌ Error in chat_member handler:`, error.message)
    }
  }
}
