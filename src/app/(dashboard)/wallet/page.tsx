'use client'

import { useWallet } from '@/context/WalletContext'
import { motion } from 'framer-motion'
import { 
  TrendingUp, PlusCircle, Dices, Flame, Sparkles, 
  Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft 
} from 'lucide-react'
import { haptics } from '@/lib/haptics'

export default function WalletPage() {
  const { balance, transactions, addDemoCoins } = useWallet()

  return (
    <div className="space-y-6 pb-24 text-[#e2e2eb] select-none max-w-7xl mx-auto">
      
      {/* Wallet Overview Card matching Stitch UI */}
      <section className="glass-card rounded-2xl p-6 md:p-8 relative overflow-hidden bg-white/5 border border-white/10 shadow-2xl">
        {/* Decorative Glow */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#d0bcff]/20 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xs uppercase font-semibold text-[#cbc3d7] tracking-wider mb-1 font-sans">
              TOTAL BALANCE
            </h2>
            <div className="flex items-end gap-3">
              <span className="text-3xl md:text-4xl font-black text-white font-sans glow-text">
                ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs font-bold text-[#44e2cd] mb-1 flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" /> +5.2%
              </span>
            </div>
          </div>

          <button
            onClick={() => { haptics.medium(); addDemoCoins(1000); }}
            className="w-full md:w-auto btn-gradient text-[#23005c] font-bold text-xs py-3 px-6 rounded-xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(3,198,178,0.3)] touch-spring cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Demo Coins</span>
          </button>
        </div>
      </section>

      {/* Transaction History Section matching Stitch UI */}
      <section className="space-y-3">
        <h3 className="text-lg font-extrabold text-white">Transaction History</h3>

        <div className="flex flex-col gap-2.5">
          {transactions.length > 0 ? (
            transactions.map((tx) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-xl p-4 flex items-center justify-between hover:bg-white/5 transition-colors border border-white/5 bg-[#161821]/80"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-lg bg-[#33343b] flex items-center justify-center text-[#ffb95f]">
                    {tx.type === 'CREDIT' ? <Sparkles className="w-5 h-5" /> : <Flame className="w-5 h-5 text-[#d0bcff]" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#e2e2eb]">{tx.game}</p>
                    <p className="text-[11px] text-[#cbc3d7]">
                      {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className={`text-sm font-bold font-mono ${tx.type === 'CREDIT' ? 'text-[#44e2cd]' : 'text-white'}`}>
                    {tx.type === 'CREDIT' ? '+' : '-'}${tx.amount.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-[#cbc3d7] uppercase font-semibold">
                    {tx.type === 'CREDIT' ? 'Win' : 'Wager'}
                  </p>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="p-8 text-center rounded-xl glass-card text-gray-400 text-xs border border-white/5">
              No transactions recorded yet. Start playing games to generate live history!
            </div>
          )}
        </div>
      </section>

    </div>
  )
}
