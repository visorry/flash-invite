import { z } from 'zod'

export const CreateInviteSchema = z.object({
  botId: z.string().uuid('Invalid bot ID'),
  expiresInHours: z.number().min(1).max(168).optional(), // Max 7 days
  maxUses: z.number().min(1).optional(),
  autoKickAfterHours: z.number().min(1).optional(),
  description: z.string().optional(),
})

export const InviteParamsSchema = z.object({
  id: z.string().uuid('Invalid invite ID'),
})

export const InviteQuerySchema = z.object({
  search: z.string().optional(),
  botId: z.string().uuid().optional(),
  isActive: z.string().optional(),
  isExpired: z.string().optional(),
  page: z.string().optional(),
  size: z.string().optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
  include: z.union([z.string(), z.array(z.string())]).optional(),
})
