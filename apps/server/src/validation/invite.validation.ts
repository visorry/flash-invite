import { z } from 'zod'

export const CreateInviteSchema = z.object({
  telegramEntityId: z.string().uuid('Invalid telegram entity ID'),
  durationSeconds: z.number().min(1),
  memberLimit: z.number().min(1).optional().nullable().default(1), // Defaults to 1 (one-time use)
  name: z.string().optional().nullable(),
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
