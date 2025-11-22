import type { RequestContext } from '../types/app'
import db from '@super-invite/db'

const list = async (ctx: RequestContext) => {
  const pagination = ctx.pagination || {}

  const [items, total] = await Promise.all([
    db.botMember.findMany({
      skip: pagination.skip,
      take: pagination.take,
      orderBy: pagination.orderBy || { lastActiveAt: 'desc' },
    }),
    db.botMember.count(),
  ])

  return {
    items,
    total,
    page: pagination.current || 1,
    size: pagination.take || 20,
  }
}

const getById = async (id: string) => {
  const member = await db.botMember.findUnique({
    where: { id },
  })

  return member
}

const getByTelegramUserId = async (telegramUserId: string) => {
  const member = await db.botMember.findUnique({
    where: { telegramUserId },
  })

  return member
}

const getStats = async () => {
  const [total, activeToday, premiumCount] = await Promise.all([
    db.botMember.count(),
    db.botMember.count({
      where: {
        lastActiveAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    }),
    db.botMember.count({
      where: { isPremium: true },
    }),
  ])

  return {
    total,
    activeToday,
    premiumCount,
  }
}

export default {
  list,
  getById,
  getByTelegramUserId,
  getStats,
}
