"use client"

import { useSession as useBetterSession, signOut } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'

export function useSession() {
  const { data: session, isPending, error } = useBetterSession()
  const router = useRouter()

  const logout = async () => {
    try {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            // Force redirect to home page after successful logout
            window.location.href = '/'
          }
        }
      })
    } catch (error) {
      // Even if there's an error, redirect to home
      window.location.href = '/'
    }
  }

  return {
    user: session?.user || null,
    isLoading: isPending,
    error: error?.message || null,
    refetch: () => Promise.resolve(),
    logout,
  }
}
