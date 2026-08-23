"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useBalance } from "@/context/BalanceContext"
import { TrendingUp, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function Crash() {
  const { balance, updateBalance } = useBalance()
  const [betAmount, setBetAmount] = useState<number>(10)
  const [isPlaying, setIsPlaying] = useState(false)
  const [multiplier, setMultiplier] = useState(1.00)
  const [crashed, setCrashed] = useState(false)
  const [message, setMessage] = useState("")
  const [serverCrashPoint, setServerCrashPoint] = useState<number | null>(null)
  const [gameId, setGameId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  const { toast } = useToast()
  
  const requestRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)

  const startGame = async () => {
     if (betAmount > balance) return setMessage("Insufficient balance")
     if (isNaN(betAmount) || betAmount <= 0) return setMessage("Invalid bet")
     if (isPlaying || loading) return

     setLoading(true)
     setMessage("")
     setCrashed(false)
     setMultiplier(1.00)
     setServerCrashPoint(null)
     setGameId(null)

     try {
         const res = await fetch('/api/games/crash/play', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ betAmount })
         })

         const data = await res.json()

         if (!res.ok) {
             throw new Error(data.error || "Failed to start game")
         }

         // Update balance (optimistic or from server)
         // processing is handled by the API, so we just fetch/sync or subtract
         updateBalance(-betAmount, true) // Local only, API already deducted
         
         setGameId(data.gameId)
         setServerCrashPoint(data.crashPoint)
         
         setIsPlaying(true)
         setLoading(false)
         
         startTimeRef.current = Date.now()
         requestRef.current = requestAnimationFrame(animate)

     } catch (error) {
         const msg = error instanceof Error ? error.message : "An error occurred"
         setLoading(false)
         setMessage(msg)
         toast({
             variant: "destructive",
             title: "Error",
             description: msg
         })
     }
  }

  const animate = () => {
      if (!startTimeRef.current) return

      const now = Date.now()
      const elapsed = (now - startTimeRef.current) / 1000 
      
      // Growth function: e^(0.15 * t) - roughly 1.00x to 2.00x in 4-5 seconds
      const currentMult = Math.pow(Math.E, 0.15 * elapsed)
      
      // Check if we hit the server crash point
      // Note: serverCrashPoint should be set from API response
      if (serverCrashPoint !== null && currentMult >= serverCrashPoint) {
          setMultiplier(serverCrashPoint)
          handleCrash(serverCrashPoint)
      } else {
          setMultiplier(currentMult)
          requestRef.current = requestAnimationFrame(animate)
      }
  }

  const handleCrash = (finalPoint: number) => {
      setCrashed(true)
      setIsPlaying(false)
      setMessage(`CRASHED @ ${finalPoint.toFixed(2)}x`)
      cancelAnimationFrame(requestRef.current)
      setGameId(null) // Reset game ID so we don't try to cash out
  }

  const cashOut = async () => {
      if (!isPlaying || crashed || !gameId) return
      
      // 1. Stop animation immediately to show "You stopped here"
      cancelAnimationFrame(requestRef.current)
      const currentMult = multiplier
      setIsPlaying(false)
      
      try {
          // 2. Call API to confirm cashout
          const res = await fetch('/api/games/crash/cashout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  gameId, 
                  multiplier: currentMult 
              })
          })

          const data = await res.json()

          if (!res.ok) {
              // If server says we crashed, show crash
              if (data.crashedAt) {
                  setMultiplier(data.crashedAt)
                  setCrashed(true)
                  setMessage(`Too late! Crashed @ ${data.crashedAt}x`)
              } else {
                  throw new Error(data.error || "Cashout failed")
              }
          } else {
              // Success
              const winAmount = data.payout
              updateBalance(winAmount, true) // Local only, API already credited
              setMessage(`CASHED OUT @ ${currentMult.toFixed(2)}x (+${(winAmount - betAmount).toFixed(2)})`)
              toast({
                  title: "You Won!",
                  description: `Successfully cashed out ₹${winAmount.toFixed(2)}`,
                  className: "bg-green-600 text-white border-none"
              })
          }
    } catch (error) {
        const msg = error instanceof Error ? error.message : "An error occurred"
        setMessage(msg)
          // If error, likely crashed or network issue. 
          // Revert to crashed state just in case if safe? 
          // For now just show error.
      }
      
      setGameId(null)
  }

  useEffect(() => {
      return () => cancelAnimationFrame(requestRef.current)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-2xl glass-card border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-orange-500">
            <TrendingUp className="h-6 w-6" /> Crash
          </CardTitle>
          <CardDescription className="text-gray-400">Cash out before the graph crashes!</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] relative bg-black/50 rounded-xl overflow-hidden flex items-end p-4 border border-white/5">
            
            {/* Grid */}
            <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 opacity-10 pointer-events-none">
                {Array.from({length: 16}).map((_,i) => <div key={i} className="border border-white/20" />)}
            </div>

            {/* Graph Visual */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none p-4 overflow-visible" preserveAspectRatio="none">
                 <path 
                    d={`M 0 380 Q ${isPlaying ? 200 : 0} ${isPlaying ? 380 - (multiplier * 10) : 380}, ${isPlaying ? 400 : 0} ${isPlaying ? 380 - (multiplier * 50) : 380}`} 
                    fill="none" 
                    stroke={crashed ? "#ef4444" : "#f97316"} 
                    strokeWidth="4"
                    className="drop-shadow-[0_0_10px_rgba(249,115,22,0.5)]"
                 />
            </svg>

            <div className="absolute inset-0 flex items-center justify-center z-10 flex-col">
                 <div className={`text-6xl font-bold font-mono tracking-tighter ${crashed ? "text-red-500" : "text-white"}`}>
                     {multiplier.toFixed(2)}x
                 </div>
                 {crashed && <div className="text-red-500 font-bold text-xl mt-2">CRASHED</div>}
                 {message && !crashed && <div className="text-green-400 font-bold text-xl mt-2">{message}</div>}
            </div>

        </CardContent>
        <CardFooter className="flex flex-col gap-4">
             {!isPlaying && !loading ? (
                 <div className="flex w-full gap-4 items-end">
                     <div className="space-y-2 flex-1">
                        <label className="text-sm font-medium text-gray-400">Bet Amount</label>
                        <Input
                            type="number"
                            value={betAmount}
                            onChange={(e) => setBetAmount(Number(e.target.value))}
                            min={1}
                            className="bg-black/50 border-white/10 focus:border-orange-500/50 text-white"
                        />
                    </div>
                    <Button onClick={startGame} className="flex-1 h-10 w-full bg-orange-600 hover:bg-orange-700 font-bold text-lg">
                        Place Bet
                    </Button>
                 </div>
             ) : (
                <Button 
                    onClick={cashOut} 
                    disabled={loading || crashed}
                    className={`w-full h-16 text-2xl font-bold ${crashed ? "bg-gray-700" : "bg-green-600 hover:bg-green-700 shadow-[0_0_20px_rgba(34,197,94,0.4)]"}`}
                >
                    {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : 
                     crashed ? "CRASHED" : 
                     `CASH OUT ${(betAmount * multiplier).toFixed(2)}`}
                </Button>
             )}
        </CardFooter>
      </Card>
    </div>
  )
}
