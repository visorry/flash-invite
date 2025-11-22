import Router from '../lib/router'
import type { Request } from 'express'
import adminService from '../services/admin.service'
import tokenService from '../services/token.service'
import botMemberService from '../services/bot-member.service'
import { getRequestContext } from '../helper/context'
import { z } from 'zod'
import { DurationUnit } from '@super-invite/db'

const router = Router()

export const name = 'admin'

const UserParamsSchema = z.object({
  id: z.string().min(1, 'Invalid user ID'),
})

const UpdateUserRoleSchema = z.object({
  isAdmin: z.boolean(),
})

// Get all users
router.get(
  '/users',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    return adminService.listUsers(ctx)
  }
)

// Get user by ID
router.get(
  '/users/:id',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { id } = req.validatedParams
    return adminService.getUserById(ctx, id)
  },
  {
    validation: UserParamsSchema,
  }
)

// Update user role
router.put(
  '/users/:id/role',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { id } = req.validatedParams
    const data = req.validatedBody
    return adminService.updateUserRole(ctx, id, data)
  },
  {
    validation: [UserParamsSchema, UpdateUserRoleSchema],
  }
)

// Get all subscriptions
router.get(
  '/subscriptions',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    return adminService.listSubscriptions(ctx)
  }
)

// Get all plans
router.get(
  '/plans',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    return adminService.listPlans(ctx)
  }
)

// Get platform stats
router.get(
  '/stats',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    return adminService.getPlatformStats(ctx)
  }
)

// Get all telegram entities (all users)
router.get(
  '/telegram-entities',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    return adminService.listAllTelegramEntities(ctx)
  }
)

// Get all invite links (all users)
router.get(
  '/invite-links',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    return adminService.listAllInviteLinks(ctx)
  }
)

// Add tokens to user
const AddTokensSchema = z.object({
  amount: z.number().int().positive(),
  description: z.string().optional(),
})

router.post(
  '/users/:id/tokens',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { id } = req.validatedParams
    const data = req.validatedBody
    return adminService.addTokensToUser(ctx, id, data.amount, data.description)
  },
  {
    validation: [UserParamsSchema, AddTokensSchema],
  }
)

// Add subscription to user
const AddSubscriptionSchema = z.object({
  planId: z.string().uuid(),
})

router.post(
  '/users/:id/subscription',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { id } = req.validatedParams
    const data = req.validatedBody
    return adminService.addSubscriptionToUser(ctx, id, data.planId)
  },
  {
    validation: [UserParamsSchema, AddSubscriptionSchema],
  }
)

// Create plan
const CreatePlanSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  type: z.number().int(),
  interval: z.number().int(),
  price: z.number(),
  tokensIncluded: z.number().int().positive(),
  maxGroups: z.number().int().positive().nullable().optional(),
  maxInvitesPerDay: z.number().int().positive().nullable().optional(),
  isActive: z.boolean().optional(),
})

router.post(
  '/plans',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const data = req.validatedBody
    return adminService.createPlan(ctx, data)
  },
  {
    validation: CreatePlanSchema,
  }
)

// Update plan
const PlanParamsSchema = z.object({
  id: z.string().uuid(),
})

router.put(
  '/plans/:id',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { id } = req.validatedParams
    const data = req.validatedBody
    return adminService.updatePlan(ctx, id, data)
  },
  {
    validation: [PlanParamsSchema, CreatePlanSchema],
  }
)

// Delete plan
router.delete(
  '/plans/:id',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const { id } = req.validatedParams
    return adminService.deletePlan(ctx, id)
  },
  {
    validation: PlanParamsSchema,
  }
)

// Get config
router.get(
  '/config',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    return adminService.getConfig(ctx)
  }
)

// Update config
const UpdateConfigSchema = z.object({
  botToken: z.string().optional(),
  botUsername: z.string().optional(),
})

router.put(
  '/config',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    const data = req.validatedBody
    return adminService.updateConfig(ctx, data)
  },
  {
    validation: UpdateConfigSchema,
  }
)

// Token pricing configuration
router.get(
  '/token-pricing',
  async (req: Request) => {
    return tokenService.getCostConfig()
  }
)

const UpsertTokenPricingSchema = z.object({
  durationUnit: z.number().int().min(0).max(4), // DurationUnit enum
  costPerUnit: z.number().int().min(0),
  description: z.string().optional(),
})

router.post(
  '/token-pricing',
  async (req: Request) => {
    const data = req.validatedBody
    return tokenService.upsertCostConfig(
      data.durationUnit as DurationUnit,
      data.costPerUnit,
      data.description
    )
  },
  {
    validation: UpsertTokenPricingSchema,
  }
)

const DeleteTokenPricingSchema = z.object({
  durationUnit: z.coerce.number().int().min(0).max(4),
})

router.delete(
  '/token-pricing/:durationUnit',
  async (req: Request) => {
    const { durationUnit } = req.validatedParams
    return tokenService.deleteCostConfig(durationUnit as DurationUnit)
  },
  {
    validation: DeleteTokenPricingSchema,
  }
)

// Bot members
router.get(
  '/bot-members',
  async (req: Request) => {
    const ctx = getRequestContext(req)
    return botMemberService.list(ctx)
  }
)

router.get(
  '/bot-members/stats',
  async (req: Request) => {
    return botMemberService.getStats()
  }
)

const BotMemberParamsSchema = z.object({
  id: z.string().uuid(),
})

router.get(
  '/bot-members/:id',
  async (req: Request) => {
    const { id } = req.validatedParams
    return botMemberService.getById(id)
  },
  {
    validation: BotMemberParamsSchema,
  }
)

export { router }
