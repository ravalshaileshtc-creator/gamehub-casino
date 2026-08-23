'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, TrendingDown, Trophy, Flame } from 'lucide-react'

interface LiveBet {
  id: string
  user: {
    name: string
  }
  game: string
  wager: number
  multiplier: number
  payout: number
  isWin: boolean
  createdAt: string
}

export default function LiveBetsFeed() {
  const [bets, setBets] = useState<LiveBet[]>([])
  const [filter, setFilter] = useState<'ALL' | 'WINS' | 'BIG_WINS'>('ALL')

  const fetchLiveBets = useCallback(async () => {
    try {
      const res = await fetch('/api/bets/live?limit=30')
      const data = await res.json()
      if (data.success) {
        setBets(data.bets)
      }
    } catch (error) {
      console.error('Failed to fetch live bets:', error)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLiveBets()
    const interval = setInterval(fetchLiveBets, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [fetchLiveBets])

  const filteredBets = bets.filter(bet => {
    if (filter === 'WINS') return bet.isWin
    if (filter === 'BIG_WINS') return bet.isWin && bet.payout >= 1000
    return true
  })

  const getGameEmoji = (game: string) => {
    switch (game) {
      case 'DICE': return '🎲'
      case 'COINFLIP': return '🪙'
      case 'ROULETTE': return '🎡'
      case 'CRASH': return '🚀'
      case 'MINES': return '💣'
      case 'SLOTS': return '🎰'
      default: return '🎮'
    }
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-orbitron font-bold text-white flex items-center gap-2">
          <Flame className="w-6 h-6 text-orange-400" />
          Live Bets
        </h2>

        <div className="flex gap-2">
          {['ALL', 'WINS', 'BIG_WINS'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as 'ALL' | 'WINS' | 'BIG_WINS')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filter === f
                  ? 'bg-gradient-primary text-white'
                  : 'bg-black/40 text-gray-400 hover:bg-black/60'
              }`}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {filteredBets.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No bets yet. Be the first to play!
            </div>
          ) : (
            filteredBets.map((bet) => (
              <motion.div
                key={bet.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`p-3 rounded-xl transition-colors ${
                  bet.isWin
                  ? 'bg-green-500/10 hover:bg-green-500/20 border border-green-500/30'
                    : 'bg-red-500/10 hover:bg-red-500/20 border border-red-500/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-2xl">{getGameEmoji(bet.game)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-white text-sm">{bet.user.name}</p>
                        {bet.payout >= 1000 && (
                          <Trophy className="w-4 h-4 text-yellow-400" />
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        {bet.game} • {bet.multiplier.toFixed(2)}x
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      {bet.isWin ? (
                        <TrendingUp className="w-4 h-4 text-green-400" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-400" />
                      )}
                      <p className={`font-bold text-sm ${
                        bet.isWin ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {bet.isWin ? '+' : '-'}₹{Math.abs(bet.payout).toFixed(2)}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">Bet: ₹{bet.wager}</p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
