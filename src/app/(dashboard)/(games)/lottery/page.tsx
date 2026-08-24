'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Volume2, VolumeX, Minus, Plus, Trophy, Sparkles, RefreshCw, Zap, Users, Flame, Award } from 'lucide-react'
import { useWallet } from '@/context/WalletContext'
import { haptics } from '@/lib/haptics'
import { playSound } from '@/lib/sounds'
import { motion, AnimatePresence } from 'framer-motion'
import { db } from '@/lib/firebase'
import { doc, setDoc, onSnapshot } from 'firebase/firestore'

export type BetType = 'SINGLE' | 'RANGE_1_5' | 'RANGE_6_9' | 'ZERO_FIVE'

interface BetOption {
  type: BetType
  label: string
  multiplier: number
  description: string
  numbers: number[]
}

const BET_TYPES_CONFIG: Record<BetType, BetOption> = {
  SINGLE: { type: 'SINGLE', label: 'SINGLE (0-9)', multiplier: 9.0, description: 'Select 1 number (0-9)', numbers: [] },
  RANGE_1_5: { type: 'RANGE_1_5', label: '1 - 5 RANGE', multiplier: 1.8, description: 'Numbers 1, 2, 3, 4, 5', numbers: [1, 2, 3, 4, 5] },
  RANGE_6_9: { type: 'RANGE_6_9', label: '6 - 9 RANGE', multiplier: 2.25, description: 'Numbers 6, 7, 8, 9', numbers: [6, 7, 8, 9] },
  ZERO_FIVE: { type: 'ZERO_FIVE', label: '0 / 5 BET', multiplier: 4.5, description: 'Numbers 0 or 5', numbers: [0, 5] },
}

// Evolution / Stake Style Two-Color Metallic Ball System
// Group 1 (Blue #2D8CFF): Even 0, 2, 4, 6, 8
// Group 2 (Orange #FF8C1A): Odd 1, 3, 5, 7, 9
export const getBallColor = (num: number) => {
  return num % 2 === 0 ? '#2D8CFF' : '#FF8C1A'
}

// Global Deterministic PRNG Seeded by Round ID (Same Winning Number on ALL devices globally)
export const getGlobalRoundWinningNumber = (roundId: number): number => {
  let seed = (roundId ^ 0x9E3779B9) >>> 0
  seed = Math.imul(seed ^ (seed >>> 16), 0x85ebca6b)
  seed = Math.imul(seed ^ (seed >>> 13), 0xc2b2ae35)
  return ((seed ^ (seed >>> 16)) >>> 0) % 10
}

interface BallPhysics {
  num: number
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  angle: number
  va: number // Angular velocity
}

interface ActiveBet {
  id: string
  betType: BetType
  selectedNumber: number | null
  amount: number
  roundId: number
}

type RoundPhase = 'BETTING' | 'DRAWING' | 'RESULT'

