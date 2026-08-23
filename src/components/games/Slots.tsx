"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useBalance } from "@/context/BalanceContext"
import { RefreshCw, Sparkles, Zap } from "lucide-react"

const SYMBOLS = ["🍒", "🍋", "🍊", "🍇", "🔔", "💎", "7️⃣"]

export default function Slots() {
  const { balance, updateBalance } = useBalance()
  const [betAmount, setBetAmount] = useState<number>(10)
  const [reels, setReels] = useState<string[]>(["7️⃣", "7️⃣", "7️⃣"])
  const [isSpinning, setIsSpinning] = useState(false)
  const [message, setMessage] = useState("")
  const [winType, setWinType] = useState<"none" | "small" | "big">("none")

  const spinReels = async () => {
    if (betAmount > balance) {
      setMessage("Insufficient balance")
      return
    }
    if (isNaN(betAmount) || betAmount <= 0) {
      setMessage("Invalid bet amount")
      return
    }

    setIsSpinning(true)
    setMessage("")
    setWinType("none")
    updateBalance(-betAmount)

    // Animation frames
    let counter = 0
    const intervalId = setInterval(() => {
      setReels([
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
      ])
      counter++
      if (counter > 20) {
        clearInterval(intervalId)
        finalizeSpin()
      }
    }, 80)
  }

  const finalizeSpin = () => {
    const finalReels = [
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
    ]
    setReels(finalReels)
    setIsSpinning(false)

    if (finalReels[0] === finalReels[1] && finalReels[1] === finalReels[2]) {
      const winnings = betAmount * 10
      updateBalance(winnings)
      setMessage(`JACKPOT! You won ${winnings} coins!`)
      setWinType("big")
    } else if (finalReels[0] === finalReels[1] || finalReels[1] === finalReels[2] || finalReels[0] === finalReels[2]) {
      const winnings = betAmount * 2
      updateBalance(winnings)
      setMessage(`Small Win! You won ${winnings} coins!`)
      setWinType("small")
    } else {
      setMessage("Try again!")
      setWinType("none")
    }
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md glass-card border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-purple-400">
            <RefreshCw className="h-6 w-6" /> Slots
          </CardTitle>
          <CardDescription className="text-gray-400">Spin to win! Match 3 for Jackpot (10x).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="flex justify-center gap-4 py-8 bg-black/50 rounded-xl border border-white/10 shadow-inner relative overflow-hidden">
             
            {/* Glow effect behind reels */}
            <div className="absolute inset-0 bg-purple-500/10 blur-xl"></div>

            {reels.map((symbol, i) => (
              <motion.div
                key={i}
                className="w-20 h-24 bg-linear-to-b from-gray-800 to-black border-2 border-purple-500/30 rounded-lg flex items-center justify-center text-4xl shadow-[0_0_15px_rgba(168,85,247,0.2)] z-10"
                animate={isSpinning ? {
                  y: [0, -20, 0],
                  filter: "blur(2px)",
                  scale: 0.95
                } : {
                  filter: "blur(0px)",
                  scale: 1
                }}
                transition={{ 
                  y: { repeat: isSpinning ? Infinity : 0, duration: 0.1, delay: i * 0.05 },
                  filter: { duration: 0.2 }
                }}
              >
                {symbol}
              </motion.div>
            ))}
          </div>

          <div className="space-y-2 bg-black/30 p-4 rounded-lg border border-white/5">
            <label className="text-sm font-medium text-gray-400">Bet Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                disabled={isSpinning}
                min={1}
                className="pl-8 bg-black/50 border-white/10 focus:border-purple-500/50 text-white"
              />
            </div>
          </div>

          <AnimatePresence>
            {message && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className={`text-center font-bold text-lg p-3 rounded-lg border flex items-center justify-center gap-2
                  ${winType === "big" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.2)]" : 
                    winType === "small" ? "bg-green-500/20 text-green-400 border-green-500/50" : 
                    "bg-red-500/10 text-red-400 border-red-500/20"}`}
              >
                {winType === "big" && <Zap className="h-5 w-5 fill-yellow-400 animate-pulse" />}
                {message}
                {winType !== "none" && <Sparkles className="h-5 w-5" />}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full h-12 text-lg font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-[0_0_20px_rgba(147,51,234,0.3)] border-none"
            onClick={spinReels} 
            disabled={isSpinning}
          >
            {isSpinning ? "Spinning..." : "Spin Reels"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
