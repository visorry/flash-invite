import db from '@super-invite/db'
import type { RequestContext } from '../../types/app'

type PrismaTransactionOption = Parameters<typeof db.$transaction>[1]
type PrismaTransactionClient = Parameters<Parameters<typeof db.$transaction>[0]>[0]

/**
 * Prisma transaction wrapper
 * Automatically wraps functions to run in transactions by adding tx as the last parameter
 */
export function prismaTransactionWrapper<T extends (...args: any[]) => any>(
  fn: T,
  options: PrismaTransactionOption = {
    timeout: 60000, // 1 minute
    maxWait: 30000,  // 30 seconds
  },
) {
  return (...args: [...(Parameters<T> extends [...infer U, any] ? U : never)]): ReturnType<T> => {
    return db.$transaction(async (tx) => {
      return fn(...args, tx)
    }, options) as ReturnType<T>
  }
}

/**
 * Execute function within a database transaction
 */
export async function withTransaction<T>(
  ctx: RequestContext,
  fn: (tx: PrismaTransactionClient, ctx: RequestContext) => Promise<T>
): Promise<T> {
  return await db.$transaction(async (tx) => {
    return await fn(tx, ctx)
  })
}

/**
 * Execute multiple functions within a single transaction
 */
export async function withTransactionBatch<T>(
  ctx: RequestContext,
  fns: Array<(tx: PrismaTransactionClient, ctx: RequestContext) => Promise<any>>
): Promise<T[]> {
  return await db.$transaction(async (tx) => {
    const results = []
    for (const fn of fns) {
      const result = await fn(tx, ctx)
      results.push(result)
    }
    return results
  })
}
