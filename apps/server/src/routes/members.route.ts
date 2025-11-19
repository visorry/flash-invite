import Router from '../lib/router'
import type { Request } from 'express'
import memberService from '../services/member.service'
import { getRequestContext } from '../helper/context'
import { DBEntity } from '../constant/db'
import {
  MemberParamsSchema,
  MemberQuerySchema,
  KickMemberSchema,
} from '../validation/member.validation'

const router = Router()

export const name = 'members'

router.get(
  '/',
  async (req: Request) => {
    const ctx = getRequestContext(req, { entity: DBEntity.Member })
    return memberService.list(ctx)
  },
  {
    validation: MemberQuerySchema,
  }
)

router.get(
  '/:id',
  async (req: Request) => {
    const ctx = getRequestContext(req, { entity: DBEntity.Member })
    const { id } = req.validatedParams
    return memberService.getById(ctx, id)
  },
  {
    validation: MemberParamsSchema,
  }
)

router.post(
  '/:id/kick',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { id } = req.validatedParams
    const { reason } = req.validatedBody
    await memberService.kick(ctx, id, reason)
    return { message: 'Member kicked successfully' }
  },
  {
    validation: [MemberParamsSchema, KickMemberSchema],
  }
)

export { router }
