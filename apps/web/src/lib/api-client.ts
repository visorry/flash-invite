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
  },
}
