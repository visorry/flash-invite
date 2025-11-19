import { randomUUID } from 'crypto'
import type { Request } from 'express'
import type { RequestContext, RouteContext } from '../types/app'
import type { DBEntityType } from '../constant/db'
import { generatePrismaFilter, generatePrismaPagination } from './db/filter'
import { generateInclude } from './db/include'

/**
 * Get route context for Express routes
 */
export function getRouteContext(req: Request): RouteContext {
  return {
    user: req.user,
    token: req.token,
    includes: extractIncludes(req),
    filter: extractFilter(req),
    pagination: extractPagination(req),
  }
}

/**
 * Get request context for services (with automatic filter generation)
 */
export function getRequestContext(
  req: Request,
  data?: {
    entity?: DBEntityType | null
  }
): RequestContext {
  const includes = generateInclude(req)

  const ctx: RequestContext = {
    user: req.user,
    token: req.token,
    requestId: randomUUID(),
    includes: includes || undefined,
  }

  if (data?.entity) {
    ctx.filter = generatePrismaFilter(req, data.entity)
    ctx.pagination = generatePrismaPagination(req, data.entity)
  }

  return ctx
}

/**
 * Extract includes from request query
 */
function extractIncludes(req: Request): string[] {
  const includes = req.query.include
  if (typeof includes === 'string') {
    return includes.split(',')
  }
  if (Array.isArray(includes)) {
    return includes.filter(i => typeof i === 'string') as string[]
  }
  return []
}

/**
 * Extract filter from request query
 */
function extractFilter(req: Request): Record<string, unknown> {
  const filter: Record<string, unknown> = {}
  
  if (req.query.search) {
    filter.search = req.query.search
  }
  
  if (req.query.status) {
    filter.status = req.query.search
  }
  
  if (req.query.isActive) {
    filter.isActive = req.query.isActive === 'true'
  }
  
  return filter
}

/**
 * Extract pagination from request query
 */
function extractPagination(req: Request) {
  const page = parseInt(req.query.page as string) || 1
  const size = Math.min(parseInt(req.query.size as string) || 20, 100)
  const skip = (page - 1) * size
  
  return { page, size, skip, take: size }
}
