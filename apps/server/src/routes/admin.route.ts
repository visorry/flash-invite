import Router from '../lib/router'
import type { Request } from 'express'
import adminService from '../services/admin.service'
import { getRequestContext } from '../helper/context'
import { z } from 'zod'

const router = Router()

export const name = 'admin'

const UserParamsSchema = z.object({
  id: z.string().uuid('Invalid user ID'),
})

const UpdateUserRoleSchema = z.object({
  isAdmin: z.boolean().optional(),
  role: z.string().optional(),
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

export { router }
