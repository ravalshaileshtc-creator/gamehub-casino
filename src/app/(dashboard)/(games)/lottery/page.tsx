'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWallet } from '@/context/WalletContext'
import { Sparkles, Volume2, VolumeX, Ticket, Dices, RefreshCw } from 'lucide-react'
import { haptics } from '@/lib/haptics'

interface Ball {
  x: number
  y: number
  vx: number
  vy: number
  num: number
  color: string
  radius: number
}

interface LotteryResult {
  id: string
  drawn: number[]
  picked: number[]
  matches: number
  payout: number
  wager: number
  multiplier: number
  mode: '4DIGIT' | 'MEGA6'
}

const BALL_COLORS = ['#ef4444', '#f97316', '#fbbf24', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899']

export default function LotterySphereGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { balance, debit, credit } = useWallet()

  const [mode, setMode] = useState<'4DIGIT' | 'MEGA6'>('4DIGIT')
  const [wager, setWager] = useState(10)
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([1, 4, 7, 9])
  const [drawing, setDrawing] = useState(false)
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([])
  const [suctionBall, setSuctionBall] = useState<number | null>(null)
  const [lastResult, setLastResult] = useState<LotteryResult | null>(null)
  const [history, setHistory] = useState<LotteryResult[]>([])
  const [soundEnabled, setSoundEnabled] = useState(true)

  const maxNumbers = mode === '4DIGIT' ? 4 : 6
  const numberRange = mode === '4DIGIT' ? 10 : 49

  const handleModeChange = (newMode: '4DIGIT' | 'MEGA6') => {
    haptics.light()
    setMode(newMode)
    setDrawnNumbers([])
    setLastResult(null)
    if (newMode === '4DIGIT') {
      setSelectedNumbers([1, 4, 7, 9])
    } else {
      setSelectedNumbers([5, 12, 23, 34, 41, 48])
    }
  }

  const playSound = (type: 'mix' | 'suck' | 'match' | 'jackpot' | 'loss') => {
    if (!soundEnabled) return
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      const now = ctx.currentTime

      if (type === 'mix') {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(300 + Math.random() * 200, now)
        gain.gain.setValueAtTime(0.04, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 0.08)
      } else if (type === 'suck') {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(400, now)
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.3)
        gain.gain.setValueAtTime(0.2, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 0.3)
      } else if (type === 'match') {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(523.25, now)
        osc.frequency.setValueAtTime(659.25, now + 0.08)
        gain.gain.setValueAtTime(0.3, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 0.25)
      }
    } catch {}
  }

  // 3D Bouncing Physics Engine in Glass Tumbler
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    const ballCount = mode === '4DIGIT' ? 20 : 35
    const balls: Ball[] = []
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2 + 10
    const globeRadius = 100

    for (let i = 0; i < ballCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const dist = Math.random() * (globeRadius - 20)
      balls.push({
        x: centerX + Math.cos(angle) * dist,
        y: centerY + Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        num: mode === '4DIGIT' ? Math.floor(Math.random() * 10) : Math.floor(Math.random() * 49) + 1,
        color: BALL_COLORS[i % BALL_COLORS.length],
        radius: 8,
      })
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 1. Suction Tube
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)'
      ctx.lineWidth = 3
      ctx.strokeRect(centerX - 16, 5, 32, 45)

      // 2. 3D Glass Outer Sphere
      const sphereGrad = ctx.createRadialGradient(centerX - 30, centerY - 30, 10, centerX, centerY, globeRadius)
      sphereGrad.addColorStop(0, 'rgba(255, 255, 255, 0.15)')
      sphereGrad.addColorStop(0.7, 'rgba(20, 20, 30, 0.85)')
      sphereGrad.addColorStop(1, 'rgba(247, 147, 26, 0.6)')

      ctx.fillStyle = sphereGrad
      ctx.beginPath()
      ctx.arc(centerX, centerY, globeRadius, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#f59e0b'
      ctx.lineWidth = 2
      ctx.stroke()

      // 3. Update & Render Bouncing Balls
      balls.forEach((ball) => {
        if (drawing) {
          ball.vx += (Math.random() - 0.5) * 2.5
          ball.vy += (Math.random() - 0.5) * 2.5
        } else {
          ball.vy += 0.15
        }

        ball.x += ball.vx
        ball.y += ball.vy

        const dx = ball.x - centerX
        const dy = ball.y - centerY
        const distFromCenter = Math.sqrt(dx * dx + dy * dy)

        if (distFromCenter + ball.radius > globeRadius - 4) {
          const angle = Math.atan2(dy, dx)
          ball.x = centerX + Math.cos(angle) * (globeRadius - 4 - ball.radius)
          ball.y = centerY + Math.sin(angle) * (globeRadius - 4 - ball.radius)
          const normalX = Math.cos(angle)
          const normalY = Math.sin(angle)
          const dot = ball.vx * normalX + ball.vy * normalY
          ball.vx = (ball.vx - 2 * dot * normalX) * 0.85
          ball.vy = (ball.vy - 2 * dot * normalY) * 0.85
        }

        ctx.save()
        const ballGrad = ctx.createRadialGradient(ball.x - 2, ball.y - 2, 1, ball.x, ball.y, ball.radius)
        ballGrad.addColorStop(0, '#ffffff')
        ballGrad.addColorStop(0.4, ball.color)
        ballGrad.addColorStop(1, '#000000')

        ctx.fillStyle = ballGrad
        ctx.beginPath()
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = '#000000'
        ctx.font = 'bold 8px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(ball.num.toString(), ball.x, ball.y + 0.5)
        ctx.restore()
      })

      animId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animId)
    }
  }, [drawing, mode])

  const drawLottery = async () => {
    if (wager <= 0 || drawing) return
    haptics.medium()

    const success = await debit(wager, 'LOTTERY')
    if (!success) {
      haptics.error()
      return
    }

    setDrawing(true)
    setDrawnNumbers([])
    setLastResult(null)

    const drawn: number[] = []

    for (let i = 0; i < maxNumbers; i++) {
      await new Promise((r) => setTimeout(r, 450))
      
      const num = mode === '4DIGIT' ? Math.floor(Math.random() * 10) : Math.floor(Math.random() * 49) + 1
      drawn.push(num)
      setSuctionBall(num)
      playSound('suck')

      await new Promise((r) => setTimeout(r, 250))
      setDrawnNumbers([...drawn])
      setSuctionBall(null)
      playSound('mix')
    }

    let matches = 0
    if (mode === '4DIGIT') {
      for (let i = 0; i < 4; i++) {
        if (selectedNumbers[i] === drawn[i]) matches++
      }
    } else {
      matches = selectedNumbers.filter((n) => drawn.includes(n)).length
    }

    let multiplier = 0
    if (mode === '4DIGIT') {
      if (matches === 4) multiplier = 500
      else if (matches === 3) multiplier = 25
      else if (matches === 2) multiplier = 4
      else if (matches === 1) multiplier = 1.2
    } else {
      if (matches === 6) multiplier = 2000
      else if (matches === 5) multiplier = 150
      else if (matches === 4) multiplier = 15
      else if (matches === 3) multiplier = 3
    }

    const payout = wager * multiplier

    setTimeout(async () => {
      if (payout > 0) {
        haptics.success()
        await credit(payout, 'LOTTERY')
        playSound(multiplier >= 50 ? 'jackpot' : 'match')
      } else {
        haptics.error()
      }

      const resObj: LotteryResult = {
        id: `LOT-${Date.now().toString().slice(-4)}`,
        drawn,
        picked: selectedNumbers,
        matches,
        payout,
        wager,
        multiplier,
        mode
      }

      setLastResult(resObj)
      setHistory((prev) => [resObj, ...prev.slice(0, 7)])
      setDrawing(false)
    }, 300)
  }

  const randomizeNumbers = () => {
    haptics.light()
    if (mode === '4DIGIT') {
      setSelectedNumbers(Array.from({ length: 4 }, () => Math.floor(Math.random() * 10)))
    } else {
      const picked: number[] = []
      while (picked.length < 6) {
        const r = Math.floor(Math.random() * 49) + 1
        if (!picked.includes(r)) picked.push(r)
      }
      setSelectedNumbers(picked.sort((a, b) => a - b))
    }
  }

  return (
    <div className="h-[calc(100dvh-8.5rem)] overflow-hidden flex flex-col justify-between p-2 max-w-lg mx-auto text-white select-none">
      
      {/* Top Segmented Mode Selector Bar */}
      <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-zinc-900 border border-white/10 shrink-0">
        <button
          onClick={() => !drawing && handleModeChange('4DIGIT')}
          disabled={drawing}
          className={`py-2 rounded-xl font-extrabold text-xs transition-all touch-spring ${
            mode === '4DIGIT'
              ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-black shadow-lg font-black'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          4-DIGIT PICK (0-9)
        </button>
        <button
          onClick={() => !drawing && handleModeChange('MEGA6')}
          disabled={drawing}
          className={`py-2 rounded-xl font-extrabold text-xs transition-all touch-spring ${
            mode === 'MEGA6'
              ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-black shadow-lg font-black'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          MEGA 6-DIGIT (1-49)
        </button>
      </div>

      {/* Center 3D Glass Sphere Tumbler Canvas Box */}
      <div className="relative flex-1 flex flex-col items-center justify-center rounded-2xl bg-gradient-to-b from-zinc-900/90 to-black border border-white/10 p-2 my-2 overflow-hidden shadow-2xl">
        
        {/* Animated Suction Tube Popup */}
        {suctionBall !== null && (
          <motion.div
            initial={{ y: 50, scale: 0.5, opacity: 0 }}
            animate={{ y: -80, scale: 1.2, opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="absolute top-14 z-30 w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-black font-black text-lg flex items-center justify-center shadow-[0_0_25px_rgba(251,191,36,0.9)] border-2 border-white"
          >
            {suctionBall}
          </motion.div>
        )}

        {/* 3D Glass Sphere Tumbler Canvas */}
        <canvas ref={canvasRef} width={280} height={230} className="max-w-full" />

        {/* Drawn Winning Balls Bar */}
        <div className="w-full mt-2 p-2 rounded-xl bg-black/70 border border-amber-500/30 flex flex-col items-center gap-1 shrink-0">
          <p className="text-[10px] uppercase font-black tracking-widest text-amber-400">Drawn Winning Balls</p>
          <div className="flex gap-1.5">
            {Array.from({ length: maxNumbers }).map((_, idx) => {
              const num = drawnNumbers[idx]
              return (
                <motion.div
                  key={idx}
                  animate={num !== undefined ? { scale: [0.5, 1.2, 1], rotate: [0, 360] } : {}}
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shadow-md border ${
                    num !== undefined
                      ? 'bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 text-black border-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.6)]'
                      : 'bg-zinc-900 text-zinc-600 border-zinc-800'
                  }`}
                >
                  {num !== undefined ? num : '?'}
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Win/Loss Toast */}
        <AnimatePresence>
          {lastResult && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className={`absolute top-3 px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-xl z-40 ${
                lastResult.payout > 0
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-emerald-500/20'
                  : 'bg-red-500/20 text-red-400 border-red-500/40'
              }`}
            >
              {lastResult.payout > 0
                ? `MATCHED ${lastResult.matches}! +${lastResult.payout.toFixed(2)} USDT`
                : 'NO MATCH'}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Ticket Selector & Primary Action Controls */}
      <div className="p-3 rounded-2xl bg-zinc-900/90 border border-white/10 space-y-2 shrink-0">
        
        {/* Ticket Selector & Quick Randomize Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase">TICKET:</span>
            <div className="flex gap-1">
              {selectedNumbers.map((n, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded-lg bg-amber-400/20 border border-amber-400/40 text-amber-300 font-mono font-bold text-xs">
                  {n}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={randomizeNumbers}
            disabled={drawing}
            className="p-1.5 rounded-lg bg-zinc-800 text-amber-400 hover:text-white touch-spring flex items-center gap-1 text-[10px] font-bold"
          >
            <RefreshCw className="w-3 h-3" /> RANDOM
          </button>
        </div>

        {/* Wager Presets & Draw Action Button */}
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
          
          {/* Primary Draw Button spanning 2 columns */}
          <button
            onClick={drawLottery}
            disabled={drawing}
            className={`col-span-2 py-2.5 rounded-xl font-black text-xs tracking-wider uppercase transition-all shadow-xl touch-spring cursor-pointer ${
              drawing
                ? 'bg-zinc-800 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 text-black shadow-[0_0_25px_rgba(251,191,36,0.3)] hover:scale-[1.01]'
            }`}
          >
            {drawing ? 'DRAWING...' : 'DRAW TICKET'}
          </button>
        </div>

      </div>

    </div>
  )
}
