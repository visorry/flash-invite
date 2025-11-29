"use client"

import { useSession as useBetterSession, signOut } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function useRequireAuth() {
  const { data: session, isPending, error } = useBetterSession()
  const router = useRouter()

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isPending && !session && typeof window !== 'undefined') {
      const path = window.location.pathname
      if (!path.includes('/login')) {
        router.push('/login' as any)
      }
    }
  }, [session, isPending, router])

  const logout = async () => {
    await signOut()
    router.push('/login' as any)
  }

  return {
    user: session?.user || null,
    isLoading: isPending,
    error: error?.message || null,
    refetch: () => Promise.resolve(),
    logout,
  }
}
