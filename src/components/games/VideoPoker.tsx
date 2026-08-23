"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useBalance } from "@/context/BalanceContext"
import { createDeck, shuffleDeck, type Card as CardType, getCardColor, getSuitSymbol } from "@/lib/deck"
import { Club } from "lucide-react"

export default function VideoPoker() {
  const { balance, updateBalance } = useBalance()
  const [betAmount, setBetAmount] = useState<number>(10)
  const [hand, setHand] = useState<CardType[]>([])
  const [heldIndices, setHeldIndices] = useState<number[]>([])
  const [deck, setDeck] = useState<CardType[]>([])
  const [gameState, setGameState] = useState<"idle" | "deal" | "draw">("idle")
  const [message, setMessage] = useState("")

  const startDeal = () => {
    if (betAmount > balance) return setMessage("Insufficient balance")
    if (isNaN(betAmount) || betAmount <= 0) return setMessage("Invalid bet")

    updateBalance(-betAmount)
    setMessage("")
    setGameState("deal")
    setHeldIndices([])
    
    const newDeck = shuffleDeck(createDeck())
    const newHand = newDeck.splice(0, 5)
    setDeck(newDeck)
    setHand(newHand)
  }

  const toggleHold = (index: number) => {
      if (gameState !== "deal") return
      if (heldIndices.includes(index)) {
          setHeldIndices(prev => prev.filter(i => i !== index))
      } else {
          setHeldIndices(prev => [...prev, index])
      }
  }

  const draw = () => {
      if (gameState !== "deal") return
      
      const newHand = [...hand]
      const currentDeck = [...deck]
      
      // Replace unheld cards
      for (let i = 0; i < 5; i++) {
          if (!heldIndices.includes(i)) {
              newHand[i] = currentDeck.pop()!
          }
      }
      
      setHand(newHand)
      setGameState("idle")
      
      const { rank, multiplier } = evaluateHand(newHand)
      if (multiplier > 0) {
          const win = betAmount * multiplier
          updateBalance(win)
          setMessage(`${rank}! Won ${win.toFixed(2)} (${multiplier}x)`)
      } else {
          setMessage(`Game Over. ${rank}`)
      }
  }

  // Basic Poker Evaluation
  const evaluateHand = (hand: CardType[]) => {
      // Sort by rank value (A=1 for sorting ease, but poker aces are high usually. Deck lib A=11 or 1?
      // Deck lib A=11 (Blackjack). Let's map values for poker: 2-10, J=11, Q=12, K=13, A=14
      const values = hand.map(c => {
          if (c.rank === 'A') return 14
          if (['J', 'Q', 'K'].includes(c.rank)) {
             if (c.rank === 'J') return 11
             if (c.rank === 'Q') return 12
             if (c.rank === 'K') return 13
          }
          return parseInt(c.rank as string)
      }).sort((a, b) => a - b)
      
      const suits = hand.map(c => c.suit)
      const isFlush = suits.every(s => s === suits[0])
      
      let isStraight = true
      for (let i = 0; i < 4; i++) {
          if (values[i] + 1 !== values[i+1]) {
              // Check Wheel (A, 2, 3, 4, 5) -> 14, 2, 3, 4, 5
              if (i === 3 && values[3] === 5 && values[4] === 14) {
                   // is straight 5-high
              } else {
                  isStraight = false
                  break
              }
          }
      }

      // Counts
      const counts: Record<number, number> = {}
      values.forEach(v => counts[v] = (counts[v] || 0) + 1)
      const countValues = Object.values(counts)
      
      if (isFlush && isStraight && values[0] === 10) return { rank: "Royal Flush", multiplier: 800 }
      if (isFlush && isStraight) return { rank: "Straight Flush", multiplier: 50 }
      if (countValues.includes(4)) return { rank: "Four of a Kind", multiplier: 25 }
      if (countValues.includes(3) && countValues.includes(2)) return { rank: "Full House", multiplier: 9 }
      if (isFlush) return { rank: "Flush", multiplier: 6 }
      if (isStraight) return { rank: "Straight", multiplier: 4 }
      if (countValues.includes(3)) return { rank: "Three of a Kind", multiplier: 3 }
      if (countValues.filter(c => c === 2).length === 2) return { rank: "Two Pair", multiplier: 2 }
      if (countValues.includes(2)) {
          // Jacks or Better check
          const pairVal = Number(Object.keys(counts).find(k => counts[Number(k)] === 2))
          if (pairVal >= 11) return { rank: "Jacks or Better", multiplier: 1 }
      }
      
      return { rank: "High Card", multiplier: 0 }
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-4xl glass-card border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-indigo-400">
            <Club className="h-6 w-6" /> Jacks or Better
          </CardTitle>
          <CardDescription className="text-gray-400">Classic Video Poker. Hold cards and draw.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 min-h-[300px]">
            
            <div className="flex justify-center gap-2 md:gap-4 h-40 md:h-56">
                {hand.length > 0 ? hand.map((card, i) => (
                    <div key={i} className="relative group cursor-pointer" onClick={() => toggleHold(i)}>
                        <div className={`
                            w-16 md:w-32 h-24 md:h-48 rounded-xl bg-white border-4 flex flex-col items-center justify-center select-none transition-transform
                            ${heldIndices.includes(i) ? "border-yellow-400 -translate-y-4 shadow-[0_0_20px_rgba(250,204,21,0.4)]" : "border-transparent hover:border-white/20"}
                        `}>
                             <div className={`text-xl md:text-3xl font-bold ${getCardColor(card.suit)}`}>{card.rank}</div>
                             <div className={`text-4xl md:text-6xl ${getCardColor(card.suit)}`}>{getSuitSymbol(card.suit)}</div>
                        </div>
                        {heldIndices.includes(i) && (
                            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-yellow-400 font-bold uppercase tracking-widest text-sm">
                                HELD
                            </div>
                        )}
                    </div>
                )) : (
                     <div className="flex items-center justify-center w-full text-gray-500 font-mono">Press DEAL to start</div>
                )}
            </div>

            {message && <div className="text-center text-xl font-bold text-indigo-300 animate-pulse">{message}</div>}

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
                        className="bg-black/50 border-white/10 focus:border-indigo-500/50 text-white"
                        disabled={gameState !== "idle"}
                    />
                </div>
                {gameState === "idle" ? (
                    <Button onClick={startDeal} className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 font-bold text-lg">
                        DEAL
                    </Button>
                ) : (
                    <Button onClick={draw} className="flex-1 h-12 bg-yellow-600 hover:bg-yellow-700 font-bold text-lg text-black">
                        DRAW
                    </Button>
                )}
            </div>
        </CardFooter>
      </Card>
    </div>
  )
}
