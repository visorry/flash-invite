import Router from '../lib/router'
import type { Request } from 'express'
import memberService from '../services/member.service'
import { getRequestContext } from '../helper/context'
import { DBEntity } from '../constant/db'
import { z } from 'zod'

const router = Router()

export const name = 'members'

const MemberQuerySchema = z.object({
  telegramEntityId: z.string().uuid().optional(),
  isActive: z.string().optional(),
  page: z.string().optional(),
  size: z.string().optional(),
  sort: z.enum(['joined', 'expires']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  include: z.union([z.string(), z.array(z.string())]).optional(),
})

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
    const id = req.params.id || ''
    return memberService.getById(ctx, id)
  }
)

export { router }
