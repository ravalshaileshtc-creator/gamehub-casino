'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Minus, Plus, Rocket, Zap, Sparkles, CheckCircle2 } from 'lucide-react'
import { useWallet } from '@/context/WalletContext'
import { haptics } from '@/lib/haptics'
import { playSound } from '@/lib/sounds'
import { useGameAdminControl } from '@/hooks/useGameAdminControl'
import { GameMaintenanceOverlay } from '@/components/ui/GameMaintenanceOverlay'

type GameState = 'PREPARING' | 'FLYING' | 'CRASHED'

interface CrashHistory {
  id: string
  multiplier: number
  crashedAt: Date
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  radius: number
  alpha: number
  life: number
}

export default function CrashPage() {
  const { balance, debit, credit, addDemoCoins } = useWallet()
  const adminSettings = useGameAdminControl('crash')

  // Game Engine State
  const [gameState, setGameState] = useState<GameState>('PREPARING')
  const [countdown, setCountdown] = useState(5)
  const [multiplier, setMultiplier] = useState(1.00)
  const [crashPoint, setCrashPoint] = useState(2.50)
  const [roundId, setRoundId] = useState(44698492)
  const [timeLeft, setTimeLeft] = useState(27)

  // Synchronize Global Epoch Round ID & Timer across all devices & Master Admin
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
    return <GameMaintenanceOverlay gameName="Crash Rocket Multiplier" />
  }

  // Wager & Bet State
  const [betAmount, setBetAmount] = useState<number>(100)
  const [autoCashout, setAutoCashout] = useState<number>(2.00)
  const [hasBet, setHasBet] = useState(false)
  const [cashedOut, setCashedOut] = useState(false)
  const [cashedOutAt, setCashedOutAt] = useState<number | null>(null)

  // Visual Effect States
  const [screenShake, setScreenShake] = useState(false)
  const [betSuccessToast, setBetSuccessToast] = useState(false)
  const [cashoutSuccessToast, setCashoutSuccessToast] = useState<string | null>(null)

  // History & Statistics
  const [history, setHistory] = useState<CrashHistory[]>([
    { id: '1', multiplier: 2.10, crashedAt: new Date() },
    { id: '2', multiplier: 1.20, crashedAt: new Date() },
    { id: '3', multiplier: 5.50, crashedAt: new Date() },
    { id: '4', multiplier: 0.90, crashedAt: new Date() },
    { id: '5', multiplier: 1.80, crashedAt: new Date() },
  ])

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const particlesRef = useRef<Particle[]>([])

  // Helper: Create Particle Explosion
  const createParticles = useCallback((x: number, y: number, colorList: string[], count = 30, speedMult = 1) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = (2 + Math.random() * 8) * speedMult
      const color = colorList[Math.floor(Math.random() * colorList.length)]
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        color,
        radius: 2 + Math.random() * 5,
        alpha: 1,
        life: 1.0
      })
    }
  }, [])

  // Generate Provably Fair Crash Point
  const generateCrashPoint = useCallback(() => {
    const e = Math.pow(2, 52)
    const h = Math.floor(Math.random() * e)
    if (h % 20 === 0) return 1.00 // 5% house edge instant crash
    const val = Math.floor((100 * e - h) / (e - h)) / 100
    return Math.max(1.01, Math.min(val, 1000.00))
  }, [])

  // Start Countdown for Next Round
  const startPreparing = useCallback(() => {
    setGameState('PREPARING')
    setCountdown(5)
    setMultiplier(1.00)
    setHasBet(false)
    setCashedOut(false)
    setCashedOutAt(null)
    setCashoutSuccessToast(null)
    setScreenShake(false)
    setRoundId(prev => prev + 1)
  }, [])

  // Auto Countdown Interval
  useEffect(() => {
    if (gameState !== 'PREPARING') return

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          // Launch Game
          const point = generateCrashPoint()
          setCrashPoint(point)
          setGameState('FLYING')
          startTimeRef.current = performance.now()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameState, generateCrashPoint])

  // Flying Rocket Multiplier Animation Loop
  useEffect(() => {
    if (gameState !== 'FLYING') return

    let cancelled = false

    const loop = (time: number) => {
      if (cancelled) return

      if (!startTimeRef.current) startTimeRef.current = time
      const elapsed = (time - startTimeRef.current) / 1000 // seconds

      // Multiplier exponentially increases over time
      const currentMult = +(Math.pow(1.06, elapsed * 10)).toFixed(2)

      if (currentMult >= crashPoint) {
        // BOOM! Crash Event Effect
        setMultiplier(crashPoint)
        setGameState('CRASHED')
        setScreenShake(true)
        playSound('lose')
        haptics.heavy()

        // Canvas Crash Explosion Particles
        const canvas = canvasRef.current
        if (canvas) {
          const w = canvas.width || 340
          const h = canvas.height || 200
          const progress = Math.min(1, (crashPoint - 1.00) / 10.00)
          const rx = 30 + progress * (w - 80)
          const ry = h - 30 - progress * (h - 60)
          createParticles(rx, ry, ['#ffb4ab', '#ef4444', '#f97316', '#eab308'], 50, 1.5)
        }

        setHistory(prev => [
          { id: Math.random().toString(), multiplier: crashPoint, crashedAt: new Date() },
          ...prev.slice(0, 7)
        ])

        // After 3 seconds, start next round
        setTimeout(() => {
          startPreparing()
        }, 3000)
        return
      }

      setMultiplier(currentMult)

      // Rocket Thrust Exhaust Particles
      const canvas = canvasRef.current
      if (canvas && Math.random() < 0.6) {
        const w = canvas.width || 340
        const h = canvas.height || 200
        const progress = Math.min(1, (currentMult - 1.00) / 10.00)
        const rx = 30 + progress * (w - 80)
        const ry = h - 30 - progress * (h - 60)
        createParticles(rx - 10, ry + 10, ['#44e2cd', '#a078ff', '#ffb95f'], 2, 0.4)
      }

      // Play engine pitch sound
      if (Math.random() < 0.15) {
        playSound('peg')
      }

      // Auto Cashout check
      if (hasBet && !cashedOut && autoCashout > 1.00 && currentMult >= autoCashout) {
        handleCashout(currentMult)
      }

      animFrameRef.current = requestAnimationFrame(loop)
    }

    animFrameRef.current = requestAnimationFrame(loop)

    return () => {
      cancelled = true
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [gameState, crashPoint, hasBet, cashedOut, autoCashout, startPreparing, createParticles])

  // Draw Canvas & Particle Engine
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let renderAnimId: number

    const render = () => {
      const width = canvas.parentElement?.clientWidth || 340
      const height = canvas.parentElement?.clientHeight || 200
      canvas.width = width
      canvas.height = height

      ctx.clearRect(0, 0, width, height)

      // Draw Grid Mesh Lines
      ctx.strokeStyle = 'rgba(208, 188, 255, 0.05)'
      ctx.lineWidth = 1
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
      }
      for (let y = 0; y < height; y += 40) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }

      // Render Curve Graph
      if (gameState === 'FLYING' || gameState === 'CRASHED') {
        const progress = Math.min(1, (multiplier - 1.00) / 10.00)
        const rocketX = 30 + progress * (width - 80)
        const rocketY = height - 30 - progress * (height - 60)

        // Draw Curve Fill Gradient
        const grad = ctx.createLinearGradient(0, height, rocketX, rocketY)
        grad.addColorStop(0, 'rgba(68, 226, 205, 0.0)')
        grad.addColorStop(1, gameState === 'CRASHED' ? 'rgba(255, 180, 171, 0.3)' : 'rgba(68, 226, 205, 0.3)')

        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.moveTo(0, height)
        ctx.quadraticCurveTo(rocketX * 0.4, height, rocketX, rocketY)
        ctx.lineTo(rocketX, height)
        ctx.closePath()
        ctx.fill()

        // Draw Curve Neon Line
        ctx.strokeStyle = gameState === 'CRASHED' ? '#ffb4ab' : '#44e2cd'
        ctx.lineWidth = 3.5
        ctx.shadowColor = gameState === 'CRASHED' ? '#ffb4ab' : '#44e2cd'
        ctx.shadowBlur = 18
        ctx.beginPath()
        ctx.moveTo(0, height)
        ctx.quadraticCurveTo(rocketX * 0.4, height, rocketX, rocketY)
        ctx.stroke()
        ctx.shadowBlur = 0

        // Draw Flying Rocket Icon
        if (gameState === 'FLYING') {
          ctx.save()
          ctx.translate(rocketX, rocketY)
          ctx.rotate(-Math.PI / 4)
          ctx.fillStyle = '#d0bcff'
          ctx.font = '24px sans-serif'
          ctx.fillText('🚀', -12, 9)
          ctx.restore()
        }
      }

      // Update & Render Particles Array
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i]
        p.x += p.vx
        p.y += p.vy
        p.alpha -= 0.02
        p.radius *= 0.96

        if (p.alpha <= 0 || p.radius <= 0.2) {
          particlesRef.current.splice(i, 1)
          continue
        }

        ctx.save()
        ctx.globalAlpha = p.alpha
        ctx.fillStyle = p.color
        ctx.shadowColor = p.color
        ctx.shadowBlur = 10
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      renderAnimId = requestAnimationFrame(render)
    }

    renderAnimId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(renderAnimId)
    }
  }, [gameState, multiplier])

  // Place Bet Handler with Effects
  const handlePlaceBet = () => {
    haptics.medium()

    if (balance < betAmount) {
      addDemoCoins(1000)
    }

    debit(betAmount, 'Crash Multiplier')
    setHasBet(true)
    setCashedOut(false)
    playSound('coin')

    // Bet Effect Toast & Particles
    setBetSuccessToast(true)
    setTimeout(() => setBetSuccessToast(false), 2000)

    const canvas = canvasRef.current
    if (canvas) {
      createParticles(canvas.width / 2, canvas.height - 20, ['#ffd700', '#44e2cd', '#a078ff'], 35, 1.2)
    }
  }

  // Cashout Handler with Epic Celebratory Effects
  const handleCashout = (currentMult?: number) => {
    if (!hasBet || cashedOut || gameState !== 'FLYING') return

    const targetMult = currentMult || multiplier
    const winAmount = +(betAmount * targetMult).toFixed(2)

    haptics.heavy()
    playSound('win')

    credit(winAmount, 'Crash Multiplier')

    setCashedOut(true)
    setCashedOutAt(targetMult)
    setCashoutSuccessToast(`CASHED OUT AT ${targetMult.toFixed(2)}x (+$${winAmount.toFixed(2)})`)

    // Celebration Confetti Particles
    const canvas = canvasRef.current
    if (canvas) {
      createParticles(canvas.width / 2, canvas.height / 2, ['#ffd700', '#44e2cd', '#ccff00', '#ffffff'], 60, 1.8)
    }
  }

  return (
    <div className={`h-full w-full overflow-hidden flex flex-col justify-between p-1 select-none text-[#e2e2eb] max-w-lg mx-auto ${
      screenShake ? 'animate-bounce border-2 border-red-500' : ''
    }`}>
      
      {/* Top Header Bar matching Stitch UI */}
      <div className="flex justify-between items-center px-2 py-1 bg-[#1e1f26] rounded-xl border border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <Link 
            href="/" 
            onClick={() => haptics.light()} 
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#d0bcff] touch-spring"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-sm font-extrabold text-[#d0bcff] tracking-tighter uppercase font-sans flex items-center gap-1">
            🚀 CRASH ELITE
          </h1>
        </div>
        <div className="bg-[#111319] py-1 px-3 rounded-full flex items-center gap-1.5 border border-white/5 text-xs font-bold text-[#44e2cd] font-mono shadow-inner">
          <span>💰</span> ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>
      </div>

      {/* Live Display Area (Canvas Card with Dynamic Particles) */}
      <div className={`glass-panel rounded-2xl w-full flex-1 min-h-[220px] relative overflow-hidden flex flex-col items-center justify-center p-3 bg-[#111319]/90 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] my-1 transition-all ${
        gameState === 'CRASHED' ? 'ring-2 ring-red-500/50 shadow-red-500/20' : cashedOut ? 'ring-2 ring-emerald-500/50 shadow-emerald-500/30' : ''
      }`}>
        
        {/* Canvas Render Element */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

        {/* Round Info Badges */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-center text-[10px] font-semibold z-10">
          <span className="bg-[#191b22]/90 px-2 py-0.5 rounded text-[#cbc3d7] border border-white/5 font-mono">
            Round: #{roundId}
          </span>
          <span className={`px-2 py-0.5 rounded font-bold flex items-center gap-1 border backdrop-blur-md ${
            gameState === 'FLYING'
              ? 'bg-emerald-950/80 text-[#44e2cd] border-[#44e2cd]/40'
              : gameState === 'PREPARING'
              ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
              : 'bg-red-950/80 text-red-300 border-red-500/40'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              gameState === 'FLYING' ? 'bg-[#44e2cd] animate-pulse' : gameState === 'PREPARING' ? 'bg-amber-400' : 'bg-red-400'
            }`} />
            {gameState === 'FLYING' ? 'RUNNING' : gameState === 'PREPARING' ? `NEXT IN ${countdown}s` : 'CRASHED'}
          </span>
        </div>

        {/* Central Multiplier Ticker */}
        <div className="z-10 flex flex-col items-center justify-center text-center">
          {gameState === 'PREPARING' ? (
            <div className="flex flex-col items-center gap-1 animate-pulse">
              <span className="text-3xl font-black text-amber-400 font-mono tracking-tight">
                NEXT ROUND IN {countdown}s
              </span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-[#1e1f26] px-3 py-1 rounded-full border border-white/5">
                Place Your Bets Now
              </span>
            </div>
          ) : gameState === 'CRASHED' ? (
            <div className="flex flex-col items-center gap-1 animate-pulse">
              <span className="text-4xl md:text-5xl font-black text-red-400 font-mono tracking-tighter drop-shadow-[0_0_25px_rgba(239,68,68,0.8)]">
                {multiplier.toFixed(2)}x
              </span>
              <span className="text-[10px] font-black text-red-200 bg-red-950/90 border border-red-500/50 px-3 py-1 rounded-full uppercase tracking-widest">
                💥 CRASHED
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-5xl md:text-6xl font-black text-[#44e2cd] font-mono tracking-tighter neon-text-glow">
                {multiplier.toFixed(2)}x
              </span>
              <span className="text-[10px] uppercase font-bold text-[#cbc3d7] bg-[#1e1f26] px-3 py-1 rounded-full mt-1 border border-white/5 tracking-widest">
                Current Multiplier
              </span>
            </div>
          )}

          {/* User Cashout Success Toast */}
          {cashoutSuccessToast && (
            <div className="mt-2 bg-gradient-to-r from-emerald-950 to-teal-950 border border-emerald-400 text-emerald-300 px-4 py-1.5 rounded-xl text-xs font-black font-mono shadow-2xl animate-bounce flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400 fill-emerald-400" />
              {cashoutSuccessToast}
            </div>
          )}

          {/* Bet Success Toast */}
          {betSuccessToast && (
            <div className="mt-2 bg-gradient-to-r from-purple-950 to-indigo-950 border border-purple-400 text-purple-300 px-3 py-1 rounded-xl text-xs font-bold font-mono shadow-lg flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
              BET OF ${betAmount} PLACED!
            </div>
          )}
        </div>

      </div>

      {/* Recent History Row matching Stitch UI */}
      <div className="space-y-1 my-1 shrink-0">
        <span className="text-[10px] uppercase font-bold text-[#cbc3d7] tracking-wider pl-1">
          RECENT HISTORY
        </span>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {history.map((item) => (
            <div
              key={item.id}
              className={`rounded-lg px-2.5 py-1 bg-[#1e1f26] border-l-2 text-xs font-bold font-mono shrink-0 ${
                item.multiplier >= 5.0
                  ? 'border-l-[#ffb95f] text-[#ffb95f] shadow-[0_0_10px_rgba(255,185,95,0.3)]'
                  : item.multiplier >= 2.0
                  ? 'border-l-[#44e2cd] text-[#44e2cd]'
                  : 'border-l-red-400 text-red-300 opacity-80'
              }`}
            >
              {item.multiplier.toFixed(2)}x
            </div>
          ))}
        </div>
      </div>

      {/* Control Console Card matching Stitch UI */}
      <div className="glass-panel rounded-2xl p-3 bg-[#1e1f26]/90 border border-white/10 space-y-2.5 shrink-0">
        
        {/* Inputs Grid */}
        <div className="grid grid-cols-2 gap-2">
          
          {/* Bet Amount */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] uppercase font-bold text-[#cbc3d7]">BET AMOUNT</label>
              <div className="flex gap-1">
                <button onClick={() => setBetAmount(prev => Math.max(10, Math.floor(prev / 2)))} className="text-[9px] bg-black/40 px-1.5 py-0.5 rounded text-gray-300 font-mono font-bold hover:text-white">1/2</button>
                <button onClick={() => setBetAmount(prev => prev * 2)} className="text-[9px] bg-black/40 px-1.5 py-0.5 rounded text-gray-300 font-mono font-bold hover:text-white">2X</button>
              </div>
            </div>
            <div className="flex items-center bg-[#0a0c10] rounded-xl border border-[#33343b] p-1">
              <button 
                onClick={() => { haptics.light(); setBetAmount(prev => Math.max(10, prev - 10)); }}
                className="w-7 h-7 flex items-center justify-center bg-[#1e1f26] rounded-lg text-white hover:text-[#d0bcff] touch-spring"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input 
                type="number" 
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(1, parseFloat(e.target.value) || 10))}
                className="w-full bg-transparent text-center text-xs font-bold text-white font-mono outline-none"
              />
              <button 
                onClick={() => { haptics.light(); setBetAmount(prev => prev + 10); }}
                className="w-7 h-7 flex items-center justify-center bg-[#1e1f26] rounded-lg text-white hover:text-[#d0bcff] touch-spring"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Auto Cashout */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-[#cbc3d7]">AUTO CASHOUT</label>
            <div className="flex items-center bg-[#0a0c10] rounded-xl border border-[#33343b] p-1 h-9">
              <input 
                type="number"
                step="0.1"
                value={autoCashout}
                onChange={(e) => setAutoCashout(Math.max(1.01, parseFloat(e.target.value) || 2.00))}
                className="w-full bg-transparent text-center text-xs font-bold text-white font-mono outline-none"
              />
              <span className="text-xs font-bold text-gray-400 font-mono pr-2">x</span>
            </div>
          </div>

        </div>

        {/* Action Button with Effects */}
        {hasBet && gameState === 'FLYING' && !cashedOut ? (
          <button
            onClick={() => handleCashout()}
            className="w-full py-3 rounded-xl font-extrabold text-sm text-[#003731] bg-gradient-to-r from-[#44e2cd] to-[#03c6b2] shadow-[0_0_30px_rgba(68,226,205,0.8)] active:scale-95 transition-transform flex flex-col items-center justify-center touch-spring cursor-pointer animate-pulse"
          >
            <span className="uppercase tracking-wider text-base font-black flex items-center gap-1">
              💰 CASH OUT (${(betAmount * multiplier).toFixed(2)})
            </span>
            <span className="text-[10px] font-mono opacity-90">
              Current Multiplier: {multiplier.toFixed(2)}x
            </span>
          </button>
        ) : hasBet ? (
          <button
            disabled
            className="w-full py-3 rounded-xl font-bold text-xs text-amber-300 bg-amber-950/60 border border-amber-500/40 opacity-90 flex items-center justify-center gap-1.5 cursor-not-allowed"
          >
            <Zap className="w-4 h-4 text-amber-400" />
            {cashedOut ? 'BET PLACED (CASHED OUT)' : 'BET PLACED (NEXT ROUND)'}
          </button>
        ) : (
          <button
            onClick={handlePlaceBet}
            disabled={balance < betAmount}
            className="w-full py-3 rounded-xl font-black text-sm text-black btn-gold-gradient shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2 touch-spring cursor-pointer disabled:opacity-50 uppercase tracking-wider"
          >
            <Rocket className="w-4 h-4 fill-black" />
            PLACE BET (${betAmount})
          </button>
        )}

      </div>

    </div>
  )
}
