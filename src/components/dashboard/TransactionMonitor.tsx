'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader, ArrowUpRight, ArrowDownLeft } from 'lucide-react'

interface Transaction {
  id: string
  type: string
  amount: number
  status: string
  user: {
    name: string
    email: string
  }
  createdAt: string
}

export function TransactionMonitor() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/admin/transactions/history')
      const data = await res.json()
      if (data.success) setTransactions(data.transactions)
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-500/20 text-green-400'
      case 'PENDING': return 'bg-yellow-500/20 text-yellow-400'
      case 'FAILED': return 'bg-red-500/20 text-red-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getTypeIcon = (type: string) => {
    return type === 'DEPOSIT' || type === 'WIN' ? (
      <ArrowDownLeft className="w-4 h-4 text-green-400" />
    ) : (
      <ArrowUpRight className="w-4 h-4 text-red-400" />
    )
  }

  const filteredTransactions = filter === 'ALL' 
    ? transactions 
    : transactions.filter(t => t.type === filter)

  if (loading) return <div className="text-center py-8"><Loader className="w-8 h-8 animate-spin mx-auto text-primary" /></div>

  return (
    <Card className="bg-black/40 border-white/10 backdrop-blur">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white">Recent Transactions</CardTitle>
        <div className="flex gap-2">
          {['ALL', 'DEPOSIT', 'WITHDRAWAL', 'BET', 'WIN'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filter === type 
                  ? 'bg-primary text-white' 
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="p-3 text-gray-400 font-medium">Type</th>
                <th className="p-3 text-gray-400 font-medium">User</th>
                <th className="p-3 text-gray-400 font-medium">Amount</th>
                <th className="p-3 text-gray-400 font-medium">Status</th>
                <th className="p-3 text-gray-400 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-full bg-white/5`}>
                        {getTypeIcon(tx.type)}
                      </div>
                      <span className="font-medium text-gray-300">{tx.type}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div>
                      <p className="font-medium text-white">{tx.user.name}</p>
                      <p className="text-xs text-gray-500">{tx.user.email}</p>
                    </div>
                  </td>
                  <td className="p-3 font-bold text-white">
                    ₹{tx.amount.toFixed(2)}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${getStatusColor(tx.status)}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-gray-500">
                    {new Date(tx.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
