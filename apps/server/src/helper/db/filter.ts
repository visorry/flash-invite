import { EntityFilter } from '../../constant/db'
import type { DBEntityType, FilterOption } from '../../types/db'
import type { Request } from 'express'

/**
 * Generate Prisma Where Filter
 */
export function generatePrismaFilter(req: Request, entity: DBEntityType) {
  const query = req.query
  const entityFilter = EntityFilter[entity]

  if (!entityFilter) {
    return {}
  }

  let filter: any = {}

  const formatter = (val: string, fn?: (...args: any) => any) => {
    if (!fn) {
      return val
    }
    return fn(val, req)
  }

  // Process query filters
  Object.keys(entityFilter).forEach((key) => {
    const queryValue = query[key] as string
    if (queryValue !== undefined && queryValue !== '') {
      filter = generateFilter(entityFilter, key, queryValue, filter, formatter)
    }
  })

  // Apply defaults for missing filters
  Object.keys(entityFilter).forEach((key) => {
    const filterConfig = entityFilter[key]
    if (filterConfig && filterConfig.default !== undefined && query[key] === undefined) {
      filter[filterConfig.key || key] = filterConfig.default
    }
  })

  return filter
}

/**
 * Generate individual filter
 */
function generateFilter(
  entityFilter: Record<string, FilterOption>,
  key: string,
  value: string,
  filter: any,
  formatter: (val: string, fn?: any) => any
): any {
  const filterConfig = entityFilter[key]
  
  if (!filterConfig) {
    return filter
  }

  // Handle search
  if (filterConfig.search) {
    const searchTerms = filterConfig.search.map(field => ({
      [field]: {
        contains: value,
        mode: 'insensitive'
      }
    }))
    
    filter.OR = searchTerms
    return filter
  }

  // Handle formatted values
  const formattedValue = formatter(value, filterConfig.formatter)
  const targetKey = filterConfig.key || key

  // Handle options (contains, nested paths, etc.)
  if (filterConfig.options) {
    const { path, filter: optionFilter } = filterConfig.options

    if (path === 'contains') {
      filter[targetKey] = {
        contains: formattedValue,
        ...optionFilter
      }
    } else if (path && path.includes('.')) {
      // Handle nested paths like 'some.tag' or 'every.field'
      const parts = path.split('.')
      let nestedFilter: any = formattedValue

      // Build nested object from right to left
      for (let i = parts.length - 1; i >= 0; i--) {
        nestedFilter = { [parts[i]]: nestedFilter }
      }

      filter[targetKey] = nestedFilter
    } else {
      filter[targetKey] = formattedValue
    }
  } else {
    // Direct assignment
    filter[targetKey] = formattedValue
  }

  return filter
}

/**
 * Generate pagination
 */
export function generatePrismaPagination(req: Request, entity: DBEntityType) {
  const { page, size = '10', sort, order = 'asc' } = req.query
  
  let skip: number | undefined
  let take: number | undefined
  let current: number | undefined
  let sortKey = (sort ?? 'createdAt') as string

  // Map sort field names for specific entities
  if (entity === 'Member') {
    if (sortKey === 'joined') sortKey = 'joinedAt'
    if (sortKey === 'expires') sortKey = 'expiresAt'
  }

  if (page && size && typeof page === 'string' && typeof size === 'string') {
    skip = (parseInt(page, 10) - 1) * parseInt(size, 10)
    current = parseInt(page, 10)
  }

  if (size && typeof size === 'string') {
    take = parseInt(size, 10)
  }

  const orderByValue = order === 'desc' ? 'desc' as const : 'asc' as const
  
  return {
    current,
    skip,
    take,
    orderBy: {
      [sortKey]: orderByValue,
    },
  }
}

/**
 * Extract includes from request
 */
export function generateInclude(req: Request): string[] {
  const includes = req.query.include
  if (typeof includes === 'string') {
    return includes.split(',')
  }
  if (Array.isArray(includes)) {
    return includes.filter(i => typeof i === 'string') as string[]
  }
  return []
}
