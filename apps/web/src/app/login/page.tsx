"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bot, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { signIn } from '@/lib/auth-client'

export default function LoginPage() {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isTelegramLoading, setIsTelegramLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)

    try {
      await signIn.social({
        provider: "google",
        callbackURL: `${window.location.origin}/dashboard`,
      })
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in with Google')
      setIsGoogleLoading(false)
    }
  }

  const handleTelegramSignIn = async () => {
    setIsTelegramLoading(true)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const response = await fetch(`${apiUrl}/api/v1/auth/telegram-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      const data = await response.json()

      if (data.success && data.data?.telegramLoginUrl) {
        toast.info('Opening Telegram...')
        window.open(data.data.telegramLoginUrl, '_blank')

        // Start polling for login completion
        const loginToken = data.data.loginToken
        pollForLogin(loginToken)
      } else {
        toast.error(data.error?.message || 'Failed to initiate Telegram login')
        setIsTelegramLoading(false)
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to start Telegram login')
      setIsTelegramLoading(false)
    }
  }

  const pollForLogin = async (token: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    let attempts = 0
    const maxAttempts = 60 // 5 minutes (5 second intervals)

    const checkStatus = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/v1/auth/telegram-status/${token}`, {
          credentials: 'include',
        })
        const data = await response.json()

        if (data.success && data.data?.completed) {
          // Redirect to API server to complete login and set cookie
          window.location.href = `${apiUrl}/api/v1/auth/telegram-complete?token=${token}`
        } else {
          attempts++
          if (attempts < maxAttempts) {
            setTimeout(checkStatus, 5000) // Check every 5 seconds
          } else {
            toast.error('Login timed out. Please try again.')
            setIsTelegramLoading(false)
          }
        }
      } catch (error) {
        console.error('Poll error:', error)
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 5000)
        } else {
          setIsTelegramLoading(false)
        }
      }
    }

    checkStatus()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to Super Invite</CardTitle>
          <CardDescription>
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleGoogleSignIn}
            className="w-full"
            disabled={isGoogleLoading || isTelegramLoading}
            variant="outline"
          >
            {isGoogleLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or
              </span>
            </div>
          </div>

          <Button
            onClick={handleTelegramSignIn}
            className="w-full"
            disabled={isGoogleLoading || isTelegramLoading}
            variant="outline"
          >
            {isTelegramLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Waiting for Telegram...
              </>
            ) : (
              <>
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                Continue with Telegram
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