export default function RealisticLuckyBallGame() {
  const { balance, debit, credit, addDemoCoins } = useWallet()

  // Master Game State
  const [roundId, setRoundId] = useState(9105)
  const [phase, setPhase] = useState<RoundPhase>('BETTING')
  const [timeLeft, setTimeLeft] = useState(30)
  const [winningNumber, setWinningNumber] = useState<number | null>(null)
  const [history, setHistory] = useState<number[]>([7, 2, 4, 9, 0, 1, 8])

  // Betting Controls
  const [selectedBetType, setSelectedBetType] = useState<BetType>('SINGLE')
  const [selectedSingleNumber, setSelectedSingleNumber] = useState<number>(7)
  const [wager, setWager] = useState<number>(100)
  const [myBets, setMyBets] = useState<ActiveBet[]>([])
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [isBetLocked, setIsBetLocked] = useState(false)
  const [betConfirmedNotice, setBetConfirmedNotice] = useState<string | null>(null)

  // Live Stats
  const [livePlayers] = useState(214)
  const [totalPool, setTotalPool] = useState(58900)
  const [lastWinAnnouncement, setLastWinAnnouncement] = useState<{ isWin: boolean; payout: number; msg: string } | null>(null)
  
  // Grand Result Modal State
  const [resultModal, setResultModal] = useState<{
    show: boolean
    isWin: boolean
    payout: number
    totalSpent: number
    netProfit: number
    winNum: number
    multiplier: number
  } | null>(null)

  // 24-Hour Bet History Table State
  const [betHistory24h, setBetHistory24h] = useState<Array<{
    id: string
    roundId: number
    time: string
    betTypeLabel: string
    wager: number
    winningBall: number | null
    payout: number
    status: 'PENDING' | 'WIN' | 'LOSS'
    isWin: boolean
  }>>([
    { id: 'b_101', roundId: 9104, time: '22:38:12', betTypeLabel: '0 / 5 BET', wager: 100, winningBall: 5, payout: 450, status: 'WIN', isWin: true },
    { id: 'b_102', roundId: 9103, time: '22:37:32', betTypeLabel: '1 - 5 RANGE', wager: 50, winningBall: 2, payout: 90, status: 'WIN', isWin: true },
    { id: 'b_103', roundId: 9102, time: '22:36:52', betTypeLabel: 'SINGLE (0-9)', wager: 100, winningBall: 9, payout: 0, status: 'LOSS', isWin: false },
    { id: 'b_104', roundId: 9101, time: '22:36:12', betTypeLabel: '6 - 9 RANGE', wager: 200, winningBall: 7, payout: 450, status: 'WIN', isWin: true },
  ])

  // Live Admin Override Settings from Firebase Firestore
  const [adminConfig, setAdminConfig] = useState<{ mode: 'AUTO' | 'FORCED' | 'HOUSE_MAX_PROFIT'; forcedNumber: number } | null>(null)

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'admin_settings', 'luckyball'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data()
        setAdminConfig({
          mode: data.mode || 'AUTO',
          forcedNumber: typeof data.forcedNumber === 'number' ? data.forcedNumber : 7
        })
      }
    }, (e) => {
      console.warn('Firebase Admin Settings Listen Error:', e)
    })
    return () => unsub()
  }, [])

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ballsRef = useRef<BallPhysics[]>([])
  const animRef = useRef<number | null>(null)

  // Initialize 10 Physical Balls (0-9) inside pneumatic chamber
  useEffect(() => {
    const balls: BallPhysics[] = []
    for (let i = 0; i <= 9; i++) {
      balls.push({
        num: i,
        x: 100 + (i % 5) * 28 + (Math.random() - 0.5) * 10,
        y: 100 + Math.floor(i / 5) * 28 + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        radius: 14,
        angle: Math.random() * Math.PI * 2,
        va: (Math.random() - 0.5) * 0.1
      })
    }
    ballsRef.current = balls
  }, [])

  const extractionAnimRef = useRef<{
    targetNum: number | null
    progress: number
    particles: Array<{ x: number; y: number; vx: number; vy: number; radius: number; alpha: number; color: string }>
    burstDone: boolean
  }>({
    targetNum: null,
    progress: 0,
    particles: [],
    burstDone: false
  })

  // 60 FPS HTML5 Canvas Physics & Rendering Engine
  const drawMachine = useCallback((isDrawing: boolean, drawnNum: number | null) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = Math.min(canvas.parentElement?.clientWidth || 290, 290)
    canvas.width = size * 2
    canvas.height = size * 2
    ctx.scale(2, 2)

    // Machine Slight Shake during high-speed drawing phase
    let offsetX = 0
    let offsetY = 0
    if (isDrawing && drawnNum === null) {
      offsetX = (Math.random() - 0.5) * 4
      offsetY = (Math.random() - 0.5) * 4
    }

    const cx = size / 2 + offsetX
    const cy = size / 2 + 10 + offsetY
    const radius = size * 0.41

    ctx.clearRect(0, 0, size, size)

    // Update Extraction Progress State
    const animState = extractionAnimRef.current
    if (drawnNum === null) {
      animState.targetNum = null
      animState.progress = 0
      animState.burstDone = false
      animState.particles = []
    } else {
      if (animState.targetNum !== drawnNum) {
        animState.targetNum = drawnNum
        animState.progress = 0
        animState.burstDone = false
        animState.particles = []
      } else if (animState.progress < 1.0) {
        animState.progress = Math.min(1.0, animState.progress + 0.02)
      }
    }

    const currentP = animState.progress

    // 1. Draw Machine Metallic Base & Stand
    ctx.save()
    ctx.beginPath()
    ctx.ellipse(cx, cy + radius + 10, radius * 0.7, 12, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#090C15'
    ctx.shadowColor = '#F7B500'
    ctx.shadowBlur = 10
    ctx.fill()
    ctx.restore()

    // 2. Draw 3D Glass Sphere Machine Vessel
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    
    // Glossy Radial Gradient Glass Reflection
    const glassGrad = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.3, 5, cx, cy, radius)
    glassGrad.addColorStop(0, 'rgba(255, 255, 255, 0.25)')
    glassGrad.addColorStop(0.3, 'rgba(45, 140, 255, 0.08)')
    glassGrad.addColorStop(0.7, 'rgba(18, 24, 38, 0.90)')
    glassGrad.addColorStop(1, 'rgba(9, 12, 21, 0.98)')
    
    ctx.fillStyle = glassGrad
    ctx.shadowColor = isDrawing ? '#F7B500' : 'rgba(45, 140, 255, 0.4)'
    ctx.shadowBlur = isDrawing ? 35 : 18
    ctx.fill()

    // Gold Metallic Outer Rim
    ctx.strokeStyle = '#F7B500'
    ctx.lineWidth = 3.5
    ctx.stroke()

    // Curved Glass Highlight Arc Reflection
    ctx.beginPath()
    ctx.arc(cx, cy, radius - 4, -Math.PI * 0.75, -Math.PI * 0.25)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)'
    ctx.lineWidth = 2.5
    ctx.stroke()
    ctx.restore()

    // 3. Golden Pneumatic Suction Chute Tube (Top Exit)
    ctx.save()
    ctx.fillStyle = '#121826'
    ctx.strokeStyle = '#F7B500'
    ctx.lineWidth = 2.5
    ctx.fillRect(cx - 18, cy - radius - 26, 36, 30)
    ctx.strokeRect(cx - 18, cy - radius - 26, 36, 30)
    ctx.restore()

    // 4. Ball-to-Ball Collisions & Realistic Movement Physics
    const balls = ballsRef.current
    const speedMult = isDrawing && drawnNum === null ? 2.8 : 1.1

    // Elastic Collision Resolution between Balls
    for (let i = 0; i < balls.length; i++) {
      for (let j = i + 1; j < balls.length; j++) {
        const b1 = balls[i]
        const b2 = balls[j]
        const dx = b2.x - b1.x
        const dy = b2.y - b1.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const minDist = b1.radius + b2.radius

        if (dist < minDist && dist > 0) {
          if (b1.num === drawnNum || b2.num === drawnNum) continue

          const nx = dx / dist
          const ny = dy / dist
          const kx = b1.vx - b2.vx
          const ky = b1.vy - b2.vy
          const p = 2 * (nx * kx + ny * ky) / 2

          b1.vx -= p * nx
          b1.vy -= p * ny
          b2.vx += p * nx
          b2.vy += p * ny

          const overlap = 0.5 * (minDist - dist)
          b1.x -= overlap * nx
          b1.y -= overlap * ny
          b2.x += overlap * nx
          b2.y += overlap * ny
        }
      }
    }

    // Render non-target balls or target ball if not extracting
    for (let i = 0; i < balls.length; i++) {
      const b = balls[i]
      if (drawnNum !== null && b.num === drawnNum) continue // Rendered via Vortex Suction Animation below

      b.x += b.vx * speedMult
      b.y += b.vy * speedMult
      b.angle += b.va * speedMult

      const dx = b.x - cx
      const dy = b.y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist + b.radius > radius - 3) {
        const nx = dx / dist
        const ny = dy / dist
        const dot = b.vx * nx + b.vy * ny
        b.vx -= 2 * dot * nx * 0.95
        b.vy -= 2 * dot * ny * 0.95

        b.x = cx + nx * (radius - 3 - b.radius)
        b.y = cy + ny * (radius - 3 - b.radius)
      }

      const mainColor = getBallColor(b.num)

      ctx.save()
      ctx.translate(b.x, b.y)
      ctx.rotate(b.angle)

      ctx.beginPath()
      ctx.arc(0, 0, b.radius, 0, Math.PI * 2)
      ctx.shadowColor = mainColor
      ctx.shadowBlur = 10
      ctx.shadowOffsetY = 2

      const ballGrad = ctx.createRadialGradient(-b.radius * 0.35, -b.radius * 0.35, 1, 0, 0, b.radius)
      ballGrad.addColorStop(0, '#FFFFFF')
      ballGrad.addColorStop(0.3, mainColor)
      ballGrad.addColorStop(0.85, mainColor === '#2D8CFF' ? '#0D3B7A' : '#7A3200')
      ballGrad.addColorStop(1, '#05070D')
      
      ctx.fillStyle = ballGrad
      ctx.fill()
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
      ctx.lineWidth = 1
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(0, 0, b.radius * 0.58, 0, Math.PI * 2)
      ctx.fillStyle = '#FFFFFF'
      ctx.fill()

      ctx.fillStyle = '#090C15'
      ctx.font = '900 11px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(b.num.toString(), 0, 0.5)

      ctx.restore()
    }

    // 5. HIGH-SPEED 3D VORTEX EXTRACTION & SPOTLIGHT BOUNCE ANIMATION
    if (drawnNum !== null) {
      const winColor = getBallColor(drawnNum)
      let bx = cx
      let by = cy
      let ballScale = 1
      let ballRotation = 0

      if (currentP < 0.45) {
        // STAGE 1: Pneumatic Spiral Vortex Suction Trajectory (0% - 45%)
        const pStage = currentP / 0.45
        const spiralAngle = pStage * Math.PI * 8
        const spiralRadius = (1 - pStage) * (radius * 0.55)
        
        bx = cx + Math.cos(spiralAngle) * spiralRadius
        by = (cy + radius * 0.3) - pStage * (radius * 1.2)
        ballRotation = spiralAngle
        ballScale = 0.85 + pStage * 0.25

        // Emit Golden Spiral Particles
        if (Math.random() < 0.8) {
          animState.particles.push({
            x: bx + (Math.random() - 0.5) * 8,
            y: by + (Math.random() - 0.5) * 8,
            vx: (Math.random() - 0.5) * 2,
            vy: Math.random() * 2 + 1,
            radius: Math.random() * 3 + 1.5,
            alpha: 1,
            color: '#F7B500'
          })
        }

      } else if (currentP < 0.70) {
        // STAGE 2: High-Velocity Suction Chute Tube Ascent (45% - 70%)
        const pStage = (currentP - 0.45) / 0.25
        bx = cx
        by = (cy - radius + 15) - pStage * 35
        ballScale = 1.1
        ballRotation = pStage * Math.PI * 4

        // Tube Streak Glow Effect
        ctx.save()
        ctx.strokeStyle = 'rgba(247, 181, 0, 0.8)'
        ctx.lineWidth = 16
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(cx, cy - radius + 15)
        ctx.lineTo(cx, by)
        ctx.stroke()
        ctx.restore()

      } else {
        // STAGE 3: Spotlight Elastic Bounce & Pedestal Lock (70% - 100%)
        const pStage = (currentP - 0.70) / 0.30
        const wy = cy - radius - 10
        const bounceHeight = Math.abs(Math.sin(pStage * Math.PI * 2.5)) * 14 * (1 - pStage)
        
        bx = cx
        by = wy - bounceHeight
        ballScale = 1 + Math.sin(pStage * Math.PI) * 0.2
        ballRotation = (1 - pStage) * Math.PI * 2

        // Burst Confetti Sparkles when locked
        if (currentP >= 0.98 && !animState.burstDone) {
          animState.burstDone = true
          for (let pCount = 0; pCount < 25; pCount++) {
            const pAngle = Math.random() * Math.PI * 2
            const pSpeed = Math.random() * 5 + 2
            animState.particles.push({
              x: cx,
              y: wy,
              vx: Math.cos(pAngle) * pSpeed,
              vy: Math.sin(pAngle) * pSpeed,
              radius: Math.random() * 4 + 2,
              alpha: 1,
              color: Math.random() > 0.4 ? '#F7B500' : '#FFFFFF'
            })
          }
        }
      }

      // Render Active Spiral Trail Particles
      for (let pIdx = animState.particles.length - 1; pIdx >= 0; pIdx--) {
        const pt = animState.particles[pIdx]
        pt.x += pt.vx
        pt.y += pt.vy
        pt.alpha -= 0.04

        if (pt.alpha <= 0) {
          animState.particles.splice(pIdx, 1)
          continue
        }

        ctx.save()
        ctx.globalAlpha = pt.alpha
        ctx.fillStyle = pt.color
        ctx.shadowColor = pt.color
        ctx.shadowBlur = 8
        ctx.beginPath()
        ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      // Render Spotlight Cone Beam behind Winning Ball
      const wx = cx
      const wy = cy - radius - 10
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(wx - 25, wy - 30)
      ctx.lineTo(wx + 25, wy - 30)
      ctx.lineTo(wx + 40, wy + 40)
      ctx.lineTo(wx - 40, wy + 40)
      ctx.closePath()
      const spotGrad = ctx.createLinearGradient(wx, wy - 30, wx, wy + 40)
      spotGrad.addColorStop(0, 'rgba(247, 181, 0, 0.7)')
      spotGrad.addColorStop(1, 'rgba(247, 181, 0, 0)')
      ctx.fillStyle = spotGrad
      ctx.fill()
      ctx.restore()

      // Render 3D Extracting Winning Ball
      ctx.save()
      ctx.translate(bx, by)
      ctx.scale(ballScale, ballScale)
      ctx.rotate(ballRotation)

      ctx.beginPath()
      ctx.arc(0, 0, 17, 0, Math.PI * 2)
      const wGrad = ctx.createRadialGradient(-6, -6, 2, 0, 0, 17)
      wGrad.addColorStop(0, '#FFFFFF')
      wGrad.addColorStop(0.35, winColor)
      wGrad.addColorStop(0.9, winColor === '#2D8CFF' ? '#0D3B7A' : '#7A3200')
      wGrad.addColorStop(1, '#000000')

      ctx.fillStyle = wGrad
      ctx.shadowColor = '#F7B500'
      ctx.shadowBlur = 30
      ctx.fill()
      ctx.strokeStyle = '#F7B500'
      ctx.lineWidth = 2.5
      ctx.stroke()

      // White Badge
      ctx.beginPath()
      ctx.arc(0, 0, 10, 0, Math.PI * 2)
      ctx.fillStyle = '#FFFFFF'
      ctx.fill()

      // Centered Number (Never Disappears)
      ctx.fillStyle = '#090C15'
      ctx.font = '900 13px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(drawnNum.toString(), 0, 0.5)

      ctx.restore()
    }
  }, [])

  // Continuous Physics Loop
  useEffect(() => {
    const loop = () => {
      drawMachine(phase === 'DRAWING', winningNumber)
      animRef.current = requestAnimationFrame(loop)
    }
    animRef.current = requestAnimationFrame(loop)
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [drawMachine, phase, winningNumber])

  // Master Global Clock Synchronizer (30s Betting -> 5s Drawing -> 5s Result)
  // All devices globally synchronize to the EXACT SAME Unix Epoch Timestamp & Deterministic Winning Ball Number
  const evaluatedRoundRef = useRef<number | null>(null)

  useEffect(() => {
    const syncGlobalClock = () => {
      const CYCLE = 40 // 30s Betting + 5s Drawing + 5s Result
      const nowSec = Math.floor(Date.now() / 1000)
      const currentRoundId = 9100 + Math.floor(nowSec / CYCLE)
      const cycleSec = nowSec % CYCLE

      setRoundId(currentRoundId)

      // Calculate Target Winning Ball for the current round
      let winBallToUse = getGlobalRoundWinningNumber(currentRoundId)

      if (adminConfig) {
        if (adminConfig.mode === 'FORCED') {
          winBallToUse = adminConfig.forcedNumber
        } else if (adminConfig.mode === 'HOUSE_MAX_PROFIT') {
          let minPayout = Infinity
          let bestBall = 0
          for (let testNum = 0; testNum <= 9; testNum++) {
            let testPayout = 0
            myBets.forEach(b => {
              if (b.betType === 'SINGLE' && b.selectedNumber === testNum) testPayout += b.amount * 9
              else if (b.betType === 'RANGE_1_5' && testNum >= 1 && testNum <= 5) testPayout += b.amount * 1.8
              else if (b.betType === 'RANGE_6_9' && testNum >= 6 && testNum <= 9) testPayout += b.amount * 2.25
              else if (b.betType === 'ZERO_FIVE' && (testNum === 0 || testNum === 5)) testPayout += b.amount * 4.5
            })
            if (testPayout < minPayout) {
              minPayout = testPayout
              bestBall = testNum
            }
          }
          winBallToUse = bestBall
        }
      }

      if (cycleSec < 30) {
        // BETTING Phase (30s to 1s)
        const remain = 30 - cycleSec
        if (phase !== 'BETTING') {
          setPhase('BETTING')
          setWinningNumber(null)
          setMyBets([])
          setLastWinAnnouncement(null)
          setResultModal(null)
        }
        setTimeLeft(remain)
      } else if (cycleSec >= 30 && cycleSec < 35) {
        // DRAWING Phase (5s)
        const remain = 35 - cycleSec
        if (phase !== 'DRAWING') {
          setPhase('DRAWING')
          setWinningNumber(winBallToUse)
          haptics.medium()
          if (soundEnabled) playSound('suction')
        }
        setTimeLeft(remain)
      } else {
        // RESULT Phase (5s)
        const remain = 40 - cycleSec

        if (phase !== 'RESULT') {
          setPhase('RESULT')
          setWinningNumber(winBallToUse)
          if (soundEnabled) playSound('suction')
        }
        setTimeLeft(remain)

        // Evaluate bet results once per round
        if (evaluatedRoundRef.current !== currentRoundId) {
          evaluatedRoundRef.current = currentRoundId
          evaluateRound(winBallToUse)
        }
      }
    }

    syncGlobalClock()
    const syncInterval = setInterval(syncGlobalClock, 500)
    return () => clearInterval(syncInterval)
  }, [phase, myBets, soundEnabled])

  // Evaluate Round Result
  const evaluateRound = async (winNum: number) => {
    let totalWinPayout = 0
    let totalSpent = 0

    myBets.forEach(b => {
      totalSpent += b.amount
      let won = false
      let mult = 0

      if (b.betType === 'SINGLE' && b.selectedNumber === winNum) {
        won = true
        mult = 9.0
      } else if (b.betType === 'RANGE_1_5' && winNum >= 1 && winNum <= 5) {
        won = true
        mult = 1.8
      } else if (b.betType === 'RANGE_6_9' && winNum >= 6 && winNum <= 9) {
        won = true
        mult = 2.25
      } else if (b.betType === 'ZERO_FIVE' && (winNum === 0 || winNum === 5)) {
        won = true
        mult = 4.5
      }

      if (won) {
        totalWinPayout += +(b.amount * mult).toFixed(2)
      }
    })

    setHistory(prev => [winNum, ...prev.slice(0, 7)])

    // Update 24-Hour Bet History entries from PENDING to WIN or LOSS
    setBetHistory24h(prev => prev.map(entry => {
      if (entry.roundId === roundId) {
        const betObj = myBets.find(b => b.id === entry.id)
        if (betObj) {
          let won = false
          let mult = 0
          if (betObj.betType === 'SINGLE' && betObj.selectedNumber === winNum) { won = true; mult = 9.0 }
          else if (betObj.betType === 'RANGE_1_5' && winNum >= 1 && winNum <= 5) { won = true; mult = 1.8 }
          else if (betObj.betType === 'RANGE_6_9' && winNum >= 6 && winNum <= 9) { won = true; mult = 2.25 }
          else if (betObj.betType === 'ZERO_FIVE' && (winNum === 0 || winNum === 5)) { won = true; mult = 4.5 }

          const payout = won ? +(betObj.amount * mult).toFixed(2) : 0
          return {
            ...entry,
            winningBall: winNum,
            payout,
            status: (won ? 'WIN' : 'LOSS') as 'WIN' | 'LOSS',
            isWin: won
          }
        }
      }
      return entry
    }))

    // Sync status updates to Firebase Firestore for Admin
    myBets.forEach(async (b) => {
      let won = false
      let mult = 0
      if (b.betType === 'SINGLE' && b.selectedNumber === winNum) { won = true; mult = 9.0 }
      else if (b.betType === 'RANGE_1_5' && winNum >= 1 && winNum <= 5) { won = true; mult = 1.8 }
      else if (b.betType === 'RANGE_6_9' && winNum >= 6 && winNum <= 9) { won = true; mult = 2.25 }
      else if (b.betType === 'ZERO_FIVE' && (winNum === 0 || winNum === 5)) { won = true; mult = 4.5 }

      const payout = won ? +(b.amount * mult).toFixed(2) : 0

      try {
        const bDocRef = doc(db, 'bets', b.id)
        await setDoc(bDocRef, {
          winningBall: winNum,
          payout,
          status: won ? 'WIN' : 'LOSS',
          isWin: won
        }, { merge: true })
      } catch (e) {
        console.warn('Firebase Bet Result Sync:', e)
      }
    })

    if (myBets.length > 0) {
      setResultModal({
        show: true,
        isWin: totalWinPayout > 0,
        payout: totalWinPayout,
        totalSpent,
        netProfit: totalWinPayout - totalSpent,
        winNum,
        multiplier: totalSpent > 0 ? +(totalWinPayout / totalSpent).toFixed(2) : 0
      })
    }

    if (totalWinPayout > 0) {
      haptics.heavy()
      if (soundEnabled) playSound('jackpot')
      await credit(totalWinPayout, 'LUCKY_BALL')
      setLastWinAnnouncement({
        isWin: true,
        payout: totalWinPayout,
        msg: `🎉 LUCKY BALL ${winNum}! YOU WON ₹${totalWinPayout.toFixed(2)}`
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

    try {
      const rDocRef = doc(db, 'rounds', `round_${roundId}`)
      await setDoc(rDocRef, {
        roundId,
        winningNumber: winNum,
        timestamp: new Date().toISOString(),
        totalPool: totalPool + totalSpent
      }, { merge: true })
    } catch (e) {
      console.warn('Firebase Round Sync:', e)
    }
  }

  // Place Bet
  const placeBet = async () => {
    if (phase !== 'BETTING' || timeLeft <= 5 || isBetLocked) return
    if (wager <= 0) return

    setIsBetLocked(true)
    haptics.medium()
    if (soundEnabled) playSound('chip')

    if (balance < wager) {
      addDemoCoins(1000)
    }

    const success = await debit(wager, 'LUCKY_BALL')
    if (!success) {
      setIsBetLocked(false)
      return
    }

    const newBet: ActiveBet = {
      id: `bet_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      betType: selectedBetType,
      selectedNumber: selectedBetType === 'SINGLE' ? selectedSingleNumber : null,
      amount: wager,
      roundId
    }

    setMyBets(prev => [...prev, newBet])
    setTotalPool(p => p + wager)

    // Add Pending Entry to 24-Hour Bet History Table immediately
    const pendingHistoryEntry = {
      id: newBet.id,
      roundId,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      betTypeLabel: BET_TYPES_CONFIG[selectedBetType].label,
      wager,
      winningBall: null,
      payout: 0,
      status: 'PENDING' as const,
      isWin: false
    }

    setBetHistory24h(prev => [pendingHistoryEntry, ...prev].slice(0, 50))

    const labelStr = selectedBetType === 'SINGLE' 
      ? `SINGLE #${selectedSingleNumber}` 
      : selectedBetType
    
    setBetConfirmedNotice(`✅ BET CONFIRMED: ₹${wager} ON ${labelStr}`)

    // Unlock button after exactly 2 seconds (2000ms)
    setTimeout(() => {
      setIsBetLocked(false)
    }, 2000)

    setTimeout(() => {
      setBetConfirmedNotice(null)
    }, 3500)

    try {
      const bDocRef = doc(db, 'bets', newBet.id)
      await setDoc(bDocRef, {
        betId: newBet.id,
        roundId,
        betType: selectedBetType,
        selectedNumber: selectedBetType === 'SINGLE' ? selectedSingleNumber : null,
        amount: wager,
        status: 'PENDING',
        timestamp: new Date().toISOString()
      }, { merge: true })
    } catch (e) {
      console.warn('Firebase Bet Sync:', e)
    }
  }

  const currentConfig = BET_TYPES_CONFIG[selectedBetType]

  return (
    <div className="h-full w-full overflow-hidden flex flex-col justify-between p-1.5 select-none text-white max-w-lg mx-auto bg-[#090C15]">
      
      {/* Top Mobile Bar */}
      <div className="flex justify-between items-center px-3 py-2 bg-[#121826] rounded-xl border border-[#F7B500]/20 shrink-0">
        <div className="flex items-center gap-2">
          <Link href="/" onClick={() => haptics.light()} className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-[#F7B500]">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xs font-black text-[#F7B500] tracking-wider uppercase flex items-center gap-1">
              🎱 REALISTIC LUCKY BALL
            </h1>
            <p className="text-[9px] text-gray-400 font-mono">ROUND #{roundId}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-[9px] uppercase font-bold text-gray-400 block">
              {phase === 'BETTING' ? 'COUNTDOWN' : phase === 'DRAWING' ? 'DRAWING...' : 'RESULT'}
            </span>
            <span className={`text-sm font-black font-mono ${timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-[#F7B500]'}`}>
              00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
            </span>
          </div>

          <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-1.5 rounded-lg bg-black/40 text-gray-400 hover:text-[#F7B500]">
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#F7B500]" /> : <VolumeX className="w-4 h-4 text-red-400" />}
          </button>
        </div>
      </div>

      {/* Previous Results Mini 3D Ball Badges */}
      <div className="flex items-center justify-between px-2.5 py-1 bg-[#121826]/80 rounded-xl border border-white/5 text-[10px] shrink-0 my-0.5">
        <span className="text-gray-400 font-bold">PREVIOUS:</span>
        <div className="flex gap-1.5 overflow-x-auto">
          {history.map((num, i) => {
            const ballColor = getBallColor(num)
            return (
              <div
                key={i}
                className="w-5 h-5 rounded-full flex items-center justify-center border border-white/30 shadow-md font-black text-[9px] text-black relative"
                style={{
                  background: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${ballColor} 60%, #000000 100%)`,
                  boxShadow: `0 0 6px ${ballColor}80`
                }}
              >
                <div className="w-3 h-3 rounded-full bg-white flex items-center justify-center text-[#090C15] font-black text-[8px]">
                  {num}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Center 3D Realistic Machine Sphere */}
      <div className="relative flex-1 flex flex-col items-center justify-center rounded-2xl bg-gradient-to-b from-[#121826] to-[#090C15] border border-[#F7B500]/20 p-1 my-0.5 overflow-hidden shadow-2xl">
        
        <div className="w-64 h-64 relative flex items-center justify-center">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>

        {/* Live Stats Overlay */}
        <div className="absolute top-2 left-3 flex gap-3 text-[10px] font-mono text-gray-400 bg-black/60 px-2.5 py-0.5 rounded-full border border-white/10 backdrop-blur-md">
          <span className="flex items-center gap-1"><Users className="w-3 h-3 text-[#F7B500]" /> {livePlayers} LIVE</span>
          <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-400" /> POOL: ₹{totalPool.toLocaleString()}</span>
        </div>

        {/* Result Overlay Announcement */}
        <AnimatePresence>
          {lastWinAnnouncement && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`absolute bottom-2 px-5 py-2 rounded-2xl backdrop-blur-xl border flex items-center gap-2 shadow-2xl z-30 ${
                lastWinAnnouncement.isWin
                  ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300 shadow-emerald-500/40'
                  : 'bg-red-950/90 border-red-500/50 text-red-300 shadow-red-500/20'
              }`}
            >
              <span className="text-xl">{lastWinAnnouncement.isWin ? '🏆' : '🔴'}</span>
              <span className="text-xs font-black uppercase tracking-wider font-mono">
                {lastWinAnnouncement.msg}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bet Type Category Tabs (4 Clean Categories) */}
      <div className="grid grid-cols-4 gap-1 shrink-0 my-0.5">
        {(Object.keys(BET_TYPES_CONFIG) as BetType[]).map(bt => {
          const cfg = BET_TYPES_CONFIG[bt]
          const isSelected = selectedBetType === bt
          return (
            <button
              key={bt}
              disabled={phase !== 'BETTING' || timeLeft <= 5}
              onClick={() => { haptics.light(); setSelectedBetType(bt); }}
              className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all touch-spring ${
                isSelected
                  ? 'bg-[#F7B500] text-black border-[#F7B500] shadow-[0_0_12px_rgba(247,181,0,0.7)] font-black scale-95'
                  : 'bg-[#121826] text-gray-300 border-white/10 hover:text-white disabled:opacity-50'
              }`}
            >
              <div className="font-bold truncate px-0.5">{cfg.label}</div>
              <div className="text-[9px] opacity-90 font-mono font-black">{cfg.multiplier}x</div>
            </button>
          )
        })}
      </div>

      {/* Single Number Selector Grid (0-9) - Two Color Metallic Ball Buttons */}
      {selectedBetType === 'SINGLE' && (
        <div className="bg-[#121826]/90 p-2 rounded-2xl border border-[#F7B500]/20 shrink-0 my-0.5 space-y-1">
          <div className="text-[9px] font-bold text-gray-300 flex justify-between px-1">
            <span>SELECT SINGLE NUMBER (0-9)</span>
            <span className="text-[#F7B500] font-mono">9.00x PAYOUT</span>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => {
              const isSelected = selectedSingleNumber === num
              const bColor = getBallColor(num)
              return (
                <button
                  key={num}
                  disabled={phase !== 'BETTING' || timeLeft <= 5}
                  onClick={() => { haptics.light(); setSelectedSingleNumber(num); }}
                  className={`h-9 rounded-xl font-black text-xs transition-all touch-spring border flex items-center justify-center relative overflow-hidden ${
                    isSelected
                      ? 'border-[#F7B500] shadow-[0_0_16px_rgba(247,181,0,0.9)] scale-95 ring-2 ring-[#F7B500]'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                  style={{
                    background: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${bColor} 65%, #000000 100%)`
                  }}
                >
                  <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[#090C15] font-black text-xs shadow-inner">
                    {num}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Betting Console & Presets */}
      <div className="bg-[#121826] rounded-2xl p-2.5 border border-white/10 space-y-2 shrink-0">
        
        <div className="flex justify-between items-center text-[9px] font-bold text-gray-300">
          <span>BET AMOUNT (₹)</span>
          <div className="flex gap-1">
            {[10, 50, 100, 500, 1000].map(amt => (
              <button
                key={amt}
                disabled={phase !== 'BETTING'}
                onClick={() => { haptics.light(); setWager(amt); }}
                className={`px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold touch-spring ${
                  wager === amt ? 'bg-[#F7B500] text-black' : 'bg-black/40 text-gray-300 hover:text-white'
                }`}
              >
                ₹{amt}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center bg-[#090C15] rounded-xl border border-white/10 p-1">
          <button 
            disabled={phase !== 'BETTING'}
            onClick={() => { haptics.light(); setWager(prev => Math.max(10, prev - 10)); }}
            className="w-7 h-7 flex items-center justify-center bg-[#121826] rounded-lg text-white hover:text-[#F7B500] touch-spring disabled:opacity-50"
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
            className="w-7 h-7 flex items-center justify-center bg-[#121826] rounded-lg text-white hover:text-[#F7B500] touch-spring disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Green Bet Confirmation Notice Banner */}
        <AnimatePresence>
          {betConfirmedNotice && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="py-1.5 px-3 rounded-xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 text-[10px] font-black text-center font-mono shadow-lg shadow-emerald-500/20"
            >
              {betConfirmedNotice}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={placeBet}
          disabled={phase !== 'BETTING' || timeLeft <= 5 || isBetLocked}
          className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-transform active:scale-95 touch-spring cursor-pointer shadow-xl ${
            phase !== 'BETTING' || timeLeft <= 5 || isBetLocked
              ? 'bg-zinc-800 text-gray-400 cursor-not-allowed border border-[#F7B500]/20 opacity-75'
              : 'bg-gradient-to-r from-[#F7B500] via-yellow-400 to-[#F7B500] text-black shadow-[0_0_20px_rgba(247,181,0,0.4)] hover:brightness-110'
          }`}
        >
          {phase !== 'BETTING' ? (
            `⏳ DRAWING IN PROGRESS...`
          ) : timeLeft <= 5 ? (
            `🔒 BETS CLOSED (LAST 5s)`
          ) : isBetLocked ? (
            `🔒 BET CONFIRMED (LOCK 2s)`
          ) : (
            `💰 PLACE BET (₹${wager}) - ${currentConfig.label}`
          )}
        </button>

      </div>

      {/* 24-HOUR BET HISTORY TABLE */}
      <div className="bg-[#121826]/90 rounded-2xl p-2 border border-white/10 shrink-0 my-1 space-y-1.5">
        <div className="flex justify-between items-center px-1">
          <span className="text-[10px] font-black text-[#F7B500] uppercase tracking-wider flex items-center gap-1">
            📜 24-HOUR BET HISTORY TABLE
          </span>
          <span className="text-[9px] text-gray-400 font-mono">LIVE DAILY SYNC ACTIVE</span>
        </div>

        <div className="overflow-x-auto max-h-32 rounded-xl border border-white/5 bg-black/40">
          <table className="w-full text-left text-[9px] font-mono border-collapse">
            <thead className="bg-[#182338] text-gray-400 uppercase sticky top-0">
              <tr>
                <th className="py-1 px-2">Round</th>
                <th className="py-1 px-1">Time</th>
                <th className="py-1 px-1">Bet Type</th>
                <th className="py-1 px-1 text-center">Ball</th>
                <th className="py-1 px-1 text-right">Wager</th>
                <th className="py-1 px-1 text-right">Payout</th>
                <th className="py-1 px-2 text-center">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-300">
              {betHistory24h.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-3 text-center text-gray-500">No bets placed in 24 hours</td>
                </tr>
              ) : (
                betHistory24h.map(rec => (
                  <tr key={rec.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-1 px-2 font-bold text-gray-400">#{rec.roundId}</td>
                    <td className="py-1 px-1 text-gray-400">{rec.time}</td>
                    <td className="py-1 px-1 font-bold text-white">{rec.betTypeLabel}</td>
                    <td className="py-1 px-1 text-center font-black">
                      {rec.status === 'PENDING' || rec.winningBall === null ? (
                        <span className="inline-block px-1.5 py-0.2 rounded-full text-[8px] bg-yellow-950 text-yellow-400 border border-yellow-500/40">
                          ⏳ WAITING
                        </span>
                      ) : (
                        <span className={`inline-block px-1.5 py-0.2 rounded-full text-[8px] text-black ${
                          rec.winningBall % 2 === 0 ? 'bg-[#2D8CFF]' : 'bg-[#FF8C1A]'
                        }`}>
                          #{rec.winningBall}
                        </span>
                      )}
                    </td>
                    <td className="py-1 px-1 text-right text-gray-300">₹{rec.wager}</td>
                    <td className={`py-1 px-1 text-right font-bold ${
                      rec.status === 'PENDING' ? 'text-yellow-400 animate-pulse' : rec.isWin ? 'text-emerald-400' : 'text-gray-500'
                    }`}>
                      {rec.status === 'PENDING' ? '⏳ PENDING' : `₹${rec.payout.toFixed(2)}`}
                    </td>
                    <td className="py-1 px-2 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                        rec.status === 'PENDING' ? 'bg-yellow-950/80 text-yellow-400 border border-yellow-500/50 animate-pulse' :
                        rec.isWin ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50' : 'bg-red-950 text-red-400 border border-red-500/30'
                      }`}>
                        {rec.status === 'PENDING' ? '⏳ PENDING' : rec.isWin ? 'WIN' : 'LOSS'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* GRAND CONGRATULATIONS VICTORY & RESULT POPUP MODAL */}
      <AnimatePresence>
        {resultModal && resultModal.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setResultModal(null)}
          >
            <motion.div
              initial={{ scale: 0.7, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.7, y: 30 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-xs p-5 rounded-3xl border text-center shadow-2xl relative overflow-hidden ${
                resultModal.isWin
                  ? 'bg-gradient-to-b from-[#182338] via-[#121826] to-[#090C15] border-[#F7B500] shadow-[0_0_50px_rgba(247,181,0,0.5)]'
                  : 'bg-gradient-to-b from-[#241419] via-[#121826] to-[#090C15] border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.3)]'
              }`}
            >
              {/* Background Sunburst Glow */}
              <div className={`absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl opacity-40 pointer-events-none ${
                resultModal.isWin ? 'bg-[#F7B500]' : 'bg-red-500'
              }`} />

              {/* Top Header Badge */}
              <div className="relative z-10 space-y-2">
                <div className="mx-auto w-16 h-16 rounded-full bg-[#121826] border-2 border-[#F7B500] flex items-center justify-center shadow-xl">
                  <span className="text-3xl">{resultModal.isWin ? '👑' : '🔴'}</span>
                </div>

                <h2 className={`text-xl font-black uppercase tracking-wider ${
                  resultModal.isWin 
                    ? 'bg-gradient-to-r from-yellow-300 via-[#F7B500] to-yellow-100 bg-clip-text text-transparent drop-shadow-md'
                    : 'text-red-400'
                }`}>
                  {resultModal.isWin ? '🎉 CONGRATULATIONS! 🎉' : 'ROUND FINISHED'}
                </h2>

                <p className="text-[10px] text-gray-400 font-mono">
                  WINNING BALL WAS <span className="text-[#F7B500] font-black">#{resultModal.winNum}</span>
                </p>

                {/* Main Payout Display */}
                <div className="py-3 px-4 rounded-2xl bg-black/50 border border-white/10 my-2">
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">TOTAL RESULT</span>
                  <span className={`text-2xl font-black font-mono tracking-tight ${
                    resultModal.isWin ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'text-red-400'
                  }`}>
                    {resultModal.isWin ? `+₹${resultModal.payout.toFixed(2)}` : `-₹${resultModal.totalSpent.toFixed(2)}`}
                  </span>
                  {resultModal.isWin && (
                    <span className="text-[10px] text-[#F7B500] font-mono font-bold block mt-1">
                      PROFIT: +₹{resultModal.netProfit.toFixed(2)} ({resultModal.multiplier}x)
                    </span>
                  )}
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-white/5 p-2 rounded-xl border border-white/5">
                  <div className="text-left">
                    <span className="text-gray-400 block">WAGERED</span>
                    <span className="font-bold text-white">₹{resultModal.totalSpent}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-400 block">PAYOUT</span>
                    <span className={`font-bold ${resultModal.isWin ? 'text-emerald-400' : 'text-gray-400'}`}>
                      ₹{resultModal.payout.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Dismiss Button */}
                <button
                  onClick={() => setResultModal(null)}
                  className={`w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all mt-3 ${
                    resultModal.isWin
                      ? 'bg-gradient-to-r from-[#F7B500] to-yellow-400 text-black shadow-lg shadow-[#F7B500]/30 hover:brightness-110'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  CONTINUE NEXT ROUND
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
