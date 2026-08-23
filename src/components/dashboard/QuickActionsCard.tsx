'use client'

import { Gift, Coins, Download, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'

export function QuickActionsCard() {
  const actions = [
    {
      title: 'Deposit',
      icon: CreditCard,
      href: '/deposit',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      hoverBg: 'hover:bg-green-500/20',
    },
    {
      title: 'Withdraw',
      icon: Download,
      href: '/withdraw',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      hoverBg: 'hover:bg-blue-500/20',
    },
    {
      title: 'Bonuses',
      icon: Gift,
      href: '/bonuses',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      hoverBg: 'hover:bg-purple-500/20',
    },
    {
      title: 'Play Games',
      icon: Coins,
      href: '/games',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      hoverBg: 'hover:bg-yellow-500/20',
    },
  ]

  return (
    <Card className="bg-black/40 border-white/10 backdrop-blur">
      <CardContent className="p-6">
        <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {actions.map((action, index) => {
            const Icon = action.icon
            return (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <Link href={action.href}>
                  <div className={`p-4 rounded-xl ${action.bgColor} ${action.hoverBg} border border-white/10 transition-all cursor-pointer text-center group`}>
                    <Icon className={`h-6 w-6 ${action.color} mx-auto mb-2 group-hover:scale-110 transition-transform`} />
                    <p className="text-sm font-medium text-white">{action.title}</p>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
