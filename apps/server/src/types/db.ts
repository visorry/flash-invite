import type { DBEntityType } from '../constant/db'

export interface FilterOption {
  key?: string
  search?: string[]
  options?: {
    path?: string
    filter?: Record<string, any>
  }
  formatter?: (value: string, req?: any) => any
  default?: any
}

export interface DBEntityFilterOption {
  [key: string]: {
    [filterKey: string]: FilterOption
  }
}

export interface DBEntitySortOption {
  [key: string]: string[]
}

export interface PaginationOption {
  current?: number
  skip?: number
  take?: number
  orderBy?: Record<string, 'asc' | 'desc'>
}

export interface FilterAccess {
  resourceIds: string | string[] | null
  path: string | string[]
  override?: string | null | undefined
}

export interface DBServiceOptions {
  access: FilterAccess[]
}

export type PrismaInclude = Record<string, any>

export interface IncludeOptions {
  key: string
  value?: string
  count?: boolean
  required?: boolean
  skip?: boolean
  override?: () => any
}

export type EntityIncludeConfig = Record<DBEntityType, Array<string | IncludeOptions>>

export type { DBEntityType }
