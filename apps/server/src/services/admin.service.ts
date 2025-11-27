import { NotFoundError, BadRequestError } from '../errors/http-exception'
import type { RequestContext } from '../types/app'
import db from '@super-invite/db'
import { validateBotToken, addBot, removeBot, getBotInstance } from '../bot/bot-manager'

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
        in: ['botToken', 'botUsername', 'systemBotId'],
      },
    },
  })

  const configMap: any = {
    botToken: '',
    botUsername: '',
    systemBotId: '',
    botStatus: 'not_configured',
  }

  configs.forEach((config) => {
    configMap[config.key] = config.value
  })

  // Check if the system bot is running
  if (configMap.systemBotId) {
    const botInstance = getBotInstance(configMap.systemBotId)
    configMap.botStatus = botInstance ? 'running' : 'stopped'
  } else if (configMap.botToken) {
    configMap.botStatus = 'configured'
  }

  // Mask the token for security
  if (configMap.botToken) {
    configMap.botToken = configMap.botToken.substring(0, 10) + '...'
  }

  return configMap
}

const updateConfig = async (_ctx: RequestContext, data: any) => {
  // If a new bot token is provided, validate and register it
  if (data.botToken) {
    // Validate the token
    const validation = await validateBotToken(data.botToken)
    if (!validation.valid) {
      throw new BadRequestError(validation.error || 'Invalid bot token')
    }

    // Check if we already have a system bot running
    const existingSystemBotId = await db.config.findUnique({
      where: { key: 'systemBotId' },
    })

    // Remove old system bot if it exists
    if (existingSystemBotId?.value) {
      try {
        await removeBot(existingSystemBotId.value)
      } catch (e) {
        console.log('Failed to remove old system bot:', e)
      }
      // Delete the old bot record
      await db.bot.delete({
        where: { id: existingSystemBotId.value },
      }).catch(() => {})
    }

    // Create a new bot record for the system bot (no user association)
    // We'll use a special system user ID or null
    const systemBot = await db.bot.create({
      data: {
        userId: _ctx.user!.id, // Admin user who configured it
        token: data.botToken,
        username: validation.username || '',
        firstName: validation.firstName || 'System Bot',
        botId: validation.botId || '',
        status: 0, // ACTIVE
        isDefault: false,
      },
    })

    // Store config first
    await db.config.upsert({
      where: { key: 'botToken' },
      update: { value: data.botToken },
      create: { key: 'botToken', value: data.botToken },
    })

    await db.config.upsert({
      where: { key: 'botUsername' },
      update: { value: validation.username || '' },
      create: { key: 'botUsername', value: validation.username || '' },
    })

    await db.config.upsert({
      where: { key: 'systemBotId' },
      update: { value: systemBot.id },
      create: { key: 'systemBotId', value: systemBot.id },
    })

    // Start the bot asynchronously in the background (don't await)
    // This prevents the HTTP request from waiting for the bot to fully launch
    addBot({
      dbBotId: systemBot.id,
      token: data.botToken,
      userId: _ctx.user!.id,
    }).catch(async (error: any) => {
      console.error('Failed to start system bot in background:', error)
      // Clean up bot record if failed to start
      await db.bot.delete({ where: { id: systemBot.id } }).catch(() => {})
      // Clean up config
      await db.config.delete({ where: { key: 'systemBotId' } }).catch(() => {})
    })
  }

  return getConfig(_ctx)
}

// Initialize system bot from database config on server startup
const initializeSystemBot = async () => {
  const configs = await db.config.findMany({
    where: {
      key: { in: ['botToken', 'systemBotId'] },
    },
  })

  const configMap: Record<string, string> = {}
  configs.forEach((c) => {
    configMap[c.key] = c.value
  })

  if (!configMap.botToken || !configMap.systemBotId) {
    console.log('No system bot configured in database')
    return
  }

  // Check if bot record exists
  const botRecord = await db.bot.findUnique({
    where: { id: configMap.systemBotId },
  })

  if (!botRecord) {
    console.log('System bot record not found, skipping initialization')
    return
  }

  // Check if already running
  const existing = getBotInstance(configMap.systemBotId)
  if (existing) {
    console.log('System bot already running')
    return
  }

  // Start the bot
  try {
    await addBot({
      dbBotId: botRecord.id,
      token: botRecord.token,
      userId: botRecord.userId,
    })
    console.log(`System bot @${botRecord.username} initialized from database config`)
  } catch (error) {
    console.error('Failed to initialize system bot:', error)
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
  addTokensToUser,
  addSubscriptionToUser,
  createPlan,
  updatePlan,
  deletePlan,
  getConfig,
  updateConfig,
  initializeSystemBot,
}
