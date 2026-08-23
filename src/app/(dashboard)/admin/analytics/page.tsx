
'use client'

import { motion } from 'framer-motion'
import { AdminAnalytics } from '@/components/dashboard/AdminAnalytics'
import { AdminStatsOverview } from '@/components/dashboard/AdminStatsOverview'

export default function AnalyticsPage() {
  return (
    <div className="space-y-8 p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold font-orbitron text-white mb-2">
          📊 Platform Analytics
        </h1>
        <p className="text-gray-400">Deep dive into user behavior and financial trends</p>
      </motion.div>

      {/* KPI Overview */}
      <AdminStatsOverview />

      {/* Detailed Charts */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Performance Metrics</h2>
        <AdminAnalytics />
      </div>
    </div>
  )
}
