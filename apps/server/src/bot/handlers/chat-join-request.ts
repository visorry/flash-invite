import type { Telegraf, Context } from 'telegraf'
import autoApprovalService from '../../services/auto-approval.service'

/**
 * Handler for chat_join_request events
 * This is triggered when a user requests to join a group/channel with join requests enabled
 */
export function setupChatJoinRequestHandler(bot: Telegraf<Context>, botId: string) {
  bot.on('chat_join_request', async (ctx) => {
    try {
      const request = ctx.chatJoinRequest
      const chatId = request.chat.id.toString()
      const userId = request.from.id.toString()
      const userInfo = {
        username: request.from.username,
        firstName: request.from.first_name,
        isPremium: request.from.is_premium || false,
      }

      console.log(`[CHAT_JOIN_REQUEST] User ${userId} (${userInfo.username || userInfo.firstName}) requesting to join ${chatId}`)

      // Process the join request
      const result = await autoApprovalService.processJoinRequest(
        botId,
        chatId,
        userId,
        userInfo
      )

      console.log(`[CHAT_JOIN_REQUEST] Result for ${userId}: ${result.action} - ${result.reason}`)

      // If rejected, decline the request
      if (result.action === 'reject') {
        try {
          await ctx.declineChatJoinRequest(userId)
        } catch (e) {
          console.error('[CHAT_JOIN_REQUEST] Failed to decline request:', e)
        }
      }
    } catch (error) {
      console.error('[CHAT_JOIN_REQUEST] Error handling join request:', error)
    }
  })
}
