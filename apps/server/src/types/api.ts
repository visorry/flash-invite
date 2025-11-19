export interface ApiResponse<T = any> {
  success: boolean
  data: T | null
  error: ApiError | null
}

export interface ApiError {
  message: string
  status: number
  code: string
  description?: string
  stack?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  size: number
  totalPages: number
}
