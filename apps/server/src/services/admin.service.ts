import { NotFoundError } from '../errors/http-exception'
import type { RequestContext } from '../types/app'
import db from '@super-invite/db'

const listUsers = async (ctx: RequestContext) => {
  const pagination = ctx.pagination || {}

  const [items, total] = await Promise.all([
    db.user.findMany({
      skip: pagination.skip,
      take: pagination.take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            telegramEntities: true,
            inviteLinks: true,
            subscriptions: true,
          },
        },
      },
    }),
    db.user.count(),
  ])

  return {
    items,
    total,
    page: pagination.current || 1,
    size: pagination.take || 20,
  }
}

const getUserById = async (_ctx: RequestContext, id: string) => {
  const user = await db.user.findUnique({
    where: { id },
    include: {
      telegramEntities: {
        orderBy: { createdAt: 'desc' },
      },
      inviteLinks: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      subscriptions: {
        orderBy: { createdAt: 'desc' },
        include: {
          plan: true,
        },
      },
      tokenBalance: true,
      _count: {
        select: {
          telegramEntities: true,
          inviteLinks: true,
          tokenTransactions: true,
        },
      },
    },
  })

  if (!user) {
    throw new NotFoundError('User not found')
  }

  return user
}

const updateUserRole = async (_ctx: RequestContext, id: string, data: any) => {
  const user = await db.user.update({
    where: { id },
    data: {
      // Add role/admin fields to your User model
      // For now, just update what exists
      updatedAt: new Date(),
    },
  })

  return user
}

const listSubscriptions = async (ctx: RequestContext) => {
  const pagination = ctx.pagination || {}

  const [items, total] = await Promise.all([
    db.subscription.findMany({
      skip: pagination.skip,
      take: pagination.take,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        plan: true,
      },
    }),
    db.subscription.count(),
  ])

  return {
    items,
    total,
    page: pagination.current || 1,
    size: pagination.take || 20,
  }
}

const listPlans = async (_ctx: RequestContext) => {
  const plans = await db.plan.findMany({
    where: {
      deletedAt: null,
    },
    orderBy: { price: 'asc' },
    include: {
      _count: {
        select: {
          subscriptions: true,
        },
      },
    },
  })

  return plans
}

const getPlatformStats = async (_ctx: RequestContext) => {
  const [
    totalUsers,
    totalTelegramEntities,
    totalInviteLinks,
    activeInviteLinks,
    totalSubscriptions,
    activeSubscriptions,
  ] = await Promise.all([
    db.user.count(),
    db.telegramEntity.count(),
    db.inviteLink.count(),
    db.inviteLink.count({ where: { status: 0 } }), // ACTIVE
    db.subscription.count(),
    db.subscription.count({ where: { status: 0 } }), // ACTIVE
  ])

  return {
    totalUsers,
    totalTelegramEntities,
    totalInviteLinks,
    activeInviteLinks,
    totalSubscriptions,
    activeSubscriptions,
  }
}

const listAllTelegramEntities = async (ctx: RequestContext) => {
  const pagination = ctx.pagination || {}

  const [items, total] = await Promise.all([
    db.telegramEntity.findMany({
      skip: pagination.skip,
      take: pagination.take,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            inviteLinks: true,
          },
        },
      },
    }),
    db.telegramEntity.count(),
  ])

  return {
    items,
    total,
    page: pagination.current || 1,
    size: pagination.take || 20,
  }
}

const listAllInviteLinks = async (ctx: RequestContext) => {
  const pagination = ctx.pagination || {}

  const [items, total] = await Promise.all([
    db.inviteLink.findMany({
      skip: pagination.skip,
      take: pagination.take,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        telegramEntity: {
          select: {
            id: true,
            title: true,
            username: true,
          },
        },
      },
    }),
    db.inviteLink.count(),
  ])

  return {
    items,
    total,
    page: pagination.current || 1,
    size: pagination.take || 20,
  }
}

export default {
  listUsers,
  getUserById,
  updateUserRole,
  listSubscriptions,
  listPlans,
  getPlatformStats,
  listAllTelegramEntities,
  listAllInviteLinks,
}
