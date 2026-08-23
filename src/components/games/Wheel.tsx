"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useBalance } from "@/context/BalanceContext"
import { Disc } from "lucide-react"

// Segments: 10x (1), 5x (3), 3x (5), 2x (7), 0x (remainder)
const SEGMENTS = [
    { value: 10, color: "bg-red-600", angle: 0 },
    { value: 0, color: "bg-gray-800", angle: 36 },
    { value: 2, color: "bg-blue-600", angle: 72 },
    { value: 0, color: "bg-gray-800", angle: 108 },
    { value: 5, color: "bg-green-600", angle: 144 },
    { value: 0, color: "bg-gray-800", angle: 180 },
    { value: 3, color: "bg-purple-600", angle: 216 },
    { value: 0, color: "bg-gray-800", angle: 252 },
    { value: 2, color: "bg-blue-600", angle: 288 },
    { value: 0, color: "bg-gray-800", angle: 324 },
] // 10 segments, 36 deg each

export default function Wheel() {
  const { balance, updateBalance } = useBalance()
  const [betAmount, setBetAmount] = useState<number>(10)
  const [isSpinning, setIsSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [message, setMessage] = useState("")

  const spinWheel = () => {
    if (betAmount > balance) return setMessage("Insufficient balance")
    if (isNaN(betAmount) || betAmount <= 0) return setMessage("Invalid bet")

    setIsSpinning(true)
    setMessage("")
    updateBalance(-betAmount)

    // Random segment
    const segmentIndex = Math.floor(Math.random() * SEGMENTS.length)
    const segment = SEGMENTS[segmentIndex]
    
    // Calculate rotation to land on top (0 deg)
    // Currently top is 0. If segment is at 36 deg, we need to rotate 360 - 36 to get it to 0.
    // Plus extra spins.
    const extraSpins = 360 * 5
    const targetRotation = rotation + extraSpins + (360 - segment.angle)
    
    setRotation(targetRotation)

    setTimeout(() => {
        setIsSpinning(false)
        if (segment.value > 0) {
            const win = betAmount * segment.value
            updateBalance(win)
            setMessage(`Won ${win.toFixed(2)} (${segment.value}x)`)
        } else {
            setMessage("Better luck next time!")
        }
    }, 4000)
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-xl glass-card border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-yellow-400">
            <Disc className="h-6 w-6" /> Wheel
          </CardTitle>
          <CardDescription className="text-gray-400">Big Multipliers. Big Risk.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-8 py-8">
            
            <div className="relative w-64 h-64 md:w-80 md:h-80">
                {/* Pointer */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 text-4xl text-white font-bold">▼</div>
                
                {/* Wheel */}
                <motion.div 
                    className="w-full h-full rounded-full border-8 border-gray-800 relative shadow-2xl overflow-hidden bg-gray-900"
                    animate={{ rotate: rotation }}
                    transition={{ duration: 4, type: "spring", stiffness: 40, damping: 20 }}
                >
                     {SEGMENTS.map((seg, i) => (
                         <div
                            key={i}
                            className={`absolute top-0 left-1/2 w-1/2 h-full origin-left ${seg.color} flex items-center justify-end pr-8`}
                            style={{ 
                                transform: `rotate(${seg.angle}deg)`,
                                clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 50%)" // Rough slice shape attempt for CSS-only
                                // Actually CSS conic gradient is better for slices, but let's use a simpler visual for this demo
                            }}
                         >
                            {/* Visual hack: Just placing numbers radially */}
                         </div>
                     ))}
                     
                     {/* Better Visual: Conic Gradient */}
                     <div 
                        className="absolute inset-0 rounded-full opacity-80"
                        style={{
                            background: `conic-gradient(
                                #dc2626 0deg 36deg,
                                #1f2937 36deg 72deg,
                                #2563eb 72deg 108deg,
                                #1f2937 108deg 144deg,
                                #16a34a 144deg 180deg,
                                #1f2937 180deg 216deg,
                                #9333ea 216deg 252deg,
                                #1f2937 252deg 288deg,
                                #2563eb 288deg 324deg,
                                #1f2937 324deg 360deg
                            )`
                        }}
                     />
                     <div className="absolute inset-4 rounded-full bg-black/50" />
                     
                     {/* Numbers Overlay */}
                     {SEGMENTS.map((seg, i) => (
                         <div 
                            key={i}
                            className="absolute top-0 left-0 w-full h-full flex items-start justify-center pt-4 font-bold text-white text-lg"
                            style={{ transform: `rotate(${seg.angle + 18}deg)` }}
                         >
                             {seg.value}x
                         </div>
                     ))}
                </motion.div>
                 
                 {/* Center Cap */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-black border-4 border-yellow-500 shadow-xl z-10 flex items-center justify-center">
                     <Disc className="w-8 h-8 text-yellow-500" />
                 </div>
            </div>

            {message && <div className="text-xl font-bold text-yellow-400 animate-pulse">{message}</div>}

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
                        className="bg-black/50 border-white/10 focus:border-yellow-500/50 text-white"
                    />
                </div>
                <Button onClick={spinWheel} disabled={isSpinning} className="flex-1 h-10 w-full bg-yellow-600 hover:bg-yellow-700 font-bold text-lg">
                    {isSpinning ? "Spinning..." : "Spin Wheel"}
                </Button>
            </div>
        </CardFooter>
      </Card>
    </div>
  )
}
