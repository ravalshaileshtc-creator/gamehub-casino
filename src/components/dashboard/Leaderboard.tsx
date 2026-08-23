
'use client'

import { useCallback, useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Trophy, Medal, Crown } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface LeaderboardEntry {
  _id: string
  totalWagered?: number
  totalProfit?: number
  wins?: number
  bets?: number
  user: {
    name: string
    image: string | null
    vipLevel: string
  }
}

export function Leaderboard() {
  const [data, setData] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [type, setType] = useState<'wagered' | 'profit'>('wagered')

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/leaderboard?type=${type}`)
      const json = await res.json()
      if (Array.isArray(json)) {
        setData(json)
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }, [type])

  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard])

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Crown className="w-6 h-6 text-yellow-400 fill-yellow-400/20" />
      case 1: return <Medal className="w-6 h-6 text-gray-300 fill-gray-300/20" />
      case 2: return <Medal className="w-6 h-6 text-amber-600 fill-amber-600/20" />
      default: return <span className="text-lg font-bold text-gray-500">#{index + 1}</span>
    }
  }

  return (
    <Card className="bg-black/40 border-white/10 backdrop-blur w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl font-heading text-white">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Top Players
          </CardTitle>
          <Tabs defaultValue="wagered" className="w-[200px]" onValueChange={(v) => setType(v as 'wagered' | 'profit')}>
            <TabsList className="grid w-full grid-cols-2 bg-black/50 border border-white/10">
              <TabsTrigger value="wagered">Wagered</TabsTrigger>
              <TabsTrigger value="profit">Profit</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 animate-pulse">
                <div className="w-8 h-8 bg-white/10 rounded-full" />
                <div className="w-10 h-10 bg-white/10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-white/10 rounded" />
                  <div className="h-3 w-16 bg-white/10 rounded" />
                </div>
                <div className="h-6 w-20 bg-white/10 rounded" />
              </div>
            ))
          ) : (
            data.map((entry, index) => (
              <motion.div
                key={entry._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "flex items-center gap-4 p-3 rounded-xl transition-all border border-transparent",
                  index === 0 ? "bg-gradient-to-r from-yellow-500/10 to-transparent border-yellow-500/20" : "hover:bg-white/5"
                )}
              >
                <div className="flex items-center justify-center w-8">
                  {getRankIcon(index)}
                </div>
                
                <Avatar className={cn(
                  "h-10 w-10 ring-2",
                  index === 0 ? "ring-yellow-500" : "ring-white/10"
                )}>
                  <AvatarImage src={entry.user.image || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-gray-800 to-gray-900 text-white font-bold">
                    {entry.user.name?.[0]}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn(
                      "font-bold truncate",
                      index === 0 ? "text-yellow-400" : "text-white"
                    )}>
                      {entry.user.name}
                    </p>
                    {index === 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-yellow-500/20 text-yellow-400 font-bold border border-yellow-500/30">
                        KING
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    {entry.user.vipLevel} List
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-mono font-bold text-white">
                    ₹{(type === 'wagered' ? entry.totalWagered : entry.totalProfit)?.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">
                    {type === 'wagered' ? 'Wagered' : 'Profit'}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
