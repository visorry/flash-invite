import Router from '../lib/router'
import type { Request } from 'express'
import { getRequestContext } from '../helper/context'
import { UpdatePhoneSchema } from '../validation/user.validation'
import db from '@super-invite/db'
import { BadRequestError } from '../errors/http-exception'

const router = Router()

export const name = 'user'

// Update authenticated user's phone number
router.patch(
    '/phone',
    async (req: Request) => {
        const ctx = getRequestContext(req)

        if (!ctx.user) {
            throw new BadRequestError('User not authenticated')
        }

        const { phoneNumber } = req.validatedBody

        // Only allow users to update their own phone number
        const updatedUser = await db.user.update({
            where: { id: ctx.user.id },
            data: { phoneNumber },
        })

        return {
            success: true,
            phoneNumber: updatedUser.phoneNumber,
        }
    },
    {
        validation: UpdatePhoneSchema,
    }
)

export { router }
