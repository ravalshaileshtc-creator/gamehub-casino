"use client"

import { useSession, signOut } from "next-auth/react"
import { useWallet } from "@/context/WalletContext"
import { User as UserIcon, Crown, ShieldCheck, LogOut, Wallet, Trophy, Gamepad2, Award } from "lucide-react"
import { useEffect, useState } from "react"

export default function ProfilePage() {
  const { data: session } = useSession()
  const { balance, transactions } = useWallet()
  const [userName, setUserName] = useState<string>("VIP Player")
  const [userEmail, setUserEmail] = useState<string>("player@casino.com")

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedName = localStorage.getItem("user_name")
      const storedEmail = localStorage.getItem("user_email")
      if (session?.user?.name) setUserName(session.user.name)
      else if (storedName) setUserName(storedName)

      if (session?.user?.email) setUserEmail(session.user.email)
      else if (storedEmail) setUserEmail(storedEmail)
    }
  }, [session])

  const totalBets = transactions.filter(t => t.type === 'DEBIT').length
  const totalWins = transactions.filter(t => t.type === 'CREDIT').length

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 p-4 md:p-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Profile Card Header */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-black via-gray-950 to-black p-8">
          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-500 p-1 shadow-xl">
              <div className="w-full h-full bg-black rounded-[22px] flex items-center justify-center">
                <UserIcon className="w-12 h-12 text-amber-400" />
              </div>
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl md:text-3xl font-extrabold text-white font-heading">
                  {userName}
                </h1>
                <span className="px-3 py-1 bg-amber-400/20 text-amber-400 border border-amber-400/30 rounded-full text-xs font-bold flex items-center gap-1">
                  <Crown className="w-3 h-3" /> VIP GOLD
                </span>
              </div>
              <p className="text-gray-400 text-sm">{userEmail}</p>
            </div>

            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  localStorage.removeItem("user_email")
                  localStorage.removeItem("user_name")
                  localStorage.removeItem("user_role")
                }
                signOut({ callbackUrl: "/login" })
              }}
              className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-black/60 border border-white/10 rounded-2xl p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2 mb-2 text-amber-400">
              <Wallet className="w-5 h-5" />
              <span className="text-xs uppercase font-bold text-gray-400">Shared Balance</span>
            </div>
            <p className="text-2xl font-black text-white font-mono">₹{balance.toFixed(2)}</p>
          </div>

          <div className="bg-black/60 border border-white/10 rounded-2xl p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2 mb-2 text-purple-400">
              <Gamepad2 className="w-5 h-5" />
              <span className="text-xs uppercase font-bold text-gray-400">Total Games</span>
            </div>
            <p className="text-2xl font-black text-white font-mono">{totalBets}</p>
          </div>

          <div className="bg-black/60 border border-white/10 rounded-2xl p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2 mb-2 text-emerald-400">
              <Trophy className="w-5 h-5" />
              <span className="text-xs uppercase font-bold text-gray-400">Total Wins</span>
            </div>
            <p className="text-2xl font-black text-white font-mono">{totalWins}</p>
          </div>

          <div className="bg-black/60 border border-white/10 rounded-2xl p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2 mb-2 text-cyan-400">
              <Award className="w-5 h-5" />
              <span className="text-xs uppercase font-bold text-gray-400">Favorite Game</span>
            </div>
            <p className="text-xl font-bold text-white font-heading">LUCKY BALL</p>
          </div>
        </div>

        {/* Real Casino Compliance Notice */}
        <div className="bg-black/60 border border-emerald-500/30 rounded-3xl p-6 backdrop-blur-xl space-y-3">
          <div className="flex items-center gap-2 text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
            <h3 className="text-lg font-bold font-heading">Licensed & Provably Fair Gaming</h3>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">
            All user balances, transactions, and game bets are verified, logged, and settled in real-time on secure backend servers.
          </p>
        </div>
      </div>
    </div>
  )
}
