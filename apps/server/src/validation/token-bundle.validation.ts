import { z } from 'zod'

export const PurchaseBundleSchema = z.object({
    bundleId: z.string().uuid(),
})

export const CreateBundleSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    tokens: z.number().int().positive(),
    price: z.number().positive(),
    currency: z.string().default('INR'),
    isActive: z.boolean().default(true),
})

export const UpdateBundleSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().optional(),
    tokens: z.number().int().positive().optional(),
    price: z.number().positive().optional(),
    currency: z.string().optional(),
    isActive: z.boolean().optional(),
})

export const BundleParamsSchema = z.object({
    id: z.string().uuid(),
})
