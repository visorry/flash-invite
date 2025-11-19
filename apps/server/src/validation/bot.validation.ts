import { z } from 'zod'

export const CreateBotSchema = z.object({
  name: z.string().min(2, 'Bot name must be at least 2 characters'),
  botToken: z.string().min(10, 'Invalid bot token'),
  channelId: z.string().min(1, 'Channel ID is required'),
  channelName: z.string().optional(),
  description: z.string().optional(),
})

export const UpdateBotSchema = z.object({
  name: z.string().min(2).optional(),
  channelName: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
})

export const BotParamsSchema = z.object({
  id: z.string().uuid('Invalid bot ID'),
})

export const BotQuerySchema = z.object({
  search: z.string().optional(),
  isActive: z.string().optional(),
  page: z.string().optional(),
  size: z.string().optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
  include: z.union([z.string(), z.array(z.string())]).optional(),
})
