"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useBalance } from "@/context/BalanceContext"
import { createDeck, shuffleDeck, type Card as CardType, getCardColor, getSuitSymbol } from "@/lib/deck"
import { ArrowUp, ArrowDown, Play } from "lucide-react"

const CARD_VALUES: Record<string, number> = {
    'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, 
    '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13
}

export default function HiLo() {
  const { balance, updateBalance } = useBalance()
  const [betAmount, setBetAmount] = useState<number>(10)
  const [isPlaying, setIsPlaying] = useState(false)
  // Lazy initializer: draw deck and first card at component creation, avoiding setState-in-effect
  const [deck, setDeck] = useState<CardType[]>(() => {
    const d = shuffleDeck(createDeck())
    d.pop() // remove the first card which is set as currentCard below
    return d
  })
  const [currentCard, setCurrentCard] = useState<CardType | null>(() => {
    const d = shuffleDeck(createDeck())
    return d[d.length - 1] ?? null
  })
  const [history, setHistory] = useState<CardType[]>([])
  const [multiplier, setMultiplier] = useState(1.0)
  const [message, setMessage] = useState("")

  const initGame = () => {
    const d = shuffleDeck(createDeck())
    const c = d.pop()!
    setDeck(d)
    setCurrentCard(c)
    setHistory([])
    setMultiplier(1.0)
    setMessage("")
  }
  
  // Removed useEffect(() => { initGame() }, []) — deck and first card are now lazy-initialized above


  const startGame = () => {
     if (betAmount > balance) return setMessage("Insufficient balance")
     if (isNaN(betAmount) || betAmount <= 0) return setMessage("Invalid bet")

     updateBalance(-betAmount)
     setIsPlaying(true)
     setMultiplier(1.0)
     setMessage("")
     
     // Reset deck if low
     if (deck.length < 10) {
        initGame()
     }
  }

  const guess = (direction: "higher" | "lower") => {
     if (!isPlaying || !currentCard) return

     const newDeck = [...deck]
     const nextCard = newDeck.pop()!
     setDeck(newDeck)
     setHistory(prev => [currentCard, ...prev].slice(0, 5)) // Keep last 5
     
     const currentVal = CARD_VALUES[currentCard.rank]
     const nextVal = CARD_VALUES[nextCard.rank]
     
     // Same rank is a push/continuation usually, or loss. Let's make it skip (push)
     if (currentVal === nextVal) {
        setCurrentCard(nextCard)
        setMessage("Same rank! Push.")
        return
     }

     const isHigher = nextVal > currentVal
     const won = (direction === "higher" && isHigher) || (direction === "lower" && !isHigher)

     setCurrentCard(nextCard)

     if (won) {
         // Calculate Prob based mult
         // Simple mult for demo: 
         // Higher chance (e.g. current is 2) = lower mult
         // Lower chance (e.g. current is K) = higher mult
         // We use static bump for now
         setMultiplier(prev => prev * 1.3)
         setMessage("Correct! Multiplier increased.")
     } else {
         setIsPlaying(false)
         setMessage("Wrong! Game Over.")
         setMultiplier(1.0)
     }
  }

  const cashOut = () => {
      if (!isPlaying) return
      const win = betAmount * multiplier
      updateBalance(win)
      setIsPlaying(false)
      setMessage(`Cashed out! Won ${win.toFixed(2)}`)
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-xl glass-card border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-blue-400">
            <ArrowUp className="h-6 w-6" /> Hi-Lo <ArrowDown className="h-6 w-6" />
          </CardTitle>
          <CardDescription className="text-gray-400">Guess if the next card is Higher or Lower.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
            
            <div className="flex justify-center items-center gap-8 h-64">
                {/* History */}
                <div className="hidden md:flex flex-col gap-2 opacity-50">
                    {history.map((c, i) => (
                        <div key={i} className="text-xs border p-1 rounded bg-gray-800 text-gray-400">
                            {c.rank}{getSuitSymbol(c.suit)}
                        </div>
                    ))}
                </div>

                {/* Current Card */}
                {currentCard && (
                    <motion.div 
                        key={`${currentCard.rank}-${currentCard.suit}`}
                        initial={{ scale: 0.8, opacity: 0, y: -20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        className="w-40 h-56 bg-white rounded-xl flex flex-col items-center justify-center relative shadow-[0_0_30px_rgba(255,255,255,0.1)] border-4 border-white"
                    >
                         <div className={`text-2xl absolute top-4 left-4 font-bold ${getCardColor(currentCard.suit)}`}>
                            {currentCard.rank}
                         </div>
                         <div className={`text-8xl ${getCardColor(currentCard.suit)}`}>
                            {getSuitSymbol(currentCard.suit)}
                         </div>
                         <div className={`text-2xl absolute bottom-4 right-4 rotate-180 font-bold ${getCardColor(currentCard.suit)}`}>
                            {currentCard.rank}
                         </div>
                    </motion.div>
                )}
            </div>

            {isPlaying && (
                <div className="flex justify-between items-center bg-black/30 p-4 rounded-lg border border-white/5">
                     <div className="text-gray-400 font-bold">Multiplier: <span className="text-green-400 text-xl">{multiplier.toFixed(2)}x</span></div>
                     <div className="text-gray-400 font-bold">Pout: <span className="text-green-400 text-xl">${(betAmount * multiplier).toFixed(2)}</span></div>
                </div>
            )}

             <AnimatePresence>
                {message && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }}
                        className="text-center font-bold text-lg text-white"
                    >
                        {message}
                    </motion.div>
                )}
             </AnimatePresence>

        </CardContent>
        <CardFooter className="flex flex-col gap-4">
             {!isPlaying ? (
                 <div className="flex w-full gap-4 items-end">
                     <div className="space-y-2 flex-1">
                        <label className="text-sm font-medium text-gray-400">Bet Amount</label>
                        <Input
                            type="number"
                            value={betAmount}
                            onChange={(e) => setBetAmount(Number(e.target.value))}
                            min={1}
                            className="bg-black/50 border-white/10 focus:border-blue-500/50 text-white"
                        />
                    </div>
                    <Button onClick={startGame} className="flex-1 h-10 w-full bg-blue-600 hover:bg-blue-700 font-bold text-lg">
                        <Play className="mr-2 h-4 w-4" /> Start Game
                    </Button>
                 </div>
             ) : (
                <div className="grid grid-cols-2 gap-4 w-full">
                    <Button onClick={() => guess("higher")} className="h-16 text-xl bg-gray-800 hover:bg-gray-700 border border-gray-600">
                        <ArrowUp className="mr-2 h-6 w-6" /> Higher
                    </Button>
                    <Button onClick={() => guess("lower")} className="h-16 text-xl bg-gray-800 hover:bg-gray-700 border border-gray-600">
                        <ArrowDown className="mr-2 h-6 w-6" /> Lower
                    </Button>
                    <Button onClick={cashOut} variant="outline" className="col-span-2 h-12 text-lg border-green-500 text-green-400 hover:bg-green-500/10">
                        Cash Out
                    </Button>
                </div>
             )}
        </CardFooter>
      </Card>
    </div>
  )
}
