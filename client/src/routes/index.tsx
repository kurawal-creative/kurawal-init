import { Navigate, createFileRoute } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

export const Route = createFileRoute('/')({
  component: IndexPage,
})

function IndexPage() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  // Redirect based on auth status
  if (isAuthenticated) {
    return <Navigate to="/admin" />
  }

  return <Navigate to="/login" />
}
