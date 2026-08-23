'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Coins, Trophy, Zap } from 'lucide-react'

const stats = [
  { label: 'Total Wagered', value: '₹48,294,000+', icon: Coins, color: 'text-yellow-400' },
  { label: 'Active Players', value: '1,240+', icon: Users, color: 'text-blue-400' },
  { label: 'Total Payouts', value: '₹32,105,000+', icon: Trophy, color: 'text-green-400' },
  { label: 'Bets Placed', value: '850,000+', icon: Zap, color: 'text-purple-400' },
]

export function GlobalStats() {
  // Simulate live updates
  const [activeUsers, setActiveUsers] = useState(1240)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveUsers(prev => prev + Math.floor(Math.random() * 3) - 1)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full bg-black/60 border-y border-white/5 backdrop-blur-md py-4 overflow-hidden relative z-20">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className={`p-2 rounded-full bg-white/5 ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs uppercase text-gray-500 font-semibold tracking-wider">{stat.label}</span>
                  <span className="text-lg font-bold text-white font-accent leading-tight tracking-wide">
                    {stat.label === 'Active Players' ? activeUsers.toLocaleString() : stat.value}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
