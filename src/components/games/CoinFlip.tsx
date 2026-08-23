"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useBalance } from "@/context/BalanceContext"
import { Coins, Sparkles } from "lucide-react"

export default function CoinFlip() {
  const { balance, updateBalance } = useBalance()
  const [betAmount, setBetAmount] = useState<number>(10)
  const [choice, setChoice] = useState<"heads" | "tails" | null>(null)
  const [isFlipping, setIsFlipping] = useState(false)
  const [result, setResult] = useState<"heads" | "tails" | null>(null)
  const [message, setMessage] = useState("")

  const handleFlip = async () => {
    if (!choice) {
      setMessage("Please select Heads or Tails")
      return
    }
    if (betAmount > balance) {
      setMessage("Insufficient balance")
      return
    }
    if (isNaN(betAmount) || betAmount <= 0) {
      setMessage("Invalid bet amount")
      return
    }

    setIsFlipping(true)
    setMessage("")
    setResult(null)
    updateBalance(-betAmount)

    // Simulate flip
    setTimeout(() => {
      const outcome = Math.random() < 0.5 ? "heads" : "tails"
      setResult(outcome)
      setIsFlipping(false)

      if (outcome === choice) {
        const winnings = betAmount * 2
        updateBalance(winnings)
        setMessage(`You won ${winnings} coins!`)
      } else {
        setMessage("You lost!")
      }
    }, 2000)
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md glass-card border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-primary">
            <Coins className="h-6 w-6" /> Coin Flip
          </CardTitle>
          <CardDescription className="text-gray-400">Double your money or lose it all!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="flex justify-center h-48 items-center perspective-1000">
            <motion.div
              className="relative w-32 h-32 preserve-3d"
              animate={{
                rotateY: isFlipping ? 1800 + (result === "tails" ? 180 : 0) : (result === "tails" ? 180 : 0),
              }}
              transition={{ duration: 2, ease: "easeOut" }}
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Heads Side */}
              <div className="absolute inset-0 w-full h-full rounded-full bg-linear-to-br from-yellow-300 to-yellow-600 border-4 border-yellow-200 flex items-center justify-center backface-hidden shadow-[0_0_30px_rgba(251,191,36,0.4)]">
                 <span className="text-4xl font-bold text-yellow-900">H</span>
              </div>
              
              {/* Tails Side */}
              <div className="absolute inset-0 w-full h-full rounded-full bg-linear-to-br from-gray-300 to-gray-500 border-4 border-gray-200 flex items-center justify-center backface-hidden shadow-[0_0_30px_rgba(255,255,255,0.2)]" style={{ transform: "rotateY(180deg)" }}>
                <span className="text-4xl font-bold text-gray-900">T</span>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant={choice === "heads" ? "default" : "outline"}
              onClick={() => setChoice("heads")}
              disabled={isFlipping}
              className={`h-12 text-lg transition-all ${choice === "heads" ? "bg-yellow-500 hover:bg-yellow-600 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)]" : "border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10"}`}
            >
              Heads
            </Button>
            <Button 
              variant={choice === "tails" ? "default" : "outline"}
              onClick={() => setChoice("tails")}
              disabled={isFlipping}
              className={`h-12 text-lg transition-all ${choice === "tails" ? "bg-gray-200 hover:bg-gray-300 text-black shadow-[0_0_15px_rgba(255,255,255,0.4)]" : "border-gray-500/50 text-gray-400 hover:bg-gray-500/10"}`}
            >
              Tails
            </Button>
          </div>

          <div className="space-y-2 bg-black/30 p-4 rounded-lg border border-white/5">
            <label className="text-sm font-medium text-gray-400">Bet Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                disabled={isFlipping}
                min={1}
                className="pl-8 bg-black/50 border-white/10 focus:border-primary/50 text-white"
              />
            </div>
          </div>

          {message && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-center font-bold text-lg p-2 rounded-lg ${message.includes("won") ? "text-green-400 bg-green-400/10 border border-green-400/20" : "text-red-400 bg-red-400/10 border border-red-400/20"}`}
            >
              {message}
              {message.includes("won") && <Sparkles className="inline ml-2 h-5 w-5" />}
            </motion.div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full h-12 text-lg font-bold bg-primary text-black hover:bg-primary/90 shadow-[0_0_20px_rgba(251,191,36,0.2)]"
            onClick={handleFlip} 
            disabled={isFlipping || !choice}
          >
            {isFlipping ? "Flipping..." : "Flip Coin"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
