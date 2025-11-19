import { NotFoundError } from '../errors/http-exception'
import type { RequestContext } from '../types/app'
import db from '@super-invite/db'
import { generatePrismaInclude } from '../helper/db/include'
import { DBEntity } from '../constant/db'

const list = async (ctx: RequestContext) => {
  const include = generatePrismaInclude(DBEntity.Member, ctx)
  const filter = ctx.filter || {}
  const pagination = ctx.pagination || {}

  // Add user filter - only show members from user's groups
  if (ctx.user) {
    // Get user's telegram entities
    const userEntities = await db.telegramEntity.findMany({
      where: { userId: ctx.user.id },
      select: { id: true },
    })

    const entityIds = userEntities.map(e => e.id)

    // Filter members by user's entities
    filter.telegramEntityId = {
      in: entityIds,
    }
  }

  // Use pagination orderBy if provided, otherwise default to newest first
  const orderBy = pagination.orderBy || { joinedAt: 'desc' }

  const [items, total] = await Promise.all([
    db.groupMember.findMany({
      where: filter,
      ...(include && { include }),
      skip: pagination.skip,
      take: pagination.take,
      orderBy,
    }),
    db.groupMember.count({ where: filter }),
  ])

  return {
    items,
    total,
    page: pagination.current || 1,
    size: pagination.take || 20,
  }
}

const getById = async (ctx: RequestContext, id: string) => {
  const include = generatePrismaInclude(DBEntity.Member, ctx)

  const member = await db.groupMember.findUnique({
    where: { id },
    ...(include && { include }),
  })

  if (!member) {
    throw new NotFoundError('Member not found')
  }

  // Check ownership - member must be from user's group
  if (ctx.user) {
    const entity = await db.telegramEntity.findUnique({
      where: { id: member.telegramEntityId },
    })

    if (!entity || entity.userId !== ctx.user.id) {
      throw new NotFoundError('Member not found')
    }
  }

  return member
}

export default {
  list,
  getById,
}
