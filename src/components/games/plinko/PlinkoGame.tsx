"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { getMultipliers, PlinkoRisk } from "@/lib/plinko"
import Matter from "matter-js"
import { useWallet } from "@/context/WalletContext"
import { Flame, Pause, Zap, Volume2, VolumeX, RefreshCw } from "lucide-react"
import { useGameAdminControl } from "@/hooks/useGameAdminControl"
import { GameMaintenanceOverlay } from "@/components/ui/GameMaintenanceOverlay"

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

interface ResultBanner {
  id: string
  multiplier: number
  payout: number
  wager: number
  profit: number
  isWin: boolean
  isBigWin: boolean
  bucketIndex: number
}

interface BallTrailPoint {
  x: number
  y: number
}

interface BallData {
  payout: number
  processed: boolean
  color: string
  trail: BallTrailPoint[]
}

interface BallBody extends Matter.Body {
  plugin: {
    data: BallData
  }
}

export default function PlinkoGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<Matter.Engine | null>(null)
  const runnerRef = useRef<Matter.Runner | null>(null)
  const particlesRef = useRef<Particle[]>([])
  
  const { balance, debit, credit } = useWallet()
  const [wager, setWager] = useState("10")
  const [rows, setRows] = useState(16)
  const [risk, setRisk] = useState<PlinkoRisk>("MEDIUM")
  const [activeBucket, setActiveBucket] = useState<number | null>(null)
  const [lastResult, setLastResult] = useState<ResultBanner | null>(null)
  const [resultsHistory, setResultsHistory] = useState<{ multiplier: number; isWin: boolean }[]>([])
  const [isAutoDrop, setIsAutoDrop] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [winStreak, setWinStreak] = useState(0)
  const [sessionProfit, setSessionProfit] = useState(0)
  const [totalDrops, setTotalDrops] = useState(0)
  
  const { toast } = useToast()
  const multipliers = getMultipliers(rows, risk)
  const autoDropIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Shared Audio Synthesizer (Singleton)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const playSoundEffect = useCallback((type: 'drop' | 'peg' | 'win' | 'bigwin' | 'loss') => {
    if (!soundEnabled) return
    try {
      if (typeof window === 'undefined') return
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        if (AudioCtx) {
          audioCtxRef.current = new AudioCtx()
        }
      }
      const ctx = audioCtxRef.current
      if (!ctx) return
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {})
      }
      
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)

      const now = ctx.currentTime

      if (type === 'drop') {
        osc.type = 'sine'
        osc.frequency.setValueAtTime(440, now)
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.1)
        gain.gain.setValueAtTime(0.2, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1)
        osc.start(now)
        osc.stop(now + 0.1)
      } else if (type === 'peg') {
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(600 + Math.random() * 300, now)
        gain.gain.setValueAtTime(0.03, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03)
        osc.start(now)
        osc.stop(now + 0.03)
      } else if (type === 'win') {
        osc.type = 'sine'
        osc.frequency.setValueAtTime(523.25, now)
        osc.frequency.setValueAtTime(659.25, now + 0.08)
        osc.frequency.setValueAtTime(783.99, now + 0.16)
        gain.gain.setValueAtTime(0.25, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25)
        osc.start(now)
        osc.stop(now + 0.25)
      } else if (type === 'bigwin') {
        osc.type = 'square'
        osc.frequency.setValueAtTime(523.25, now)
        osc.frequency.setValueAtTime(659.25, now + 0.1)
        osc.frequency.setValueAtTime(783.99, now + 0.2)
        osc.frequency.setValueAtTime(1046.50, now + 0.3)
        gain.gain.setValueAtTime(0.3, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4)
        osc.start(now)
        osc.stop(now + 0.4)
      } else if (type === 'loss') {
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(220, now)
        osc.frequency.linearRampToValueAtTime(110, now + 0.15)
        gain.gain.setValueAtTime(0.15, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15)
        osc.start(now)
        osc.stop(now + 0.15)
      }
    } catch {
      // Ignore audio error
    }
  }, [soundEnabled])

  // Create Particle Explosion
  const createParticles = (x: number, y: number, color: string, count = 25) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 2 + Math.random() * 6
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        color,
        radius: 3 + Math.random() * 4,
        alpha: 1,
        life: 1.0
      })
    }
  }

  const getMultiplierColor = (val: number) => {
    if (val >= 25) return '#ef4444' // Red
    if (val >= 10) return '#f97316' // Orange
    if (val >= 3) return '#fbbf24'  // Gold
    if (val >= 1) return '#22c55e'  // Green
    return '#3f3f46'                // Dark Gray
  }

  const getBadgeStyle = (val: number) => {
    if (val >= 25) return 'bg-red-500/20 text-red-300 border-red-500/50 shadow-red-500/20'
    if (val >= 10) return 'bg-orange-500/20 text-orange-300 border-orange-500/50 shadow-orange-500/20'
    if (val >= 3) return 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-amber-500/20'
    if (val >= 1) return 'bg-green-500/20 text-green-300 border-green-500/50 shadow-green-500/20'
    return 'bg-zinc-800 text-zinc-400 border-zinc-700'
  }

  const handleWin = useCallback((ballBody: Matter.Body, bucketIndex: number, hitX: number, hitY: number) => {
    const ball = ballBody as BallBody
    if (!ball || !ball.plugin || !ball.plugin.data || ball.plugin.data.processed) return
    ball.plugin.data.processed = true

    const validBucketIndex = Math.max(0, Math.min(multipliers.length - 1, bucketIndex))
    const multiplier = multipliers[validBucketIndex] ?? 1.0
    const currentWager = parseFloat(wager) || 10
    const payout = currentWager * multiplier
    const profit = payout - currentWager
    const isWin = multiplier >= 1.0
    const isBigWin = multiplier >= 3.0

    if (payout > 0) {
      credit(payout, 'PLINKO')
    }

    setSessionProfit(prev => prev + profit)
    setTotalDrops(prev => prev + 1)

    if (isWin) {
      setWinStreak(prev => prev + 1)
    } else {
      setWinStreak(0)
    }

    setActiveBucket(validBucketIndex)
    setTimeout(() => setActiveBucket(null), 700)

    const particleColor = getMultiplierColor(multiplier)
    createParticles(hitX, hitY, particleColor, isBigWin ? 45 : 22)

    if (isBigWin) {
      playSoundEffect('bigwin')
    } else if (isWin) {
      playSoundEffect('win')
    } else {
      playSoundEffect('loss')
    }

    const resultObj: ResultBanner = {
      id: Math.random().toString(),
      multiplier,
      payout,
      wager: currentWager,
      profit,
      isWin,
      isBigWin,
      bucketIndex: validBucketIndex
    }
    setLastResult(resultObj)
    setResultsHistory(prev => [{ multiplier, isWin }, ...prev.slice(0, 7)])

    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(isBigWin ? [100, 50, 100] : isWin ? 40 : 20)
    }
  }, [multipliers, wager, credit, playSoundEffect])

  // Stable ref for handleWin & multipliers to prevent physics engine re-creations!
  const handleWinRef = useRef(handleWin)
  const multipliersRef = useRef(multipliers)
  useEffect(() => {
    handleWinRef.current = handleWin
    multipliersRef.current = multipliers
  }, [handleWin, multipliers])

  // Setup Matter.js Physics Engine & Renderer Loop - ONLY re-create on `rows` change!
  useEffect(() => {
    if (!canvasRef.current) return

    const width = 800
    const height = 600
    const pegSpacing = 35

    const engine = Matter.Engine.create({
      gravity: { x: 0, y: 1.25 }
    })
    engineRef.current = engine

    const render = Matter.Render.create({
      canvas: canvasRef.current,
      engine: engine,
      options: {
        width,
        height,
        wireframes: false,
        background: '#09090b'
      }
    })

    const pegs: Matter.Body[] = []
    const startY = 60
    const startX = width / 2
    const pegRadius = 4
    const rowSpacing = (height - 150) / rows

    for (let r = 0; r < rows; r++) {
      const count = r + 3
      const rowWidth = (count - 1) * pegSpacing
      const rowStartX = startX - rowWidth / 2

      for (let c = 0; c < count; c++) {
        const x = rowStartX + c * pegSpacing
        const y = startY + r * rowSpacing
        const peg = Matter.Bodies.circle(x, y, pegRadius, {
          isStatic: true,
          label: 'peg',
          render: { fillStyle: '#e4e4e7' }
        })
        pegs.push(peg)
      }
    }

    const lastRowIndex = rows - 1
    const lastRowCount = lastRowIndex + 3
    const lastRowWidth = (lastRowCount - 1) * pegSpacing
    const lastRowStartX = startX - lastRowWidth / 2
    const bucketY = startY + rows * rowSpacing + 15
    const totalBuckets = rows + 1
    const bucketLeftBound = lastRowStartX - pegSpacing / 2

    const buckets: Matter.Body[] = []
    for (let i = 0; i <= totalBuckets; i++) {
      const x = bucketLeftBound + i * pegSpacing
      const divider = Matter.Bodies.rectangle(x, bucketY, 4, 35, {
        isStatic: true,
        label: 'divider',
        render: { fillStyle: '#3f3f46' }
      })
      buckets.push(divider)
    }

    const floor = Matter.Bodies.rectangle(width / 2, height + 10, width, 20, {
      isStatic: true,
      label: 'floor'
    })

    Matter.Composite.add(engine.world, [...pegs, ...buckets, floor])

    // Collision Detection using stable handleWinRef
    Matter.Events.on(engine, 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair
        const ball = bodyA.label === 'ball' ? bodyA : bodyB.label === 'ball' ? bodyB : null
        const peg = bodyA.label === 'peg' ? bodyA : bodyB.label === 'peg' ? bodyB : null
        
        if (ball && peg) {
          playSoundEffect('peg')
          peg.render.fillStyle = '#38bdf8'
          setTimeout(() => { peg.render.fillStyle = '#e4e4e7' }, 120)
        }

        if (ball && (bodyA.label === 'floor' || bodyB.label === 'floor')) {
          const ballX = ball.position.x
          const relativeX = ballX - bucketLeftBound
          const bucketIndex = Math.max(0, Math.min(totalBuckets - 1, Math.floor(relativeX / pegSpacing)))
          
          handleWinRef.current(ball, bucketIndex, ballX, ball.position.y)
          setTimeout(() => {
            if (engine.world.bodies.includes(ball)) {
              Matter.Composite.remove(engine.world, ball)
            }
          }, 150)
        }
      })
    })

    // After Render: Motion Trails & Canvas Multipliers Text
    Matter.Events.on(render, 'afterRender', () => {
      const ctx = render.context
      const currentMultipliers = multipliersRef.current

      // Draw Ball Motion Trails
      const bodies = Matter.Composite.allBodies(engine.world)
      bodies.forEach(body => {
        if (body && body.label === 'ball') {
          const ball = body as BallBody
          if (ball.plugin && ball.plugin.data) {
            const data = ball.plugin.data
            if (!data.trail) data.trail = []
            
            data.trail.push({ x: ball.position.x, y: ball.position.y })
            if (data.trail.length > 8) data.trail.shift()

            ctx.save()
            for (let t = 0; t < data.trail.length - 1; t++) {
              const pt1 = data.trail[t]
              const pt2 = data.trail[t + 1]
              const opacity = (t + 1) / data.trail.length
              ctx.strokeStyle = `rgba(251, 191, 36, ${opacity * 0.6})`
              ctx.lineWidth = (t + 1) * 0.8
              ctx.beginPath()
              ctx.moveTo(pt1.x, pt1.y)
              ctx.lineTo(pt2.x, pt2.y)
              ctx.stroke()
            }
            ctx.restore()
          }
        }
      })
      
      // Draw Canvas Multipliers Below Each Slot
      ctx.save()
      ctx.font = 'bold 10px monospace'
      ctx.textAlign = 'center'
      for (let b = 0; b < totalBuckets; b++) {
        const slotCenterX = bucketLeftBound + b * pegSpacing + pegSpacing / 2
        const val = currentMultipliers[b] ?? 1.0
        ctx.fillStyle = getMultiplierColor(val)
        ctx.fillRect(slotCenterX - 14, bucketY + 18, 28, 16)
        ctx.fillStyle = '#ffffff'
        ctx.fillText(`${val}x`, slotCenterX, bucketY + 30)
      }
      ctx.restore()

      // Particles Loop
      const particles = particlesRef.current
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.15
        p.alpha -= 0.025
        p.life -= 0.025

        if (p.alpha <= 0 || p.life <= 0) {
          particles.splice(i, 1)
          continue
        }

        ctx.save()
        ctx.globalAlpha = Math.max(0, p.alpha)
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
    })

    const runner = Matter.Runner.create()
    runnerRef.current = runner
    Matter.Runner.run(runner, engine)
    Matter.Render.run(render)

    return () => {
      Matter.Render.stop(render)
      Matter.Runner.stop(runner)
      Matter.Engine.clear(engine)
    }
  }, [rows, playSoundEffect])

  // Single Ball Drop Action
  const spawnBall = async () => {
    const amount = parseFloat(wager)
    if (isNaN(amount) || amount <= 0) return false

    const success = await debit(amount, 'PLINKO')
    if (!success) return false

    playSoundEffect('drop')

    const engine = engineRef.current
    if (!engine) return false

    const ball = Matter.Bodies.circle(400 + (Math.random() - 0.5) * 12, 20, 7, {
      restitution: 0.65,
      friction: 0.15,
      label: 'ball',
      render: { fillStyle: '#fbbf24' },
      plugin: {
        data: {
          payout: 0,
          processed: false,
          color: '#fbbf24',
          trail: []
        }
      }
    }) as BallBody

    Matter.Body.setVelocity(ball, { x: (Math.random() - 0.5) * 2.2, y: 0 })
    Matter.Composite.add(engine.world, ball)
    return true
  }

  // 5x Wave Burst Drop
  const handleBurstDrop = async () => {
    const amount = parseFloat(wager) || 10
    const totalWager = amount * 5
    if (balance < totalWager) {
      toast({ title: "Insufficient Balance", description: `You need $${totalWager.toFixed(2)} for 5 drops`, variant: "destructive" })
      return
    }

    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        spawnBall()
      }, i * 140)
    }
  }

  // Auto Drop Timer Loop
  useEffect(() => {
    if (isAutoDrop) {
      autoDropIntervalRef.current = setInterval(() => {
        spawnBall()
      }, 450)
    } else if (autoDropIntervalRef.current) {
      clearInterval(autoDropIntervalRef.current)
    }

    return () => {
      if (autoDropIntervalRef.current) clearInterval(autoDropIntervalRef.current)
    }
  }, [isAutoDrop, wager])
  const singleWager = parseFloat(wager) || 10
  const burstWager = singleWager * 5

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

  const adminSettings = useGameAdminControl('plinko')

  if (!adminSettings.enabled) {
    return <GameMaintenanceOverlay gameName="Plinko Peg Drop" />
  }

  return (
    <div className="h-full w-full overflow-hidden flex flex-col justify-between p-1 text-white gap-2 max-w-lg mx-auto">
      
      {/* Top Header Bar matching Stitch UI */}
      <div className="flex justify-between items-center bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-extrabold text-[#d0bcff] flex items-center gap-1.5 font-sans">
            🎯 PLINKO PRO
          </h2>
          <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
            #{roundId}
          </span>
          <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/20">
            00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400 font-bold uppercase font-mono">Streak: 🔥 {winStreak}</span>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-lg bg-zinc-800 text-gray-400 hover:text-[#44e2cd] transition"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-[#44e2cd]" /> : <VolumeX className="w-3.5 h-3.5 text-red-400" />}
          </button>
        </div>
      </div>

      {/* Game Canvas & Animated Result Banner */}
      <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-2xl p-2 flex flex-col items-center justify-center overflow-hidden relative min-h-[220px]">
        {/* REALISTIC WIN / LOSS ANIMATED OVERLAY */}
        <AnimatePresence>
          {lastResult && (
            <motion.div
              key={lastResult.id}
              initial={{ opacity: 0, scale: 0.5, y: -40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className={`absolute top-4 z-30 px-4 py-2 rounded-xl backdrop-blur-xl border flex items-center gap-3 shadow-2xl ${
                lastResult.isBigWin
                  ? 'bg-gradient-to-r from-amber-500/30 via-yellow-500/30 to-amber-500/30 border-amber-400 text-amber-300 shadow-amber-500/40 ring-2 ring-amber-500/20'
                  : lastResult.isWin
                  ? 'bg-gradient-to-r from-emerald-500/30 to-teal-500/30 border-teal-400 text-teal-300 shadow-teal-500/30'
                  : 'bg-gradient-to-r from-red-500/20 to-zinc-900 border-red-500/40 text-red-400 shadow-red-500/20'
              }`}
            >
              <div className="text-2xl">
                {lastResult.isBigWin ? '🎉' : lastResult.isWin ? '✨' : '💥'}
              </div>
              <div>
                <p className="text-[9px] uppercase font-extrabold tracking-widest opacity-80">
                  {lastResult.isBigWin ? 'JACKPOT WIN!' : lastResult.isWin ? 'ROUND WIN' : 'LOW MULTIPLIER'}
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-black font-mono">
                    {lastResult.multiplier}x
                  </span>
                  <span className="text-xs font-bold">
                    ({lastResult.isWin ? '+' : ''}${lastResult.payout.toFixed(2)})
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <canvas ref={canvasRef} className="max-w-full rounded-xl shadow-xl border border-white/5" />
        
        {/* Multiplier Buckets Bar */}
        <div className="flex gap-1 mt-2 overflow-x-auto max-w-full px-1 py-1 scrollbar-none">
          {multipliers.map((m, i) => {
            const isActive = activeBucket === i
            return (
              <motion.div
                key={i}
                animate={isActive ? { scale: [1, 1.3, 1.1], y: [0, -5, 0] } : { scale: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`px-2 py-1 rounded-lg text-[10px] font-mono font-black text-white text-center shrink-0 border transition-all ${
                  isActive
                    ? 'ring-2 ring-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.8)] z-20'
                    : 'border-white/10 opacity-90'
                }`}
                style={{ backgroundColor: getMultiplierColor(m) }}
              >
                {m}x
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Controls Console */}
      <div className="bg-[#1e1f26]/90 border border-white/10 rounded-2xl p-3 space-y-2.5 shrink-0">
        <div className="grid grid-cols-3 gap-2 text-center bg-black/40 p-2 rounded-xl border border-white/5">
          <div>
            <p className="text-[9px] text-gray-400 font-bold uppercase">Profit</p>
            <p className={`text-xs font-extrabold font-mono ${sessionProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {sessionProfit >= 0 ? '+' : ''}${sessionProfit.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-[9px] text-gray-400 font-bold uppercase">Drops</p>
            <p className="text-xs font-extrabold text-white font-mono">{totalDrops}</p>
          </div>
          <div>
            <p className="text-[9px] text-gray-400 font-bold uppercase">Streak</p>
            <p className="text-xs font-extrabold text-amber-400 flex items-center justify-center gap-0.5 font-mono">
              <Flame className="w-3 h-3 fill-amber-400" /> {winStreak}
            </p>
          </div>
        </div>

        {/* Wager & Settings */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-[10px] text-gray-300 font-bold">Wager ($)</Label>
            <Input
              type="number"
              value={wager}
              onChange={(e) => setWager(e.target.value)}
              className="bg-black border-zinc-700 text-white font-mono font-bold text-xs h-8 mt-1"
            />
          </div>

          <div>
            <Label className="text-[10px] text-gray-300 font-bold">Risk</Label>
            <Select value={risk} onValueChange={(v) => setRisk(v as PlinkoRisk)}>
              <SelectTrigger className="bg-black border-zinc-700 mt-1 text-white text-xs h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700 text-white text-xs">
                <SelectItem value="LOW">🟢 Low</SelectItem>
                <SelectItem value="MEDIUM">🟡 Med</SelectItem>
                <SelectItem value="HIGH">🔴 High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-[10px] text-gray-300 font-bold">Rows ({rows})</Label>
            <Select value={rows.toString()} onValueChange={(v) => setRows(parseInt(v))}>
              <SelectTrigger className="bg-black border-zinc-700 mt-1 text-white text-xs h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700 text-white text-xs">
                <SelectItem value="8">8 Rows</SelectItem>
                <SelectItem value="10">10 Rows</SelectItem>
                <SelectItem value="12">12 Rows</SelectItem>
                <SelectItem value="14">14 Rows</SelectItem>
                <SelectItem value="16">16 Rows</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Button */}
        <Button
          onClick={() => {
            if (isAutoDrop) {
              setIsAutoDrop(false)
            } else {
              spawnBall()
            }
          }}
          className={`w-full h-11 font-black text-base rounded-xl shadow-lg transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2 ${
            isAutoDrop 
              ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white animate-pulse' 
              : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:brightness-110 text-black'
          }`}
        >
          {isAutoDrop ? (
            <>
              <Pause className="w-5 h-5 fill-white" />
              STOP AUTO
            </>
          ) : (
            <>
              🎯 DROP BALL (${singleWager})
            </>
          )}
        </Button>
      </div>

    </div>
  )
}
