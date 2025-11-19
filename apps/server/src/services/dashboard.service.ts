import type { RequestContext } from '../types/app'

const getStats = async (_ctx: RequestContext) => {
  // TODO: Implement with Prisma
  return {
    totalBots: 0,
    totalInvites: 0,
    activeInvites: 0,
    totalMembers: 0,
  }
}

const getRecentActivity = async (_ctx: RequestContext) => {
  // TODO: Implement with Prisma
  return {
    items: [],
    total: 0,
  }
}

export default {
  getStats,
  getRecentActivity,
}
