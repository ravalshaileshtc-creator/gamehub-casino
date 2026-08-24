'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Volume2, VolumeX, Minus, Plus, Trophy, Disc, Sparkles } from 'lucide-react'
import { useWallet } from '@/context/WalletContext'
import { haptics } from '@/lib/haptics'
import { playSound } from '@/lib/sounds'
import { motion, AnimatePresence } from 'framer-motion'

// Authentic European Roulette Wheel Order (37 pockets)
const ROULETTE_POCKETS = [
  { num: 0, color: 'green' },
  { num: 32, color: 'red' }, { num: 15, color: 'black' }, { num: 19, color: 'red' },
  { num: 4, color: 'black' }, { num: 21, color: 'red' }, { num: 2, color: 'black' },
  { num: 25, color: 'red' }, { num: 17, color: 'black' }, { num: 34, color: 'red' },
  { num: 6, color: 'black' }, { num: 27, color: 'red' }, { num: 13, color: 'black' },
  { num: 36, color: 'red' }, { num: 11, color: 'black' }, { num: 30, color: 'red' },
  { num: 8, color: 'black' }, { num: 23, color: 'red' }, { num: 10, color: 'black' },
  { num: 5, color: 'red' }, { num: 24, color: 'black' }, { num: 16, color: 'red' },
  { num: 33, color: 'black' }, { num: 1, color: 'red' }, { num: 20, color: 'black' },
  { num: 14, color: 'red' }, { num: 31, color: 'black' }, { num: 9, color: 'red' },
  { num: 22, color: 'black' }, { num: 18, color: 'red' }, { num: 29, color: 'black' },
  { num: 7, color: 'red' }, { num: 28, color: 'black' }, { num: 12, color: 'red' },
  { num: 35, color: 'black' }, { num: 3, color: 'red' }, { num: 26, color: 'black' },
]

export type BetType = 'RED' | 'BLACK' | 'EVEN' | 'ODD' | 'ZERO' | '1ST_12' | '2ND_12' | '3RD_12'

interface BetConfig {
  type: BetType
  label: string
  multiplier: number
  colorClass: string
}

const BET_OPTIONS: Record<BetType, BetConfig> = {
  RED: { type: 'RED', label: '🔴 RED (2x)', multiplier: 2.0, colorClass: 'bg-red-600 border-red-400 text-white shadow-red-600/50' },
  BLACK: { type: 'BLACK', label: '🖤 BLACK (2x)', multiplier: 2.0, colorClass: 'bg-zinc-800 border-zinc-500 text-white shadow-zinc-600/50' },
  EVEN: { type: 'EVEN', label: '2️⃣ EVEN (2x)', multiplier: 2.0, colorClass: 'bg-indigo-600 border-indigo-400 text-white' },
  ODD: { type: 'ODD', label: '1️⃣ ODD (2x)', multiplier: 2.0, colorClass: 'bg-purple-600 border-purple-400 text-white' },
  ZERO: { type: 'ZERO', label: '🟢 ZERO (36x)', multiplier: 36.0, colorClass: 'bg-emerald-600 border-emerald-400 text-white' },
  '1ST_12': { type: '1ST_12', label: '1-12 (3x)', multiplier: 3.0, colorClass: 'bg-blue-600 border-blue-400 text-white' },
  '2ND_12': { type: '2ND_12', label: '13-24 (3x)', multiplier: 3.0, colorClass: 'bg-amber-600 border-amber-400 text-white' },
  '3RD_12': { type: '3RD_12', label: '25-36 (3x)', multiplier: 3.0, colorClass: 'bg-teal-600 border-teal-400 text-white' },
}

