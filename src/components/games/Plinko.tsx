"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useBalance } from "@/context/BalanceContext"
import { ArrowDownCircle } from "lucide-react"

const ROWS = 12
const MULTIPLIERS = [10, 5, 2, 1.5, 1, 0.5, 0.2, 0.5, 1, 1.5, 2, 5, 10] // approx for 12 rows center-heavy

export default function Plinko() {
  const { balance, updateBalance } = useBalance()
  const [betAmount, setBetAmount] = useState<number>(10)
  const [balls, setBalls] = useState<{id: number, path: number[]}[]>([])
  const [message, setMessage] = useState("")
  
  const dropBall = () => {
     if (betAmount > balance) return setMessage("Insufficient balance")
     if (isNaN(betAmount) || betAmount <= 0) return setMessage("Invalid bet")

     updateBalance(-betAmount)
     setMessage("")

     // Calculate path
     // 0 = left, 1 = right
     const path: number[] = []
     
     // Simplification:
     // Result index (0 to 12) determines multiplier.
     // We generate a result index based on Normal Distribution logic (more likely center).
     // Then we back-calculate a visual path.
     
     let currentIdx = 0 // 0 to start
     for (let i = 0; i < ROWS; i++) {
        const dir = Math.random() > 0.5 ? 1 : 0
        path.push(dir)
        currentIdx += dir
     }
     
     const id = Date.now()
     setBalls(prev => [...prev, { id, path }])

     // Simulate arrival time
     setTimeout(() => {
         const multiplier = MULTIPLIERS[currentIdx % MULTIPLIERS.length]
         const win = betAmount * multiplier
         updateBalance(win)
         setBalls(prev => prev.filter(b => b.id !== id))
         if (win > betAmount) setMessage(`Won ${win.toFixed(2)} (${multiplier}x)`)
     }, ROWS * 300) // Animation duration
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-2xl glass-card border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-pink-500">
            <ArrowDownCircle className="h-6 w-6" /> Plinko
          </CardTitle>
          <CardDescription className="text-gray-400">Watch the ball fall. High risk, high reward.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center relative min-h-[500px] overflow-hidden">
             
             {/* Pins Pyramid */}
             <div className="flex flex-col items-center gap-4 mt-8">
                 {Array.from({ length: ROWS }).map((_, row) => (
                     <div key={row} className="flex gap-4">
                         {Array.from({ length: row + 3 }).map((_, col) => (
                             <div key={col} className="w-2 h-2 rounded-full bg-white/20 shadow-[0_0_5px_rgba(255,255,255,0.2)]" />
                         ))}
                     </div>
                 ))}
             </div>

             {/* Multiplier Buckets */}
             <div className="flex gap-1 mt-4">
                 {MULTIPLIERS.map((m, i) => (
                     <div key={i} className={`
                        w-8 h-8 flex items-center justify-center text-[10px] font-bold rounded shadow-lg
                        ${m >= 5 ? "bg-red-600 text-white" : m >= 2 ? "bg-orange-500 text-black" : "bg-yellow-400 text-black"}
                     `}>
                         {m}x
                     </div>
                 ))}
             </div>

             {/* Balls Animation */}
             {balls.map((ball) => (
                 <PlinkoBall key={ball.id} path={ball.path} />
             ))}

        </CardContent>
        <CardFooter className="flex flex-col gap-4 z-10 bg-black/50 p-4 rounded-b-xl w-full">
            <div className="flex w-full gap-4 items-end">
                <div className="space-y-2 flex-1">
                    <label className="text-sm font-medium text-gray-400">Bet Amount</label>
                    <Input
                        type="number"
                        value={betAmount}
                        onChange={(e) => setBetAmount(Number(e.target.value))}
                        min={1}
                        className="bg-black/50 border-white/10 focus:border-pink-500/50 text-white"
                    />
                </div>
                <Button onClick={dropBall} className="flex-1 h-10 bg-pink-600 hover:bg-pink-700 font-bold text-lg">Drop Ball</Button>
            </div>
            {message && <div className="text-center font-bold text-pink-400">{message}</div>}
        </CardFooter>
      </Card>
    </div>
  )
}

function PlinkoBall({ path }: { path: number[] }) {
    // We animate simply by X, Y coords.
    // Row 0 Y=0. Row 1 Y=20...
    // X needs to shift based on path 0 (left) or 1 (right)
    // This is a naive visualization
    
    return (
        <motion.div
            className="absolute top-0 w-4 h-4 rounded-full bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.8)]"
            initial={{ y: 0, x: 0 }}
            animate={{
                y: path.map((_, i) => (i + 1) * 36 + 20), // Move down info pins
                x: path.map((dir, i) => {
                     // Accumulate shift.
                     // A pure random walk moves roughly 15px left or right each step
                     const steps = path.slice(0, i + 1).reduce((acc, curr) => acc + (curr === 0 ? -1 : 1), 0)
                     return steps * 12
                })
            }}
            transition={{ duration: 3, ease: "linear" }}
        />
    )
}
