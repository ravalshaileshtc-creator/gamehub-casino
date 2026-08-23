'use client'

import { motion } from 'framer-motion'
import { WithdrawalApprovals } from '@/components/dashboard/WithdrawalApprovals'
import { TransactionMonitor } from '@/components/dashboard/TransactionMonitor'
import { SystemWalletStats } from '@/components/dashboard/SystemWalletStats'
import { DollarSign, Activity, TrendingUp } from 'lucide-react'

export default function AdminFinancePage() {
  return (
    <div className="space-y-8 p-8 max-w-[1600px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold font-orbitron text-white mb-2 flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-green-500" />
            Financial Operations
          </h1>
          <p className="text-gray-400">Monitor transactions, approve withdrawals, and track revenue</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <SystemWalletStats />
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-yellow-400" />
            Pending Withdrawals
          </h2>
          <WithdrawalApprovals />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
           <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            Live Transactions
          </h2>
          <TransactionMonitor />
        </motion.div>
      </div>
    </div>
  )
}
