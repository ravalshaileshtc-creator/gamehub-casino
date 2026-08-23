"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sparkles, Zap, ShieldCheck, Coins } from "lucide-react"
import { motion, useMotionValue, useSpring, useTransform, MotionValue } from "framer-motion"

interface Star {
  id: number
  x: number
  y: number
  size: number
  delay: number
  duration: number
}

function StarField({ stars }: { stars: Star[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Track mouse for the star field specifically
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Global window mouse move for full screen effect
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [mouseX, mouseY])

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((star) => (
        <InteractiveStar key={star.id} star={star} mouseX={mouseX} mouseY={mouseY} />
      ))}
    </div>
  )
}

function InteractiveStar({ star, mouseX, mouseY }: { star: Star; mouseX: MotionValue<number>; mouseY: MotionValue<number> }) {
  const x = useTransform(mouseX, (value: number) => {
    if (typeof window === "undefined") return `${star.x}%`
    // Parallax effect
    const moveFactor = star.size * 0.5 // Adjust density impact
    const screenCenter = window.innerWidth / 2
    const offset = (value - screenCenter) * 0.05 * moveFactor * -1
    return `calc(${star.x}% + ${offset}px)` 
  })
  
  const y = useTransform(mouseY, (value: number) => {
    if (typeof window === "undefined") return `${star.y}%`
    const moveFactor = star.size * 0.5
    const screenCenter = window.innerHeight / 2
    const offset = (value - screenCenter) * 0.05 * moveFactor * -1
    return `calc(${star.y}% + ${offset}px)`
  })

  return (
      <motion.div
      className="absolute bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]"
      style={{
        left: x,
        top: y,
        width: star.size,
        height: star.size,
      }}
      initial={{ opacity: 0 }}
      animate={{
        opacity: [0.2, 0.8, 0.2],
        scale: [0.8, 1.2, 0.8],
      }}
      transition={{
        duration: star.duration,
        repeat: Infinity,
        delay: star.delay,
        ease: "easeInOut",
      }}
    />
  )
}

export function Hero() {
  const ref = useRef<HTMLDivElement>(null)
  const [stars] = useState(() =>
    Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 5,
      duration: 3 + Math.random() * 2
    }))
  )
  
  // 3D Tilt Effect logic
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const mouseX = useSpring(x, { stiffness: 500, damping: 50 })
  const mouseY = useSpring(y, { stiffness: 500, damping: 50 })

  const rotateX = useTransform(mouseY, [-0.5, 0.5], ["15deg", "-15deg"])
  const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-15deg", "15deg"])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect()
    if (rect) {
      const width = rect.width
      const height = rect.height
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      const xPct = mouseX / width - 0.5
      const yPct = mouseY / height - 0.5
      x.set(xPct)
      y.set(yPct)
    }
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <section 
        className="relative overflow-hidden py-24 lg:py-40 perspective-1000"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        ref={ref}
    >
      {/* Background layers */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-background to-background opacity-70 z-0 pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-amber-900/10 via-transparent to-transparent z-0 pointer-events-none"></div>
      
      {/* Glittering Stars */}
      <div className="absolute inset-0 z-0">
        <StarField stars={stars} />
      </div>

      <div className="container relative z-10 flex flex-col items-center gap-8 text-center mx-auto px-4 perspective-1000">
        
        <motion.div 
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            className="flex flex-col items-center gap-8"
        >
            {/* Badge */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center rounded-full border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10 px-4 py-2 text-sm font-medium text-amber-400 backdrop-blur-md shadow-[0_0_20px_rgba(251,191,36,0.15)] transform-gpu hover:scale-105 transition-all duration-300 font-accent"
            >
                <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                <span className="tracking-wider uppercase text-xs font-bold">The Future of Crypto Gambling</span>
            </motion.div>
            
            {/* Main heading with Orbitron font */}
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="font-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.15)] transform-gpu"
            >
                Provably Fair <br className="hidden sm:inline" />
                <span className="text-gradient-gold inline-block mt-2">Crypto Casino</span>
            </motion.h1>
            
            {/* Description */}
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="max-w-[48rem] leading-relaxed text-gray-300 text-lg sm:text-xl drop-shadow-lg font-light"
            >
                Experience the thrill of next-gen gambling. Instant payouts, transparent odds, and <span className="text-white font-semibold text-gradient-gold">100% fair games</span> verified on-chain.
            </motion.p>
        </motion.div>
        
        {/* CTA Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-4 mt-4 z-20"
        >
          <Link href="/games">
            <Button className="h-14 px-10 text-lg font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-black hover:from-amber-400 hover:via-orange-400 hover:to-amber-500 shadow-[0_0_30px_rgba(251,191,36,0.4)] transition-all hover:scale-105 hover:-translate-y-1 hover:shadow-[0_0_50px_rgba(251,191,36,0.6)] relative overflow-hidden group font-accent">
              <span className="relative z-10 tracking-wide">Start Playing Now</span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            </Button>
          </Link>
          <Link href="https://github.com" target="_blank" rel="noreferrer">
            <Button className="h-14 px-10 text-lg border-2 border-white/20 bg-white/5 hover:bg-white/10 text-white transition-all hover:scale-105 hover:border-white/30 backdrop-blur-md font-accent">
              View Source Code
            </Button>
          </Link>
        </motion.div>
        
        {/* Feature cards */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm text-muted-foreground w-full max-w-5xl"
        >
          <motion.div 
            whileHover={{ y: -8, scale: 1.03 }}
            className="flex flex-col items-center gap-4 p-6 rounded-2xl glass-card hover:bg-white/10 transition-all duration-300 group"
          >
            <div className="p-3 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 group-hover:from-amber-500/30 group-hover:to-orange-500/30 transition-all">
              <Zap className="h-8 w-8 text-amber-400 group-hover:animate-pulse" />
            </div>
            <span className="font-bold text-white text-lg font-accent tracking-wide">Instant Deposits</span>
            <p className="text-gray-400 text-center text-sm">Lightning-fast crypto transactions</p>
          </motion.div>
          
          <motion.div 
             whileHover={{ y: -8, scale: 1.03 }}
             className="flex flex-col items-center gap-4 p-6 rounded-2xl glass-card hover:bg-white/10 transition-all duration-300 group"
          >
            <div className="p-3 rounded-full bg-gradient-to-br from-emerald-500/20 to-green-500/20 group-hover:from-emerald-500/30 group-hover:to-green-500/30 transition-all">
              <ShieldCheck className="h-8 w-8 text-emerald-400 group-hover:animate-pulse" />
            </div>
            <span className="font-bold text-white text-lg font-accent tracking-wide">Provably Fair</span>
            <p className="text-gray-400 text-center text-sm">Cryptographically verified results</p>
          </motion.div>
          
          <motion.div 
             whileHover={{ y: -8, scale: 1.03 }}
             className="flex flex-col items-center gap-4 p-6 rounded-2xl glass-card hover:bg-white/10 transition-all duration-300 group"
           >
            <div className="p-3 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 group-hover:from-purple-500/30 group-hover:to-pink-500/30 transition-all">
              <Coins className="h-8 w-8 text-purple-400 group-hover:animate-pulse" />
            </div>
            <span className="font-bold text-white text-lg font-accent tracking-wide">Daily Rewards</span>
            <p className="text-gray-400 text-center text-sm">Earn bonuses every day you play</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
