"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Gamepad2, Wallet, User, Crown } from "lucide-react"
import { haptics } from "@/lib/haptics"

export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 w-full z-50 bg-[#0c0e14] border-t border-white/10 select-none md:hidden">
      <ul className="flex justify-around items-center h-20 px-2 relative pb-safe">
        
        {/* 1. Home */}
        <li>
          <Link
            href="/"
            onClick={() => haptics.light()}
            className={`flex flex-col items-center justify-center transition-all touch-spring ${
              pathname === "/" ? "text-[#ffd700]" : "text-gray-400 hover:text-white"
            }`}
          >
            <Home className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-bold">Home</span>
          </Link>
        </li>

        {/* 2. Games */}
        <li>
          <Link
            href="/games"
            onClick={() => haptics.light()}
            className={`flex flex-col items-center justify-center transition-all touch-spring ${
              pathname === "/games" ? "text-[#ffd700]" : "text-gray-400 hover:text-white"
            }`}
          >
            <Gamepad2 className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-bold">Games</span>
          </Link>
        </li>

        {/* 3. CENTERED FLOATING GOLDEN CROWN PLAY BUTTON (Matching Screenshot) */}
        <li className="-mt-6">
          <Link
            href="/dashboard"
            onClick={() => haptics.medium()}
            className="w-16 h-16 rounded-full bg-[#111319] border-2 border-[#ffd700] shadow-[0_0_25px_rgba(255,215,0,0.5)] flex flex-col items-center justify-center text-[#ffd700] touch-spring hover:scale-105 active:scale-95 transition-transform"
          >
            <Crown className="w-7 h-7 fill-[#ffd700]" />
            <span className="text-[9px] font-black uppercase tracking-wider -mt-0.5">Play</span>
          </Link>
        </li>

        {/* 4. Wallet */}
        <li>
          <Link
            href="/wallet"
            onClick={() => haptics.light()}
            className={`flex flex-col items-center justify-center transition-all touch-spring ${
              pathname === "/wallet" ? "text-[#ffd700]" : "text-gray-400 hover:text-white"
            }`}
          >
            <Wallet className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-bold">Wallet</span>
          </Link>
        </li>

        {/* 5. Profile */}
        <li>
          <Link
            href="/profile"
            onClick={() => haptics.light()}
            className={`flex flex-col items-center justify-center transition-all touch-spring ${
              pathname === "/profile" ? "text-[#ffd700]" : "text-gray-400 hover:text-white"
            }`}
          >
            <User className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-bold">Profile</span>
          </Link>
        </li>

      </ul>
    </nav>
  )
}
