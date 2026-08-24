'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bomb, Gem, Play, Sparkles, RefreshCw } from 'lucide-react'
import { useWallet } from '@/context/WalletContext'
import { haptics } from '@/lib/haptics'

interface MinesResult {
  isWin: boolean
  wager: number
  payout: number
  multiplier: number
}

export default function MinesGame() {
  const { balance, debit, credit, addDemoCoins } = useWallet()
  const [wager, setWager] = useState(10)
  const [mineCount, setMineCount] = useState(3)
  const [playing, setPlaying] = useState(false)
  const [revealed, setRevealed] = useState<number[]>([])
  const [result, setResult] = useState<MinesResult | null>(null)
  const [minePositions, setMinePositions] = useState<number[]>([])
  const [gameOver, setGameOver] = useState(false)
  const [currentMultiplier, setCurrentMultiplier] = useState(1.00)
  const [sessionMines, setSessionMines] = useState<number[]>([])

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

  const startGame = async () => {
    if (wager <= 0 || playing) return
    haptics.medium()

    if (balance < wager) {
      addDemoCoins(1000)
    }

    const success = await debit(wager, 'MINES')
    if (!success) {
      haptics.error()
      return
    }

    const mines: number[] = []
    while (mines.length < mineCount) {
      const pos = Math.floor(Math.random() * 25)
      if (!mines.includes(pos)) mines.push(pos)
    }

    setSessionMines(mines)
    setMinePositions([])
    setRevealed([])
    setResult(null)
    setGameOver(false)
    setPlaying(true)
    setCurrentMultiplier(1.00)
  }

  const revealTile = async (index: number) => {
    if (!playing || revealed.includes(index) || gameOver) return

    haptics.light()
    const newRevealed = [...revealed, index]
    setRevealed(newRevealed)

    if (sessionMines.includes(index)) {
      haptics.error()
      setMinePositions(sessionMines)
      setPlaying(false)
      setGameOver(true)
      setResult({
        isWin: false,
        wager,
        payout: 0,
        multiplier: 0
      })
    } else {
      haptics.medium()
      const gemsFound = newRevealed.length
      const safeTilesTotal = 25 - mineCount
      let multiplier = 1.00
      for (let i = 0; i < gemsFound; i++) {
        multiplier *= (25 - i) / (safeTilesTotal - i)
      }
      multiplier *= 0.97
      setCurrentMultiplier(multiplier)
    }
  }

  const pickRandomTile = () => {
    if (!playing || gameOver) return
    const unrevealedPositions = Array.from({ length: 25 }, (_, i) => i).filter(i => !revealed.includes(i))
    if (unrevealedPositions.length === 0) return
    const randomPos = unrevealedPositions[Math.floor(Math.random() * unrevealedPositions.length)]
    revealTile(randomPos)
  }

  const cashout = async () => {
    if (!playing || gameOver || revealed.length === 0) return
    haptics.success()

    const payout = wager * currentMultiplier
    await credit(payout, 'MINES')
    setMinePositions(sessionMines)
    setPlaying(false)
    setGameOver(true)

    setResult({
      isWin: true,
      wager,
      payout,
      multiplier: currentMultiplier
    })
  }

  return (
    <div className="h-[calc(100dvh-8.5rem)] overflow-hidden flex flex-col justify-between p-2 max-w-lg mx-auto text-white select-none">
      
      {/* Top Header Stats */}
      <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/10 text-xs shrink-0">
        <span className="text-[#ffb95f] font-extrabold flex items-center gap-1">
          💣 MINES (5x5 GRID)
        </span>
        <span className="text-gray-400 font-mono">
          MULTIPLIER: <strong className="text-[#44e2cd]">{currentMultiplier.toFixed(2)}x</strong>
        </span>
      </div>

      {/* 5x5 Mine Grid Canvas Area */}
      <div className="relative flex-1 flex flex-col items-center justify-center rounded-2xl bg-gradient-to-b from-zinc-900 to-black border border-white/10 p-2 my-2 overflow-hidden shadow-2xl">
        
        {/* 5x5 Grid */}
        <div className="grid grid-cols-5 gap-2 w-full max-w-[280px]">
          {Array.from({ length: 25 }).map((_, i) => {
            const isRevealed = revealed.includes(i)
            const isMine = minePositions.includes(i)

            return (
              <motion.button
                key={i}
                onClick={() => revealTile(i)}
                disabled={!playing || isRevealed || gameOver}
                whileTap={{ scale: 0.92 }}
                className={`aspect-square rounded-xl flex items-center justify-center text-xl font-black transition-all relative border ${
                  isRevealed
                    ? (isMine
                        ? 'bg-gradient-to-br from-red-600 to-rose-950 border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                        : 'bg-gradient-to-br from-emerald-500 to-teal-800 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]')
                    : playing
                    ? 'bg-gradient-to-br from-[#a078ff] to-[#44e2cd] border-white/20 text-black font-black hover:brightness-110 cursor-pointer shadow-md'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-700'
                }`}
              >
                {!isRevealed && playing && (
                  <span className="select-none font-extrabold text-sm text-black">
                    ?
                  </span>
                )}

                {!isRevealed && !playing && !gameOver && (
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                )}

                <AnimatePresence>
                  {isRevealed && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    >
                      {isMine ? (
                        <Bomb className="w-5 h-5 text-white" />
                      ) : (
                        <Gem className="w-5 h-5 text-white" />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            )
          })}
        </div>

        {/* Win/Loss Result Overlay */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className={`absolute top-3 px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-xl z-30 ${
                result.isWin
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-emerald-500/20'
                  : 'bg-red-500/20 text-red-400 border-red-500/40'
              }`}
            >
              {result.isWin
                ? `CASHED OUT (${result.multiplier.toFixed(2)}x)! +${result.payout.toFixed(2)} USDT`
                : 'HIT A MINE! GAME OVER'}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls & Action Button */}
      <div className="p-3 rounded-2xl bg-zinc-900/90 border border-white/10 space-y-2 shrink-0">
        
        {/* Mine Count Selector & Pick Random */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase">MINES:</span>
            <div className="flex gap-1">
              {[1, 3, 5, 10].map((m) => (
                <button
                  key={m}
                  onClick={() => { haptics.light(); !playing && setMineCount(m); }}
                  disabled={playing}
                  className={`px-2 py-0.5 rounded-lg border text-xs font-bold font-mono touch-spring ${
                    mineCount === m ? 'bg-[#ffb95f] text-black border-[#ffb95f]' : 'bg-zinc-800 border-white/5 text-gray-300'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          {playing && (
            <button
              onClick={pickRandomTile}
              className="p-1 rounded-lg bg-zinc-800 text-[#44e2cd] touch-spring text-[10px] font-bold"
            >
              RANDOM TILE
            </button>
          )}
        </div>

        {/* Action Button */}
        {playing ? (
          <button
            onClick={cashout}
            disabled={revealed.length === 0}
            className={`w-full py-2.5 rounded-xl font-black text-xs tracking-wider uppercase transition-all shadow-xl touch-spring cursor-pointer ${
              revealed.length === 0
                ? 'bg-zinc-800 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]'
            }`}
          >
            CASHOUT ${(wager * currentMultiplier).toFixed(2)} ({currentMultiplier.toFixed(2)}x)
          </button>
        ) : (
          <div className="grid grid-cols-5 gap-1.5">
            <button
              onClick={() => { haptics.light(); setWager(10); }}
              className={`py-2 rounded-xl border text-xs font-bold touch-spring ${wager === 10 ? 'bg-[#d0bcff] text-black border-[#d0bcff]' : 'bg-zinc-800 border-white/5 text-gray-300'}`}
            >
              $10
            </button>
            <button
              onClick={() => { haptics.light(); setWager(50); }}
              className={`py-2 rounded-xl border text-xs font-bold touch-spring ${wager === 50 ? 'bg-[#d0bcff] text-black border-[#d0bcff]' : 'bg-zinc-800 border-white/5 text-gray-300'}`}
            >
              $50
            </button>
            <button
              onClick={() => { haptics.light(); setWager(100); }}
              className={`py-2 rounded-xl border text-xs font-bold touch-spring ${wager === 100 ? 'bg-[#d0bcff] text-black border-[#d0bcff]' : 'bg-zinc-800 border-white/5 text-gray-300'}`}
            >
              $100
            </button>
            
            <button
              onClick={startGame}
              className="col-span-2 py-2.5 rounded-xl font-black text-xs tracking-wider uppercase transition-all shadow-xl touch-spring bg-gradient-to-r from-[#a078ff] via-[#44e2cd] to-[#a078ff] text-black shadow-[0_0_20px_rgba(68,226,205,0.3)] hover:scale-[1.01]"
            >
              START BET
            </button>
          </div>
        )}

      </div>

    </div>
  )
}
