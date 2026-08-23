'use client'

import Link from "next/link"
import { motion } from "framer-motion"
import { Trophy, Shield, Users, ArrowRight } from "lucide-react"

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  description: string
  linkText: string
  linkHref: string
  linkLabel: string
}

export function AuthLayout({ children, title, description, linkText, linkHref, linkLabel }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full flex bg-black overflow-hidden relative">
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background z-0 pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20 pointer-events-none" />

      {/* Left Column - Visuals (Desktop Only) */}
      <div className="hidden lg:flex w-1/2 relative z-10 flex-col justify-between p-12 bg-white/5 backdrop-blur-sm border-r border-white/5">
        <div className="relative z-10">
          <Link href="/" className="flex items-center space-x-2 w-fit">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-orange-600 shadow-lg shadow-primary/20">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold font-heading text-white tracking-wider">
              GAMBLEFI
            </span>
          </Link>
          
          <div className="mt-20">
             <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-5xl font-bold font-heading text-white leading-tight mb-6"
             >
                Win Big.<br />
                <span className="text-gradient-gold">Play Fair.</span>
             </motion.h1>
             <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-gray-400 text-lg max-w-md leading-relaxed"
             >
                 Join the world&apos;s most transparent crypto casino. Instant withdrawals, verified fairness, and daily rewards wait for you.
             </motion.p>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-2 gap-6 relative z-10">
            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-md">
                <Shield className="w-8 h-8 text-emerald-400 mb-3" />
                <h3 className="text-white font-bold mb-1">Provably Fair</h3>
                <p className="text-xs text-gray-500">Every roll verified on blockchain</p>
            </div>
            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-md">
                <Users className="w-8 h-8 text-blue-400 mb-3" />
                <h3 className="text-white font-bold mb-1">Community</h3>
                <p className="text-xs text-gray-500">Join 50k+ active players</p>
            </div>
        </div>

        {/* Abstract Shapes */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      </div>

      {/* Right Column - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 relative z-20">
        <div className="w-full max-w-md space-y-8">
            <div className="lg:hidden text-center mb-8">
                <Link href="/" className="inline-flex items-center space-x-2">
                    <Trophy className="h-8 w-8 text-primary" />
                    <span className="text-2xl font-bold font-heading text-white">GAMBLEFI</span>
                </Link>
            </div>

            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-black/40 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative overflow-hidden"
            >
                {/* Top decorative line */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-orange-500 to-purple-600" />
                
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-white font-heading mb-2">{title}</h2>
                    <p className="text-gray-400 font-light">{description}</p>
                </div>

                {children}

                <div className="mt-8 text-center text-sm">
                    <span className="text-gray-500">{linkText}</span>
                    <Link href={linkHref} className="ml-2 font-bold text-primary hover:text-primary/80 transition-colors inline-flex items-center group">
                        {linkLabel}
                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </motion.div>
        </div>
      </div>
    </div>
  )
}
