'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cherry, Apple, Grape, Gem, Zap } from 'lucide-react'
import { useWallet } from '@/context/WalletContext'
import { haptics } from '@/lib/haptics'
import { useGameAdminControl } from '@/hooks/useGameAdminControl'
import { GameMaintenanceOverlay } from '@/components/ui/GameMaintenanceOverlay'

const SYMBOLS = [
  { icon: Cherry, color: 'text-red-400', name: 'cherry' },
  { icon: Apple, color: 'text-yellow-400', name: 'apple' },
  { icon: Grape, color: 'text-purple-400', name: 'grape' },
  { icon: Gem, color: 'text-pink-400', name: 'gem' },
  { icon: Zap, color: 'text-[#ffb95f]', name: 'seven' },
]

interface SlotsResult {
  isWin: boolean
  wager: number
  payout: number
  multiplier: number
  reels: number[]
}

export default function SlotsGame() {
  const { balance, debit, credit, addDemoCoins } = useWallet()
  const adminSettings = useGameAdminControl('slots')

  const [wager, setWager] = useState(10)
  const [spinning, setSpinning] = useState(false)
  const [reels, setReels] = useState([0, 0, 0])
  const [result, setResult] = useState<SlotsResult | null>(null)

  // Synchronize Global Epoch Round ID & Timer across all devices & Master Admin
  const [roundId, setRoundId] = useState<number>(44698492)
  const [timeLeft, setTimeLeft] = useState<number>(27)

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Math.floor(Date.now() / 1000)
      const cycle = now % 30
      const currentRoundId = 44698000 + Math.floor(now / 30)
      setRoundId(currentRoundId)
      setTimeLeft(30 - cycle)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  if (!adminSettings.enabled) {
    return <GameMaintenanceOverlay gameName="Slots 777 Vegas" />
  }

  const spinReels = async () => {
    if (wager <= 0 || spinning || balance < wager) return
    haptics.medium()

    const success = await debit(wager, 'SLOTS')
    if (!success) {
      haptics.error()
      return
    }

    setSpinning(true)
    setResult(null)

    const finalReels = [
      Math.floor(Math.random() * SYMBOLS.length),
      Math.floor(Math.random() * SYMBOLS.length),
      Math.floor(Math.random() * SYMBOLS.length),
    ]

    const spinInterval = setInterval(() => {
      setReels([
        Math.floor(Math.random() * SYMBOLS.length),
        Math.floor(Math.random() * SYMBOLS.length),
        Math.floor(Math.random() * SYMBOLS.length),
      ])
    }, 50)

    setTimeout(async () => {
      clearInterval(spinInterval)
      setReels(finalReels)

      const s0 = SYMBOLS[finalReels[0]].name
      const s1 = SYMBOLS[finalReels[1]].name
      const s2 = SYMBOLS[finalReels[2]].name

      let multiplier = 0
      if (s0 === s1 && s1 === s2) {
        multiplier = s0 === 'seven' ? 25 : s0 === 'gem' ? 15 : 10
      } else if (s0 === s1 || s1 === s2 || s0 === s2) {
        multiplier = 1.5
      }

      const payout = wager * multiplier
      const isWin = multiplier > 0

      if (isWin) {
        haptics.success()
        await credit(payout, 'SLOTS')
      } else {
        haptics.error()
      }

      setResult({
        isWin,
        wager,
        payout,
        multiplier,
        reels: finalReels
      })
      setSpinning(false)
    }, 1200)
  }

  const getSymbol = (num: number) => {
    return SYMBOLS[num % SYMBOLS.length]
  }

  return (
    <div className="h-[calc(100dvh-8.5rem)] overflow-hidden flex flex-col justify-between p-2 max-w-lg mx-auto text-white select-none">
      
      {/* Top Header Stats */}
      <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/10 text-xs shrink-0">
        <span className="text-amber-400 font-extrabold flex items-center gap-1">
          🎰 3-REEL VEGAS SLOTS
        </span>
        <span className="text-gray-400 font-mono">
          JACKPOT: <strong className="text-amber-400">25.00x</strong>
        </span>
      </div>

      {/* Slots Machine Stage */}
      <div className="relative flex-1 flex flex-col items-center justify-center rounded-2xl bg-gradient-to-b from-zinc-900 via-black to-zinc-900 border border-white/10 p-4 my-2 overflow-hidden shadow-2xl">
        
        {/* Machine Rim */}
        <div className="w-full bg-gradient-to-b from-amber-600 via-amber-700 to-amber-900 rounded-2xl p-4 shadow-[0_0_50px_rgba(245,158,11,0.3)] border border-amber-400/40">
          <div className="flex justify-center gap-2">
            {reels.map((reel, i) => {
              const SymbolItem = getSymbol(reel)
              return (
                <motion.div
                  key={i}
                  animate={spinning ? { y: [0, -15, 0] } : {}}
                  transition={{ repeat: spinning ? Infinity : 0, duration: 0.18, delay: i * 0.05 }}
                  className="flex-1 h-28 bg-black rounded-xl flex items-center justify-center border-2 border-amber-400/50 shadow-inner"
                >
                  <SymbolItem.icon className={`w-14 h-14 ${SymbolItem.color}`} />
                </motion.div>
              )
            })}
          </div>
          <div className="h-1 bg-amber-400 rounded-full mt-3 shadow-[0_0_12px_rgba(251,191,36,0.8)]" />
        </div>

        {/* Win/Loss Result Overlay */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className={`absolute bottom-3 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border shadow-xl z-30 ${
                result.isWin
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-emerald-500/20'
                  : 'bg-red-500/20 text-red-400 border-red-500/40'
              }`}
            >
              {result.isWin
                ? `🎉 MATCH! +${result.payout.toFixed(2)} USDT (${result.multiplier}x)`
                : 'NO MATCH'}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Wager Presets & Spin Action Button */}
      <div className="p-3 rounded-2xl bg-zinc-900/90 border border-white/10 space-y-2 shrink-0">
        <div className="flex justify-between items-center text-[10px] font-bold">
          <span className="text-gray-400">SELECT BET</span>
          <span className="text-white font-mono">${wager}</span>
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          <button
            onClick={() => { haptics.light(); setWager(10); }}
            className={`py-2 rounded-xl border text-xs font-bold touch-spring ${wager === 10 ? 'bg-amber-400 text-black border-amber-400' : 'bg-zinc-800 border-white/5 text-gray-300'}`}
          >
            $10
          </button>
          <button
            onClick={() => { haptics.light(); setWager(50); }}
            className={`py-2 rounded-xl border text-xs font-bold touch-spring ${wager === 50 ? 'bg-amber-400 text-black border-amber-400' : 'bg-zinc-800 border-white/5 text-gray-300'}`}
          >
            $50
          </button>
          <button
            onClick={() => { haptics.light(); setWager(100); }}
            className={`py-2 rounded-xl border text-xs font-bold touch-spring ${wager === 100 ? 'bg-amber-400 text-black border-amber-400' : 'bg-zinc-800 border-white/5 text-gray-300'}`}
          >
            $100
          </button>
          
          <button
            onClick={spinReels}
            disabled={spinning}
            className={`col-span-2 py-2.5 rounded-xl font-black text-xs tracking-wider uppercase transition-all shadow-xl touch-spring cursor-pointer ${
              spinning
                ? 'bg-zinc-800 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 text-black shadow-[0_0_20px_rgba(251,191,36,0.3)] hover:scale-[1.01]'
            }`}
          >
            {spinning ? 'SPINNING...' : 'SPIN REELS'}
          </button>
        </div>
      </div>

    </div>
  )
}
