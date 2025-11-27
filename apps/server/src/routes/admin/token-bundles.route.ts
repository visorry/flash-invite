import Router from '../../lib/router'
import type { Request } from 'express'
import tokenBundleAdminService from '../../services/admin/token-bundle-admin.service'
import { z } from 'zod'

const router = Router()

export const name = 'token-bundles'

// Validation schemas
const CreateBundleSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    tokens: z.number().int().positive(),
    price: z.number().positive(),
    currency: z.string().default('INR'),
    isActive: z.boolean().default(true),
})

const UpdateBundleSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().optional(),
    tokens: z.number().int().positive().optional(),
    price: z.number().positive().optional(),
    currency: z.string().optional(),
    isActive: z.boolean().optional(),
})

// Get all bundles (including inactive)
router.get(
    '/',
    async (_req: Request) => {
        return tokenBundleAdminService.getAllBundles()
    }
)

// Create new bundle
router.post(
    '/',
    async (req: Request) => {
        const data = req.validatedBody
        return tokenBundleAdminService.createBundle(data)
    },
    {
        validation: CreateBundleSchema,
    }
)

// Update bundle
router.put(
    '/:id',
    async (req: Request) => {
        const { id } = req.params
        const data = req.validatedBody
        return tokenBundleAdminService.updateBundle(id, data)
    },
    {
        validation: UpdateBundleSchema,
    }
)

// Delete bundle (soft delete)
router.delete(
    '/:id',
    async (req: Request) => {
        const { id } = req.params
        return tokenBundleAdminService.deleteBundle(id)
    }
)

// Toggle active status
router.patch(
    '/:id/toggle',
    async (req: Request) => {
        const { id } = req.params
        return tokenBundleAdminService.toggleActive(id)
    }
)

export { router }
