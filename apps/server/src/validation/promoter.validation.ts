import { z } from 'zod'

export const PromoterQuerySchema = z.object({
  botId: z.string().uuid().optional(),
})

export const PromoterParamsSchema = z.object({
  id: z.string().uuid(),
})

export const PromoterPostParamsSchema = z.object({
  id: z.string().uuid(),
})

export const CreatePromoterConfigSchema = z.object({
  botId: z.string().uuid(),
  vaultEntityId: z.string().uuid(),
  marketingEntityId: z.string().uuid(),
  name: z.string().min(1).max(100),
  ctaTemplate: z.string().max(1000).optional(),
  autoPostToMarketing: z.boolean().optional(),
  includeCaptionInCta: z.boolean().optional(),
  tokenExpirationEnabled: z.boolean().optional(),
  tokenExpirationDays: z.number().min(1).max(365).optional(),
  multipleBotsEnabled: z.boolean().optional(),
  additionalBotIds: z.array(z.string().uuid()).optional(),
  deleteMarketingAfterEnabled: z.boolean().optional(),
  deleteMarketingInterval: z.number().min(1).optional(),
  deleteMarketingIntervalUnit: z.number().min(0).max(5).optional(),
  deleteDeliveredAfterEnabled: z.boolean().optional(),
  deleteDeliveredInterval: z.number().min(1).optional(),
  deleteDeliveredIntervalUnit: z.number().min(0).max(5).optional(),
  hideSenderName: z.boolean().optional(),
  copyMode: z.boolean().optional(),
  removeLinks: z.boolean().optional(),
  addWatermark: z.string().max(500).optional(),
  invalidTokenMessage: z.string().max(500).optional(),
  expiredTokenMessage: z.string().max(500).optional(),
})

export const UpdatePromoterConfigSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
  ctaTemplate: z.string().max(1000).optional(),
  autoPostToMarketing: z.boolean().optional(),
  includeCaptionInCta: z.boolean().optional(),
  tokenExpirationEnabled: z.boolean().optional(),
  tokenExpirationDays: z.number().min(1).max(365).nullable().optional(),
  multipleBotsEnabled: z.boolean().optional(),
  additionalBotIds: z.array(z.string().uuid()).nullable().optional(),
  deleteMarketingAfterEnabled: z.boolean().optional(),
  deleteMarketingInterval: z.number().min(1).nullable().optional(),
  deleteMarketingIntervalUnit: z.number().min(0).max(5).nullable().optional(),
  deleteDeliveredAfterEnabled: z.boolean().optional(),
  deleteDeliveredInterval: z.number().min(1).nullable().optional(),
  deleteDeliveredIntervalUnit: z.number().min(0).max(5).nullable().optional(),
  hideSenderName: z.boolean().optional(),
  copyMode: z.boolean().optional(),
  removeLinks: z.boolean().optional(),
  addWatermark: z.string().max(500).nullable().optional(),
  invalidTokenMessage: z.string().max(500).optional(),
  expiredTokenMessage: z.string().max(500).optional(),
})
