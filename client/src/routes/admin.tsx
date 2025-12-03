import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { AdminLayout } from '@/components/layouts/admin-layout'

export const Route = createFileRoute('/admin')({
  beforeLoad: ({ context, location }) => {
    // Check if user is authenticated
    const token = localStorage.getItem('token')
    if (!token) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      })
    }
  },
  component: AdminComponent,
})

function AdminComponent() {
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  )
}
