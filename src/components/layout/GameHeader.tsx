"use client"

import Link from "next/link"
import { ArrowLeft, Wallet } from "lucide-react"
import { useWallet } from "@/context/WalletContext"
import { motion } from "framer-motion"

interface GameHeaderProps {
  title: string
  icon?: string
}

export function GameHeader({ title, icon = "🎮" }: GameHeaderProps) {
  const { balance } = useWallet()

  return (
    <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10 px-4 py-3 mb-4">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        <Link 
          href="/games" 
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <h1 className="text-lg md:text-xl font-extrabold text-white font-heading tracking-wide uppercase">{title}</h1>
        </div>

        <Link href="/wallet">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/40 px-3.5 py-1.5 rounded-full shadow-[0_0_15px_rgba(251,191,36,0.2)]"
          >
            <Wallet className="w-4 h-4 text-amber-400" />
            <span className="font-mono font-extrabold text-amber-400 text-sm md:text-base">
              ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </motion.div>
        </Link>
      </div>
    </div>
  )
}
