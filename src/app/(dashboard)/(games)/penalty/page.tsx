'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWallet } from '@/context/WalletContext'
import { Trophy, Volume2, VolumeX, Sparkles, Flame } from 'lucide-react'
import { haptics } from '@/lib/haptics'

interface ShotResult {
  zoneId: string
  isGoal: boolean
  payout: number
  wager: number
  multiplier: number
  targetName: string
}

const TARGET_ZONES = [
  { id: 'top-left', name: 'Top Left', multiplier: 4.80, pos: 'top-2 left-2' },
  { id: 'top-right', name: 'Top Right', multiplier: 4.80, pos: 'top-2 right-2' },
  { id: 'center-top', name: 'Top Roof', multiplier: 3.50, pos: 'top-2 left-1/2 -translate-x-1/2' },
  { id: 'bottom-left', name: 'Low Left', multiplier: 2.00, pos: 'bottom-3 left-3' },
  { id: 'bottom-right', name: 'Low Right', multiplier: 2.00, pos: 'bottom-3 right-3' },
  { id: 'center-low', name: 'Low Center', multiplier: 1.95, pos: 'bottom-3 left-1/2 -translate-x-1/2' },
]

export default function PenaltyBallGame() {
  const { balance, debit, credit, addDemoCoins } = useWallet()
  const [wager, setWager] = useState(10)
  const [selectedZone, setSelectedZone] = useState<string>('top-left')
  const [shooting, setShooting] = useState(false)
  const [keeperAnim, setKeeperAnim] = useState<string>('center')
  const [result, setResult] = useState<ShotResult | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [streak, setStreak] = useState(0)

  const activeZone = TARGET_ZONES.find(z => z.id === selectedZone) || TARGET_ZONES[0]

  const shootPenalty = async () => {
    if (wager <= 0 || shooting) return
    haptics.medium()

    if (balance < wager) {
      addDemoCoins(1000)
    }

    const success = await debit(wager, 'PENALTY')
    if (!success) {
      haptics.error()
      return
    }

    setShooting(true)
    setResult(null)

    const randomDive = TARGET_ZONES[Math.floor(Math.random() * TARGET_ZONES.length)].id
    setKeeperAnim(randomDive)

    const isGoal = randomDive !== selectedZone
    const payout = isGoal ? wager * activeZone.multiplier : 0

    setTimeout(async () => {
      if (isGoal) {
        haptics.success()
        setStreak(s => s + 1)
        await credit(payout, 'PENALTY')
      } else {
        haptics.error()
        setStreak(0)
      }

      const resObj: ShotResult = {
        zoneId: selectedZone,
        isGoal,
        payout,
        wager,
        multiplier: activeZone.multiplier,
        targetName: activeZone.name
      }

      setResult(resObj)
      setShooting(false)
    }, 550)
  }

  return (
    <div className="h-[calc(100dvh-8.5rem)] overflow-hidden flex flex-col justify-between p-2 max-w-lg mx-auto text-white select-none">
      
      {/* Top Header Stats */}
      <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/10 text-xs shrink-0">
        <div className="flex items-center gap-1.5 text-emerald-400 font-extrabold">
          <span>⚽ 3D PENALTY SHOOTOUT</span>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1 text-amber-400 font-bold">
            <Flame className="w-3.5 h-3.5 fill-amber-400" />
            <span>{streak} GOAL STREAK</span>
          </div>
        )}
      </div>

      {/* Goal Post Frame & Football Arena */}
      <div className="relative flex-1 flex flex-col items-center justify-between rounded-2xl bg-gradient-to-b from-zinc-950 via-emerald-950/40 to-emerald-900/60 border border-emerald-500/20 p-2 my-2 overflow-hidden shadow-2xl">
        
        {/* Goal Post Frame */}
        <div className="relative w-full flex-1 border-4 border-white rounded-t-xl bg-black/40 overflow-hidden shadow-inner flex items-center justify-center">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff15_1px,transparent_1px),linear-gradient(to_bottom,#ffffff15_1px,transparent_1px)] bg-[size:14px_14px]" />

          {/* Target Zones */}
          {TARGET_ZONES.map((zone) => {
            const isSelected = selectedZone === zone.id
            return (
              <button
                key={zone.id}
                onClick={() => { haptics.light(); !shooting && setSelectedZone(zone.id); }}
                disabled={shooting}
                className={`absolute ${zone.pos} px-2 py-1 rounded-lg font-bold text-[10px] transition-all flex items-center gap-1 z-20 cursor-pointer touch-spring ${
                  isSelected
                    ? 'bg-amber-400 text-black border border-amber-200 shadow-[0_0_15px_rgba(251,191,36,0.8)] scale-105'
                    : 'bg-black/60 text-white/80 border border-white/20 hover:border-amber-400/60'
                }`}
              >
                <span>🎯</span> {zone.multiplier}x
              </button>
            )
          })}

          {/* Animated Goalkeeper */}
          <motion.div
            animate={shooting ? {
              x: keeperAnim.includes('left') ? -90 : keeperAnim.includes('right') ? 90 : 0,
              y: keeperAnim.includes('top') ? -30 : keeperAnim.includes('bottom') ? 20 : 0,
            } : { x: 0, y: 0 }}
            transition={{ duration: 0.35 }}
            className="absolute bottom-1 left-1/2 -translate-x-1/2 text-4xl z-10 pointer-events-none drop-shadow-md"
          >
            🧤
          </motion.div>
        </div>

        {/* Penalty Spot Football */}
        <div className="relative flex items-center justify-center h-14 mt-1">
          <motion.div
            animate={shooting ? {
              scale: [1, 0.4],
              y: selectedZone.includes('top') ? -140 : -90,
              x: selectedZone.includes('left') ? -90 : selectedZone.includes('right') ? 90 : 0,
              rotate: 720
            } : { scale: 1, y: 0, x: 0, rotate: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="text-4xl cursor-pointer drop-shadow-lg"
          >
            ⚽
          </motion.div>
        </div>

        {/* Win/Loss Result Overlay */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className={`absolute top-3 px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-xl z-30 ${
                result.isGoal
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-emerald-500/20'
                  : 'bg-red-500/20 text-red-400 border-red-500/40'
              }`}
            >
              {result.isGoal ? `GOAL! +${result.payout.toFixed(2)} USDT` : 'SAVED BY KEEPER!'}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Wager Presets & Shoot Button */}
      <div className="p-3 rounded-2xl bg-zinc-900/90 border border-white/10 space-y-2 shrink-0">
        <div className="flex justify-between items-center text-[10px] font-bold">
          <span className="text-gray-400">TARGET: <strong className="text-amber-400">{activeZone.name} ({activeZone.multiplier}x)</strong></span>
          <span className="text-white font-mono">${wager}</span>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
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
            onClick={shootPenalty}
            disabled={shooting}
            className={`py-2.5 rounded-xl font-black text-xs tracking-wider uppercase transition-all shadow-xl touch-spring cursor-pointer ${
              shooting
                ? 'bg-zinc-800 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-[1.01]'
            }`}
          >
            {shooting ? 'KICKING...' : 'SHOOT'}
          </button>
        </div>
      </div>

    </div>
  )
}
