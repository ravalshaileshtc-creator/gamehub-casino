'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWallet } from '@/context/WalletContext'
import { Flame } from 'lucide-react'
import { haptics } from '@/lib/haptics'

interface DiceResult {
  roll: number
  isWin: boolean
  payout: number
  wager: number
  target: number
  isOver: boolean
}

export default function DiceGame() {
  const { balance, debit, credit, addDemoCoins } = useWallet()
  const [wager, setWager] = useState(10)
  const [target, setTarget] = useState(50)
  const [isOver, setIsOver] = useState(true)
  const [rolling, setRolling] = useState(false)
  const [displayRoll, setDisplayRoll] = useState<number | string>('?')
  const [result, setResult] = useState<DiceResult | null>(null)
  const [winStreak, setWinStreak] = useState(0)

  const winChance = isOver ? (100 - target) : target
  const multiplierNum = parseFloat((98 / Math.max(1, winChance)).toFixed(2))

  const rollDice = async () => {
    if (wager <= 0 || rolling) return
    haptics.medium()

    if (balance < wager) {
      addDemoCoins(1000)
    }

    const success = await debit(wager, 'DICE')
    if (!success) {
      haptics.error()
      return
    }

    setRolling(true)
    setResult(null)

    const ticker = setInterval(() => {
      setDisplayRoll(Math.floor(Math.random() * 100))
    }, 60)

    const finalRoll = Math.floor(Math.random() * 100)
    const isWin = isOver ? finalRoll > target : finalRoll < target
    const payout = isWin ? wager * multiplierNum : 0

    setTimeout(async () => {
      clearInterval(ticker)
      setDisplayRoll(finalRoll)

      if (isWin) {
        haptics.success()
        setWinStreak(s => s + 1)
        await credit(payout, 'DICE')
      } else {
        haptics.error()
        setWinStreak(0)
      }

      setResult({
        roll: finalRoll,
        isWin,
        payout,
        wager,
        target,
        isOver
      })

      setRolling(false)
    }, 850)
  }

  return (
    <div className="h-[calc(100dvh-8.5rem)] overflow-hidden flex flex-col justify-between p-2 max-w-lg mx-auto text-white select-none">
      
      {/* Top Header Stats */}
      <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/10 text-xs shrink-0">
        <span className="text-amber-400 font-extrabold flex items-center gap-1">
          🎲 3D DICE ROLL
        </span>
        {winStreak > 0 && (
          <div className="flex items-center gap-1 text-amber-400 font-bold">
            <Flame className="w-3.5 h-3.5 fill-amber-400" />
            <span>{winStreak} STREAK</span>
          </div>
        )}
      </div>

      {/* 3D Tumbling Cube & Roll Display Box */}
      <div className="relative flex-1 flex flex-col items-center justify-center rounded-2xl bg-gradient-to-b from-zinc-900 via-black to-zinc-900 border border-white/10 p-3 my-2 overflow-hidden shadow-2xl">
        
        {/* 3D Tumbling Cube */}
        <div className="relative mb-2">
          <motion.div
            animate={rolling ? {
              rotateX: [0, 360, 720, 1080],
              rotateY: [0, 180, 540, 900],
              scale: [1, 1.15, 0.9, 1]
            } : { rotateX: 0, rotateY: 0, scale: 1 }}
            transition={rolling ? { duration: 0.8, ease: "linear" } : { type: "spring" }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-300 p-1 shadow-[0_0_30px_rgba(247,147,26,0.5)] flex items-center justify-center"
          >
            <div className="w-full h-full rounded-xl bg-black/90 flex items-center justify-center border border-white/20">
              <span className="font-extrabold text-3xl text-amber-400 font-mono">
                {displayRoll}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Win/Loss Result Overlay */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-xl z-30 ${
                result.isWin
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-emerald-500/20'
                  : 'bg-red-500/20 text-red-400 border-red-500/40'
              }`}
            >
              {result.isWin
                ? `ROLLED ${result.roll}! +${result.payout.toFixed(2)} USDT (${multiplierNum}x)`
                : `ROLLED ${result.roll}`}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Target Threshold & Bet Controls */}
      <div className="p-3 rounded-2xl bg-zinc-900/90 border border-white/10 space-y-2 shrink-0">
        
        {/* Target Slider & Toggle */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[10px] font-bold text-gray-400">
            <span>TARGET: <strong className="text-amber-400 font-mono">{target}</strong></span>
            <span>CHANCE: <strong className="text-emerald-400 font-mono">{winChance}%</strong></span>
            <span>MULTIPLIER: <strong className="text-[#44e2cd] font-mono">{multiplierNum}x</strong></span>
          </div>

          <input
            type="range"
            min="5"
            max="95"
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
            disabled={rolling}
            className="w-full accent-amber-400 cursor-pointer h-1.5 rounded-lg bg-zinc-800"
          />

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => { haptics.light(); setIsOver(true); }}
              disabled={rolling}
              className={`py-1.5 rounded-xl font-bold text-xs transition-all touch-spring border ${
                isOver ? 'bg-amber-400 text-black border-amber-300 shadow-md font-extrabold' : 'bg-zinc-800 text-gray-400 border-white/5'
              }`}
            >
              ROLL OVER &gt; {target}
            </button>
            <button
              onClick={() => { haptics.light(); setIsOver(false); }}
              disabled={rolling}
              className={`py-1.5 rounded-xl font-bold text-xs transition-all touch-spring border ${
                !isOver ? 'bg-[#44e2cd] text-black border-[#44e2cd] shadow-md font-extrabold' : 'bg-zinc-800 text-gray-400 border-white/5'
              }`}
            >
              ROLL UNDER &lt; {target}
            </button>
          </div>
        </div>

        {/* Wager Presets & Roll Button */}
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
            onClick={rollDice}
            disabled={rolling}
            className={`col-span-2 py-2.5 rounded-xl font-black text-xs tracking-wider uppercase transition-all shadow-xl touch-spring cursor-pointer ${
              rolling
                ? 'bg-zinc-800 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 text-black shadow-[0_0_20px_rgba(251,191,36,0.3)] hover:scale-[1.01]'
            }`}
          >
            {rolling ? 'ROLLING...' : 'ROLL DICE'}
          </button>
        </div>

      </div>

    </div>
  )
}
