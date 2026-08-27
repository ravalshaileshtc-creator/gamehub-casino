'use client'

import Link from 'next/link'
import { 
  ArrowDown, ArrowUp, Gift, History, ChevronRight, CircleDot, 
  Sparkles, Bomb, Dices, CirclePlus, Grid, Trophy, Flame 
} from 'lucide-react'
import { useWallet } from '@/context/WalletContext'
import { haptics } from '@/lib/haptics'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

export default function DashboardPage() {
  const { balance } = useWallet()
  const { data: session } = useSession()
  const [userName, setUserName] = useState<string>("VIP Player")

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedName = localStorage.getItem("user_name")
      if (session?.user?.name) setUserName(session.user.name)
      else if (storedName) setUserName(storedName)
    }
  }, [session])

  const popularGames = [
    {
      id: 'plinko',
      title: 'PLINKO',
      borderColor: 'border-purple-500/50',
      bgColor: 'from-purple-950/40 to-indigo-950/40',
      href: '/plinko',
      icon: CircleDot,
    },
    {
      id: 'lottery',
      title: 'LOTTERY',
      borderColor: 'border-blue-500/50',
      bgColor: 'from-blue-950/40 to-cyan-950/40',
      href: '/lottery',
      icon: Sparkles,
    },
    {
      id: 'penalty',
      title: 'PENALTY',
      borderColor: 'border-emerald-500/50',
      bgColor: 'from-emerald-950/40 to-green-950/40',
      href: '/penalty',
      icon: Trophy,
    },
    {
      id: 'roulette',
      title: 'ROULETTE',
      borderColor: 'border-red-500/50',
      bgColor: 'from-rose-950/40 to-red-950/40',
      href: '/roulette',
      icon: Dices,
    },
    {
      id: 'crash',
      title: 'CRASH',
      borderColor: 'border-purple-500/50',
      bgColor: 'from-purple-950/40 to-indigo-950/40',
      href: '/crash',
      icon: Flame,
    },
    {
      id: 'mines',
      title: 'MINES',
      borderColor: 'border-teal-500/50',
      bgColor: 'from-teal-950/40 to-emerald-950/40',
      href: '/mines',
      icon: Bomb,
    },
    {
      id: 'coinflip',
      title: 'COINFLIP',
      borderColor: 'border-amber-500/50',
      bgColor: 'from-amber-950/40 to-orange-950/40',
      href: '/coinflip',
      icon: CirclePlus,
    },
    {
      id: 'dragontower',
      title: 'DRAGON',
      borderColor: 'border-amber-500/50',
      bgColor: 'from-amber-950/40 to-yellow-950/40',
      href: '/dragontower',
      icon: Trophy,
    },
    {
      id: 'dice',
      title: 'DICE',
      borderColor: 'border-purple-500/50',
      bgColor: 'from-purple-950/40 to-indigo-950/40',
      href: '/dice',
      icon: Grid,
    },
  ]

  return (
    <div className="space-y-4 pb-28 text-white select-none max-w-md mx-auto w-full">
      
      {/* 1. USER & BALANCE CARD (Matching PLAYZON Screenshot) */}
      <section className="p-4 rounded-2xl bg-[#111319] border border-[#ffd700]/30 shadow-2xl flex items-center justify-between">
        {/* Left Side: Avatar & Player Info */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full p-[1.5px] bg-gradient-to-tr from-[#ffd700] via-orange-500 to-purple-600">
            <div className="w-full h-full rounded-full bg-[#1e1f26] flex items-center justify-center font-black text-xs text-[#ffd700]">
              P1
            </div>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-semibold">Welcome back,</p>
            <div className="flex items-center gap-1.5">
              <h3 className="text-base font-extrabold text-white">{userName}</h3>
              <span className="bg-[#4c1d95] text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                VIP GOLD
              </span>
            </div>
            <p className="text-[9px] text-gray-500 font-mono">UID: PZ458796</p>
          </div>
        </div>

        {/* Divider */}
        <div className="w-[1px] h-10 bg-white/10" />

        {/* Right Side: Total Balance */}
        <div className="text-right">
          <p className="text-[10px] text-gray-400 font-semibold uppercase">Total Balance</p>
          <h2 className="text-xl font-black text-[#ffd700] font-mono tracking-tight">
            ₹ {balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
          <p className="text-[9px] text-emerald-400 font-mono font-bold">
            Bonus Balance ₹ 0.00
          </p>
        </div>
      </section>

      {/* 2. QUICK ACTION GRID (4 Buttons Matching PLAYZON Screenshot) */}
      <section className="p-3 rounded-2xl bg-[#111319] border border-[#ffd700]/30 shadow-xl grid grid-cols-4 gap-2">
        <Link
          href="/wallet"
          onClick={() => haptics.light()}
          className="flex flex-col items-center justify-center gap-1.5 touch-spring group"
        >
          <div className="w-12 h-12 rounded-xl bg-[#3b0764] border border-purple-500/40 flex items-center justify-center text-purple-300 group-hover:scale-105 transition-transform">
            <ArrowDown className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-gray-300">Deposit</span>
        </Link>

        <Link
          href="/wallet"
          onClick={() => haptics.light()}
          className="flex flex-col items-center justify-center gap-1.5 touch-spring group"
        >
          <div className="w-12 h-12 rounded-xl bg-[#064e3b] border border-emerald-500/40 flex items-center justify-center text-emerald-300 group-hover:scale-105 transition-transform">
            <ArrowUp className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-gray-300">Withdraw</span>
        </Link>

        <Link
          href="/wallet"
          onClick={() => haptics.light()}
          className="flex flex-col items-center justify-center gap-1.5 touch-spring group"
        >
          <div className="w-12 h-12 rounded-xl bg-[#1e3a8a] border border-blue-500/40 flex items-center justify-center text-blue-300 group-hover:scale-105 transition-transform">
            <Gift className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-gray-300">Bonus</span>
        </Link>

        <Link
          href="/history"
          onClick={() => haptics.light()}
          className="flex flex-col items-center justify-center gap-1.5 touch-spring group"
        >
          <div className="w-12 h-12 rounded-xl bg-[#7c2d12] border border-amber-500/40 flex items-center justify-center text-amber-300 group-hover:scale-105 transition-transform">
            <History className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-gray-300">History</span>
        </Link>
      </section>

      {/* 3. DEPOSIT & 10% BONUS HERO BANNER (Matching PLAYZON Screenshot) */}
      <section className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#2e1065] via-[#3b0764] to-[#581c87] border border-purple-500/30 p-5 shadow-2xl min-h-[150px] flex flex-col justify-between">
        <div className="relative z-10 max-w-[65%] space-y-1">
          <p className="text-xs font-black italic tracking-wider text-gray-200">
            DEPOSIT & GET
          </p>
          <h3 className="text-2xl font-black italic text-[#ffd700] tracking-tight">
            10% BONUS
          </h3>
          <p className="text-[11px] font-bold text-purple-200 uppercase">
            UP TO ₹5,000
          </p>
          
          <Link
            href="/wallet"
            onClick={() => haptics.medium()}
            className="btn-gold-gradient text-black font-black text-xs py-2 px-4 rounded-lg inline-block mt-2 shadow-lg touch-spring uppercase"
          >
            DEPOSIT NOW
          </Link>
        </div>

        {/* Treasure Chest Icon Graphic Placeholder */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-6xl opacity-90 pointer-events-none">
          🏴‍☠️🪙
        </div>

        {/* Carousel Indicator Dots */}
        <div className="flex justify-center gap-1.5 mt-2">
          <span className="w-4 h-1.5 rounded-full bg-white" />
          <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
          <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
          <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
        </div>
      </section>

      {/* 4. POPULAR GAMES GRID (Matching PLAYZON Screenshot) */}
      <section className="space-y-2">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-base font-black text-white">Popular Games</h3>
          <Link href="/games" onClick={() => haptics.light()} className="text-xs font-bold text-gray-400 hover:text-white flex items-center gap-0.5">
            View All <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 4x2 Grid */}
        <div className="grid grid-cols-4 gap-2.5">
          {popularGames.map((game) => {
            const GameIcon = game.icon

            return (
              <Link
                key={game.id}
                href={game.href}
                onClick={() => haptics.medium()}
                className={`p-2.5 rounded-2xl bg-gradient-to-b ${game.bgColor} border ${game.borderColor} flex flex-col items-center justify-center gap-2 touch-spring hover:scale-105 transition-transform shadow-lg group`}
              >
                <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <GameIcon className="w-5 h-5 text-[#ffd700]" />
                </div>
                <span className="text-[10px] font-black text-white uppercase tracking-wider text-center">
                  {game.title}
                </span>
              </Link>
            )
          })}
        </div>
      </section>

      {/* 5. RECENT GAMES SECTION (Matching PLAYZON Screenshot) */}
      <section className="space-y-2">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-base font-black text-white">Recent Games</h3>
          <Link href="/history" onClick={() => haptics.light()} className="text-xs font-bold text-gray-400 hover:text-white flex items-center gap-0.5">
            View All <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <Link
          href="/dice"
          onClick={() => haptics.light()}
          className="p-3.5 rounded-2xl bg-[#111319] border border-white/10 flex items-center justify-between touch-spring hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#282a30] border border-white/5 flex items-center justify-center text-[#ffd700]">
              <Grid className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-black text-white">Dice Roll</h4>
              <p className="text-[11px] text-gray-400">2 mins ago</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-right">
            <div>
              <p className="text-sm font-black font-mono text-emerald-400">₹260.00</p>
              <p className="text-[10px] text-emerald-500/80 font-bold uppercase">Won</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </div>
        </Link>
      </section>

    </div>
  )
}
