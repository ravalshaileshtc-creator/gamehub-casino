'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWallet } from '@/context/WalletContext'
import { haptics } from '@/lib/haptics'

export default function CoinFlipGame() {
  const { balance, debit, credit, addDemoCoins } = useWallet()
  const [wager, setWager] = useState(10)
  const [choice, setChoice] = useState<'HEADS' | 'TAILS'>('HEADS')
  const [flipping, setFlipping] = useState(false)
  const [outcome, setOutcome] = useState<{ isWin: boolean; flip: 'HEADS' | 'TAILS'; payout: number } | null>(null)

  const flipCoin = async () => {
    if (wager <= 0 || flipping) return
    haptics.medium()

    if (balance < wager) {
      addDemoCoins(1000)
    }

    const success = await debit(wager, 'COINFLIP')
    if (!success) {
      haptics.error()
      return
    }

    setFlipping(true)
    setOutcome(null)

    const resultFlip: 'HEADS' | 'TAILS' = Math.random() < 0.5 ? 'HEADS' : 'TAILS'
    const isWin = resultFlip === choice
    const payout = isWin ? wager * 1.95 : 0

    setTimeout(async () => {
      if (payout > 0) {
        haptics.success()
        await credit(payout, 'COINFLIP')
      } else {
        haptics.error()
      }

      setOutcome({ isWin, flip: resultFlip, payout })
      setFlipping(false)
    }, 1200)
  }

  return (
    <div className="h-[calc(100dvh-8.5rem)] overflow-hidden flex flex-col justify-between p-2 max-w-lg mx-auto text-white select-none">
      
      {/* Top Header Stats */}
      <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/10 text-xs shrink-0">
        <span className="text-amber-400 font-extrabold flex items-center gap-1">
          🪙 3D COINFLIP
        </span>
        <span className="text-gray-400 font-mono">
          MULTIPLIER: <strong className="text-emerald-400">1.95x</strong>
        </span>
      </div>

      {/* Coin Animation Arena */}
      <div className="relative flex-1 flex flex-col items-center justify-center rounded-2xl bg-gradient-to-b from-zinc-900 via-black to-zinc-900 border border-white/10 p-3 my-2 overflow-hidden shadow-2xl">
        
        {/* 3D Rotating Coin */}
        <div className="h-44 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {flipping ? (
              <motion.div
                key="flipping"
                animate={{ rotateY: [0, 1800], scale: [1, 1.2, 1] }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
                className="w-32 h-32 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 border-4 border-amber-200 flex items-center justify-center text-4xl font-black shadow-[0_0_40px_rgba(251,191,36,0.6)] text-black"
              >
                🪙
              </motion.div>
            ) : outcome ? (
              <motion.div
                key="outcome"
                initial={{ scale: 0, rotateY: 180 }}
                animate={{ scale: 1, rotateY: 0 }}
                className={`w-32 h-32 rounded-full border-4 flex flex-col items-center justify-center font-black text-2xl shadow-2xl ${
                  outcome.isWin
                    ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 border-emerald-200 text-black shadow-emerald-500/50'
                    : 'bg-gradient-to-tr from-red-600 to-rose-900 border-red-400 text-white shadow-red-500/50'
                }`}
              >
                <span>{outcome.flip === 'HEADS' ? '👑' : '🦅'}</span>
                <span className="text-sm tracking-wider uppercase mt-1">{outcome.flip}</span>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-32 h-32 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-300 border-4 border-amber-200 flex flex-col items-center justify-center font-black text-2xl text-black shadow-[0_0_30px_rgba(251,191,36,0.5)]"
              >
                <span>{choice === 'HEADS' ? '👑' : '🦅'}</span>
                <span className="text-xs tracking-wider uppercase mt-1">{choice}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Win/Loss Result Banner */}
        <AnimatePresence>
          {outcome && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className={`absolute bottom-3 px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-xl z-30 ${
                outcome.isWin
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-emerald-500/20'
                  : 'bg-red-500/20 text-red-400 border-red-500/40'
              }`}
            >
              {outcome.isWin
                ? `LANDED ON ${outcome.flip}! +${outcome.payout.toFixed(2)} USDT`
                : `LANDED ON ${outcome.flip}`}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Choice Selector & Wager Controls */}
      <div className="p-3 rounded-2xl bg-zinc-900/90 border border-white/10 space-y-2 shrink-0">
        
        {/* Heads / Tails Segmented Controls */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => { haptics.light(); setChoice('HEADS'); }}
            disabled={flipping}
            className={`py-2 rounded-xl font-black text-xs transition-all touch-spring border ${
              choice === 'HEADS'
                ? 'bg-amber-400 text-black border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.6)]'
                : 'bg-zinc-800 text-gray-400 border-white/5'
            }`}
          >
            👑 HEADS (1.95x)
          </button>
          <button
            onClick={() => { haptics.light(); setChoice('TAILS'); }}
            disabled={flipping}
            className={`py-2 rounded-xl font-black text-xs transition-all touch-spring border ${
              choice === 'TAILS'
                ? 'bg-[#44e2cd] text-black border-[#44e2cd] shadow-[0_0_15px_rgba(68,226,205,0.6)]'
                : 'bg-zinc-800 text-gray-400 border-white/5'
            }`}
          >
            🦅 TAILS (1.95x)
          </button>
        </div>

        {/* Wager Presets & Flip Action Button */}
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
            onClick={flipCoin}
            disabled={flipping}
            className={`col-span-2 py-2.5 rounded-xl font-black text-xs tracking-wider uppercase transition-all shadow-xl touch-spring cursor-pointer ${
              flipping
                ? 'bg-zinc-800 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 text-black shadow-[0_0_20px_rgba(251,191,36,0.3)] hover:scale-[1.01]'
            }`}
          >
            {flipping ? 'FLIPPING...' : 'FLIP COIN'}
          </button>
        </div>

      </div>

    </div>
  )
}
