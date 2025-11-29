import { NotFoundError, BadRequestError } from '../errors/http-exception'
import type { RequestContext } from '../types/app'
import db from '@super-invite/db'
import { TransactionType, TransactionStatus, DurationUnit, getSecondsPerUnit, AutomationFeatureType, getAutomationFeatureTypeLabel } from '@super-invite/db'
import { withTransaction } from '../helper/db/transaction'

const getBalance = async (ctx: RequestContext) => {
  if (!ctx.user) {
    throw new BadRequestError('User not authenticated')
  }

  let balance = await db.tokenBalance.findUnique({
    where: { userId: ctx.user.id },
  })

  // Create balance if doesn't exist
  if (!balance) {
    balance = await db.tokenBalance.create({
      data: {
        userId: ctx.user.id,
        balance: 0,
        totalEarned: 0,
        totalSpent: 0,
      },
    })
  }

  return balance
}

const getTransactions = async (ctx: RequestContext) => {
  if (!ctx.user) {
    throw new BadRequestError('User not authenticated')
  }

  const pagination = ctx.pagination || {}

  const [items, total] = await Promise.all([
    db.tokenTransaction.findMany({
      where: {
        userId: ctx.user.id,
        deletedAt: null,
      },
      skip: pagination.skip,
      take: pagination.take,
      orderBy: { createdAt: 'desc' },
    }),
    db.tokenTransaction.count({
      where: {
        userId: ctx.user.id,
        deletedAt: null,
      },
    }),
  ])

  return {
    items,
    total,
    page: pagination.current || 1,
    size: pagination.take || 20,
  }
}

const addTokens = async (
  ctx: RequestContext,
  userId: string,
  amount: number,
  type: TransactionType,
  description?: string,
  reference?: string
) => {
  return withTransaction(ctx, async (tx) => {
    // Get or create balance
    let balance = await tx.tokenBalance.findUnique({
      where: { userId },
    })

    if (!balance) {
      balance = await tx.tokenBalance.create({
        data: {
          userId,
          balance: 0,
          totalEarned: 0,
          totalSpent: 0,
        },
      })
    }

    const newBalance = balance.balance + amount

    // Update balance
    await tx.tokenBalance.update({
      where: { userId },
      data: {
        balance: newBalance,
        totalEarned: { increment: amount },
      },
    })

    // Create transaction
    const transaction = await tx.tokenTransaction.create({
      data: {
        userId,
        type,
        status: TransactionStatus.COMPLETED,
        amount,
        balanceAfter: newBalance,
        description,
        reference,
      },
    })

    return transaction
  })
}

const deductTokens = async (
  ctx: RequestContext,
  userId: string,
  amount: number,
  type: TransactionType,
  description?: string,
  reference?: string
) => {
  return withTransaction(ctx, async (tx) => {
    const balance = await tx.tokenBalance.findUnique({
      where: { userId },
    })

    if (!balance) {
      throw new NotFoundError('Token balance not found')
    }

    if (balance.balance < amount) {
      throw new BadRequestError('Insufficient token balance')
    }

    const newBalance = balance.balance - amount

    // Update balance
    await tx.tokenBalance.update({
      where: { userId },
      data: {
        balance: newBalance,
        totalSpent: { increment: amount },
      },
    })

    // Create transaction
    const transaction = await tx.tokenTransaction.create({
      data: {
        userId,
        type,
        status: TransactionStatus.COMPLETED,
        amount: -amount,
        balanceAfter: newBalance,
        description,
        reference,
      },
    })

    return transaction
  })
}

const getCostConfig = async () => {
  const configs = await db.tokenCostConfig.findMany({
    where: {
      isActive: true,
      deletedAt: null,
    },
    orderBy: { durationUnit: 'asc' },
  })

  return configs
}

// Calculate token cost for a given duration in seconds
const calculateInviteCost = async (durationSeconds: number): Promise<number> => {
  const configs = await db.tokenCostConfig.findMany({
    where: {
      isActive: true,
      deletedAt: null,
    },
    orderBy: { durationUnit: 'desc' }, // Start from largest unit (year) to smallest (minute)
  })

  if (configs.length === 0) {
    return 0 // No pricing configured, free
  }

  let totalCost = 0
  let remainingSeconds = durationSeconds

  // Process from largest to smallest unit for best pricing
  for (const config of configs) {
    const secondsPerUnit = getSecondsPerUnit(config.durationUnit)
    const units = Math.floor(remainingSeconds / secondsPerUnit)

    if (units > 0) {
      totalCost += units * config.costPerUnit
      remainingSeconds -= units * secondsPerUnit
    }
  }

  return totalCost
}

