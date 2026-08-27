'use client'

import { ShieldAlert, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'

export function GameMaintenanceOverlay({ gameName }: { gameName: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-[320px] h-full w-full p-6 text-center bg-zinc-950/95 backdrop-blur-xl border border-red-500/30 rounded-2xl select-none"
    >
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(239,68,68,0.2)] animate-pulse">
        <ShieldAlert className="w-8 h-8 text-red-400" />
      </div>

      <span className="text-[10px] font-mono text-red-400 font-bold bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20 uppercase tracking-widest mb-2">
        ADMIN SYSTEM LOCK
      </span>

      <h3 className="text-xl font-black text-white uppercase tracking-wider font-sans">
        {gameName} Is In Maintenance
      </h3>

      <p className="text-xs text-gray-400 mt-2 max-w-xs leading-relaxed font-sans">
        The Master Admin has paused this game for maintenance and live parameter synchronization. It will be back online shortly!
      </p>

      <div className="mt-6 flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-amber-400">
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
        <span>Syncing Live Control Signal...</span>
      </div>
    </motion.div>
  )
}
