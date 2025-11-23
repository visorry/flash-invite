import {
  initializeAllBots,
  getBot,
  getAllBots,
  healthCheck,
  getStats,
  stopAllBots,
  botManager,
} from './bot-manager'

async function initializeBots() {
  await initializeAllBots()

  const allBots = getAllBots()

  if (allBots.length > 0) {
    // Set up periodic health checks
    setInterval(
      async () => {
        await healthCheck()
      },
      5 * 60 * 1000
    ) // 5 minutes

    console.log('Bot system initialized successfully')
    console.log('Bot stats:', getStats())
  } else {
    console.warn('No bots initialized - bot features will be unavailable')
  }
}

// Export initialization function and manager
export { initializeBots, botManager }

// Export individual functions for direct use
export {
  initializeAllBots,
  getBot,
  getAllBots,
  healthCheck,
  getStats,
  stopAllBots,
} from './bot-manager'

// Helper to get bot for a specific entity (uses primary bot)
export async function getBotForEntity(telegramEntityId: string) {
  const db = (await import('@super-invite/db')).default

  const botLink = await db.botTelegramEntity.findFirst({
    where: {
      telegramEntityId,
      isPrimary: true,
    },
    include: {
      bot: true,
    },
  })

  if (!botLink) return null

  return getBot(botLink.botId)
}

// Legacy export for backward compatibility with existing code
export const telegramBot: any = {
  sendMessage: async (chatId: string | number, text: string, options?: any) => {
    // For legacy calls, we need to find which bot to use
    // This should be updated to use getBotForEntity in callers
    const allBots = getAllBots()
    if (allBots.length === 0) throw new Error('No bot available')
    return allBots[0].bot.telegram.sendMessage(chatId, text, options)
  },
  createChatInviteLink: async (chatId: string | number, options?: any) => {
    const allBots = getAllBots()
    if (allBots.length === 0) throw new Error('No bot available')
    return allBots[0].bot.telegram.createChatInviteLink(chatId, options)
  },
  revokeChatInviteLink: async (chatId: string | number, inviteLink: string) => {
    const allBots = getAllBots()
    if (allBots.length === 0) throw new Error('No bot available')
    return allBots[0].bot.telegram.revokeChatInviteLink(chatId, inviteLink)
  },
  getChatMember: async (chatId: string | number, userId: number) => {
    const allBots = getAllBots()
    if (allBots.length === 0) throw new Error('No bot available')
    return allBots[0].bot.telegram.getChatMember(chatId, userId)
  },
  banChatMember: async (chatId: string | number, userId: number) => {
    const allBots = getAllBots()
    if (allBots.length === 0) throw new Error('No bot available')
    return allBots[0].bot.telegram.banChatMember(chatId, userId)
  },
  unbanChatMember: async (chatId: string | number, userId: number) => {
    const allBots = getAllBots()
    if (allBots.length === 0) throw new Error('No bot available')
    return allBots[0].bot.telegram.unbanChatMember(chatId, userId)
  },
}

// Legacy function for backward compatibility
export async function initializeBot() {
  return initializeBots()
}