export default function EuropeanRouletteGame() {
  const { balance, debit, credit, addDemoCoins } = useWallet()

  // Game Configuration State
  const [wager, setWager] = useState<number>(100)
  const [selectedBet, setSelectedBet] = useState<BetType>('RED')
  const [soundEnabled, setSoundEnabled] = useState(true)

  // Wheel Animation Engine State
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<{ isWin: boolean; number: number; color: string; payout: number } | null>(null)
  const [history, setHistory] = useState<{ num: number; color: string }[]>([
    { num: 32, color: 'red' },
    { num: 15, color: 'black' },
    { num: 0, color: 'green' },
    { num: 19, color: 'red' },
    { num: 4, color: 'black' }
  ])

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

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number | null>(null)

  // Draw High-Resolution European Roulette Wheel Canvas
  const drawWheel = useCallback((wAngle: number, bAngle: number, bRadiusFactor: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = Math.min(canvas.parentElement?.clientWidth || 320, 320)
    canvas.width = size * 2 // High-DPI scaling
    canvas.height = size * 2
    ctx.scale(2, 2)

    const cx = size / 2
    const cy = size / 2
    const outerRadius = size * 0.46
    const pocketOuterR = size * 0.40
    const pocketInnerR = size * 0.26
    const hubRadius = size * 0.16
    const numPockets = ROULETTE_POCKETS.length
    const sliceAngle = (Math.PI * 2) / numPockets

    ctx.clearRect(0, 0, size, size)

    // 1. Draw Metallic Outer Brass Rim & Shadow
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, outerRadius, 0, Math.PI * 2)
    const rimGrad = ctx.createRadialGradient(cx, cy, pocketOuterR, cx, cy, outerRadius)
    rimGrad.addColorStop(0, '#78350f')
    rimGrad.addColorStop(0.3, '#f59e0b')
    rimGrad.addColorStop(0.7, '#d97706')
    rimGrad.addColorStop(1, '#451a03')
    ctx.fillStyle = rimGrad
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)'
    ctx.shadowBlur = 20
    ctx.fill()
    ctx.restore()

    // 2. Draw 37 Pocket Slices
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(wAngle)

    for (let i = 0; i < numPockets; i++) {
      const startA = i * sliceAngle - Math.PI / 2
      const endA = startA + sliceAngle
      const item = ROULETTE_POCKETS[i]

      ctx.beginPath()
      ctx.arc(0, 0, pocketOuterR, startA, endA)
      ctx.arc(0, 0, pocketInnerR, endA, startA, true)
      ctx.closePath()

      if (item.color === 'red') ctx.fillStyle = '#dc2626'
      else if (item.color === 'black') ctx.fillStyle = '#18181b'
      else ctx.fillStyle = '#10b981'

      ctx.fill()
      ctx.strokeStyle = '#f59e0b'
      ctx.lineWidth = 0.8
      ctx.stroke()

      // Render Number Label inside Pocket
      ctx.save()
      const midAngle = startA + sliceAngle / 2
      const textRadius = (pocketOuterR + pocketInnerR) / 2
      const tx = Math.cos(midAngle) * textRadius
      const ty = Math.sin(midAngle) * textRadius

      ctx.translate(tx, ty)
      ctx.rotate(midAngle + Math.PI / 2)
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 9px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(item.num.toString(), 0, 0)
      ctx.restore()
    }

    // 3. Draw Center Metallic Hub & Silver Spokes
    ctx.beginPath()
    ctx.arc(0, 0, pocketInnerR, 0, Math.PI * 2)
    const hubGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, pocketInnerR)
    hubGrad.addColorStop(0, '#fef08a')
    hubGrad.addColorStop(0.5, '#ca8a04')
    hubGrad.addColorStop(1, '#78350f')
    ctx.fillStyle = hubGrad
    ctx.fill()
    ctx.strokeStyle = '#fbbf24'
    ctx.lineWidth = 1.5
    ctx.stroke()

    // Central Chrome Turret
    ctx.beginPath()
    ctx.arc(0, 0, hubRadius, 0, Math.PI * 2)
    const centerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, hubRadius)
    centerGrad.addColorStop(0, '#ffffff')
    centerGrad.addColorStop(0.4, '#94a3b8')
    centerGrad.addColorStop(1, '#334155')
    ctx.fillStyle = centerGrad
    ctx.fill()
    ctx.restore()

    // 4. Draw Top Fixed Pointer Marker at 12 o'clock
    ctx.save()
    ctx.fillStyle = '#fbbf24'
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(cx - 10, cy - outerRadius - 4)
    ctx.lineTo(cx + 10, cy - outerRadius - 4)
    ctx.lineTo(cx, cy - pocketOuterR + 4)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.restore()

    // 5. Draw Rolling White Ivory Ball
    if (bAngle !== 0 || spinning) {
      ctx.save()
      const currentBallR = pocketOuterR * bRadiusFactor
      const ballX = cx + Math.cos(bAngle) * currentBallR
      const ballY = cy + Math.sin(bAngle) * currentBallR

      // Ball Shadow
      ctx.beginPath()
      ctx.arc(ballX + 2, ballY + 2, 5, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(0,0,0,0.4)'
      ctx.fill()

      // Ivory Metallic Ball
      ctx.beginPath()
      ctx.arc(ballX, ballY, 5.5, 0, Math.PI * 2)
      const ballGrad = ctx.createRadialGradient(ballX - 1.5, ballY - 1.5, 0.5, ballX, ballY, 5.5)
      ballGrad.addColorStop(0, '#ffffff')
      ballGrad.addColorStop(0.6, '#f1f5f9')
      ballGrad.addColorStop(1, '#94a3b8')
      ctx.fillStyle = ballGrad
      ctx.fill()
      ctx.strokeStyle = '#cbd5e1'
      ctx.lineWidth = 0.5
      ctx.stroke()
      ctx.restore()
    }
  }, [spinning])

  const wheelAngleRef = useRef(0)
  const ballAngleRef = useRef(0)
  const ballRadiusOffsetRef = useRef(1.0)

  // Canvas Initial & Continuous Render Loop
  useEffect(() => {
    drawWheel(wheelAngleRef.current, ballAngleRef.current, ballRadiusOffsetRef.current)
  }, [drawWheel])

  // Spin European Roulette Wheel Physics Engine
  const spinWheel = async () => {
    if (spinning) return

    haptics.medium()
    if (soundEnabled) playSound('coin')

    if (balance < wager) {
      addDemoCoins(1000)
    }

    debit(wager, 'European Roulette')
    setSpinning(true)
    setResult(null)

    // Secret Result Pocket Picker
    const winIdx = Math.floor(Math.random() * ROULETTE_POCKETS.length)
    const winningObj = ROULETTE_POCKETS[winIdx]

    // Determine Win Condition
    let isWin = false
    const cfg = BET_OPTIONS[selectedBet]

    if (selectedBet === 'RED') isWin = winningObj.color === 'red'
    else if (selectedBet === 'BLACK') isWin = winningObj.color === 'black'
    else if (selectedBet === 'EVEN') isWin = winningObj.num > 0 && winningObj.num % 2 === 0
    else if (selectedBet === 'ODD') isWin = winningObj.num > 0 && winningObj.num % 2 !== 0
    else if (selectedBet === 'ZERO') isWin = winningObj.num === 0
    else if (selectedBet === '1ST_12') isWin = winningObj.num >= 1 && winningObj.num <= 12
    else if (selectedBet === '2ND_12') isWin = winningObj.num >= 13 && winningObj.num <= 24
    else if (selectedBet === '3RD_12') isWin = winningObj.num >= 25 && winningObj.num <= 36

    const payout = isWin ? +(wager * cfg.multiplier).toFixed(2) : 0

    // Calculate Target Angles
    const sliceRad = (Math.PI * 2) / 37
    const initialWheelA = wheelAngleRef.current
    const targetWheelRad = initialWheelA + Math.PI * 2 * 6 // 6 full wheel rotations
    
    // Position winning pocket under top marker (12 o'clock = -Math.PI / 2)
    const pocketOffsetAngle = winIdx * sliceRad
    const finalWheelAngle = targetWheelRad

    const duration = 3500 // 3.5 seconds spin
    const startTime = performance.now()

    const animateSpin = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(1, elapsed / duration)
      // Ease-out cubic formula
      const ease = 1 - Math.pow(1 - progress, 3)

      const curWheelA = initialWheelA + (finalWheelAngle - initialWheelA) * ease
      const curBallA = -Math.PI / 2 - (curWheelA + pocketOffsetAngle) + (1 - ease) * Math.PI * 2 * 8
      const curBallR = 1.0 - ease * 0.28 // Drops from 1.0 (rim) to 0.72 (pocket)

      wheelAngleRef.current = curWheelA
      ballAngleRef.current = curBallA
      ballRadiusOffsetRef.current = curBallR

      // Direct Canvas Draw (No React re-renders during 60 FPS spin!)
      drawWheel(curWheelA, curBallA, curBallR)

      if (Math.random() < 0.15 && soundEnabled) {
        playSound('peg')
      }

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animateSpin)
      } else {
        // Spin Complete! Guarantee Win/Loss Result Render!
        haptics.heavy()
        if (isWin) {
          if (soundEnabled) playSound('win')
          credit(payout, 'European Roulette')
        } else {
          if (soundEnabled) playSound('lose')
        }

        setResult({
          isWin,
          number: winningObj.num,
          color: winningObj.color,
          payout
        })

        setHistory(prev => [winningObj, ...prev.slice(0, 6)])
        setSpinning(false)
      }
    }

    animRef.current = requestAnimationFrame(animateSpin)
  }

  return (
    <div className="h-full w-full overflow-hidden flex flex-col justify-between p-1 select-none text-white max-w-lg mx-auto">
      
      {/* Header Bar */}
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
            🎡 ROULETTE BALL
          </h1>
        </div>

        {/* History Pills & Sound */}
        <div className="flex items-center gap-1.5">
          <div className="flex gap-1">
            {history.slice(0, 4).map((h, i) => (
              <span 
                key={i} 
                className={`w-5 h-5 rounded-full text-[9px] font-black flex items-center justify-center border border-white/20 shadow-sm ${
                  h.color === 'red' ? 'bg-red-600 text-white' : h.color === 'black' ? 'bg-zinc-800 text-white' : 'bg-emerald-600 text-white'
                }`}
              >
                {h.num}
              </span>
            ))}
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-lg bg-zinc-800 text-gray-400 hover:text-[#44e2cd] transition"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-[#44e2cd]" /> : <VolumeX className="w-3.5 h-3.5 text-red-400" />}
          </button>
        </div>
      </div>

      {/* Main Wheel Canvas Area */}
      <div className="glass-panel rounded-2xl w-full flex-1 relative overflow-hidden flex flex-col items-center justify-center p-2 bg-[#111319]/95 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] my-1">
        
        {/* HTML5 High-DPI Canvas */}
        <div className="w-72 h-72 relative flex items-center justify-center">
          <canvas ref={canvasRef} className="w-full h-full drop-shadow-2xl" />
        </div>

        {/* Win / Loss Result Overlay */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`absolute bottom-3 px-4 py-2 rounded-xl backdrop-blur-xl border flex items-center gap-2 shadow-2xl z-30 ${
                result.isWin
                  ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300 shadow-emerald-500/30'
                  : 'bg-red-950/90 border-red-500/50 text-red-300 shadow-red-500/20'
              }`}
            >
              <span className="text-xl">{result.isWin ? '🏆' : '🔴'}</span>
              <div>
                <p className="text-[9px] uppercase font-black tracking-widest opacity-80">
                  {result.isWin ? 'WINNER!' : 'NO MATCH'}
                </p>
                <p className="text-xs font-black font-mono">
                  LANDED ON {result.number} ({result.color.toUpperCase()}) {result.isWin ? `+₹${result.payout.toFixed(2)}` : ''}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Betting Options Grid */}
      <div className="grid grid-cols-4 gap-1 my-1 shrink-0">
        {(Object.keys(BET_OPTIONS) as BetType[]).map((bt) => {
          const cfg = BET_OPTIONS[bt]
          const isSelected = selectedBet === bt
          return (
            <button
              key={bt}
              disabled={spinning}
              onClick={() => { haptics.light(); setSelectedBet(bt); }}
              className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all touch-spring ${
                isSelected
                  ? `${cfg.colorClass} shadow-lg ring-1 ring-white/40 scale-95`
                  : 'bg-[#1e1f26] text-gray-400 border-white/5 hover:text-white disabled:opacity-50'
              }`}
            >
              {cfg.label}
            </button>
          )
        })}
      </div>

      {/* Control Console */}
      <div className="glass-panel rounded-2xl p-2.5 bg-[#1e1f26]/90 border border-white/10 space-y-2 shrink-0">
        
        {/* Wager Amount Input */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[10px] font-bold text-[#cbc3d7]">
            <span>BET AMOUNT (₹)</span>
            <div className="flex gap-1">
              <button disabled={spinning} onClick={() => setWager(prev => Math.max(10, Math.floor(prev / 2)))} className="bg-black/40 px-1.5 py-0.5 rounded text-gray-300 font-mono font-bold hover:text-white">1/2</button>
              <button disabled={spinning} onClick={() => setWager(prev => prev * 2)} className="bg-black/40 px-1.5 py-0.5 rounded text-gray-300 font-mono font-bold hover:text-white">2X</button>
            </div>
          </div>
          <div className="flex items-center bg-[#0a0c10] rounded-xl border border-[#33343b] p-1">
            <button 
              disabled={spinning}
              onClick={() => { haptics.light(); setWager(prev => Math.max(10, prev - 10)); }}
              className="w-7 h-7 flex items-center justify-center bg-[#1e1f26] rounded-lg text-white hover:text-[#d0bcff] touch-spring disabled:opacity-50"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <input 
              type="number" 
              disabled={spinning}
              value={wager}
              onChange={(e) => setWager(Math.max(10, parseFloat(e.target.value) || 10))}
              className="w-full bg-transparent text-center text-xs font-bold text-white font-mono outline-none disabled:opacity-50"
            />
            <button 
              disabled={spinning}
              onClick={() => { haptics.light(); setWager(prev => prev + 10); }}
              className="w-7 h-7 flex items-center justify-center bg-[#1e1f26] rounded-lg text-white hover:text-[#d0bcff] touch-spring disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Spin Button */}
        <button
          onClick={spinWheel}
          disabled={spinning}
          className={`w-full py-3 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-transform active:scale-95 touch-spring cursor-pointer shadow-xl ${
            spinning
              ? 'bg-zinc-800 text-gray-500 cursor-not-allowed border border-white/5'
              : 'text-black btn-gold-gradient'
          }`}
        >
          {spinning ? '🎡 SPINNING WHEEL...' : `SPIN WHEEL (₹${wager})`}
        </button>

      </div>

    </div>
  )
}
