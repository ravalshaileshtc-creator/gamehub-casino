'use client'

import { motion } from 'framer-motion'
import { SystemSettings } from '@/components/dashboard/SystemSettings'
import { Settings } from 'lucide-react'

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6 p-8 max-w-[1600px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold font-orbitron text-white mb-2 flex items-center gap-3">
            <Settings className="w-8 h-8 text-gray-400" />
            System Configuration
          </h1>
          <p className="text-gray-400">Global platform settings, maintenance control, and limits</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="max-w-4xl"
      >
        <SystemSettings />
      </motion.div>
    </div>
  )
}
