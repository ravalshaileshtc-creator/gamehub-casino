'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Filter, Download, Activity, Calendar, DollarSign } from 'lucide-react'

interface Transaction {
  id: string
  type: string
  amount: number
  status: string
  description: string
  balanceBefore: number
  balanceAfter: number
  createdAt: string
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filter, setFilter] = useState<'ALL' | 'DEPOSIT' | 'WITHDRAWAL' | 'BET' | 'WIN'>('ALL')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/wallet/transactions?limit=50')
      const data = await res.json()
      if (data.success) {
        setTransactions(data.transactions)
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTransactions = transactions.filter(tx => 
    filter === 'ALL' || tx.type === filter
  )

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
      case 'WIN':
      case 'BONUS':
        return 'text-green-400'
      case 'WITHDRAWAL':
      case 'BET':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  const getTypeBg = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
      case 'WIN':
      case 'BONUS':
        return 'bg-green-500/10 border-green-500/30'
      case 'WITHDRAWAL':
      case 'BET':
        return 'bg-red-500/10 border-red-500/30'
      default:
        return 'bg-gray-500/10 border-gray-500/30'
    }
  }

  const totalDeposits = transactions
    .filter(tx => tx.type === 'DEPOSIT')
    .reduce((sum, tx) => sum + tx.amount, 0)

  const totalWithdrawals = transactions
    .filter(tx => tx.type === 'WITHDRAWAL')
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0)

  const totalWagered = transactions
    .filter(tx => tx.type === 'BET')
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0)

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-black via-gray-950 to-black p-8"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent opacity-50" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] animate-pulse-slow" />
        
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Activity className="w-6 h-6 text-primary animate-pulse" />
              <span className="text-sm uppercase tracking-wider text-gray-500 font-bold">Activity Log</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-3 text-white font-heading tracking-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-200 to-blue-400 animate-text-shimmer bg-[length:200%_auto]">Transaction History</span>
            </h1>
            <p className="text-gray-400 text-lg">Complete record of all your financial activities</p>
          </div>
          <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-bold text-white hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all flex items-center gap-2">
            <Download className="w-5 h-5" /> Export CSV
          </button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative group"
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative bg-black/60 border border-white/10 backdrop-blur-xl rounded-2xl p-6 hover:border-white/20 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-white/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400 uppercase tracking-wider">Total Deposits</p>
                <p className="text-2xl font-bold text-green-400 font-heading">₹{totalDeposits.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative group"
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative bg-black/60 border border-white/10 backdrop-blur-xl rounded-2xl p-6 hover:border-white/20 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-white/10 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400 uppercase tracking-wider">Total Withdrawals</p>
                <p className="text-2xl font-bold text-red-400 font-heading">₹{totalWithdrawals.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative group"
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative bg-black/60 border border-white/10 backdrop-blur-xl rounded-2xl p-6 hover:border-white/20 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400 uppercase tracking-wider">Total Wagered</p>
                <p className="text-2xl font-bold text-purple-400 font-heading">₹{totalWagered.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="relative group"
      >
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative bg-black/60 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Filter className="w-5 h-5 text-primary" />
            <span className="text-sm text-gray-400 uppercase tracking-wider font-medium">Filter by type:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['ALL', 'DEPOSIT', 'WITHDRAWAL', 'BET', 'WIN'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-5 py-2.5 rounded-xl font-bold transition-all hover:scale-105 ${
                  filter === type
                    ? 'bg-gradient-to-r from-primary to-purple-600 text-white shadow-[0_0_20px_rgba(102,126,234,0.3)]'
                    : 'bg-black/60 text-gray-400 hover:bg-black/80 border border-white/10'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Transactions List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="relative group"
      >
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative bg-black/60 border border-white/10 backdrop-blur-xl rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-heading font-bold text-white">All Transactions</h2>
            <span className="text-sm text-gray-400">
              {filteredTransactions.length} {filteredTransactions.length === 1 ? 'transaction' : 'transactions'}
            </span>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-400">Loading transactions...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-16">
              <Activity className="w-16 h-16 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No transactions found</p>
              <p className="text-gray-600 text-sm mt-2">Try adjusting your filter</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((tx, index) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="p-5 rounded-xl bg-black/20 hover:bg-black/30 border border-white/5 hover:border-white/10 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center border ${getTypeBg(tx.type)}`}>
                        {['DEPOSIT', 'WIN', 'BONUS'].includes(tx.type) ? (
                          <TrendingUp className={`w-7 h-7 ${getTypeColor(tx.type)}`} />
                        ) : (
                          <TrendingDown className={`w-7 h-7 ${getTypeColor(tx.type)}`} />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <p className="font-bold text-white text-lg">{tx.type}</p>
                          <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                            tx.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                            tx.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                            'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            {tx.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(tx.createdAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          {tx.description && (
                            <>
                              <span className="text-gray-600">•</span>
                              <span>{tx.description}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className={`text-2xl font-bold font-heading ${getTypeColor(tx.type)}`}>
                        {['DEPOSIT', 'WIN', 'BONUS'].includes(tx.type) ? '+' : '-'}₹{Math.abs(tx.amount).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Balance: <span className="text-gray-400 font-medium">₹{tx.balanceAfter.toFixed(2)}</span>
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
