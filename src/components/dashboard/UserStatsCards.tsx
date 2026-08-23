'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Wallet, TrendingUp, Trophy, Target } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface UserStats {
  mainBalance: number
  bonusBalance: number
  totalWagered: number
  totalWon: number
  netProfit: number
  vipLevel: string
  vipProgress: number
  referralEarnings: number
}

export function UserStatsCards() {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [balanceRes, statsRes] = await Promise.all([
          fetch('/api/user/balance'),
          fetch('/api/user/stats'),
        ])

        const balance = await balanceRes.json()
        const userStats = await statsRes.json()

        setStats({
          mainBalance: balance.mainBalance || 0,
          bonusBalance: balance.bonusBalance || 0,
          totalWagered: userStats.totalWagered || 0,
          totalWon: userStats.totalWon || 0,
          netProfit: userStats.netProfit || 0,
          vipLevel: userStats.vipLevel || 'BRONZE',
          vipProgress: userStats.vipProgress || 0,
          referralEarnings: userStats.referralEarnings || 0,
        })
      } catch (error) {
        console.error('Failed to fetch user stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-purple-600 rounded-2xl blur opacity-20 animate-pulse" />
            <Card className="relative bg-black/60 border-white/10 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-white/10 rounded w-24" />
                  <div className="h-8 bg-white/20 rounded w-32" />
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    )
  }

  const cards = [
    {
      title: 'Total Balance',
      value: `₹${((stats?.mainBalance || 0) + (stats?.bonusBalance || 0)).toFixed(2)}`,
      subtitle: `Main: ₹${(stats?.mainBalance || 0).toFixed(2)} | Bonus: ₹${(stats?.bonusBalance || 0).toFixed(2)}`,
      icon: Wallet,
      color: 'text-cyan-400',
      glowColor: 'from-cyan-500/20 to-blue-500/20',
      borderGlow: 'group-hover:shadow-[0_0_30px_rgba(34,211,238,0.3)]',
    },
    {
      title: 'Total Wagered',
      value: `₹${(stats?.totalWagered || 0).toFixed(2)}`,
      icon: Target,
      color: 'text-purple-400',
      glowColor: 'from-purple-500/20 to-pink-500/20',
      borderGlow: 'group-hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]',
    },
    {
      title: 'Total Won',
      value: `₹${(stats?.totalWon || 0).toFixed(2)}`,
      icon: Trophy,
      color: 'text-yellow-400',
      glowColor: 'from-yellow-500/20 to-orange-500/20',
      borderGlow: 'group-hover:shadow-[0_0_30px_rgba(251,191,36,0.3)]',
    },
    {
      title: 'Net Profit',
      value: `₹${(stats?.netProfit || 0).toFixed(2)}`,
      icon: TrendingUp,
      color: (stats?.netProfit || 0) >= 0 ? 'text-emerald-400' : 'text-red-400',
      glowColor: (stats?.netProfit || 0) >= 0 ? 'from-emerald-500/20 to-green-500/20' : 'from-red-500/20 to-rose-500/20',
      borderGlow: (stats?.netProfit || 0) >= 0 ? 'group-hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]' : 'group-hover:shadow-[0_0_30px_rgba(239,68,68,0.3)]',
    },
  ]

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1, type: "spring" }}
            className="relative group"
          >
            {/* Glow Effect */}
            <div className={`absolute -inset-0.5 bg-gradient-to-r ${card.glowColor} rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            
            {/* Card */}
            <Card className={`relative bg-black/60 border border-white/10 backdrop-blur-xl hover:border-white/20 transition-all duration-300 overflow-hidden ${card.borderGlow}`}>
              {/* Shimmer Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
              
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                  {card.title}
                </CardTitle>
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${card.glowColor} border border-white/10 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent className="pb-6">
                <div className={`text-3xl font-bold font-heading ${card.color} mb-1 tracking-tight`}>
                  {card.value}
                </div>
                {card.subtitle && (
                  <p className="text-xs text-gray-500 font-medium">{card.subtitle}</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
