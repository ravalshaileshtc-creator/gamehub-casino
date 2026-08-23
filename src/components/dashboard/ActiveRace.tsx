
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Timer, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface UpcomingRace {
  title: string
  startTime: string
  prizePool: number
}

interface RaceData {
  active: boolean
  upcoming?: UpcomingRace | null
  race?: {
    title: string
    prizePool: number
    endTime: string
  }
  leaderboard?: Array<{
    _id: string
    totalWagered: number
    user: {
      name: string
      image: string | null
      vipLevel: string
    }
  }>
}

export function ActiveRace() {
  const [data, setData] = useState<RaceData | null>(null)
  const [timeLeft, setTimeLeft] = useState<string>('')

  const fetchRaceData = useCallback(async () => {
    try {
      const res = await fetch('/api/races/active')
      const json = await res.json()
      setData(json)
    } catch (err) {
      console.error(err)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRaceData()
    const interval = setInterval(fetchRaceData, 10000) // Poll every 10s
    return () => clearInterval(interval)
  }, [fetchRaceData])

  useEffect(() => {
    if (data?.race?.endTime) {
      const timer = setInterval(() => {
        const end = new Date(data.race!.endTime).getTime()
        const now = new Date().getTime()
        const diff = end - now

        if (diff <= 0) {
          setTimeLeft('Ended')
          return
        }

        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const s = Math.floor((diff % (1000 * 60)) / 1000)
        setTimeLeft(`${h}h ${m}m ${s}s`)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [data])

  if (!data?.active || !data.race) return null

  return (
    <Card className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border-indigo-500/30 backdrop-blur w-full overflow-hidden relative group">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
      
      <CardHeader className="pb-2 relative z-10">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg text-white font-heading">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-400 font-bold">
              {data.race.title}
            </span>
          </CardTitle>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/40 border border-white/10">
            <Timer className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs font-mono font-bold text-indigo-300 tabular-nums">
              {timeLeft}
            </span>
          </div>
        </div>
        <p className="text-xs text-indigo-200/70 font-medium tracking-wide">
          Prize Pool: <span className="text-white font-bold">₹{data.race.prizePool.toLocaleString()}</span>
        </p>
      </CardHeader>
      
      <CardContent className="space-y-3 relative z-10">
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
        
        <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-indigo-500/20">
          <AnimatePresence mode='popLayout'>
            {data.leaderboard?.slice(0, 5).map((entry, index) => (
              <motion.div
                key={entry._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg border transition-all",
                  index === 0 
                    ? "bg-yellow-500/10 border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.1)]" 
                    : "bg-black/20 border-white/5 hover:bg-black/40"
                )}
              >
                <div className={cn(
                  "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold",
                  index === 0 ? "bg-yellow-500 text-black" : "bg-white/10 text-white/70"
                )}>
                  {index + 1}
                </div>
                
                <Avatar className="w-8 h-8 rounded-lg border border-white/10">
                  <AvatarImage src={entry.user.image || undefined} />
                  <AvatarFallback className="bg-indigo-950 text-indigo-200 text-xs">
                    {entry.user.name?.[0]}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-bold truncate",
                    index === 0 ? "text-yellow-400" : "text-white"
                  )}>
                    {entry.user.name}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] px-1 rounded bg-white/10 text-white/50 border border-white/5">
                      {entry.user.vipLevel}
                    </span>
                    {index === 0 && (
                      <Zap className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm font-mono font-bold text-white">
                    ₹{(entry.totalWagered / 1000).toFixed(1)}k
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {(!data.leaderboard || data.leaderboard.length === 0) && (
            <div className="text-center py-4">
              <p className="text-sm text-indigo-300/50">Race just started! bet to join.</p>
            </div>
          )}
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg shadow-indigo-500/20 transition-all border border-white/10"
        >
          Join Race
        </motion.button>
      </CardContent>
    </Card>
  )
}
