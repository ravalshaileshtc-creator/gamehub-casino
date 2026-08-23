"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useBalance } from "@/context/BalanceContext"
import { Grid } from "lucide-react"
import { cn } from "@/lib/utils"

export default function Keno() {
  const { balance, updateBalance } = useBalance()
  const [betAmount, setBetAmount] = useState<number>(10)
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([])
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [message, setMessage] = useState("")

  const toggleNumber = (num: number) => {
    if (isPlaying) return
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(prev => prev.filter(n => n !== num))
    } else {
      if (selectedNumbers.length >= 10) return
      setSelectedNumbers(prev => [...prev, num])
    }
  }

  const startGame = () => {
    if (selectedNumbers.length === 0) return setMessage("Select at least 1 number")
    if (betAmount > balance) return setMessage("Insufficient balance")
    if (isNaN(betAmount) || betAmount <= 0) return setMessage("Invalid bet")

    updateBalance(-betAmount)
    setIsPlaying(true)
    setDrawnNumbers([])
    setMessage("")

    // Draw 20 numbers
    const drawn: number[] = []
    while (drawn.length < 20) {
      const num = Math.floor(Math.random() * 80) + 1
      if (!drawn.includes(num)) drawn.push(num)
    }

    // Reveal animation simulation
    let i = 0
    const interval = setInterval(() => {
        setDrawnNumbers(prev => [...prev, drawn[i]])
        i++
        if (i >= 20) {
            clearInterval(interval)
            finishGame(drawn)
        }
    }, 100)
  }

  const finishGame = (finalDrawn: number[]) => {
      setIsPlaying(false)
      const hits = selectedNumbers.filter(n => finalDrawn.includes(n)).length
      
      // Simplified Payout Table (for 10 picks)
      // Hits: 0  1  2  3  4  5    6    7    8     9     10
      // Pay:  0  0  0  0  1  3x   10x  50x  200x  500x  1000x
      // This is dynamic based on count usually, implying a simple 1:1 for now for > 30% hit rate
      
      let multiplier = 0
      const percentage = hits / selectedNumbers.length
      
      if (percentage >= 0.5) multiplier = 2
      if (percentage >= 0.7) multiplier = 10
      if (percentage >= 0.9) multiplier = 50
      if (percentage === 1.0 && selectedNumbers.length >= 5) multiplier = 100

      if (hits === 0 && selectedNumbers.length >= 8) multiplier = 2 // Payout for 0 hits on high picks

      if (multiplier > 0) {
          const win = betAmount * multiplier
          updateBalance(win)
          setMessage(`Hit ${hits}! Won ${win.toFixed(2)} (${multiplier}x)`)
      } else {
          setMessage(`Hit ${hits}. Try again.`)
      }
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-4xl glass-card border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-teal-400">
            <Grid className="h-6 w-6" /> Keno
          </CardTitle>
          <CardDescription className="text-gray-400">Pick up to 10 numbers. 20 are drawn. Match to win.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            
            {/* Grid */}
            <div className="grid grid-cols-8 md:grid-cols-10 gap-2">
                {Array.from({length: 80}).map((_, i) => {
                    const num = i + 1
                    const isSelected = selectedNumbers.includes(num)
                    const isDrawn = drawnNumbers.includes(num)
                    const isHit = isSelected && isDrawn
                    
                    return (
                        <button
                            key={num}
                            onClick={() => toggleNumber(num)}
                            disabled={isPlaying}
                            className={cn(
                                "aspect-square rounded-md text-sm font-bold flex items-center justify-center transition-all",
                                isHit ? "bg-green-500 text-black shadow-[0_0_10px_rgba(34,197,94,0.6)] scale-110 z-10" :
                                isSelected ? "bg-teal-600 text-white" :
                                isDrawn ? "bg-red-500/50 text-white" :
                                "bg-black/30 hover:bg-white/10 text-gray-500"
                            )}
                        >
                            {num}
                        </button>
                    )
                })}
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-black/30 p-4 rounded-lg">
                 <div>
                     <span className="text-gray-400">Selected: </span>
                     <span className="font-bold text-white">{selectedNumbers.length}/10</span>
                 </div>
                 {message && <div className="font-bold text-lg text-teal-400 animate-pulse">{message}</div>}
            </div>

        </CardContent>
        <CardFooter className="flex flex-col gap-4">
            <div className="flex w-full gap-4 items-end">
                <div className="space-y-2 flex-1">
                    <label className="text-sm font-medium text-gray-400">Bet Amount</label>
                    <Input
                        type="number"
                        value={betAmount}
                        onChange={(e) => setBetAmount(Number(e.target.value))}
                        min={1}
                        className="bg-black/50 border-white/10 focus:border-teal-500/50 text-white"
                    />
                </div>
                <Button onClick={startGame} disabled={isPlaying} className="flex-1 h-10 w-full bg-teal-600 hover:bg-teal-700 font-bold text-lg">
                    {isPlaying ? "Drawing..." : "Play Keno"}
                </Button>
            </div>
            <Button variant="ghost" onClick={() => {setSelectedNumbers([]); setMessage("")}} disabled={isPlaying} className="text-gray-500 hover:text-white">Clear Selection</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
