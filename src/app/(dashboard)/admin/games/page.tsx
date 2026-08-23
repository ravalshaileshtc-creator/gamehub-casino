'use client'

import { motion } from 'framer-motion'
import { GameControlPanel } from '@/components/dashboard/GameControlPanel'
import { Gamepad2 } from 'lucide-react'

export default function AdminGamesPage() {
  return (
    <div className="space-y-6 p-8 max-w-[1600px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold font-orbitron text-white mb-2 flex items-center gap-3">
            <Gamepad2 className="w-8 h-8 text-purple-500" />
            Game Control
          </h1>
          <p className="text-gray-400">Manage game availability, maintenance mode, and monitor RTP</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <GameControlPanel />
      </motion.div>
    </div>
  )
}
