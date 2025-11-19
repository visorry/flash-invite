import { config } from '../../config/configuration'
import db from '@super-invite/db'

interface TelegramUser {
  id: number
  is_bot: boolean
  first_name: string
  last_name?: string
  username?: string
}

interface TelegramChat {
  id: number
  type: 'private' | 'group' | 'supergroup' | 'channel'
  title?: string
  username?: string
  description?: string
}

interface TelegramInviteLink {
  invite_link: string
  creator: TelegramUser
  creates_join_request: boolean
  is_primary: boolean
  is_revoked: boolean
  name?: string
  expire_date?: number
  member_limit?: number
  pending_join_request_count?: number
}

interface CreateInviteLinkOptions {
  name?: string
  expire_date?: number
  member_limit?: number
  creates_join_request?: boolean
}

class TelegramBotClient {
  private botToken: string
  private baseUrl: string
  private tokenPromise: Promise<string> | null = null

  constructor(botToken?: string) {
    this.botToken = botToken || config.TELEGRAM_BOT_TOKEN
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`
  }

  /**
   * Get bot token from database or fallback to env
   */
  private async getBotToken(): Promise<string> {
    // If token was provided in constructor, use it
    if (this.botToken && this.botToken !== config.TELEGRAM_BOT_TOKEN) {
      return this.botToken
    }

    // Try to get from database
    try {
      const configEntry = await db.config.findUnique({
        where: { key: 'botToken' },
      })

      if (configEntry && configEntry.value) {
        return configEntry.value
      }
    } catch (error) {
      // Database might not be ready, fallback to env
      console.warn('Failed to get bot token from database, using env:', error)
    }

    // Fallback to env
    return config.TELEGRAM_BOT_TOKEN
  }

  /**
   * Make API request to Telegram
   */
  private async request<T>(method: string, params?: Record<string, any>): Promise<T> {
    // Get the latest bot token
    const token = await this.getBotToken()
    const url = `https://api.telegram.org/bot${token}/${method}`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params || {}),
    })

    const data: any = await response.json()

    if (!data.ok) {
      throw new Error(data.description || 'Telegram API error')
    }

    return data.result as T
  }

  /**
   * Get bot information
   */
  async getMe(): Promise<TelegramUser> {
    return this.request<TelegramUser>('getMe')
  }

  /**
   * Get chat information
   */
  async getChat(chatId: string | number): Promise<TelegramChat> {
    return this.request<TelegramChat>('getChat', { chat_id: chatId })
  }

  /**
   * Get chat member count
   */
  async getChatMemberCount(chatId: string | number): Promise<number> {
    return this.request<number>('getChatMemberCount', { chat_id: chatId })
  }

  /**
   * Create a new invite link
   */
  async createChatInviteLink(
    chatId: string | number,
    options?: CreateInviteLinkOptions
  ): Promise<TelegramInviteLink> {
    return this.request<TelegramInviteLink>('createChatInviteLink', {
      chat_id: chatId,
      ...options,
    })
  }

  /**
   * Revoke an invite link
   */
  async revokeChatInviteLink(
    chatId: string | number,
    inviteLink: string
  ): Promise<TelegramInviteLink> {
    return this.request<TelegramInviteLink>('revokeChatInviteLink', {
      chat_id: chatId,
      invite_link: inviteLink,
    })
  }

  /**
   * Ban a chat member (kick)
   */
  async banChatMember(
    chatId: string | number,
    userId: number,
    untilDate?: number
  ): Promise<boolean> {
    return this.request<boolean>('banChatMember', {
      chat_id: chatId,
      user_id: userId,
      until_date: untilDate,
    })
  }

  /**
   * Unban a chat member
   */
  async unbanChatMember(
    chatId: string | number,
    userId: number,
    onlyIfBanned?: boolean
  ): Promise<boolean> {
    return this.request<boolean>('unbanChatMember', {
      chat_id: chatId,
      user_id: userId,
      only_if_banned: onlyIfBanned,
    })
  }

  /**
   * Get chat member information
   */
  async getChatMember(chatId: string | number, userId: number): Promise<any> {
    return this.request('getChatMember', {
      chat_id: chatId,
      user_id: userId,
    })
  }

  /**
   * Verify bot token is valid
   */
  async verifyToken(): Promise<boolean> {
    try {
      await this.getMe()
      return true
    } catch {
      return false
    }
  }

  /**
   * Check if bot is admin in chat
   */
  async isBotAdmin(chatId: string | number): Promise<boolean> {
    try {
      const bot = await this.getMe()
      const member = await this.getChatMember(chatId, bot.id)
      return member.status === 'administrator' || member.status === 'creator'
    } catch {
      return false
    }
  }
}

/**
 * Create a new Telegram bot client
 */
export function createTelegramBot(botToken?: string): TelegramBotClient {
  return new TelegramBotClient(botToken)
}

/**
 * Default bot client using env token
 */
export const telegramBot = createTelegramBot()

export type { TelegramUser, TelegramChat, TelegramInviteLink, CreateInviteLinkOptions }
export { TelegramBotClient }
