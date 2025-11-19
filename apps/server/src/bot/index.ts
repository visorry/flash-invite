import { botManager } from './bot-manager'

async function initializeBots() {
  try {
    // Initialize default bot first
    await botManager.initializeDefaultBot()

    // Initialize custom bots from database
    await botManager.initializeCustomBots()

    const defaultBot = botManager.getDefaultBot()

    if (defaultBot) {
      // Set up periodic health checks
      setInterval(
        async () => {
          await botManager.healthCheck()
        },
        5 * 60 * 1000
      ) // 5 minutes

      console.log('Bot system initialized successfully')
      console.log('Bot stats:', botManager.getStats())
    } else {
      console.warn('No default bot initialized - bot features will be unavailable')
    }
  } catch (error) {
    console.error('Failed to initialize bot system:', error)
    // Don't exit - allow server to run without bots
  }
}

// Export initialization function and manager
export { initializeBots, botManager }

// Legacy export for backward compatibility with existing code
export const telegramBot: any = {
  sendMessage: async (chatId: string | number, text: string, options?: any) => {
    const bot = botManager.getDefaultBot()
    if (!bot) throw new Error('No bot available')
    return bot.telegram.sendMessage(chatId, text, options)
  },
  createChatInviteLink: async (chatId: string | number, options?: any) => {
    const bot = botManager.getDefaultBot()
    if (!bot) throw new Error('No bot available')
    return bot.telegram.createChatInviteLink(chatId, options)
  },
  revokeChatInviteLink: async (chatId: string | number, inviteLink: string) => {
    const bot = botManager.getDefaultBot()
    if (!bot) throw new Error('No bot available')
    return bot.telegram.revokeChatInviteLink(chatId, inviteLink)
  },
  getChatMember: async (chatId: string | number, userId: number) => {
    const bot = botManager.getDefaultBot()
    if (!bot) throw new Error('No bot available')
    return bot.telegram.getChatMember(chatId, userId)
  },
  banChatMember: async (chatId: string | number, userId: number) => {
    const bot = botManager.getDefaultBot()
    if (!bot) throw new Error('No bot available')
    return bot.telegram.banChatMember(chatId, userId)
  },
  unbanChatMember: async (chatId: string | number, userId: number) => {
    const bot = botManager.getDefaultBot()
    if (!bot) throw new Error('No bot available')
    return bot.telegram.unbanChatMember(chatId, userId)
  },
}

// Legacy function for backward compatibility
export async function initializeBot() {
  return initializeBots()
}
