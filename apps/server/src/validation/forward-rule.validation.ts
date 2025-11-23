import { z } from 'zod'

export const ForwardRuleQuerySchema = z.object({
  botId: z.string().uuid().optional(),
})

export const ForwardRuleParamsSchema = z.object({
  id: z.string().uuid(),
})

export const CreateForwardRuleSchema = z.object({
  botId: z.string().uuid(),
  sourceEntityId: z.string().uuid(),
  destinationEntityId: z.string().uuid(),
  name: z.string().min(1).max(100),
  scheduleMode: z.number().min(0).max(1).optional(),
  intervalMinutes: z.number().min(1).max(1440).optional(),
  startFromMessageId: z.number().optional(),
  endAtMessageId: z.number().optional(),
  shuffle: z.boolean().optional(),
  repeatWhenDone: z.boolean().optional(),
  forwardMedia: z.boolean().optional(),
  forwardText: z.boolean().optional(),
  forwardDocuments: z.boolean().optional(),
  forwardStickers: z.boolean().optional(),
  forwardPolls: z.boolean().optional(),
  removeLinks: z.boolean().optional(),
  addWatermark: z.string().max(500).optional(),
  includeKeywords: z.array(z.string()).optional(),
  excludeKeywords: z.array(z.string()).optional(),
})

export const UpdateForwardRuleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
  scheduleMode: z.number().min(0).max(1).optional(),
  intervalMinutes: z.number().min(1).max(1440).optional(),
  startFromMessageId: z.number().nullable().optional(),
  endAtMessageId: z.number().nullable().optional(),
  shuffle: z.boolean().optional(),
  repeatWhenDone: z.boolean().optional(),
  forwardMedia: z.boolean().optional(),
  forwardText: z.boolean().optional(),
  forwardDocuments: z.boolean().optional(),
  forwardStickers: z.boolean().optional(),
  forwardPolls: z.boolean().optional(),
  removeLinks: z.boolean().optional(),
  addWatermark: z.string().max(500).nullable().optional(),
  includeKeywords: z.array(z.string()).optional(),
  excludeKeywords: z.array(z.string()).optional(),
})
