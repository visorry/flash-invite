import { NotFoundError, BadRequestError } from '../errors/http-exception'
import type { RequestContext } from '../types/app'
import db from '@super-invite/db'
import { TransactionType, TransactionStatus, DurationUnit, getSecondsPerUnit } from '@super-invite/db'
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

export default {
  getBalance,
  getTransactions,
  addTokens,
  deductTokens,
  getCostConfig,
  calculateInviteCost,
  upsertCostConfig,
  deleteCostConfig,
}
