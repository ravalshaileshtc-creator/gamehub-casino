
'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowDownLeft, ArrowUpRight, DollarSign, Wallet, TrendingUp, AlertTriangle, Loader } from 'lucide-react'

interface FinancialStats {
  totalLiability: number
  totalBonusLiability: number
  totalDeposited: number
  totalWithdrawn: number
  netCashFlow: number
  solvency: number
  platformGameProfit: number
  totalWagered: number
}

export function SystemWalletStats() {
  const [stats, setStats] = useState<FinancialStats | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/finance/stats')
      const data = await res.json()
      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch financial stats:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-black/40 border-white/10 backdrop-blur h-32 flex items-center justify-center">
            <Loader className="w-6 h-6 animate-spin text-primary" />
          </Card>
        ))}
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* 1. Net Exposure / Solvency */}
      <Card className="bg-black/40 border-white/10 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-purple-400" />
            Net Liquidity (Solvency)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${stats.solvency >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(stats.solvency)}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            (Cash Flow - User Liabilities)
          </p>
        </CardContent>
      </Card>

      {/* 2. Platform Profit (Game Performance) */}
      <Card className="bg-black/40 border-white/10 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            Game Gross Profit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${stats.platformGameProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(stats.platformGameProfit)}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Wagered: {formatCurrency(stats.totalWagered)}
          </p>
        </CardContent>
      </Card>

      {/* 3. User Liabilities */}
      <Card className="bg-black/40 border-white/10 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            Total Liabilities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">
            {formatCurrency(stats.totalLiability)}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            + {formatCurrency(stats.totalBonusLiability)} Bonus
          </p>
        </CardContent>
      </Card>

      {/* 4. Cash Flow */}
      <Card className="bg-black/40 border-white/10 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-blue-400" />
            Net Cash Flow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${stats.netCashFlow >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>
            {formatCurrency(stats.netCashFlow)}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
            <span className="text-green-500 flex items-center"><ArrowDownLeft className="w-3 h-3 mr-0.5"/>{formatCurrency(stats.totalDeposited)}</span>
            <span className="text-red-500 flex items-center"><ArrowUpRight className="w-3 h-3 mr-0.5"/>{formatCurrency(stats.totalWithdrawn)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
