"use client"

import { useState } from "react"
import { useWallet } from "@/context/WalletContext"
import { History as HistoryIcon, Clock, ArrowUpRight, ArrowDownRight, Filter, Activity } from "lucide-react"

export default function HistoryPage() {
  const { transactions } = useWallet()
  const [filter, setFilter] = useState("ALL")

  const categories = ["ALL", "Plinko", "Lottery", "Penalty", "Slots", "Crash", "Mines", "Coinflip", "Dice", "Roulette"]

  const filteredTx = transactions.filter((tx) => {
    if (filter === "ALL") return true
    return tx.game.toLowerCase().includes(filter.toLowerCase())
  })

  return (
    <div className="min-h-screen bg-[#0F1117] text-white p-4 md:p-6 pb-24 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white flex items-center gap-3">
              <Activity className="w-8 h-8 text-amber-400" />
              ACTIVITY & LEDGER
            </h1>
            <p className="text-gray-400 text-sm mt-1">Real-time ledger of all bets, wins, and shared wallet operations</p>
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
            <HistoryIcon className="w-8 h-8 text-amber-400" />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <Filter className="w-4 h-4 text-gray-500 shrink-0 ml-1 mr-1" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all shrink-0 cursor-pointer border ${
                filter === cat
                  ? "bg-amber-400 text-black border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.4)]"
                  : "bg-zinc-900 border-zinc-800 text-gray-400 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="bg-[#18191c] border border-white/10 backdrop-blur-xl rounded-3xl p-6 space-y-3 shadow-2xl">
          {filteredTx.length === 0 ? (
            <div className="text-center py-16 text-gray-500 text-sm">
              No transactions found for filter <span className="text-amber-400 font-bold">{filter}</span>. Play any game to generate live ledger history!
            </div>
          ) : (
            filteredTx.map((tx) => {
              const isWin = tx.type === "CREDIT" || tx.type === "TOPUP"
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-amber-400/40 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${isWin ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                      {isWin ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">{tx.game}</p>
                      <p className="text-gray-400 text-xs flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-gray-500" />
                        {new Date(tx.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={`font-mono font-extrabold text-base ${isWin ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isWin ? '+' : '-'}${tx.amount.toFixed(2)}
                    </p>
                    <p className="text-[11px] font-mono text-gray-500 mt-0.5">
                      Bal: ${tx.balanceAfter.toFixed(2)}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>

      </div>
    </div>
  )
}
