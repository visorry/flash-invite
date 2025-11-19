import Router from '../lib/router'
import { z } from 'zod'
import type { Request } from 'express'

const router = Router()

export const name = 'auth'

const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
})

router.post(
  '/login',
  async (req: Request) => {
    const { email, password } = req.validatedBody
    
    // TODO: Implement Better Auth login
    // For now, return mock success
    return {
      success: true,
      message: 'Login successful',
      user: {
        id: '1',
        email,
        name: 'Test User',
      },
    }
  },
  {
    validation: LoginSchema,
  }
)

router.post(
  '/register',
  async (req: Request) => {
    const { email, name, password } = req.validatedBody
    
    // TODO: Implement Better Auth registration
    // For now, return mock success
    return {
      success: true,
      message: 'Registration successful',
      user: {
        id: '1',
        email,
        name,
      },
    }
  },
  {
    validation: RegisterSchema,
  }
)

router.get(
  '/me',
  async (req: Request) => {
    const user = req.user
    
    if (!user) {
      return null
    }
    
    return user
  }
)

export { router }
