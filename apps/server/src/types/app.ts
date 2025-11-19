export interface User {
  id: string
  email: string
  name: string
  [key: string]: any
}

export interface RequestContext {
  user?: User
  token?: string
  requestId: string
  filter?: any
  pagination?: PaginationOptions
  includes?: string[]
}

export interface RouteContext {
  user?: User
  token?: string
  permissions?: string[]
  includes: string[]
  filter: Record<string, unknown>
  pagination: PaginationOptions
}

export interface PaginationOptions {
  page?: number
  size?: number
  skip?: number
  take?: number
  orderBy?: any
  current?: number
}
