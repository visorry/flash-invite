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
        isAdmin: true,
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
      isAdmin: data.isAdmin,
      updatedAt: new Date(),
    },
    select: {
      id: true,
      name: true,
      email: true,
      isAdmin: true,
      updatedAt: true,
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

const addTokensToUser = async (_ctx: RequestContext, userId: string, amount: number, description?: string) => {
  // Get or create token balance
  let tokenBalance = await db.tokenBalance.findUnique({
    where: { userId },
  })

  if (!tokenBalance) {
    tokenBalance = await db.tokenBalance.create({
      data: {
        userId,
        balance: 0,
        totalEarned: 0,
        totalSpent: 0,
      },
    })
  }

  const newBalance = tokenBalance.balance + amount

  // Update balance
  await db.tokenBalance.update({
    where: { userId },
    data: {
      balance: newBalance,
      totalEarned: tokenBalance.totalEarned + amount,
    },
  })

  // Create transaction record
  await db.tokenTransaction.create({
    data: {
      userId,
      type: 0, // CREDIT
      status: 1, // COMPLETED
      amount,
      balanceAfter: newBalance,
      description: description || 'Admin credit',
      reference: 'admin-add',
    },
  })

  return {
    success: true,
    newBalance,
    amountAdded: amount,
  }
}

const addSubscriptionToUser = async (_ctx: RequestContext, userId: string, planId: string) => {
  // Get plan details
  const plan = await db.plan.findUnique({
    where: { id: planId },
  })

  if (!plan) {
    throw new NotFoundError('Plan not found')
  }

  // Calculate end date (30 days from now for monthly, 365 for yearly)
  const startDate = new Date()
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + (plan.interval === 0 ? 30 : 365))

  // Create subscription
  const subscription = await db.subscription.create({
    data: {
      userId,
      planId,
      status: 0, // ACTIVE
      startDate,
      endDate,
      autoRenew: false, // Admin-added subscriptions don't auto-renew
    },
    include: {
      plan: true,
    },
  })

  // Add tokens from plan
  await addTokensToUser(_ctx, userId, plan.tokensIncluded, `Subscription: ${plan.name}`)

  return {
    success: true,
    subscription,
  }
}

const createPlan = async (_ctx: RequestContext, data: any) => {
  const plan = await db.plan.create({
    data: {
      name: data.name,
      description: data.description,
      type: data.type,
      interval: data.interval,
      price: data.price,
      tokensIncluded: data.tokensIncluded,
      maxGroups: data.maxGroups,
      maxInvitesPerDay: data.maxInvitesPerDay,
      isActive: data.isActive ?? true,
    },
  })

  return plan
}

const updatePlan = async (_ctx: RequestContext, id: string, data: any) => {
  const plan = await db.plan.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      type: data.type,
      interval: data.interval,
      price: data.price,
      tokensIncluded: data.tokensIncluded,
      maxGroups: data.maxGroups,
      maxInvitesPerDay: data.maxInvitesPerDay,
      isActive: data.isActive,
    },
  })

  return plan
}

const deletePlan = async (_ctx: RequestContext, id: string) => {
  // Soft delete
  await db.plan.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      isActive: false,
    },
  })

  return { success: true, message: 'Plan deleted successfully' }
}

const getConfig = async (_ctx: RequestContext) => {
  const configs = await db.config.findMany({
    where: {
      key: {
        in: ['botToken', 'botUsername'],
      },
    },
  })

  const configMap: any = {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    botUsername: process.env.TELEGRAM_BOT_USERNAME || '',
  }

  configs.forEach((config) => {
    configMap[config.key] = config.value
  })

  return configMap
}

const updateConfig = async (_ctx: RequestContext, data: any) => {
  // Update or create config entries
  if (data.botToken) {
    await db.config.upsert({
      where: { key: 'botToken' },
      update: { value: data.botToken },
      create: { key: 'botToken', value: data.botToken },
    })
  }

  if (data.botUsername) {
    await db.config.upsert({
      where: { key: 'botUsername' },
      update: { value: data.botUsername },
      create: { key: 'botUsername', value: data.botUsername },
    })
  }

  return getConfig(_ctx)
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
  addTokensToUser,
  addSubscriptionToUser,
  createPlan,
  updatePlan,
  deletePlan,
  getConfig,
  updateConfig,
}
