import { z } from 'zod'

export const UpdateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
})

export const UpdatePhoneSchema = z.object({
  phoneNumber: z.string().min(10).max(15),
})

export const UserParamsSchema = z.object({
  id: z.string().uuid('Invalid user ID'),
})

export const UserQuerySchema = z.object({
  search: z.string().optional(),
  page: z.string().optional(),
  size: z.string().optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
  include: z.union([z.string(), z.array(z.string())]).optional(),
})
