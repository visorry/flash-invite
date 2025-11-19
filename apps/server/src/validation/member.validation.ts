import { z } from 'zod'

export const MemberParamsSchema = z.object({
  id: z.string().uuid('Invalid member ID'),
})

export const MemberQuerySchema = z.object({
  search: z.string().optional(),
  inviteId: z.string().uuid().optional(),
  botId: z.string().uuid().optional(),
  isActive: z.string().optional(),
  isKicked: z.string().optional(),
  page: z.string().optional(),
  size: z.string().optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
  include: z.union([z.string(), z.array(z.string())]).optional(),
})

export const KickMemberSchema = z.object({
  reason: z.string().optional(),
})
