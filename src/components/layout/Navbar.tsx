'use client'

import Link from 'next/link'
import { Menu, Bell, Crown } from 'lucide-react'
import { haptics } from '@/lib/haptics'

export function Navbar() {
  return (
    <header className="fixed top-0 w-full z-50 bg-[#0c0e14]/90 backdrop-blur-2xl border-b border-white/10 select-none">
      <div className="flex justify-between items-center px-4 py-2.5 max-w-7xl mx-auto">
        
        {/* Left: Menu Icon */}
        <button 
          onClick={() => haptics.light()}
          className="text-white hover:bg-white/10 p-2 rounded-full active:scale-95 transition-transform"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Center: PLAYZON Logo & Crown */}
        <Link href="/" onClick={() => haptics.light()} className="flex flex-col items-center justify-center touch-spring">
          <Crown className="w-5 h-5 text-[#ffd700] fill-[#ffd700] mb-0.5" />
          <h1 className="text-lg font-black text-white tracking-widest leading-none font-sans uppercase">
            PLAYZON
          </h1>
          <span className="text-[8px] font-bold text-gray-400 tracking-widest mt-0.5 uppercase">
            - WIN BIG EVERYDAY -
          </span>
        </Link>

        {/* Right: Notification Bell with Badge */}
        <button 
          onClick={() => haptics.light()}
          className="relative text-white hover:bg-white/10 p-2 rounded-full active:scale-95 transition-transform"
        >
          <Bell className="w-6 h-6" />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-[#0c0e14]" />
        </button>

      </div>
    </header>
  )
}
