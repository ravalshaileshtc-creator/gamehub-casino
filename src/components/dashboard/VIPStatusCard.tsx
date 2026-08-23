'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Crown, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

const VIP_LEVELS = {
  BRONZE: { color: 'text-orange-600', bg: 'bg-orange-500/10', next: 'SILVER', threshold: 10000 },
  SILVER: { color: 'text-gray-400', bg: 'bg-gray-500/10', next: 'GOLD', threshold: 50000 },
  GOLD: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', next: 'PLATINUM', threshold: 200000 },
  PLATINUM: { color: 'text-purple-400', bg: 'bg-purple-500/10', next: 'DIAMOND', threshold: 1000000 },
  DIAMOND: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', next: null, threshold: 0 },
}

interface VIPData {
  level: keyof typeof VIP_LEVELS
  totalWagered: number
  nextLevelWager: number
}

export function VIPStatusCard() {
  const [vipData, setVIPData] = useState<VIPData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchVIPData = async () => {
      try {
        const res = await fetch('/api/user/stats')
        const data = await res.json()
        setVIPData({
          level: data.vipLevel || 'BRONZE',
          totalWagered: data.totalWagered || 0,
          nextLevelWager: data.nextLevelWager || 10000,
        })
      } catch (error) {
        console.error('Failed to fetch VIP data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchVIPData()
  }, [])

  if (loading) {
    return (
      <Card className="bg-black/40 border-white/10 backdrop-blur">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-white/10 rounded w-32 mb-4"></div>
            <div className="h-2 bg-white/10 rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const levelConfig = VIP_LEVELS[vipData?.level || 'BRONZE']
  const progress = vipData?.nextLevelWager 
    ? Math.min(((vipData?.totalWagered || 0) / vipData.nextLevelWager) * 100, 100)
    : 100

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`border-white/10 backdrop-blur ${levelConfig.bg} hover:border-white/20 transition-all`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Crown className={`h-5 w-5 ${levelConfig.color}`} />
            <span className={levelConfig.color}>VIP {vipData?.level}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Progress to {levelConfig.next || 'MAX'}</span>
                <span className="text-white font-bold">{progress.toFixed(1)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <div>
                <p className="text-xs text-gray-500">Wagered</p>
                <p className="text-white font-bold">₹{(vipData?.totalWagered || 0).toLocaleString()}</p>
              </div>
              {levelConfig.next && (
                <div className="text-right">
                  <p className="text-xs text-gray-500">Next Level</p>
                  <p className="text-white font-bold">₹{vipData?.nextLevelWager.toLocaleString()}</p>
                </div>
              )}
            </div>

            {levelConfig.next && (
              <div className="flex items-center gap-2 text-xs text-gray-400 bg-black/30 p-2 rounded">
                <TrendingUp className="h-3 w-3" />
                <span>₹{((vipData?.nextLevelWager || 0) - (vipData?.totalWagered || 0)).toLocaleString()} to {levelConfig.next}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
