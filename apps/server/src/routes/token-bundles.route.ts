import Router from '../lib/router'
import type { Request } from 'express'
import tokenBundleService from '../services/token-bundle.service'
import { getRequestContext } from '../helper/context'
import { PurchaseBundleSchema } from '../validation/token-bundle.validation'

const router = Router()

export const name = 'token-bundles'

// Get all active token bundles (public)
router.get(
    '/',
    async (_req: Request) => {
        return tokenBundleService.getActiveBundles()
    }
)

// Purchase a token bundle (requires auth)

router.post(
    '/purchase',
    async (req: Request) => {
        const ctx = getRequestContext(req)
        const { bundleId } = req.validatedBody
        return tokenBundleService.purchaseBundle(ctx, bundleId)
    },
    {
        validation: PurchaseBundleSchema,
    }
)

export { router }
