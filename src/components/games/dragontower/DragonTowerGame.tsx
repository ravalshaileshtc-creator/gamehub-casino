'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Volume2, VolumeX, Minus, Plus, ShieldCheck, Trophy, RefreshCw, Key, CheckCircle, Copy, AlertTriangle } from 'lucide-react'
import { useWallet } from '@/context/WalletContext'
import { haptics } from '@/lib/haptics'
import { playSound } from '@/lib/sounds'
import { motion, AnimatePresence } from 'framer-motion'
import { DRAGON_CONFIG, DragonDifficulty } from '@/lib/dragonTowerDb'

const TOTAL_FLOORS = 10
const TOTAL_TILES = 5

interface TileState {
  revealed: boolean
  isEgg: boolean
}

export default function DragonTowerGame() {
  const { balance, debit, credit } = useWallet()

  // Game Configuration State
  const [difficulty, setDifficulty] = useState<DragonDifficulty>('MEDIUM')
  const [wager, setWager] = useState<number>(100)
  const [autoCashout, setAutoCashout] = useState<number>(0)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [clientSeedInput, setClientSeedInput] = useState<string>('player_seed_' + Math.random().toString(36).substring(2, 6))

  // Active Game State
  const [roundId, setRoundId] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentFloor, setCurrentFloor] = useState(0) // 0 = not started, 1 to 10
  const [isGameOver, setIsGameOver] = useState(false)
  const [hasWon, setHasWon] = useState(false)
  const [winAmount, setWinAmount] = useState(0)

  // Provably Fair Cryptographic Details
  const [serverSeedHash, setServerSeedHash] = useState<string>('')
  const [revealedServerSeed, setRevealedServerSeed] = useState<string | null>(null)
  const [activeClientSeed, setActiveClientSeed] = useState<string>('')
  const [activeNonce, setActiveNonce] = useState<number>(1)
  const [showFairnessModal, setShowFairnessModal] = useState(false)

  // Tower Grid State: 10 floors x 5 tiles
  const [grid, setGrid] = useState<TileState[][]>(() => {
    return Array(TOTAL_FLOORS).fill(null).map(() =>
      Array(TOTAL_TILES).fill(null).map(() => ({ revealed: false, isEgg: false }))
    )
  })

  const config = DRAGON_CONFIG[difficulty]

  // Reset grid whenever difficulty changes
  useEffect(() => {
    if (!isPlaying) {
      setGrid(Array(TOTAL_FLOORS).fill(null).map(() =>
        Array(TOTAL_TILES).fill(null).map(() => ({ revealed: false, isEgg: false }))
      ))
    }
  }, [difficulty, isPlaying])

  // 1. START NEW ROUND (Backend HMAC-SHA256 Setup)
  const startNewGame = useCallback(async () => {
    haptics.medium()
    if (soundEnabled) playSound('coin')

    const currentWager = Math.max(10, wager)
    debit(currentWager, 'Dragon Tower')

    try {
      const res = await fetch('/api/games/dragontower/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          betAmount: currentWager,
          difficulty,
          clientSeed: clientSeedInput
        })
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        alert(data.error || 'Failed to start game')
        return
      }

      setRoundId(data.roundId)
      setServerSeedHash(data.serverSeedHash)
      setActiveClientSeed(data.clientSeed)
      setActiveNonce(data.nonce)
      setRevealedServerSeed(null)

      // Initialize empty grid layout for 10 floors
      const freshGrid: TileState[][] = Array(TOTAL_FLOORS).fill(null).map(() =>
        Array(TOTAL_TILES).fill(null).map(() => ({ revealed: false, isEgg: false }))
      )

      setGrid(freshGrid)
      setCurrentFloor(0)
      setIsGameOver(false)
      setHasWon(false)
      setWinAmount(0)
      setIsPlaying(true)
    } catch (e) {
      console.error(e)
    }
  }, [wager, difficulty, clientSeedInput, soundEnabled, debit])

  // 2. PLAYER TILE SELECTION ON ACTIVE FLOOR
  const handleTileClick = async (floorIdx: number, tileIdx: number) => {
    if (!isPlaying || isGameOver || !roundId || floorIdx !== currentFloor) return

    haptics.light()

    try {
      const res = await fetch('/api/games/dragontower/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roundId,
          floor: floorIdx + 1, // 1-indexed (1 to 10)
          selectedTile: tileIdx
        })
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        // If round is expired or errored, unlock new game
        setIsPlaying(false)
        setIsGameOver(true)
        return
      }

      const isSafe = data.result === 'SAFE'
      const newGrid = [...grid]

      newGrid[floorIdx][tileIdx] = { revealed: true, isEgg: isSafe }
      setGrid(newGrid)

      if (isSafe) {
        // STEP SUCCESSFUL! (Golden Egg 🥚)
        haptics.medium()
        if (soundEnabled) playSound('peg')

        if (data.isTopFloor || data.status === 'CASHED_OUT') {
          // TOP FLOOR REACHED! MEGA WIN!
          haptics.heavy()
          if (soundEnabled) playSound('win')

          credit(data.payout, 'Dragon Tower')
          setRevealedServerSeed(data.serverSeed)

          // Reveal all tiles across 10 floors
          if (data.floorLayouts) {
            const revealedFullGrid = data.floorLayouts.map((row: boolean[], rIdx: number) =>
              row.map((isEggVal: boolean, tIdx: number) => ({
                revealed: true,
                isEgg: isEggVal
              }))
            )
            setGrid(revealedFullGrid)
          }

          setIsPlaying(false)
          setIsGameOver(true)
          setHasWon(true)
          setWinAmount(data.payout)
        } else {
          // Unlock next floor!
          setCurrentFloor(data.currentFloor)

          // Auto Cashout check
          const newMult = config.multipliers[data.currentFloor - 1]
          if (autoCashout > 1.00 && newMult >= autoCashout) {
            setTimeout(() => {
              handleCashout()
            }, 300)
          }
        }
      } else {
        // BUSTED! (Dragon Skull 💀)
        haptics.heavy()
        if (soundEnabled) playSound('lose')

        setRevealedServerSeed(data.serverSeed)

        // Reveal full 10-floor Layout
        if (data.floorLayouts) {
          const revealedFullGrid = data.floorLayouts.map((row: boolean[], rIdx: number) =>
            row.map((isEggVal: boolean, tIdx: number) => ({
              revealed: true,
              isEgg: isEggVal
            }))
          )
          setGrid(revealedFullGrid)
        }

        setIsPlaying(false)
        setIsGameOver(true)
        setHasWon(false)
      }
    } catch (e) {
      console.error(e)
      setIsPlaying(false)
      setIsGameOver(true)
    }
  }

  // 3. CASH OUT WINNINGS
  const handleCashout = async () => {
    if (!isPlaying || currentFloor === 0) return

    const fallbackMult = config.multipliers[currentFloor - 1]
    const fallbackPayout = +(wager * fallbackMult).toFixed(2)

    haptics.heavy()
    if (soundEnabled) playSound('win')

    // Instant local credit so UI never freezes
    credit(fallbackPayout, 'Dragon Tower')

    setIsPlaying(false)
    setIsGameOver(true)
    setHasWon(true)
    setWinAmount(fallbackPayout)

    if (roundId) {
      try {
        const res = await fetch('/api/games/dragontower/cashout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roundId })
        })

        const data = await res.json()
        if (res.ok && data.success) {
          setRevealedServerSeed(data.serverSeed)
          if (data.floorLayouts) {
            const revealedFullGrid = data.floorLayouts.map((row: boolean[], rIdx: number) =>
              row.map((isEggVal: boolean, tIdx: number) => ({
                revealed: true,
                isEgg: isEggVal
              }))
            )
            setGrid(revealedFullGrid)
          }
        }
      } catch (e) {
        console.error(e)
      }
    }
  }

  const currentMultiplier = currentFloor > 0 ? config.multipliers[currentFloor - 1] : 1.00

  return (
    <div className="h-full w-full overflow-hidden flex flex-col justify-between p-1 select-none text-white max-w-lg mx-auto">
      
      {/* Top Header matching Stitch UI */}
      <div className="flex justify-between items-center px-2.5 py-1.5 bg-[#1e1f26] rounded-xl border border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <Link 
            href="/" 
            onClick={() => haptics.light()} 
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#d0bcff] touch-spring"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-xs font-extrabold text-[#d0bcff] tracking-tighter uppercase font-sans flex items-center gap-1">
            🐉 DRAGON TOWER
          </h1>
        </div>
        
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowFairnessModal(true)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#44e2cd]/10 text-[#44e2cd] border border-[#44e2cd]/30 text-[10px] font-mono font-bold hover:bg-[#44e2cd]/20 transition"
          >
            <ShieldCheck className="w-3 h-3" /> Provably Fair
          </button>
          
          <div className="bg-[#111319] py-1 px-2.5 rounded-full flex items-center gap-1 border border-white/5 text-xs font-bold text-[#44e2cd] font-mono shadow-inner">
            💰 ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-lg bg-zinc-800 text-gray-400 hover:text-[#44e2cd] transition"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-[#44e2cd]" /> : <VolumeX className="w-3.5 h-3.5 text-red-400" />}
          </button>
        </div>
      </div>

      {/* Main 10-Floor Tower Display */}
      <div className="glass-panel rounded-2xl w-full flex-1 relative overflow-hidden flex flex-col justify-end p-2 bg-[#111319]/95 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] my-1">
        
        {/* Background Grid Mesh */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#d0bcff 1px, transparent 1px), linear-gradient(90deg, #d0bcff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

        {/* Win / Loss Overlay Banner */}
        <AnimatePresence>
          {isGameOver && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              className={`absolute top-2 left-2 right-2 z-30 p-2.5 rounded-xl backdrop-blur-xl border flex items-center justify-between shadow-2xl ${
                hasWon
                  ? 'bg-gradient-to-r from-emerald-950/90 to-teal-950/90 border-emerald-400 text-emerald-300 shadow-emerald-500/30'
                  : 'bg-gradient-to-r from-red-950/90 to-rose-950/90 border-red-500/50 text-red-300 shadow-red-500/20'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{hasWon ? '🏆' : '💀'}</span>
                <div>
                  <p className="text-[9px] uppercase font-black tracking-widest opacity-80">
                    {hasWon ? 'CLIMB SUCCESSFUL!' : 'DRAGON FIRE BUST!'}
                  </p>
                  <p className="text-sm font-black font-mono">
                    {hasWon ? `WON ₹${winAmount.toFixed(2)} (${currentMultiplier.toFixed(2)}x)` : `LOST ₹${wager}`}
                  </p>
                </div>
              </div>
              <button
                onClick={startNewGame}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase touch-spring shadow-md ${
                  hasWon ? 'bg-emerald-500 text-black' : 'bg-red-500 text-white'
                }`}
              >
                PLAY AGAIN
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 10 Floors (Floor 10 at Top, Floor 1 at Bottom) */}
        <div className="w-full flex flex-col gap-1 justify-end">
          {Array.from({ length: TOTAL_FLOORS }).map((_, idx) => {
            const floorIdx = TOTAL_FLOORS - 1 - idx // Floor index 9 at top, 0 at bottom
            const floorNumber = floorIdx + 1
            const isCurrentFloor = isPlaying && floorIdx === currentFloor
            const isPastFloor = isPlaying && floorIdx < currentFloor
            const mult = config.multipliers[floorIdx]

            return (
              <div 
                key={floorIdx}
                className={`flex items-center gap-1.5 p-1 rounded-xl transition-all ${
                  isCurrentFloor
                    ? 'bg-purple-950/50 border border-[#a078ff] shadow-[0_0_15px_rgba(160,120,255,0.4)] ring-1 ring-[#d0bcff]/30'
                    : isPastFloor
                    ? 'bg-emerald-950/30 border border-emerald-500/30'
                    : 'bg-[#191b22]/80 border border-white/5 opacity-70'
                }`}
              >
                {/* Floor Multiplier Badge */}
                <div className={`w-14 text-center py-1 rounded-lg text-[10px] font-black font-mono border shrink-0 ${
                  isCurrentFloor
                    ? 'bg-[#a078ff] text-black border-white/40 shadow-sm'
                    : isPastFloor
                    ? 'bg-emerald-900/60 text-emerald-300 border-emerald-500/30'
                    : 'bg-black/40 text-gray-400 border-white/5'
                }`}>
                  F{floorNumber}: {mult.toFixed(2)}x
                </div>

                {/* 5 Tiles per Floor Grid */}
                <div className="flex-1 grid grid-cols-5 gap-1">
                  {Array.from({ length: TOTAL_TILES }).map((_, tileIdx) => {
                    const tile = grid[floorIdx]?.[tileIdx]
                    const revealed = tile?.revealed

                    return (
                      <button
                        key={tileIdx}
                        disabled={!isCurrentFloor}
                        onClick={() => handleTileClick(floorIdx, tileIdx)}
                        className={`h-8 rounded-lg font-black text-xs flex items-center justify-center transition-all touch-spring ${
                          revealed && tile?.isEgg
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 border border-emerald-300 text-black shadow-[0_0_10px_rgba(16,185,129,0.8)] scale-95'
                            : revealed && !tile?.isEgg
                            ? 'bg-gradient-to-r from-red-600 to-rose-700 border border-red-400 text-white shadow-[0_0_10px_rgba(239,68,68,0.8)] scale-95'
                            : isCurrentFloor
                            ? 'bg-gradient-to-b from-[#282a30] to-[#1e1f26] hover:from-[#33343b] hover:to-[#282a30] border border-[#d0bcff]/40 text-[#d0bcff] shadow-md hover:scale-[1.03] cursor-pointer'
                            : 'bg-[#111319] border border-white/5 text-gray-600 cursor-not-allowed'
                        }`}
                      >
                        {revealed ? (tile?.isEgg ? '🥚' : '💀') : isCurrentFloor ? '❓' : ''}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

      </div>

      {/* Difficulty Selector Tabs */}
      <div className="grid grid-cols-4 gap-1 my-1 shrink-0">
        {(['EASY', 'MEDIUM', 'HARD', 'EXTREME'] as DragonDifficulty[]).map((d) => {
          const cfg = DRAGON_CONFIG[d]
          return (
            <button
              key={d}
              disabled={isPlaying}
              onClick={() => { haptics.light(); setDifficulty(d); }}
              className={`py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all touch-spring ${
                difficulty === d
                  ? 'bg-[#a078ff] text-black border-white/40 shadow-lg'
                  : 'bg-[#1e1f26] text-gray-400 border-white/5 hover:text-white disabled:opacity-50'
              }`}
            >
              {d === 'EASY' ? '🟢 Easy (80%)' : d === 'MEDIUM' ? '🟡 Med (60%)' : d === 'HARD' ? '🔴 Hard (40%)' : '🔥 Ext (20%)'}
            </button>
          )
        })}
      </div>

      {/* Control Console */}
      <div className="glass-panel rounded-2xl p-2.5 bg-[#1e1f26]/90 border border-white/10 space-y-2 shrink-0">
        
        {/* Wager Amount Input */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[10px] font-bold text-[#cbc3d7]">
            <span>STARTING BET AMOUNT (₹10+)</span>
            <div className="flex gap-1">
              <button disabled={isPlaying} onClick={() => setWager(prev => Math.max(10, Math.floor(prev / 2)))} className="bg-black/40 px-1.5 py-0.5 rounded text-gray-300 font-mono font-bold hover:text-white">1/2</button>
              <button disabled={isPlaying} onClick={() => setWager(prev => prev * 2)} className="bg-black/40 px-1.5 py-0.5 rounded text-gray-300 font-mono font-bold hover:text-white">2X</button>
            </div>
          </div>
          <div className="flex items-center bg-[#0a0c10] rounded-xl border border-[#33343b] p-1">
            <button 
              disabled={isPlaying}
              onClick={() => { haptics.light(); setWager(prev => Math.max(10, prev - 10)); }}
              className="w-7 h-7 flex items-center justify-center bg-[#1e1f26] rounded-lg text-white hover:text-[#d0bcff] touch-spring disabled:opacity-50"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <input 
              type="number" 
              disabled={isPlaying}
              value={wager}
              onChange={(e) => setWager(Math.max(10, parseFloat(e.target.value) || 10))}
              className="w-full bg-transparent text-center text-xs font-bold text-white font-mono outline-none disabled:opacity-50"
            />
            <button 
              disabled={isPlaying}
              onClick={() => { haptics.light(); setWager(prev => prev + 10); }}
              className="w-7 h-7 flex items-center justify-center bg-[#1e1f26] rounded-lg text-white hover:text-[#d0bcff] touch-spring disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Action Button */}
        {isPlaying && !isGameOver && currentFloor > 0 ? (
          <button
            onClick={handleCashout}
            className="w-full py-3 rounded-xl font-extrabold text-sm text-[#003731] bg-gradient-to-r from-[#44e2cd] to-[#03c6b2] shadow-[0_0_25px_rgba(68,226,205,0.8)] active:scale-95 transition-transform flex flex-col items-center justify-center touch-spring cursor-pointer animate-pulse"
          >
            <span className="uppercase tracking-wider text-base font-black">
              💰 CASH OUT (₹{(wager * currentMultiplier).toFixed(2)})
            </span>
            <span className="text-[10px] font-mono opacity-90">
              Floor {currentFloor} of 10 ({currentMultiplier.toFixed(2)}x)
            </span>
          </button>
        ) : isPlaying && !isGameOver ? (
          <button
            disabled
            className="w-full py-3 rounded-xl font-black text-xs text-purple-200 bg-purple-950/80 border border-purple-500/40 flex items-center justify-center gap-2 uppercase tracking-wider animate-pulse"
          >
            👇 PICK A TILE ON FLOOR 1
          </button>
        ) : (
          <button
            onClick={startNewGame}
            className="w-full py-3 rounded-xl font-black text-sm text-black btn-gold-gradient shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2 touch-spring cursor-pointer uppercase tracking-wider"
          >
            🐉 START CLIMB (₹{wager})
          </button>
        )}

      </div>

      {/* Provably Fair Verification Modal */}
      <AnimatePresence>
        {showFairnessModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#191b22] border border-white/10 rounded-2xl p-4 max-w-md w-full space-y-3 text-xs"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <h3 className="font-extrabold text-sm text-[#44e2cd] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> Provably Fair Verification
                </h3>
                <button onClick={() => setShowFairnessModal(false)} className="text-gray-400 hover:text-white font-bold text-sm">✕</button>
              </div>

              <div className="space-y-2 font-mono">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-0.5">SERVER SEED HASH (SHA256):</label>
                  <div className="bg-[#0f1015] p-2 rounded-lg border border-white/5 break-all text-[10px] text-[#d0bcff]">
                    {serverSeedHash || 'Starts when game begins'}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 block mb-0.5">CLIENT SEED (USER SEED):</label>
                  <input
                    type="text"
                    disabled={isPlaying}
                    value={clientSeedInput}
                    onChange={(e) => setClientSeedInput(e.target.value)}
                    className="w-full bg-[#0f1015] p-2 rounded-lg border border-white/10 text-[11px] text-white outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 block mb-0.5">NONCE:</label>
                  <div className="bg-[#0f1015] p-2 rounded-lg border border-white/5 text-[11px] text-emerald-400 font-bold">
                    {activeNonce}
                  </div>
                </div>

                {revealedServerSeed && (
                  <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/40 space-y-1">
                    <span className="text-[10px] text-emerald-300 font-bold block">REVEALED UNHASHED SERVER SEED:</span>
                    <div className="break-all text-[10px] text-white bg-black/60 p-1.5 rounded">
                      {revealedServerSeed}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-white/10 flex justify-end">
                <button
                  onClick={() => setShowFairnessModal(false)}
                  className="px-4 py-2 bg-[#44e2cd] text-black font-extrabold rounded-xl"
                >
                  CLOSE VERIFICATION
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
