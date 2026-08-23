"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useBalance } from "@/context/BalanceContext"
import { Dices, Sparkles } from "lucide-react"

export default function DiceRoll() {
  const { balance, updateBalance } = useBalance()
  const [betAmount, setBetAmount] = useState<number>(10)
  const [prediction, setPrediction] = useState<"low" | "high" | null>(null)
  const [isRolling, setIsRolling] = useState(false)
  const [result, setResult] = useState<number>(1)
  const [message, setMessage] = useState("")

  const handleRoll = async () => {
    if (!prediction) {
      setMessage("Select High or Low")
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

    setIsRolling(true)
    setMessage("")
    updateBalance(-betAmount)

    // Animation simulation - 1.5s delay as requested
    const interval = setInterval(() => {
      setResult(Math.floor(Math.random() * 6) + 1)
    }, 80)

    setTimeout(() => {
      clearInterval(interval)
      const outcome = Math.floor(Math.random() * 6) + 1
      setResult(outcome)
      setIsRolling(false)

      const isLow = outcome >= 1 && outcome <= 3
      const isHigh = outcome >= 4 && outcome <= 6
      
      let won = false
      if (prediction === "low" && isLow) won = true
      if (prediction === "high" && isHigh) won = true

      if (won) {
        const winnings = betAmount * 1.92
        updateBalance(winnings)
        setMessage(`You won ${winnings.toFixed(2)} coins!`)
      } else {
        setMessage("You lost!")
      }
    }, 1500)
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md glass-card border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-blue-400">
            <Dices className="h-6 w-6" /> Dice Roll
          </CardTitle>
          <CardDescription className="text-gray-400">Low (1-3) or High (4-6). Win 1.92x.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="flex justify-center h-48 items-center perspective-1000">
            <motion.div
              className={`relative w-24 h-24 flex items-center justify-center rounded-xl text-5xl font-bold shadow-[0_0_40px_rgba(59,130,246,0.3)]
                 bg-linear-to-br from-blue-500 to-blue-700 text-white border border-blue-400/50`}
              animate={{
                rotateX: isRolling ? [0, 360, 720, 1080] : 0,
                rotateY: isRolling ? [0, 360, 720, 1080] : 0,
                scale: isRolling ? [1, 1.2, 1] : 1,
              }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            >
              {result}
            </motion.div>
          </div>

          <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => setPrediction("low")}
                disabled={isRolling}
                className={`h-16 text-xl font-bold transition-all ${
                  prediction === "low"
                    ? "bg-blue-500 hover:bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)] border-blue-500" 
                    : "border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                }`}
              >
                LOW (1-3)
              </Button>
              <Button
                onClick={() => setPrediction("high")}
                disabled={isRolling}
                className={`h-16 text-xl font-bold transition-all ${
                  prediction === "high"
                    ? "bg-blue-500 hover:bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)] border-blue-500" 
                    : "border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                }`}
              >
                HIGH (4-6)
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
                disabled={isRolling}
                min={1}
                className="pl-8 bg-black/50 border-white/10 focus:border-blue-500/50 text-white"
              />
            </div>
          </div>

          <AnimatePresence>
            {message && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className={`text-center font-bold text-lg p-2 rounded-lg ${message.includes("won") ? "text-green-400 bg-green-400/10 border border-green-400/20" : "text-red-400 bg-red-400/10 border border-red-400/20"}`}
              >
                {message}
                {message.includes("won") && <Sparkles className="inline ml-2 h-5 w-5" />}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full h-12 text-lg font-bold bg-blue-500 text-white hover:bg-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.3)] border-none"
            onClick={handleRoll} 
            disabled={isRolling || prediction === null}
          >
            {isRolling ? "Rolling..." : "Roll Dice"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
