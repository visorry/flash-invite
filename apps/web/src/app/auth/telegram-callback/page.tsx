"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bot, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function TelegramCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token')

      if (!token) {
        setStatus('error')
        setErrorMessage('Invalid callback - no token provided')
        return
      }

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
        const response = await fetch(`${apiUrl}/api/v1/auth/telegram-callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ token }),
        })

        const data = await response.json()

        if (data.success && data.data?.sessionToken) {
          setStatus('success')
          toast.success('Login successful!')

          // Redirect to the API server to set the cookie properly via redirect
          // The API will set the cookie and redirect back to the web app
          window.location.href = `${apiUrl}/api/v1/auth/set-session?token=${data.data.sessionToken}&redirect=${encodeURIComponent(window.location.origin)}`
        } else if (data.success) {
          // Fallback if no token in response
          setStatus('success')
          toast.success('Login successful!')
          setTimeout(() => {
            window.location.href = '/'
          }, 1000)
        } else {
          setStatus('error')
          setErrorMessage(data.error?.message || 'Login failed')
          toast.error(data.error?.message || 'Login failed')
        }
      } catch (error) {
        console.error('Telegram callback error:', error)
        setStatus('error')
        setErrorMessage('Failed to complete login. Please try again.')
        toast.error('Failed to complete login')
      }
    }

    handleCallback()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {status === 'loading' && 'Completing Login...'}
            {status === 'success' && 'Login Successful!'}
            {status === 'error' && 'Login Failed'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">
                Please wait while we complete your Telegram login...
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <p className="text-muted-foreground">
                Redirecting you to the dashboard...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-4">
              <XCircle className="h-8 w-8 text-red-500" />
              <p className="text-muted-foreground">{errorMessage}</p>
              <a
                href="/login"
                className="text-primary hover:underline font-medium"
              >
                Back to Login
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