// Update or create cost config for a duration unit
const upsertCostConfig = async (
  durationUnit: DurationUnit,
  costPerUnit: number,
  description?: string
) => {
  const existing = await db.tokenCostConfig.findUnique({
    where: { durationUnit },
  })

  if (existing) {
    return db.tokenCostConfig.update({
      where: { durationUnit },
      data: {
        costPerUnit,
        description,
        isActive: true,
        deletedAt: null,
      },
    })
  }

  return db.tokenCostConfig.create({
    data: {
      durationUnit,
      costPerUnit,
      description,
      isActive: true,
    },
  })
}

// Delete (soft) cost config
const deleteCostConfig = async (durationUnit: DurationUnit) => {
  return db.tokenCostConfig.update({
    where: { durationUnit },
    data: {
      isActive: false,
      deletedAt: new Date(),
    },
  })
}

// ============ Automation Cost Config ============

// Get all automation cost configs
const getAutomationCostConfig = async () => {
  const configs = await db.automationCostConfig.findMany({
    where: {
      isActive: true,
      deletedAt: null,
    },
    orderBy: { featureType: 'asc' },
  })
  return configs
}

// Get automation cost config for a specific feature type
const getAutomationCostForFeature = async (featureType: AutomationFeatureType) => {
  const config = await db.automationCostConfig.findFirst({
    where: {
      featureType,
      isActive: true,
      deletedAt: null,
    },
  })
  return config
}

// Calculate automation cost for a user (considering free rules allowed)
const calculateAutomationCost = async (
  userId: string,
  featureType: AutomationFeatureType
): Promise<{ cost: number; freeUsed: number; freeAllowed: number }> => {
  const config = await getAutomationCostForFeature(featureType)

  if (!config) {
    return { cost: 0, freeUsed: 0, freeAllowed: 0 }
  }

  // Count existing rules for this user and feature type
  let existingCount = 0
  if (featureType === AutomationFeatureType.AUTO_APPROVAL) {
    existingCount = await db.autoApprovalRule.count({
      where: { userId },
    })
  } else if (featureType === AutomationFeatureType.FORWARD_RULE) {
    existingCount = await db.forwardRule.count({
      where: { userId, deletedAt: null },
    })
  }

  const freeAllowed = config.freeRulesAllowed
  const freeUsed = Math.min(existingCount, freeAllowed)

  // If user has used all free rules, they need to pay
  if (existingCount >= freeAllowed) {
    return { cost: config.costPerRule, freeUsed, freeAllowed }
  }

  return { cost: 0, freeUsed, freeAllowed }
}

// Update or create automation cost config
const upsertAutomationCostConfig = async (
  featureType: AutomationFeatureType,
  costPerRule: number,
  freeRulesAllowed: number,
  description?: string
) => {
  const existing = await db.automationCostConfig.findUnique({
    where: { featureType },
  })

  if (existing) {
    return db.automationCostConfig.update({
      where: { featureType },
      data: {
        costPerRule,
        freeRulesAllowed,
        description,
        isActive: true,
        deletedAt: null,
      },
    })
  }

  return db.automationCostConfig.create({
    data: {
      featureType,
      costPerRule,
      freeRulesAllowed,
      description,
      isActive: true,
    },
  })
}

// Delete (soft) automation cost config
const deleteAutomationCostConfig = async (featureType: AutomationFeatureType) => {
  return db.automationCostConfig.update({
    where: { featureType },
    data: {
      isActive: false,
      deletedAt: new Date(),
    },
  })
}

// ============ Daily Token Claim ============

