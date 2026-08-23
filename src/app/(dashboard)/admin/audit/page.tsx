'use client'

import { motion } from 'framer-motion'
import { AuditLogViewer } from '@/components/dashboard/AuditLogViewer'
import { Shield } from 'lucide-react'

export default function AdminAuditPage() {
  return (
    <div className="space-y-6 p-8 max-w-[1600px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold font-orbitron text-white mb-2 flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-500" />
            Audit Logs
          </h1>
          <p className="text-gray-400">Track all administrative actions and security events</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <AuditLogViewer />
      </motion.div>
    </div>
  )
}
