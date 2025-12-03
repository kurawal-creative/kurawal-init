import { Link } from 'react-router-dom'
import { Activity, Brain, ImageIcon, Users } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

function AdminDashboard() {
  const stats = [
    {
      title: 'AI Queries',
      value: '0',
      icon: Brain,
      color: 'from-blue-500 to-blue-600',
      description: 'Total AI requests',
    },
    {
      title: 'Images Generated',
      value: '0',
      icon: ImageIcon,
      color: 'from-purple-500 to-purple-600',
      description: 'Gemini creations',
    },
    {
      title: 'Active Users',
      value: '1',
      icon: Users,
      color: 'from-green-500 to-green-600',
      description: 'Online now',
    },
    {
      title: 'System Status',
      value: '99.9%',
      icon: Activity,
      color: 'from-orange-500 to-orange-600',
      description: 'Uptime',
    },
  ]

  const quickActions = [
    {
      title: 'Kimi AI Assistant',
      description: 'Chat with Kimi AI for intelligent responses',
      href: '/admin/kimi',
      icon: Brain,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Gemini Image Generation',
      description: 'Create and edit images with AI',
      href: '/admin/gemini',
      icon: ImageIcon,
      color: 'from-purple-500 to-pink-500',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Welcome to your AI-powered admin panel
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color}`}>
                <stat.icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {quickActions.map((action) => (
            <Link key={action.title} to={action.href}>
              <Card className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-xl bg-gradient-to-br ${action.color}`}
                    >
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle>{action.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {action.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Your latest AI interactions and system events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No recent activity</p>
            <p className="text-sm">
              Start using AI features to see activity here
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminDashboard
