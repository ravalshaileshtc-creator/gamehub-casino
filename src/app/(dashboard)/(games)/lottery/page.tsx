'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Volume2, VolumeX, Minus, Plus, Trophy, Sparkles, RefreshCw, Zap, Users, Flame } from 'lucide-react'
import { useWallet } from '@/context/WalletContext'
import { haptics } from '@/lib/haptics'
import { playSound } from '@/lib/sounds'
import { motion, AnimatePresence } from 'framer-motion'
import { db } from '@/lib/firebase'
import { doc, setDoc } from 'firebase/firestore'

// Single Number Lucky Ball Configuration (0-9)
export type BetType = 'SINGLE' | 'EVEN' | 'ODD' | 'LOW' | 'HIGH'

interface BetOption {
  type: BetType
  label: string
  multiplier: number
  description: string
  numbers: number[]
}

const BET_TYPES_CONFIG: Record<BetType, BetOption> = {
  SINGLE: { type: 'SINGLE', label: 'SINGLE NUMBER', multiplier: 9.0, description: 'Select 1 number (0-9)', numbers: [] },
  EVEN: { type: 'EVEN', label: 'EVEN (BEKI)', multiplier: 1.9, description: '0, 2, 4, 6, 8', numbers: [0, 2, 4, 6, 8] },
  ODD: { type: 'ODD', label: 'ODD', multiplier: 1.9, description: '1, 3, 5, 7, 9', numbers: [1, 3, 5, 7, 9] },
  LOW: { type: 'LOW', label: 'LOW (0-5)', multiplier: 1.5, description: '0, 1, 2, 3, 4, 5', numbers: [0, 1, 2, 3, 4, 5] },
  HIGH: { type: 'HIGH', label: 'HIGH (6-9)', multiplier: 2.25, description: '6, 7, 8, 9', numbers: [6, 7, 8, 9] },
}

const BALL_PALETTE = [
  '#ef4444', // 0 Red
  '#3b82f6', // 1 Blue
  '#22c55e', // 2 Green
  '#f97316', // 3 Orange
  '#a855f7', // 4 Purple
  '#ec4899', // 5 Pink
  '#06b6d4', // 6 Cyan
  '#eab308', // 7 Gold
  '#10b981', // 8 Emerald
  '#f43f5e', // 9 Rose
]

interface Ball3D {
  num: number
  x: number
  y: number
  vx: number
  vy: number
  color: string
  radius: number
}

interface ActiveBet {
  id: string
  betType: BetType
  selectedNumber: number | null
  amount: number
  roundId: number
}

type RoundPhase = 'BETTING' | 'DRAWING' | 'RESULT'

export default function SingleNumberLuckyBallGame() {
  const { balance, debit, credit, addDemoCoins } = useWallet()

  // Game Engine State
  const [roundId, setRoundId] = useState(8842)
  const [phase, setPhase] = useState<RoundPhase>('BETTING')
  const [timeLeft, setTimeLeft] = useState(30) // 30s Betting phase
  const [winningNumber, setWinningNumber] = useState<number | null>(null)
  const [history, setHistory] = useState<number[]>([7, 2, 9, 0, 4, 1, 8])

  // Player Bet Controls
  const [selectedBetType, setSelectedBetType] = useState<BetType>('SINGLE')
  const [selectedSingleNumber, setSelectedSingleNumber] = useState<number>(7)
  const [wager, setWager] = useState<number>(100)
  const [myBets, setMyBets] = useState<ActiveBet[]>([])
  const [soundEnabled, setSoundEnabled] = useState(true)

  // Live Stats
  const [livePlayers] = useState(148)
  const [totalPool, setTotalPool] = useState(45280)
  const [lastWinAnnouncement, setLastWinAnnouncement] = useState<{ isWin: boolean; payout: number; msg: string } | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ballsRef = useRef<Ball3D[]>([])
  const animRef = useRef<number | null>(null)

  // Initialize 10 Bouncing Balls (0-9) inside pneumatic chamber
  useEffect(() => {
    const balls: Ball3D[] = []
    for (let i = 0; i <= 9; i++) {
      balls.push({
        num: i,
        x: Math.random() * 180 + 30,
        y: Math.random() * 180 + 30,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        color: BALL_PALETTE[i],
        radius: 13
      })
    }
    ballsRef.current = balls
  }, [])

  // 60 FPS HTML5 Canvas Pneumatic Sphere Tumbler Physics
  const drawTumbler = useCallback((isDrawingPhase: boolean, drawnNum: number | null) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = Math.min(canvas.parentElement?.clientWidth || 280, 280)
    canvas.width = size * 2
    canvas.height = size * 2
    ctx.scale(2, 2)

    const cx = size / 2
    const cy = size / 2 + 10
    const radius = size * 0.40

    ctx.clearRect(0, 0, size, size)

    // 1. Draw Pneumatic Sphere Outer Glass Vessel & Glow
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    const glassGrad = ctx.createRadialGradient(cx - 20, cy - 20, 10, cx, cy, radius)
    glassGrad.addColorStop(0, 'rgba(255, 255, 255, 0.15)')
    glassGrad.addColorStop(0.6, 'rgba(15, 23, 42, 0.85)')
    glassGrad.addColorStop(1, 'rgba(11, 15, 25, 0.98)')
    ctx.fillStyle = glassGrad
    ctx.shadowColor = '#F6B400'
    ctx.shadowBlur = isDrawingPhase ? 30 : 15
    ctx.fill()
    ctx.strokeStyle = '#F6B400'
    ctx.lineWidth = 3
    ctx.stroke()
    ctx.restore()

    // 2. Top Suction Chute Tube
    ctx.save()
    ctx.fillStyle = '#151B2D'
    ctx.strokeStyle = '#F6B400'
    ctx.lineWidth = 2
    ctx.fillRect(cx - 16, cy - radius - 24, 32, 28)
    ctx.strokeRect(cx - 16, cy - radius - 24, 32, 28)
    ctx.restore()

    // 3. Update & Render Bouncing Balls (0-9)
    const balls = ballsRef.current
    const speedMult = isDrawingPhase ? 2.5 : 1.0

    for (let i = 0; i < balls.length; i++) {
      const b = balls[i]

      // Pneumatic Air Turbulance
      b.x += b.vx * speedMult
      b.y += b.vy * speedMult

      // Boundary Collision inside Sphere Vessel
      const dx = b.x - cx
      const dy = b.y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist + b.radius > radius - 2) {
        const nx = dx / dist
        const ny = dy / dist
        const dot = b.vx * nx + b.vy * ny
        b.vx -= 2 * dot * nx
        b.vy -= 2 * dot * ny

        // Reposition inside
        b.x = cx + nx * (radius - 2 - b.radius)
        b.y = cy + ny * (radius - 2 - b.radius)
      }

      // Render Ball
      ctx.save()
      ctx.beginPath()
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2)
      const bGrad = ctx.createRadialGradient(b.x - 3, b.y - 3, 1, b.x, b.y, b.radius)
      bGrad.addColorStop(0, '#ffffff')
      bGrad.addColorStop(0.4, b.color)
      bGrad.addColorStop(1, '#000000')
      ctx.fillStyle = bGrad
      ctx.shadowColor = b.color
      ctx.shadowBlur = 8
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'
      ctx.lineWidth = 1
      ctx.stroke()

      // Render Number on Ball
      ctx.fillStyle = '#ffffff'
      ctx.font = 'black 11px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(b.num.toString(), b.x, b.y)
      ctx.restore()
    }

    // 4. If Drawn Winning Ball is Suctioned to Top Chute
    if (drawnNum !== null) {
      ctx.save()
      const winColor = BALL_PALETTE[drawnNum]
      const wx = cx
      const wy = cy - radius - 10

      ctx.beginPath()
      ctx.arc(wx, wy, 16, 0, Math.PI * 2)
      const wGrad = ctx.createRadialGradient(wx - 4, wy - 4, 1, wx, wy, 16)
      wGrad.addColorStop(0, '#ffffff')
      wGrad.addColorStop(0.4, winColor)
      wGrad.addColorStop(1, '#000000')
      ctx.fillStyle = wGrad
      ctx.shadowColor = '#F6B400'
      ctx.shadowBlur = 25
      ctx.fill()
      ctx.strokeStyle = '#F6B400'
      ctx.lineWidth = 2.5
      ctx.stroke()

      ctx.fillStyle = '#ffffff'
      ctx.font = 'black 14px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(drawnNum.toString(), wx, wy)
      ctx.restore()
    }
  }, [])

  // Canvas Continuous Physics Loop
  useEffect(() => {
    const loop = () => {
      drawTumbler(phase === 'DRAWING', winningNumber)
      animRef.current = requestAnimationFrame(loop)
    }
    animRef.current = requestAnimationFrame(loop)
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [drawTumbler, phase, winningNumber])

  // Master Round Timer Engine (30s Betting -> 5s Drawing -> 5s Result -> Repeat)
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev > 1) return prev - 1

        // Phase Transition Trigger
        if (phase === 'BETTING') {
          // Enter DRAWING Phase
          setPhase('DRAWING')
          haptics.medium()
          if (soundEnabled) playSound('coin')

          // Draw Secure Random Winning Ball (0-9)
          const winningBall = Math.floor(Math.random() * 10)
          
          setTimeout(() => {
            setWinningNumber(winningBall)
            setPhase('RESULT')
            evaluateRoundResult(winningBall)
          }, 4000)

          return 5 // 5s drawing delay
        } else if (phase === 'RESULT') {
          // Restart Next Round
          setPhase('BETTING')
          setWinningNumber(null)
          setMyBets([])
          setLastWinAnnouncement(null)
          setRoundId(r => r + 1)
          return 30 // Reset 30s Betting phase
        }

        return 5
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [phase, myBets, wager, balance, soundEnabled])

  // Evaluate Round Winning Payouts & Sync to Firebase
  const evaluateRoundResult = async (winNum: number) => {
    let totalWinPayout = 0
    let totalSpent = 0

    myBets.forEach(b => {
      totalSpent += b.amount
      let won = false
      let mult = 0

      if (b.betType === 'SINGLE' && b.selectedNumber === winNum) {
        won = true
        mult = 9.0
      } else if (b.betType === 'EVEN' && winNum % 2 === 0) {
        won = true
        mult = 1.9
      } else if (b.betType === 'ODD' && winNum % 2 !== 0) {
        won = true
        mult = 1.9
      } else if (b.betType === 'LOW' && winNum >= 0 && winNum <= 5) {
        won = true
        mult = 1.5
      } else if (b.betType === 'HIGH' && winNum >= 6 && winNum <= 9) {
        won = true
        mult = 2.25
      }

      if (won) {
        totalWinPayout += +(b.amount * mult).toFixed(2)
      }
    })

    // Update History
    setHistory(prev => [winNum, ...prev.slice(0, 7)])

    if (totalWinPayout > 0) {
      haptics.heavy()
      if (soundEnabled) playSound('win')
      await credit(totalWinPayout, 'LUCKY_BALL')
      setLastWinAnnouncement({
        isWin: true,
        payout: totalWinPayout,
        msg: `🎉 YOU WON ₹${totalWinPayout.toFixed(2)}!`
      })
    } else if (myBets.length > 0) {
      haptics.error()
      if (soundEnabled) playSound('lose')
      setLastWinAnnouncement({
        isWin: false,
        payout: 0,
        msg: `🔴 WINNING BALL WAS ${winNum}`
      })
    }

    // Sync Round & Bets Data to Firebase Firestore
    try {
      const rDocRef = doc(db, 'rounds', `round_${roundId}`)
      await setDoc(rDocRef, {
        roundId,
        winningNumber: winNum,
        timestamp: new Date().toISOString(),
        totalPool: totalPool + totalSpent
      }, { merge: true })
    } catch (e) {
      console.warn('Firebase Round Sync Note:', e)
    }
  }

  // Place Bet Action Handler
  const placeBet = async () => {
    if (phase !== 'BETTING') return
    if (wager <= 0) return

    haptics.medium()
    if (soundEnabled) playSound('coin')

    if (balance < wager) {
      addDemoCoins(1000)
    }

    const success = await debit(wager, 'LUCKY_BALL')
    if (!success) return

    const newBet: ActiveBet = {
      id: `bet_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      betType: selectedBetType,
      selectedNumber: selectedBetType === 'SINGLE' ? selectedSingleNumber : null,
      amount: wager,
      roundId
    }

    setMyBets(prev => [...prev, newBet])
    setTotalPool(p => p + wager)

    // Sync Bet to Firebase Firestore
    try {
      const bDocRef = doc(db, 'bets', newBet.id)
      await setDoc(bDocRef, {
        betId: newBet.id,
        roundId,
        betType: selectedBetType,
        selectedNumber: selectedBetType === 'SINGLE' ? selectedSingleNumber : null,
        amount: wager,
        timestamp: new Date().toISOString()
      }, { merge: true })
    } catch (e) {
      console.warn('Firebase Bet Sync Note:', e)
    }
  }

  const currentConfig = BET_TYPES_CONFIG[selectedBetType]

  return (
    <div className="h-full w-full overflow-hidden flex flex-col justify-between p-1 select-none text-white max-w-lg mx-auto bg-[#0B0F19]">
      
      {/* Top Section Header */}
      <div className="flex justify-between items-center px-2.5 py-1.5 bg-[#151B2D] rounded-xl border border-[#F6B400]/20 shrink-0">
        <div className="flex items-center gap-2">
          <Link href="/" onClick={() => haptics.light()} className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-[#F6B400]">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xs font-black text-[#F6B400] tracking-wider uppercase flex items-center gap-1">
              🎱 LUCKY BALL 0-9
            </h1>
            <p className="text-[9px] text-gray-400 font-mono">ROUND #{roundId}</p>
          </div>
        </div>

        {/* Live Round Countdown & Status */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-[9px] uppercase font-bold text-gray-400 block">
              {phase === 'BETTING' ? 'BETTING CLOSES' : phase === 'DRAWING' ? 'DRAWING...' : 'RESULT'}
            </span>
            <span className={`text-sm font-black font-mono ${timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-[#F6B400]'}`}>
              00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
            </span>
          </div>

          <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-1.5 rounded-lg bg-black/40 text-gray-400 hover:text-[#F6B400]">
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-[#F6B400]" /> : <VolumeX className="w-3.5 h-3.5 text-red-400" />}
          </button>
        </div>
      </div>

      {/* Previous Results Badges */}
      <div className="flex items-center justify-between px-2 py-1 bg-[#151B2D]/80 rounded-lg border border-white/5 text-[10px] shrink-0 my-0.5">
        <span className="text-gray-400 font-bold">HISTORY:</span>
        <div className="flex gap-1 overflow-x-auto">
          {history.map((num, i) => (
            <span key={i} className="w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center text-black border border-white/40 shadow-sm" style={{ backgroundColor: BALL_PALETTE[num] }}>
              {num}
            </span>
          ))}
        </div>
      </div>

      {/* Center 3D Sphere Tumbler Machine */}
      <div className="relative flex-1 flex flex-col items-center justify-center rounded-2xl bg-gradient-to-b from-[#151B2D] to-[#0B0F19] border border-[#F6B400]/20 p-1 my-0.5 overflow-hidden shadow-2xl">
        
        {/* Canvas Sphere Machine */}
        <div className="w-64 h-64 relative flex items-center justify-center">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>

        {/* Live Pool & Players Overlay */}
        <div className="absolute top-2 left-3 flex gap-3 text-[10px] font-mono text-gray-400 bg-black/60 px-2 py-0.5 rounded-full border border-white/10">
          <span className="flex items-center gap-1"><Users className="w-3 h-3 text-[#F6B400]" /> {livePlayers} PLAYERS</span>
          <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-400" /> POOL: ₹{totalPool.toLocaleString()}</span>
        </div>

        {/* Win/Loss Result Announcement Overlay */}
        <AnimatePresence>
          {lastWinAnnouncement && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`absolute bottom-2 px-4 py-1.5 rounded-xl backdrop-blur-xl border flex items-center gap-2 shadow-2xl z-30 ${
                lastWinAnnouncement.isWin
                  ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300 shadow-emerald-500/30'
                  : 'bg-red-950/90 border-red-500/50 text-red-300 shadow-red-500/20'
              }`}
            >
              <span className="text-base">{lastWinAnnouncement.isWin ? '🏆' : '🔴'}</span>
              <span className="text-xs font-black uppercase tracking-wider font-mono">
                {lastWinAnnouncement.msg}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bet Type Selection Tabs */}
      <div className="grid grid-cols-5 gap-1 shrink-0 my-0.5">
        {(Object.keys(BET_TYPES_CONFIG) as BetType[]).map(bt => {
          const cfg = BET_TYPES_CONFIG[bt]
          const isSelected = selectedBetType === bt
          return (
            <button
              key={bt}
              disabled={phase !== 'BETTING'}
              onClick={() => { haptics.light(); setSelectedBetType(bt); }}
              className={`py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all touch-spring ${
                isSelected
                  ? 'bg-[#F6B400] text-black border-[#F6B400] shadow-[0_0_12px_rgba(246,180,0,0.6)] font-black scale-95'
                  : 'bg-[#151B2D] text-gray-400 border-white/5 hover:text-white disabled:opacity-50'
              }`}
            >
              <div>{cfg.type}</div>
              <div className="text-[8px] opacity-80 font-mono">{cfg.multiplier}x</div>
            </button>
          )
        })}
      </div>

      {/* Single Number Selector Grid (0-9) - Enabled when BetType === 'SINGLE' */}
      {selectedBetType === 'SINGLE' && (
        <div className="bg-[#151B2D]/90 p-1.5 rounded-xl border border-[#F6B400]/20 shrink-0 my-0.5 space-y-1">
          <div className="text-[9px] font-bold text-gray-300 flex justify-between">
            <span>SELECT SINGLE NUMBER (0-9)</span>
            <span className="text-[#F6B400] font-mono">9.00x PAYOUT</span>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => {
              const isSelected = selectedSingleNumber === num
              return (
                <button
                  key={num}
                  disabled={phase !== 'BETTING'}
                  onClick={() => { haptics.light(); setSelectedSingleNumber(num); }}
                  className={`h-8 rounded-lg font-black text-xs transition-all touch-spring border flex items-center justify-center ${
                    isSelected
                      ? 'bg-gradient-to-tr from-[#F6B400] to-yellow-300 text-black border-[#F6B400] shadow-[0_0_15px_rgba(246,180,0,0.8)] scale-95'
                      : 'bg-black/40 text-white border-white/10 hover:border-white/30'
                  }`}
                  style={{ color: isSelected ? '#000000' : BALL_PALETTE[num] }}
                >
                  {num}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Control Console */}
      <div className="bg-[#151B2D] rounded-2xl p-2 border border-white/10 space-y-1.5 shrink-0">
        
        {/* Wager Presets */}
        <div className="flex justify-between items-center text-[9px] font-bold text-gray-300">
          <span>BET AMOUNT (₹)</span>
          <div className="flex gap-1">
            {[10, 50, 100, 500, 1000].map(amt => (
              <button
                key={amt}
                disabled={phase !== 'BETTING'}
                onClick={() => { haptics.light(); setWager(amt); }}
                className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold touch-spring ${
                  wager === amt ? 'bg-[#F6B400] text-black' : 'bg-black/40 text-gray-300 hover:text-white'
                }`}
              >
                ₹{amt}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Wager Input */}
        <div className="flex items-center bg-[#0B0F19] rounded-xl border border-white/10 p-1">
          <button 
            disabled={phase !== 'BETTING'}
            onClick={() => { haptics.light(); setWager(prev => Math.max(10, prev - 10)); }}
            className="w-7 h-7 flex items-center justify-center bg-[#151B2D] rounded-lg text-white hover:text-[#F6B400] touch-spring disabled:opacity-50"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <input 
            type="number" 
            disabled={phase !== 'BETTING'}
            value={wager}
            onChange={(e) => setWager(Math.max(10, parseFloat(e.target.value) || 10))}
            className="w-full bg-transparent text-center text-xs font-bold text-white font-mono outline-none disabled:opacity-50"
          />
          <button 
            disabled={phase !== 'BETTING'}
            onClick={() => { haptics.light(); setWager(prev => prev + 10); }}
            className="w-7 h-7 flex items-center justify-center bg-[#151B2D] rounded-lg text-white hover:text-[#F6B400] touch-spring disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Main Action Button */}
        <button
          onClick={placeBet}
          disabled={phase !== 'BETTING'}
          className={`w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-transform active:scale-95 touch-spring cursor-pointer shadow-xl ${
            phase !== 'BETTING'
              ? 'bg-zinc-800 text-gray-500 cursor-not-allowed border border-white/5'
              : 'bg-gradient-to-r from-[#F6B400] via-yellow-400 to-[#F6B400] text-black shadow-[0_0_20px_rgba(246,180,0,0.4)]'
          }`}
        >
          {phase === 'BETTING' ? (
            `💰 PLACE BET (₹${wager}) - ${currentConfig.label}`
          ) : (
            `⏳ DRAWING IN PROGRESS...`
          )}
        </button>

      </div>

    </div>
  )
}
