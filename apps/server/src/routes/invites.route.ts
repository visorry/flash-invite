import Router from '../lib/router'
import type { Request } from 'express'
import inviteService from '../services/invite.service'
import { getRequestContext } from '../helper/context'
import { DBEntity } from '../constant/db'
import {
  CreateInviteSchema,
  InviteParamsSchema,
  InviteQuerySchema,
} from '../validation/invite.validation'

const router = Router()

export const name = 'invites'

router.get(
  '/',
  async (req: Request) => {
    const ctx = getRequestContext(req, { entity: DBEntity.Invite })
    return inviteService.list(ctx)
  },
  {
    validation: InviteQuerySchema,
  }
)

router.get(
  '/:id',
  async (req: Request) => {
    const ctx = getRequestContext(req, { entity: DBEntity.Invite })
    const { id } = req.validatedParams
    return inviteService.getById(ctx, id)
  },
  {
    validation: InviteParamsSchema,
  }
)

router.post(
  '/',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const data = req.validatedBody
    return inviteService.create(ctx, data)
  },
  {
    validation: CreateInviteSchema,
  }
)

router.delete(
  '/:id',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { id } = req.validatedParams
    await inviteService.revoke(ctx, id)
    return { message: 'Invite revoked successfully' }
  },
  {
    validation: InviteParamsSchema,
  }
)

router.get(
  '/:id/stats',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { id } = req.validatedParams
    return inviteService.getStats(ctx, id)
  },
  {
    validation: InviteParamsSchema,
  }
)

export { router }
