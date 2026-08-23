'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Activity, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalRevenue: number
  totalDeposits: number
  totalWithdrawals: number
  pendingWithdrawals: number
  activeBets: number
  platformProfit: number
}

export function AdminStatsOverview() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/stats')
        const data = await res.json()
        if (data.success) {
          setStats(data.stats)
        }
      } catch (error) {
        console.error('Failed to fetch admin stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-black/40 border-white/10 backdrop-blur">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-white/10 rounded w-24 mb-2"></div>
                <div className="h-8 bg-white/20 rounded w-32"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const cards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers.toLocaleString() || '0',
      subtitle: `${stats?.activeUsers || 0} active today`,
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Platform Revenue',
      value: `₹${(stats?.platformProfit || 0).toLocaleString()}`,
      subtitle: 'Net profit',
      icon: stats && stats.platformProfit >= 0 ? TrendingUp : TrendingDown,
      color: stats && stats.platformProfit >= 0 ? 'text-green-400' : 'text-red-400',
      bgColor: stats && stats.platformProfit >= 0 ? 'bg-green-500/10' : 'bg-red-500/10',
    },
    {
      title: 'Active Bets',
      value: stats?.activeBets.toLocaleString() || '0',
      subtitle: 'Currently playing',
      icon: Activity,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Pending Withdrawals',
      value: stats?.pendingWithdrawals.toLocaleString() || '0',
      subtitle: 'Awaiting approval',
      icon: AlertTriangle,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="bg-black/40 border-white/10 backdrop-blur hover:bg-black/50 transition-all hover:border-white/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${card.color}`}>
                  {card.value}
                </div>
                {card.subtitle && (
                  <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
