"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api-client"

interface User {
  id: string
  email: string
  name: string
  [key: string]: any
}

interface UseSessionReturn {
  user: User | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useSession(): UseSessionReturn {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUser = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await apiClient.get<User>('/api/v1/auth/me')
      setUser(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  return {
    user,
    isLoading,
    error,
    refetch: fetchUser,
  }
}
