import { NotFoundError } from '../errors/http-exception'
import type { RequestContext } from '../types/app'

const list = async (ctx: RequestContext) => {
  // TODO: Implement with Prisma
  return {
    items: [],
    total: 0,
    page: ctx.pagination?.page || 1,
    size: ctx.pagination?.size || 20,
  }
}

const getById = async (_ctx: RequestContext, _id: string) => {
  // TODO: Implement with Prisma
  throw new NotFoundError('Member not found')
}

const kick = async (_ctx: RequestContext, _id: string, _reason?: string) => {
  // TODO: Implement with Prisma
  // Call Telegram API to kick member
  throw new NotFoundError('Member not found')
}

export default {
  list,
  getById,
  kick,
}
