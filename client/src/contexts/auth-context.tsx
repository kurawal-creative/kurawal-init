import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { User } from '@/lib/api-client'
import { apiClient } from '@/lib/api-client'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (
    username: string,
    email: string,
    password: string,
    name?: string,
  ) => Promise<void>
  signOut: () => void
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check if user is authenticated on mount
  useEffect(() => {
    const token = apiClient.getToken()
    if (token) {
      loadProfile()
    } else {
      setIsLoading(false)
    }
  }, [])

  const loadProfile = async () => {
    try {
      const profile = await apiClient.getProfile()
      setUser(profile)
    } catch (error) {
      console.error('Failed to load profile:', error)
      apiClient.clearAuth()
    } finally {
      setIsLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    const response = await apiClient.signIn({ email, password })
    setUser(response.user)
  }

  const signUp = async (
    username: string,
    email: string,
    password: string,
    name?: string,
  ) => {
    const response = await apiClient.signUp({ username, email, password, name })
    setUser(response.user)
  }

  const signOut = () => {
    apiClient.clearAuth()
    setUser(null)
    // Redirect to login page after sign out
    window.location.href = '/login'
  }

  const refreshProfile = async () => {
    await loadProfile()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
