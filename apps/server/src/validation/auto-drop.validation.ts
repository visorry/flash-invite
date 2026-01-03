import { z } from 'zod'

export const AutoDropQuerySchema = z.object({
  botId: z.string().uuid().optional(),
})

export const AutoDropParamsSchema = z.object({
  id: z.string().uuid(),
})

export const CreateAutoDropSchema = z.object({
  botId: z.string().uuid(),
  sourceEntityId: z.string().uuid().optional(), // Now optional - can create message-only rules
  name: z.string().min(1).max(100),
  command: z.string().min(2).max(32).regex(/^\/[a-zA-Z0-9_]+$/, 'Command must start with / and contain only letters, numbers, and underscores'),

  // Custom messages (optional)
  startMessage: z.string().max(4000).optional(),
  endMessage: z.string().max(4000).optional(),

  // Rate limiting
  rateLimitEnabled: z.boolean().optional(),
  rateLimitCount: z.number().min(1).max(100).optional(),
  rateLimitWindow: z.number().min(1).max(86400).optional(),
  rateLimitWindowUnit: z.number().min(0).max(3).optional(), // 0=seconds, 1=minutes, 2=hours, 3=days
  rateLimitMessage: z.string().max(1000).optional(),

  // Drop configuration
  postsPerDrop: z.number().min(1).max(10).optional(),
  randomOrder: z.boolean().optional(),

  // Message range
  startFromMessageId: z.number().optional(),
  endAtMessageId: z.number().optional(),

  // Auto-delete configuration
  deleteAfterEnabled: z.boolean().optional(),
  deleteInterval: z.number().min(1).optional(),
  deleteIntervalUnit: z.number().min(0).max(5).optional(), // 0=seconds, 1=minutes, 2=hours, 3=days, 4=months, 5=never

  // Content filters
  forwardMedia: z.boolean().optional(),
  forwardText: z.boolean().optional(),
  forwardDocuments: z.boolean().optional(),
  forwardStickers: z.boolean().optional(),
  forwardPolls: z.boolean().optional(),

  // Modifications
  removeLinks: z.boolean().optional(),
  addWatermark: z.string().max(500).optional(),
  deleteWatermark: z.boolean().optional(),
  hideSenderName: z.boolean().optional(),
  copyMode: z.boolean().optional(),

  // Keywords
  includeKeywords: z.array(z.string()).optional(),
  excludeKeywords: z.array(z.string()).optional(),
})

export const UpdateAutoDropSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
  command: z.string().min(2).max(32).regex(/^\/[a-zA-Z0-9_]+$/, 'Command must start with / and contain only letters, numbers, and underscores').optional(),

  // Custom messages (optional)
  startMessage: z.string().max(4000).nullable().optional(),
  endMessage: z.string().max(4000).nullable().optional(),

  // Rate limiting
  rateLimitEnabled: z.boolean().optional(),
  rateLimitCount: z.number().min(1).max(100).optional(),
  rateLimitWindow: z.number().min(1).max(86400).optional(),
  rateLimitWindowUnit: z.number().min(0).max(3).optional(), // 0=seconds, 1=minutes, 2=hours, 3=days
  rateLimitMessage: z.string().max(1000).nullable().optional(),

  // Drop configuration
  postsPerDrop: z.number().min(1).max(10).optional(),
  randomOrder: z.boolean().optional(),

  // Message range
  startFromMessageId: z.number().nullable().optional(),
  endAtMessageId: z.number().nullable().optional(),

  // Auto-delete configuration
  deleteAfterEnabled: z.boolean().optional(),
  deleteInterval: z.number().min(1).nullable().optional(),
  deleteIntervalUnit: z.number().min(0).max(5).nullable().optional(), // 0=seconds, 1=minutes, 2=hours, 3=days, 4=months, 5=never

  // Content filters
  forwardMedia: z.boolean().optional(),
  forwardText: z.boolean().optional(),
  forwardDocuments: z.boolean().optional(),
  forwardStickers: z.boolean().optional(),
  forwardPolls: z.boolean().optional(),

  // Modifications
  removeLinks: z.boolean().optional(),
  addWatermark: z.string().max(500).nullable().optional(),
  deleteWatermark: z.boolean().optional(),
  hideSenderName: z.boolean().optional(),
  copyMode: z.boolean().optional(),

  // Keywords
  includeKeywords: z.array(z.string()).optional(),
  excludeKeywords: z.array(z.string()).optional(),
})
