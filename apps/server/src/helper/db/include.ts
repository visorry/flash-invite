import EntityInclude from '../../constant/db/include'
import type { RequestContext } from '../../types/app'
import type { DBEntityType, PrismaInclude } from '../../types/db'
import type { Request } from 'express'

/**
 * Generate dynamic path for nested includes
 */
function generateDynamicPath(path: string, type: 'include' | 'select'): string[] {
  const parts = path.split('.')
  const result: string[] = []
  
  for (let i = 0; i < parts.length; i++) {
    result.push(parts[i])
    if (i < parts.length - 1) {
      result.push(type)
    }
  }
  
  return result
}

/**
 * Set nested object property using path array
 */
function setNestedProperty(obj: any, path: string[], value: any): any {
  if (path.length === 0) return obj
  
  const result = { ...obj }
  let current: any = result
  
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i]
    if (!key) continue
    
    if (!current[key]) {
      current[key] = {}
    } else {
      current[key] = { ...current[key] }
    }
    current = current[key]
  }
  
  const lastKey = path[path.length - 1]
  if (lastKey) {
    current[lastKey] = value
  }
  
  return result
}

/**
 * Generate Prisma Include from entity and request context
 */
export function generatePrismaInclude(
  entity: DBEntityType,
  options?: RequestContext,
): PrismaInclude | null {
  if (!options || !options.includes) {
    return null
  }

  const entityInclude = EntityInclude[entity]

  // Convert to set and then array to remove duplicates
  const includes = Array.from(new Set(options.includes))

  if (!includes || !entityInclude || entityInclude.length === 0) {
    return null
  }

  const filteredModel = entityInclude.filter((e) => {
    if (typeof e === 'string') {
      return includes?.includes(e)
    }

    if ('skip' in e && e.skip) {
      return false
    }

    if ('required' in e && e.required) {
      return true
    }

    return includes?.includes(e.key)
  })

  if (filteredModel.length === 0) {
    return null
  }

  let include: PrismaInclude = {}

  filteredModel.forEach((e) => {
    if (typeof e === 'string') {
      const path = generateDynamicPath(e, 'include')
      include = setNestedProperty(include, path, true)
      return
    }

    const includeVal = e.override ? e.override() : true

    if ('count' in e && e.count) {
      // Handle count includes
      let value: string | undefined = e.value
      const path: string[] = []

      const paths = value ? value.split('.') : []

      if (paths.length > 1) {
        value = paths.pop()
        path.push(...generateDynamicPath(paths.join('.'), 'include'), 'include')
      }

      if (value) {
        path.push('_count', 'select')
        path.push(value)
      }

      include = setNestedProperty(include, path, includeVal)
      return
    }

    if ('value' in e && e.value) {
      const path = generateDynamicPath(e.value, 'include')
      include = setNestedProperty(include, path, includeVal)
      return
    }

    const path = generateDynamicPath(e.key, 'include')
    include = setNestedProperty(include, path, includeVal)
  })

  return include
}

/**
 * Generate Entity Include Array from request
 */
export function generateInclude(req: Request): string[] | null {
  const { include } = req.query

  if (!include) {
    return null
  }

  if (!Array.isArray(include)) {
    return [include] as string[]
  }

  return include as string[]
}