const claimDailyTokens = async (ctx: RequestContext) => {
  if (!ctx.user) {
    throw new BadRequestError('User not authenticated')
  }

  // Get active subscription
  const subscription = await db.subscription.findFirst({
    where: {
      userId: ctx.user.id,
      status: 0, // ACTIVE
      deletedAt: null,
    },
    include: {
      plan: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  if (!subscription) {
    throw new BadRequestError('No active subscription found')
  }

  // Check if subscription has expired
  if (subscription.endDate && subscription.endDate < new Date()) {
    throw new BadRequestError('Your subscription has expired')
  }

  const dailyTokens = subscription.plan.dailyTokens
  if (dailyTokens <= 0) {
    throw new BadRequestError('Your plan does not include daily tokens')
  }

  // Check if already claimed today
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const existingClaim = await db.dailyTokenClaim.findUnique({
    where: {
      userId_claimDate: {
        userId: ctx.user.id,
        claimDate: today,
      },
    },
  })

  if (existingClaim) {
    throw new BadRequestError('You have already claimed your daily tokens today')
  }

  // Grant tokens
  return withTransaction(ctx, async (tx) => {
    // Get or create balance
    let balance = await tx.tokenBalance.findUnique({
      where: { userId: ctx.user!.id },
    })

    if (!balance) {
      balance = await tx.tokenBalance.create({
        data: {
          userId: ctx.user!.id,
          balance: 0,
          totalEarned: 0,
          totalSpent: 0,
        },
      })
    }

    const newBalance = balance.balance + dailyTokens

    // Update balance
    await tx.tokenBalance.update({
      where: { userId: ctx.user!.id },
      data: {
        balance: newBalance,
        totalEarned: { increment: dailyTokens },
      },
    })

    // Create transaction record
    await tx.tokenTransaction.create({
      data: {
        userId: ctx.user!.id,
        type: TransactionType.DAILY_CLAIM,
        status: TransactionStatus.COMPLETED,
        amount: dailyTokens,
        balanceAfter: newBalance,
        description: `Daily token claim (${subscription.plan.name})`,
        reference: subscription.id,
      },
    })

    // Create claim record
    await tx.dailyTokenClaim.create({
      data: {
        userId: ctx.user!.id,
        subscriptionId: subscription.id,
        tokensGranted: dailyTokens,
        claimDate: today,
      },
    })

    // Calculate next claim time (tomorrow at 00:00)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return {
      success: true,
      tokensGranted: dailyTokens,
      newBalance,
      canClaimAgain: tomorrow,
    }
  })
}

const getDailyClaimStatus = async (ctx: RequestContext) => {
  if (!ctx.user) {
    throw new BadRequestError('User not authenticated')
  }

  // Get active subscription
  const subscription = await db.subscription.findFirst({
    where: {
      userId: ctx.user.id,
      status: 0, // ACTIVE
      deletedAt: null,
    },
    include: {
      plan: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  if (!subscription) {
    return {
      canClaim: false,
      reason: 'No active subscription',
      dailyTokens: 0,
    }
  }

  // Check if subscription has expired
  if (subscription.endDate && subscription.endDate < new Date()) {
    return {
      canClaim: false,
      reason: 'Subscription expired',
      dailyTokens: 0,
    }
  }

  const dailyTokens = subscription.plan.dailyTokens
  if (dailyTokens <= 0) {
    return {
      canClaim: false,
      reason: 'Plan does not include daily tokens',
      dailyTokens: 0,
    }
  }

  // Check if already claimed today
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const existingClaim = await db.dailyTokenClaim.findUnique({
    where: {
      userId_claimDate: {
        userId: ctx.user.id,
        claimDate: today,
      },
    },
  })

  if (existingClaim) {
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return {
      canClaim: false,
      reason: 'Already claimed today',
      dailyTokens,
      lastClaimDate: existingClaim.claimDate,
      nextClaimDate: tomorrow,
    }
  }

  return {
    canClaim: true,
    dailyTokens,
    planName: subscription.plan.name,
  }
}

const getClaimHistory = async (ctx: RequestContext, limit: number = 30) => {
  if (!ctx.user) {
    throw new BadRequestError('User not authenticated')
  }

  const claims = await db.dailyTokenClaim.findMany({
    where: {
      userId: ctx.user.id,
    },
    include: {
      subscription: {
        include: {
          plan: true,
        },
      },
    },
    orderBy: {
      claimDate: 'desc',
    },
    take: limit,
  })

  return claims
}

export default {
  getBalance,
  getTransactions,
  addTokens,
  deductTokens,
  getCostConfig,
  calculateInviteCost,
  upsertCostConfig,
  deleteCostConfig,
  // Automation cost
  getAutomationCostConfig,
  getAutomationCostForFeature,
  calculateAutomationCost,
  upsertAutomationCostConfig,
  deleteAutomationCostConfig,
  // Daily token claim
  claimDailyTokens,
  getDailyClaimStatus,
  getClaimHistory,
}
