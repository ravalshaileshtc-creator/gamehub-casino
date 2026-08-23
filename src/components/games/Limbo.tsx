"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useBalance } from "@/context/BalanceContext"
import { Rocket } from "lucide-react"

export default function Limbo() {
  const { balance, updateBalance } = useBalance()
  const [betAmount, setBetAmount] = useState<number>(10)
  const [targetMultiplier, setTargetMultiplier] = useState<number>(2.0)
  const [result, setResult] = useState<number | null>(null)
  const [message, setMessage] = useState("")
  const [isPlaying, setIsPlaying] = useState(false)

  const playGame = () => {
    if (betAmount > balance) return setMessage("Insufficient balance")
    if (isNaN(betAmount) || betAmount <= 0) return setMessage("Invalid bet")
    if (targetMultiplier < 1.01) return setMessage("Min target 1.01x")

    setIsPlaying(true)
    setMessage("")
    updateBalance(-betAmount)

    // Simulate server-side hash generation for fairness
    // Logic: result = 100 / (Math.random() * 100) ... or 1e6 / (random * 1e6)
    // House Edge 1%: max win = 99 / prediction
    
    // Simple logic:
    // Generate a result multiplier.
    // Probability of hitting X is 1/X * (1 - HouseEdge).
    // Let's just generate a result independently.
    // Standard Limbo formula: float = bytes_to_float(hash). Multiplier = 0.99 / float.
    
    setTimeout(() => {
        const float = Math.random()
        // Avoid division by zero, float is [0, 1)
        const outcome = Math.max(1.00, Math.floor((0.99 / (1 - float)) * 100) / 100)
        
        setResult(outcome)

        if (outcome >= targetMultiplier) {
            const win = betAmount * targetMultiplier
            updateBalance(win)
            setMessage(`Won ${win.toFixed(2)}!`)
        } else {
            setMessage("Lost.")
        }
        setIsPlaying(false)
    }, 500)
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-lg glass-card border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-cyan-400">
            <Rocket className="h-6 w-6" /> Limbo
          </CardTitle>
          <CardDescription className="text-gray-400">Predict the target multiplier.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 text-center py-8">
            
            <div className={`text-6xl font-black font-mono tracking-tighter transition-colors ${
                result === null ? "text-gray-600" :
                result >= targetMultiplier ? "text-green-400" : "text-red-500"
            }`}>
                {result !== null ? result.toFixed(2) : "0.00"}x
            </div>
            
            {message && <div className="text-xl font-bold text-white">{message}</div>}

            <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2 text-left">
                    <label className="text-sm font-medium text-gray-400">Target Multiplier</label>
                    <Input
                        type="number"
                        value={targetMultiplier}
                        onChange={(e) => setTargetMultiplier(Number(e.target.value))}
                        step={0.1}
                        min={1.01}
                        className="bg-black/50 border-white/10 focus:border-cyan-500/50 text-white"
                        disabled={isPlaying}
                    />
                    <div className="text-xs text-gray-500">Win Chance: {(99 / targetMultiplier).toFixed(2)}%</div>
                </div>
                 <div className="space-y-2 text-left">
                    <label className="text-sm font-medium text-gray-400">Bet Amount</label>
                    <Input
                        type="number"
                        value={betAmount}
                        onChange={(e) => setBetAmount(Number(e.target.value))}
                        min={1}
                        className="bg-black/50 border-white/10 focus:border-cyan-500/50 text-white"
                        disabled={isPlaying}
                    />
                     <div className="text-xs text-gray-500">Profit: ${(betAmount * targetMultiplier - betAmount).toFixed(2)}</div>
                </div>
            </div>

        </CardContent>
        <CardFooter>
             <Button onClick={playGame} disabled={isPlaying} className="w-full h-12 bg-cyan-600 hover:bg-cyan-700 font-bold text-lg shadow-[0_0_20px_rgba(8,145,178,0.3)]">
                {isPlaying ? "Launching..." : "Bet"}
             </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
