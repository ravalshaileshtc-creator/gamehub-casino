"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useBalance } from "@/context/BalanceContext"
import { Disc } from "lucide-react"
import { cn } from "@/lib/utils"

// Mini Roulette: 0-12
const NUMBERS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const RED_NUMBERS = [1, 3, 5, 7, 9, 11]
const BLACK_NUMBERS = [2, 4, 6, 8, 10, 12]

export default function Roulette() {
  const { balance, updateBalance } = useBalance()
  const [betAmount, setBetAmount] = useState<number>(10)
  const [selectedBet, setSelectedBet] = useState<number | "red" | "black" | "even" | "odd" | null>(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [result, setResult] = useState<number | null>(null)
  const [rotation, setRotation] = useState(0)
  const [message, setMessage] = useState("")

  const handleSpin = () => {
    if (selectedBet === null) return setMessage("Place a bet first!")
    if (betAmount > balance) return setMessage("Insufficient balance")
    if (isNaN(betAmount) || betAmount <= 0) return setMessage("Invalid bet")

    setIsSpinning(true)
    setMessage("")
    setResult(null)
    updateBalance(-betAmount)

    // eslint-disable-next-line react-hooks/purity -- Math.random() is inside an event handler, not render
    const winningNumber = NUMBERS[Math.floor(Math.random() * NUMBERS.length)]
    
    // Rotation logic
    const sliceAngle = 360 / 13
    const winningIndex = NUMBERS.indexOf(winningNumber)

    setRotation(prev => prev + 1800 + (360 - (winningIndex * sliceAngle)))

    setTimeout(() => {
        setIsSpinning(false)
        setResult(winningNumber)
        checkWin(winningNumber)
    }, 3000)
  }

  const checkWin = (number: number) => {
    let won = false
    let payout = 0
    
    if (typeof selectedBet === "number") {
        if (selectedBet === number) {
            won = true
            payout = betAmount * 12 // 12x for exact number (1/13 chance) - House edge ~7.7%
        }
    } else if (selectedBet === "red") {
        if (RED_NUMBERS.includes(number)) {
            won = true
            payout = betAmount * 2
        }
    } else if (selectedBet === "black") {
        if (BLACK_NUMBERS.includes(number)) {
            won = true
            payout = betAmount * 2
        }
    } else if (selectedBet === "even") {
        if (number !== 0 && number % 2 === 0) {
            won = true
            payout = betAmount * 2
        }
    } else if (selectedBet === "odd") {
        if (number !== 0 && number % 2 !== 0) {
            won = true
            payout = betAmount * 2
        }
    }

    if (won) {
        updateBalance(payout)
        setMessage(`WIN! ${number} pays ${payout} coins!`)
    } else {
        setMessage(`Lost. Result was ${number}`)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-4xl glass-card border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-red-500">
            <Disc className="h-6 w-6" /> Mini Roulette
          </CardTitle>
          <CardDescription className="text-gray-400">Numbers 0-12. Guess the number (12x) or color (2x).</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-8 items-center justify-center">
            
            {/* Wheel Animation Area */}
            <div className="relative w-64 h-64 md:w-80 md:h-80 flex-shrink-0">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-20 text-4xl text-yellow-400 font-bold">▼</div>
                <motion.div 
                    className="w-full h-full rounded-full border-8 border-gray-800 bg-gray-900 relative shadow-2xl overflow-hidden flex items-center justify-center"
                    animate={{ rotate: rotation }}
                    transition={{ duration: 3, type: "spring", damping: 50, stiffness: 50 }}
                >
                    <div className="absolute inset-0 rounded-full border-[20px] border-dashed border-red-900 opacity-50" />
                     <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-8xl font-bold text-white/10">{result !== null ? result : "?"}</span>
                     </div>
                </motion.div>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                     <div className="bg-black/80 px-4 py-2 rounded-xl border border-yellow-500/50 backdrop-blur-md">
                        <span className={`text-4xl font-bold ${result === 0 ? "text-green-500" : RED_NUMBERS.includes(result ?? -1) ? "text-red-500" : "text-white"}`}>
                            {result !== null ? result : "SPIN"}
                        </span>
                     </div>
                </div>
            </div>

            {/* Betting Board */}
            <div className="flex-1 w-full max-w-md space-y-4">
                <div className="grid grid-cols-4 gap-2">
                    {/* Zero */}
                    <Button 
                        
                        className={cn("col-span-4 h-12 bg-green-900 text-green-100 hover:bg-green-700 border-green-800", selectedBet === 0 && "ring-2 ring-yellow-400")}
                        onClick={() => setSelectedBet(0)}
                    >0</Button>
                    
                    {/* Numbers 1-12 */}
                    {NUMBERS.slice(1).map((num) => {
                        const isRed = RED_NUMBERS.includes(num)
                        return (
                            <Button 
                                key={num}
                                
                                className={cn(
                                    "col-span-1 h-12 text-lg font-bold border-none", 
                                    isRed ? "bg-red-900 text-red-100 hover:bg-red-700" : "bg-gray-800 text-gray-100 hover:bg-gray-600",
                                    selectedBet === num && "ring-2 ring-yellow-400 z-10"
                                )}
                                onClick={() => setSelectedBet(num)}
                            >
                                {num}
                            </Button>
                        )
                    })}
                </div>

                <div className="grid grid-cols-2 gap-2">
                     <Button 
                        
                        onClick={() => setSelectedBet("red")}
                        className={cn("h-10 bg-red-900 hover:bg-red-800 border-red-900 text-white", selectedBet === "red" && "ring-2 ring-yellow-400")}
                    >Red (x2)</Button>
                     <Button 
                        
                        onClick={() => setSelectedBet("black")}
                        className={cn("h-10 bg-gray-900 hover:bg-gray-800 border-gray-900 text-white", selectedBet === "black" && "ring-2 ring-yellow-400")}
                    >Black (x2)</Button>
                     <Button 
                        
                        onClick={() => setSelectedBet("even")}
                        className={cn("h-10 bg-blue-900 hover:bg-blue-800 border-blue-900 text-white", selectedBet === "even" && "ring-2 ring-yellow-400")}
                    >Even (x2)</Button>
                     <Button 
                        
                        onClick={() => setSelectedBet("odd")}
                        className={cn("h-10 bg-blue-900 hover:bg-blue-800 border-blue-900 text-white", selectedBet === "odd" && "ring-2 ring-yellow-400")}
                    >Odd (x2)</Button>
                </div>

                <div className="flex gap-4 items-end bg-black/20 p-4 rounded-lg">
                     <div className="space-y-2 flex-1">
                        <label className="text-sm font-medium text-gray-400">Bet</label>
                        <Input
                            type="number"
                            value={betAmount}
                            onChange={(e) => setBetAmount(Number(e.target.value))}
                            min={1}
                            className="bg-black/50 border-white/10 focus:border-red-500/50 text-white"
                        />
                    </div>
                    <Button 
                        onClick={handleSpin} 
                        disabled={isSpinning}
                        className="h-10 w-24 bg-yellow-600 hover:bg-yellow-700 text-black font-bold shadow-[0_0_15px_rgba(234,179,8,0.3)]"
                    >
                        {isSpinning ? "..." : "Spin"}
                    </Button>
                </div>
                 
                 {message && (
                    <div className="text-center font-bold text-lg text-yellow-400 animate-pulse bg-yellow-400/10 p-2 rounded border border-yellow-400/20">
                        {message}
                    </div>
                 )}
            </div>

        </CardContent>
      </Card>
    </div>
  )
}
