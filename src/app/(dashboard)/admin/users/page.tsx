'use client'

import { motion } from 'framer-motion'
import { UserManagementTable } from '@/components/dashboard/UserManagementTable'
import { Users } from 'lucide-react'

export default function AdminUsersPage() {
  return (
    <div className="space-y-6 p-8 max-w-[1600px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold font-orbitron text-white mb-2 flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            User Management
          </h1>
          <p className="text-gray-400">View stats, manage accounts, and handle bans</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <UserManagementTable />
      </motion.div>
    </div>
  )
}
