import axios from 'axios'
import type { AxiosError, AxiosInstance } from 'axios'

// Types matching backend
export type ApiResponse<T = any> = {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export type User = {
  id: number
  username: string
  email: string
  name?: string
  avatar?: string
}

export type AuthResponse = {
  user: User
  token: string
}

export type SignInRequest = {
  email: string
  password: string
}

export type SignUpRequest = {
  username: string
  email: string
  password: string
  name?: string
}

export type KimiQueryRequest = {
  query: string
}

export type KimiResponse = {
  html: string
}

export type KimiStreamEvent = {
  html: string
  isComplete: boolean
  progress: number
}

class ApiClient {
  private client: AxiosInstance
  private token: string | null = null

  constructor() {
    this.client = axios.create({
      baseURL: '/api',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Load token from localStorage
    this.token = localStorage.getItem('auth_token')
    if (this.token) {
      this.setAuthHeader(this.token)
    }

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiResponse>) => {
        if (error.response?.status === 401) {
          // Unauthorized - clear token and redirect to login
          this.clearAuth()
          window.location.href = '/login'
        }
        return Promise.reject(error)
      },
    )
  }

  private setAuthHeader(token: string) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`
  }

  private clearAuthHeader() {
    delete this.client.defaults.headers.common['Authorization']
  }

  setToken(token: string) {
    this.token = token
    localStorage.setItem('auth_token', token)
    this.setAuthHeader(token)
  }

  clearAuth() {
    this.token = null
    localStorage.removeItem('auth_token')
    this.clearAuthHeader()
  }

  getToken() {
    return this.token
  }

  // Auth endpoints
  async signIn(data: SignInRequest): Promise<AuthResponse> {
    const response = await this.client.post<ApiResponse<AuthResponse>>(
      '/auth/signin',
      data,
    )
    if (response.data.success && response.data.data) {
      this.setToken(response.data.data.token)
      return response.data.data
    }
    throw new Error(response.data.error || 'Sign in failed')
  }

  async signUp(data: SignUpRequest): Promise<AuthResponse> {
    const response = await this.client.post<ApiResponse<AuthResponse>>(
      '/auth/signup',
      data,
    )
    if (response.data.success && response.data.data) {
      this.setToken(response.data.data.token)
      return response.data.data
    }
    throw new Error(response.data.error || 'Sign up failed')
  }

  async getProfile(): Promise<User> {
    const response = await this.client.get<ApiResponse<User>>('/auth/profile')
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    throw new Error(response.data.error || 'Failed to get profile')
  }

  // AI endpoints
  async queryKimi(
    data: KimiQueryRequest,
    apiKey: string,
  ): Promise<KimiResponse> {
    const response = await this.client.post<ApiResponse<KimiResponse>>(
      '/ai/kimi',
      data,
      {
        headers: {
          'X-API-Key': apiKey,
        },
      },
    )
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    throw new Error(response.data.error || 'Kimi query failed')
  }

  async generateGeminiImage(
    image: File | null,
    prompt: string,
    apiKey: string,
  ): Promise<Blob> {
    const formData = new FormData()
    if (image) {
      formData.append('image', image)
    }
    formData.append('prompt', prompt)

    const response = await this.client.post('/ai/gemini', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'X-API-Key': apiKey,
      },
      responseType: 'blob',
    })

    return response.data
  }

  // SSE Stream for Kimi
  kimiStream(
    query: string,
    apiKey: string,
    callbacks: {
      onChunk?: (data: { html: string; progress: number }) => void
      onError?: (error: string) => void
      onDone?: () => void
      onHeartbeat?: () => void
    },
  ): EventSource {
    const url = `/api/ai/kimi/stream?q=${encodeURIComponent(query)}&apiKey=${encodeURIComponent(apiKey)}`
    const eventSource = new EventSource(url)

    eventSource.addEventListener('message', (e) => {
      try {
        const data = JSON.parse(e.data)
        callbacks.onChunk?.(data)
      } catch (error) {
        console.error('Failed to parse SSE message:', error)
      }
    })

    eventSource.addEventListener('error', (e: any) => {
      try {
        const data = JSON.parse(e.data)
        callbacks.onError?.(data.error)
      } catch (error) {
        callbacks.onError?.('Connection error')
      }
    })

    eventSource.addEventListener('done', () => {
      callbacks.onDone?.()
      eventSource.close()
    })

    eventSource.addEventListener('heartbeat', () => {
      callbacks.onHeartbeat?.()
    })

    eventSource.onerror = (error) => {
      console.error('EventSource error:', error)
      callbacks.onError?.('Connection lost')
      eventSource.close()
    }

    return eventSource
  }

  // Health check
  async healthCheck() {
    const response = await this.client.get('/health')
    return response.data
  }
}

// Export singleton instance
export const apiClient = new ApiClient()
