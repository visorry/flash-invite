import { NotFoundError, BadRequestError } from '../errors/http-exception'
import type { RequestContext } from '../types/app'
import db from '@super-invite/db'
import { TransactionType, TransactionStatus } from '@super-invite/db'
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
    orderBy: { action: 'asc' },
  })

  return configs
}

export default {
  getBalance,
  getTransactions,
  addTokens,
  deductTokens,
  getCostConfig,
}
