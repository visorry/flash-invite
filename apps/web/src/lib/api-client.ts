const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

interface ApiResponse<T = any> {
  success: boolean
  data: T | null
  error: {
    message: string
    status: number
    code: string
  } | null
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    const data: ApiResponse<T> = await response.json()

    if (!data.success || data.error) {
      throw new Error(data.error?.message || 'An error occurred')
    }

    return data.data as T
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  async post<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  async put<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    })
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }
}

export const apiClient = new ApiClient(API_URL)

// Typed API routes
export const api = {
  auth: {
    me: () => apiClient.get('/api/v1/auth/me'),
  },
  bots: {
    list: () => apiClient.get('/api/v1/bots'),
    getById: (id: string) => apiClient.get(`/api/v1/bots/${id}`),
    create: (token: string) => apiClient.post('/api/v1/bots', { token }),
    delete: (id: string) => apiClient.delete(`/api/v1/bots/${id}`),
    setDefault: (id: string) => apiClient.post(`/api/v1/bots/${id}/default`),
    getChats: (id: string) => apiClient.get(`/api/v1/bots/${id}/chats`),
    syncChats: (id: string) => apiClient.post(`/api/v1/bots/${id}/sync`),
    linkToEntity: (id: string, telegramEntityId: string, isPrimary: boolean = false) =>
      apiClient.post(`/api/v1/bots/${id}/entities`, { telegramEntityId, isPrimary }),
    unlinkFromEntity: (id: string, entityId: string) =>
      apiClient.delete(`/api/v1/bots/${id}/entities/${entityId}`),
    getCost: () => apiClient.get('/api/v1/bots/cost'),
  },
  telegramEntities: {
    list: (params?: any) => apiClient.get('/api/v1/telegram-entities', { ...params }),
    getById: (id: string) => apiClient.get(`/api/v1/telegram-entities/${id}`),
    create: (data: any) => apiClient.post('/api/v1/telegram-entities', data),
    update: (id: string, data: any) => apiClient.put(`/api/v1/telegram-entities/${id}`, data),
    delete: (id: string) => apiClient.delete(`/api/v1/telegram-entities/${id}`),
    syncMembers: (id: string) => apiClient.post(`/api/v1/telegram-entities/${id}/sync-members`),
  },
  invites: {
    list: (params?: any) => {
      const queryParams = new URLSearchParams()
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.size) queryParams.append('size', params.size.toString())
      if (params?.sort) queryParams.append('sort', params.sort)
      if (params?.order) queryParams.append('order', params.order)
      // Include telegram entity by default
      queryParams.append('include', 'telegramEntity')
      const queryString = queryParams.toString()
      return apiClient.get(`/api/v1/invites${queryString ? `?${queryString}` : ''}`)
    },
    getById: (id: string) => apiClient.get(`/api/v1/invites/${id}`),
    create: (data: any) => apiClient.post('/api/v1/invites', data),
    revoke: (id: string) => apiClient.delete(`/api/v1/invites/${id}`),
    getStats: (id: string) => apiClient.get(`/api/v1/invites/${id}/stats`),
  },
  members: {
    list: (params?: any) => {
      const queryParams = new URLSearchParams()
      if (params?.telegramEntityId) queryParams.append('telegramEntityId', params.telegramEntityId)
      if (params?.isActive) queryParams.append('isActive', params.isActive)
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.size) queryParams.append('size', params.size.toString())
      if (params?.sort) queryParams.append('sort', params.sort)
      if (params?.order) queryParams.append('order', params.order)
      const queryString = queryParams.toString()
      return apiClient.get(`/api/v1/members${queryString ? `?${queryString}` : ''}`)
    },
    getById: (id: string) => apiClient.get(`/api/v1/members/${id}`),
  },
  tokens: {
    getBalance: () => apiClient.get('/api/v1/tokens/balance'),
    getTransactions: (params?: any) => apiClient.get('/api/v1/tokens/transactions', { ...params }),
    getCosts: () => apiClient.get('/api/v1/tokens/costs'),
    calculateCost: (durationSeconds: number) =>
      apiClient.get(`/api/v1/tokens/calculate-cost?durationSeconds=${durationSeconds}`),
  },
  dashboard: {
    getStats: () => apiClient.get('/api/v1/dashboard/stats'),
    getRecentActivity: () => apiClient.get('/api/v1/dashboard/recent-activity'),
  },
  admin: {
    getStats: () => apiClient.get('/api/v1/admin/stats'),
    listUsers: (params?: any) => apiClient.get('/api/v1/admin/users', { ...params }),
    getUserById: (id: string) => apiClient.get(`/api/v1/admin/users/${id}`),
    updateUserRole: (id: string, data: any) => apiClient.put(`/api/v1/admin/users/${id}/role`, data),
    listSubscriptions: (params?: any) => apiClient.get('/api/v1/admin/subscriptions', { ...params }),
    listPlans: () => apiClient.get('/api/v1/admin/plans'),
    listAllGroups: (params?: any) => apiClient.get('/api/v1/admin/telegram-entities', { ...params }),
    listAllInvites: (params?: any) => apiClient.get('/api/v1/admin/invite-links', { ...params }),
    addTokens: (userId: string, amount: number, description?: string) => 
      apiClient.post(`/api/v1/admin/users/${userId}/tokens`, { amount, description }),
    addSubscription: (userId: string, planId: string) => 
      apiClient.post(`/api/v1/admin/users/${userId}/subscription`, { planId }),
    createPlan: (data: any) => apiClient.post('/api/v1/admin/plans', data),
    updatePlan: (id: string, data: any) => apiClient.put(`/api/v1/admin/plans/${id}`, data),
    deletePlan: (id: string) => apiClient.delete(`/api/v1/admin/plans/${id}`),
    getConfig: () => apiClient.get('/api/v1/admin/config'),
    updateConfig: (data: any) => apiClient.put('/api/v1/admin/config', data),
    // Token pricing
    getTokenPricing: () => apiClient.get('/api/v1/admin/token-pricing'),
    upsertTokenPricing: (data: { durationUnit: number; costPerUnit: number; description?: string }) =>
      apiClient.post('/api/v1/admin/token-pricing', data),
    deleteTokenPricing: (durationUnit: number) =>
      apiClient.delete(`/api/v1/admin/token-pricing/${durationUnit}`),
    // Bot members
    listBotMembers: (params?: any) => {
      const queryParams = new URLSearchParams()
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.size) queryParams.append('size', params.size.toString())
      const queryString = queryParams.toString()
      return apiClient.get(`/api/v1/admin/bot-members${queryString ? `?${queryString}` : ''}`)
    },
    getBotMemberStats: () => apiClient.get('/api/v1/admin/bot-members/stats'),
    getBotMemberById: (id: string) => apiClient.get(`/api/v1/admin/bot-members/${id}`),
    // Broadcast templates
    listBroadcastTemplates: (params?: { page?: number; size?: number }) => {
      const queryParams = new URLSearchParams()
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.size) queryParams.append('size', params.size.toString())
      const queryString = queryParams.toString()
      return apiClient.get(`/api/v1/admin/broadcast/templates${queryString ? `?${queryString}` : ''}`)
    },
    getBroadcastTemplate: (id: string) => apiClient.get(`/api/v1/admin/broadcast/templates/${id}`),
    createBroadcastTemplate: (data: { name: string; content: string; parseMode?: string; buttons?: any }) =>
      apiClient.post('/api/v1/admin/broadcast/templates', data),
    updateBroadcastTemplate: (id: string, data: { name?: string; content?: string; parseMode?: string; buttons?: any; isActive?: boolean }) =>
      apiClient.put(`/api/v1/admin/broadcast/templates/${id}`, data),
    deleteBroadcastTemplate: (id: string) => apiClient.delete(`/api/v1/admin/broadcast/templates/${id}`),
    // Broadcasts
    listBroadcasts: (params?: { page?: number; size?: number }) => {
      const queryParams = new URLSearchParams()
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.size) queryParams.append('size', params.size.toString())
      const queryString = queryParams.toString()
      return apiClient.get(`/api/v1/admin/broadcast/list${queryString ? `?${queryString}` : ''}`)
    },
    getBroadcast: (id: string) => apiClient.get(`/api/v1/admin/broadcast/${id}`),
    getBroadcastStats: () => apiClient.get('/api/v1/admin/broadcast/stats'),
    getBroadcastRecipients: (params?: {
      page?: number;
      size?: number;
      botId?: string;
      isPremium?: boolean;
      languageCode?: string;
      activeWithinDays?: number
    }) => {
      const queryParams = new URLSearchParams()
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.size) queryParams.append('size', params.size.toString())
      if (params?.botId) queryParams.append('botId', params.botId)
      if (params?.isPremium !== undefined) queryParams.append('isPremium', params.isPremium.toString())
      if (params?.languageCode) queryParams.append('languageCode', params.languageCode)
      if (params?.activeWithinDays) queryParams.append('activeWithinDays', params.activeWithinDays.toString())
      const queryString = queryParams.toString()
      return apiClient.get(`/api/v1/admin/broadcast/recipients${queryString ? `?${queryString}` : ''}`)
    },
    sendBroadcast: (data: {
      botId: string;
      templateId?: string;
      content: string;
      parseMode?: string;
      buttons?: any;
      recipientIds: string[];
      filterCriteria?: { botId?: string; isPremium?: boolean; languageCode?: string; activeWithinDays?: number };
    }) => apiClient.post('/api/v1/admin/broadcast/send', data),
    cancelBroadcast: (id: string) => apiClient.post(`/api/v1/admin/broadcast/${id}/cancel`),
  },
  autoApproval: {
    list: (params?: { botId?: string }) => {
      const queryParams = new URLSearchParams()
      if (params?.botId) queryParams.append('botId', params.botId)
      const queryString = queryParams.toString()
      return apiClient.get(`/api/v1/auto-approval${queryString ? `?${queryString}` : ''}`)
    },
    getById: (id: string) => apiClient.get(`/api/v1/auto-approval/${id}`),
    create: (data: {
      botId: string
      telegramEntityId: string
      name: string
      approvalMode?: number
      delaySeconds?: number
      requirePremium?: boolean
      requireUsername?: boolean
      minAccountAge?: number
      blockedCountries?: string[]
      sendWelcomeMsg?: boolean
      welcomeMessage?: string
    }) => apiClient.post('/api/v1/auto-approval', data),
    update: (id: string, data: {
      name?: string
      isActive?: boolean
      approvalMode?: number
      delaySeconds?: number
      requirePremium?: boolean
      requireUsername?: boolean
      minAccountAge?: number | null
      blockedCountries?: string[]
      sendWelcomeMsg?: boolean
      welcomeMessage?: string | null
    }) => apiClient.put(`/api/v1/auto-approval/${id}`, data),
    toggle: (id: string) => apiClient.post(`/api/v1/auto-approval/${id}/toggle`),
    delete: (id: string) => apiClient.delete(`/api/v1/auto-approval/${id}`),
  },
  forwardRules: {
    list: (params?: { botId?: string }) => {
      const queryParams = new URLSearchParams()
      if (params?.botId) queryParams.append('botId', params.botId)
      const queryString = queryParams.toString()
      return apiClient.get(`/api/v1/forward-rules${queryString ? `?${queryString}` : ''}`)
    },
    getById: (id: string) => apiClient.get(`/api/v1/forward-rules/${id}`),
    create: (data: {
      botId: string
      sourceEntityId: string
      destinationEntityId: string
      name: string
      scheduleMode?: number
      intervalMinutes?: number
      startFromMessageId?: number
      endAtMessageId?: number
      shuffle?: boolean
      repeatWhenDone?: boolean
      forwardMedia?: boolean
      forwardText?: boolean
      forwardDocuments?: boolean
      forwardStickers?: boolean
      forwardPolls?: boolean
      removeLinks?: boolean
      addWatermark?: string
      includeKeywords?: string[]
      excludeKeywords?: string[]
    }) => apiClient.post('/api/v1/forward-rules', data),
    update: (id: string, data: {
      name?: string
      isActive?: boolean
      scheduleMode?: number
      intervalMinutes?: number
      startFromMessageId?: number | null
      endAtMessageId?: number | null
      shuffle?: boolean
      repeatWhenDone?: boolean
      forwardMedia?: boolean
      forwardText?: boolean
      forwardDocuments?: boolean
      forwardStickers?: boolean
      forwardPolls?: boolean
      removeLinks?: boolean
      addWatermark?: string | null
      includeKeywords?: string[]
      excludeKeywords?: string[]
    }) => apiClient.put(`/api/v1/forward-rules/${id}`, data),
    toggle: (id: string) => apiClient.post(`/api/v1/forward-rules/${id}/toggle`),
    delete: (id: string) => apiClient.delete(`/api/v1/forward-rules/${id}`),
    start: (id: string) => apiClient.post(`/api/v1/forward-rules/${id}/start`),
    pause: (id: string) => apiClient.post(`/api/v1/forward-rules/${id}/pause`),
    resume: (id: string) => apiClient.post(`/api/v1/forward-rules/${id}/resume`),
    reset: (id: string) => apiClient.post(`/api/v1/forward-rules/${id}/reset`),
  },
}
