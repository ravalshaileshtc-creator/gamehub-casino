"use client"

import Link from "next/link"
import { useRef } from "react"
import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion"
import { ArrowRight, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface GameCardProps {
  title: string
  description: string
  icon: LucideIcon
  href: string
  color: string
  gradient: string
}

export function GameCard({ title, description, icon: Icon, href, color, gradient }: GameCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const mouseX = useSpring(x, { stiffness: 500, damping: 100 })
  const mouseY = useSpring(y, { stiffness: 500, damping: 100 })

  function onMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect()
    mouseX.set(clientX - left)
    mouseY.set(clientY - top)
  }

  const maskImage = useMotionTemplate`radial-gradient(280px at ${mouseX}px ${mouseY}px, white, transparent)`
  const style = { maskImage, WebkitMaskImage: maskImage }

  return (
    <Link href={href} className="group relative block h-full">
      <div 
        ref={ref}
        onMouseMove={onMouseMove}
        className="relative h-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-gray-900/80 via-black/60 to-gray-900/80 px-7 py-9 shadow-[0_8px_30px_rgb(0,0,0,0.4)] transition-all duration-500 hover:scale-[1.03] hover:border-primary/30 hover:shadow-[0_20px_50px_rgba(247,147,26,0.2)] backdrop-blur-sm"
      >
        {/* Animated gradient overlay */}
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 animate-pulse-glow" />
        </div>
        
        {/* Spotlight Effect */}
        <div className="pointer-events-none absolute inset-0 transition duration-500 group-hover:opacity-100 opacity-0">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent blur-2xl transform -translate-x-full transition-transform duration-1000 group-hover:translate-x-full" />
        </div>
        
        {/* Mouse follow glow */}
        <motion.div
          className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={style}
        >
          <div className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-20 blur-xl`} />
        </motion.div>
        
        <div className="relative z-10 flex flex-col h-full">
            {/* Icon with gradient background */}
            <div className={cn(
              "mb-7 inline-flex p-4 rounded-2xl w-fit group-hover:scale-110 transition-all duration-500 shadow-lg relative overflow-hidden",
              "bg-gradient-to-br from-white/10 via-white/5 to-transparent",
              "border border-white/10 group-hover:border-primary/30",
              color
            )}>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Icon className="h-9 w-9 text-white relative z-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
            </div>
            
            {/* Title with gradient on hover */}
            <h3 className="mb-3 text-2xl font-bold text-white group-hover:text-gradient-gold transition-all duration-300 font-heading tracking-tight">
              {title}
            </h3>
            
            {/* Description */}
            <p className="mb-7 text-sm text-gray-400 leading-relaxed flex-grow font-light">
              {description}
            </p>
            
            {/* Footer */}
            <div className="flex items-center justify-between border-t border-white/10 pt-5 mt-auto group-hover:border-primary/20 transition-colors">
                <span className="text-xs font-mono font-bold text-primary bg-primary/15 px-3 py-1.5 rounded-lg border border-primary/20 group-hover:bg-primary/20 group-hover:border-primary/30 transition-all font-accent tracking-wide">
                  RTP 99%
                </span>
                <span className="flex items-center text-sm font-bold text-white group-hover:text-primary group-hover:translate-x-2 transition-all duration-300 font-accent tracking-wide">
                    Play <ArrowRight className="ml-2 h-4 w-4" />
                </span>
            </div>
        </div>
        
        {/* Neon glow border effect */}
        <div className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `linear-gradient(135deg, ${gradient.includes('amber') ? 'rgba(247,147,26,0.3)' : 'rgba(124,58,237,0.3)'}, transparent)`,
            filter: 'blur(8px)'
          }}
        />
      </div>
    </Link>
  )
}
