"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Loader } from "lucide-react"

interface Bet {
    id: string
    user: string
    game: string
    wager: string
    multiplier: string
    payout: string
    won: boolean
}

export function RecentBets() {
  const [bets, setBets] = useState<Bet[]>([])
  const [loading, setLoading] = useState(true)

  const fetchBets = async () => {
    try {
      const res = await fetch('/api/bets/recent')
      const data = await res.json()
      if (data.success) {
        setBets(data.bets)
      }
    } catch (error) {
      console.error('Failed to fetch bets:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBets()
    // Poll every 5 seconds
    const interval = setInterval(fetchBets, 5000)
    return () => clearInterval(interval)
  }, [])

  if (loading && bets.length === 0) {
      return (
        <div className="w-full h-12 flex items-center justify-center bg-black/40 border-y border-white/5 backdrop-blur-md">
            <Loader className="w-4 h-4 animate-spin text-gray-500" />
        </div>
      )
  }

  return (
    <div className="w-full bg-black/40 border-y border-white/5 backdrop-blur-md overflow-hidden h-12 flex items-center relative">
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-black via-black/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-black via-black/80 to-transparent z-10 pointer-events-none" />
        
        <div className="flex gap-4 px-4 overflow-hidden mask-linear-fade">
             <AnimatePresence mode='popLayout'>
            {bets.map((bet) => (
                    <motion.div 
                        key={bet.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex items-center gap-3 text-sm min-w-fit px-3 py-1 rounded-full bg-white/5 border border-white/5"
                    >
                         <span className="text-gray-400 font-mono text-xs">{bet.user}</span>
                         <span className={`text-xs font-bold ${
                             bet.game === 'CRASH' ? 'text-red-400' : 
                             bet.game === 'MINES' ? 'text-yellow-400' : 'text-blue-400'
                         }`}>
                             {bet.game}
                         </span>
                         <span className={bet.won ? "text-green-400 font-bold" : "text-gray-500"}>
                            {bet.won ? `+${bet.payout}` : `-${bet.wager}`}
                         </span>
                         {bet.won && parseFloat(bet.multiplier) > 5 && (
                             <Sparkles className="h-3 w-3 text-yellow-500 animate-spin-slow" />
                         )}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    </div>
  )
}
