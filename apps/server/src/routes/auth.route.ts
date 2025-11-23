import Router from '../lib/router'
import type { Request, Response } from 'express'
import { randomBytes } from 'crypto'
import db from '@super-invite/db'
import { auth } from '@super-invite/auth'

const router = Router()

export const name = 'auth'

// Initiate Telegram login
router.post(
  '/telegram-login',
  async (_req: Request, res: Response) => {
    try {
      // Generate a unique token for telegram login
      const loginToken = randomBytes(8).toString('hex')

      // Store the token in database with expiry (5 minutes)
      await db.telegramLoginToken.create({
        data: {
          token: loginToken,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        },
      })

      // Remove @ if present in bot username
      const botUsername = (process.env.TELEGRAM_BOT_USERNAME || 'userinfobot').replace('@', '')
      const telegramLoginUrl = `https://t.me/${botUsername}?start=login_${loginToken}`

      res.json({
        success: true,
        data: {
          telegramLoginUrl,
          loginToken,
        },
        error: null,
      })
    } catch (error) {
      console.error('Telegram login error:', error)
      res.status(500).json({
        success: false,
        data: null,
        error: {
          message: 'Failed to initiate Telegram login',
        },
      })
    }
  }
)

// Complete Telegram login - this endpoint handles the callback and redirects to set cookie
router.get(
  '/telegram-complete',
  async (req: Request, res: Response) => {
    try {
      const { token } = req.query

      if (!token || typeof token !== 'string') {
        return res.redirect(`${process.env.WEB_APP_URL || 'http://localhost:3001'}/login?error=Token is required`)
      }

      // Find the completed login token
      const loginRecord = await db.telegramLoginToken.findFirst({
        where: {
          token,
          telegramUserId: { not: null },
          expiresAt: { gt: new Date() },
        },
      })

      if (!loginRecord || !loginRecord.telegramUserId) {
        return res.redirect(`${process.env.WEB_APP_URL || 'http://localhost:3001'}/login?error=Invalid or expired token`)
      }

      // Find or create user
      let user = await db.user.findFirst({
        where: { telegramId: loginRecord.telegramUserId },
      })

      const now = new Date()

      if (!user) {
        // Create new user with a unique ID
        const userId = randomBytes(16).toString('hex')
        user = await db.user.create({
          data: {
            id: userId,
            name: loginRecord.fullName || 'Telegram User',
            email: `tg_${loginRecord.telegramUserId}@telegram.local`,
            telegramId: loginRecord.telegramUserId,
            telegramUsername: loginRecord.username,
            emailVerified: true,
            createdAt: now,
            updatedAt: now,
          },
        })
      } else {
        // Update user info
        user = await db.user.update({
          where: { id: user.id },
          data: {
            name: loginRecord.fullName || user.name,
            telegramUsername: loginRecord.username || user.telegramUsername,
            updatedAt: now,
          },
        })
      }

      // Delete the used login token
      await db.telegramLoginToken.delete({
        where: { id: loginRecord.id },
      })

      // Convert Express headers to Web API Headers for BetterAuth
      const webHeaders = new Headers()
      for (const [key, value] of Object.entries(req.headers)) {
        if (value) {
          webHeaders.set(key, Array.isArray(value) ? value[0] : value)
        }
      }

      // Get the auth context
      const authContext = await auth.$context

      // Use the internal adapter to create a proper session
      const newSession = await authContext.internalAdapter.createSession(
        user.id,
        {
          headers: webHeaders,
          request: undefined,
          context: {
            ...authContext,
            request: undefined,
          },
        } as any,
        false,
        undefined,
        undefined
      )

      if (!newSession) {
        throw new Error('Failed to create session')
      }

      // Sign the token using HMAC like BetterAuth does
      const crypto = await import('crypto')
      const secret = process.env.BETTER_AUTH_SECRET || 'secret'
      const signature = crypto.createHmac('sha256', secret).update(newSession.token).digest('base64')
      const signedToken = `${newSession.token}.${signature}`

      // Set cookie using BetterAuth's cookie settings
      const isProduction = process.env.NODE_ENV === 'production'
      // For cross-subdomain cookies, keep the leading dot for proper subdomain sharing
      const cookieDomain = process.env.COOKIE_DOMAIN || undefined
      // Use __Secure- prefix in production (required for secure cookies)
      const cookieName = isProduction ? '__Secure-better-auth.session_token' : 'better-auth.session_token'
      res.cookie(cookieName, signedToken, {
        httpOnly: isProduction,
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        domain: isProduction ? cookieDomain : undefined,
      })

      // Redirect to web app
      res.redirect(process.env.WEB_APP_URL || 'http://localhost:3001')
    } catch (error) {
      console.error('Telegram complete error:', error)
      res.redirect(`${process.env.WEB_APP_URL || 'http://localhost:3001'}/login?error=Login failed`)
    }
  }
)

// Check Telegram login status
router.get(
  '/telegram-status/:token',
  async (req: Request, res: Response) => {
    try {
      const { token } = req.params

      const loginRecord = await db.telegramLoginToken.findFirst({
        where: {
          token,
          expiresAt: { gt: new Date() },
        },
      })

      if (!loginRecord) {
        return res.status(404).json({
          success: false,
          data: null,
          error: { message: 'Token not found or expired' },
        })
      }

      res.json({
        success: true,
        data: {
          completed: !!loginRecord.telegramUserId,
        },
        error: null,
      })
    } catch (error) {
      console.error('Telegram status error:', error)
      res.status(500).json({
        success: false,
        data: null,
        error: {
          message: 'Failed to check status',
        },
      })
    }
  }
)

export { router }
