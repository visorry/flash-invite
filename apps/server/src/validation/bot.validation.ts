import { z } from 'zod'

export const CreateBotSchema = z.object({
  token: z.string().min(40, 'Invalid bot token format'),
})

export const BotParamsSchema = z.object({
  id: z.string().uuid('Invalid bot ID'),
})

export const BotQuerySchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  page: z.string().optional(),
  size: z.string().optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
})

export const LinkEntitySchema = z.object({
  telegramEntityId: z.string().uuid('Invalid entity ID'),
  isPrimary: z.boolean().optional().default(false),
})

export const EntityParamsSchema = z.object({
  id: z.string().uuid('Invalid bot ID'),
  entityId: z.string().uuid('Invalid entity ID'),
})
