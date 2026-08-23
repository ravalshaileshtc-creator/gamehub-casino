"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useBalance } from "@/context/BalanceContext"
import { createDeck, shuffleDeck, type Card as CardType, getCardColor, getSuitSymbol } from "@/lib/deck"
import { Crown } from "lucide-react"

export default function Baccarat() {
  const { balance, updateBalance } = useBalance()
  const [betAmount, setBetAmount] = useState<number>(10)
  const [selectedBet, setSelectedBet] = useState<"player" | "banker" | "tie">("player")
  const [playerHand, setPlayerHand] = useState<CardType[]>([])
  const [bankerHand, setBankerHand] = useState<CardType[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [message, setMessage] = useState("")

  const getHandValue = (hand: CardType[]) => {
      let sum = 0
      hand.forEach(c => {
          let val = c.value
          if (val >= 10) val = 0 // 10, J, Q, K are 0
          if (c.rank === 'A') val = 1
          sum += val
      })
      return sum % 10
  }

  const playGame = async () => {
     if (betAmount > balance) return setMessage("Insufficient balance")
     if (isNaN(betAmount) || betAmount <= 0) return setMessage("Invalid bet")

     updateBalance(-betAmount)
     setIsPlaying(true)
     setMessage("")
     setPlayerHand([])
     setBankerHand([])

     const deck = shuffleDeck(createDeck())
     
     // Initial Deal
     const p1 = deck.pop()!
     const b1 = deck.pop()!
     const p2 = deck.pop()!
     const b2 = deck.pop()!
     
     const pHand = [p1, p2]
     const bHand = [b1, b2]
     
     setPlayerHand(pHand)
     setBankerHand(bHand)

     await new Promise(r => setTimeout(r, 1000))

     let pScore = getHandValue(pHand)
     let bScore = getHandValue(bHand)

     // Natural win check
     if (pScore >= 8 || bScore >= 8) {
         finishGame(pScore, bScore)
         return
     }

     const currentPHand = [...pHand]
     const currentBHand = [...bHand]

     // Third card rules simplified for demo (Player hits 0-5)
     // Player draws
     if (pScore <= 5) {
         const p3 = deck.pop()!
         currentPHand.push(p3)
         setPlayerHand([...currentPHand])
         // Recalculate pScore for banker logic if needed, but for now we just wait
         await new Promise(r => setTimeout(r, 800))
     }

     // Banker draws (simplified logic for now)
     // Recalculate scores after player's potential third card
     pScore = getHandValue(currentPHand)
     bScore = getHandValue(currentBHand)

     if (bScore <= 5) {
         const b3 = deck.pop()!
         currentBHand.push(b3)
         setBankerHand([...currentBHand])
         await new Promise(r => setTimeout(r, 800))
     }

     finishGame(getHandValue(currentPHand), getHandValue(currentBHand))
  }

  const finishGame = (pScore: number, bScore: number) => {
      setIsPlaying(false)
      let winner: "player" | "banker" | "tie" = "tie"
      if (pScore > bScore) winner = "player"
      else if (bScore > pScore) winner = "banker"

      let payout = 0
      if (selectedBet === winner) {
          if (winner === "tie") payout = betAmount * 9
          else if (winner === "player") payout = betAmount * 2
          else payout = betAmount * 1.95 // 5% commission
      } else if (winner === "tie" && selectedBet !== "tie") {
          payout = betAmount // Push on tie for non-tie bets (standard baccarat pushes? Yes often returned)
      }

      if (payout > 0) {
          updateBalance(payout)
          setMessage(`Win! ${winner.toUpperCase()} wins.`)
      } else {
          setMessage(`${winner.toUpperCase()} wins. You lose.`)
      }
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-2xl glass-card border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-yellow-600">
            <Crown className="h-6 w-6" /> Baccarat
          </CardTitle>
          <CardDescription className="text-gray-400">Player vs Banker. Closest to 9 wins.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 min-h-[400px]">
            
            <div className="flex justify-between items-center px-4 md:px-12 bg-green-900/20 rounded-xl py-8 border border-green-900/50">
                {/* Player */}
                <div className="flex flex-col items-center gap-4">
                    <h3 className="text-blue-400 font-bold uppercase tracking-widest">Player</h3>
                    <div className="flex -space-x-12">
                        {playerHand.map((c, i) => <SmallCard key={i} card={c} index={i} />)}
                        {playerHand.length === 0 && <div className="w-16 h-24 border-2 border-dashed border-white/10 rounded bg-white/5" />}
                    </div>
                    {playerHand.length > 0 && <div className="text-2xl font-bold text-white">{getHandValue(playerHand)}</div>}
                </div>

                <div className="h-24 w-px bg-white/10 mx-4"></div>

                {/* Banker */}
                <div className="flex flex-col items-center gap-4">
                    <h3 className="text-red-400 font-bold uppercase tracking-widest">Banker</h3>
                    <div className="flex -space-x-12">
                        {bankerHand.map((c, i) => <SmallCard key={i} card={c} index={i} />)}
                        {bankerHand.length === 0 && <div className="w-16 h-24 border-2 border-dashed border-white/10 rounded bg-white/5" />}
                    </div>
                    {bankerHand.length > 0 && <div className="text-2xl font-bold text-white">{getHandValue(bankerHand)}</div>}
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <Button 
                    variant={selectedBet === "player" ? "default" : "outline"}
                    onClick={() => setSelectedBet("player")}
                    className={`h-16 text-lg border-blue-500/50 ${selectedBet === "player" ? "bg-blue-600 hover:bg-blue-700" : "text-blue-400 hover:bg-blue-900/20"}`}
                >
                    PLAYER (1:1)
                </Button>
                <Button 
                    variant={selectedBet === "tie" ? "default" : "outline"}
                    onClick={() => setSelectedBet("tie")}
                     className={`h-16 text-lg border-green-500/50 ${selectedBet === "tie" ? "bg-green-600 hover:bg-green-700" : "text-green-400 hover:bg-green-900/20"}`}
                >
                    TIE (8:1)
                </Button>
                <Button 
                    variant={selectedBet === "banker" ? "default" : "outline"}
                    onClick={() => setSelectedBet("banker")}
                     className={`h-16 text-lg border-red-500/50 ${selectedBet === "banker" ? "bg-red-600 hover:bg-red-700" : "text-red-400 hover:bg-red-900/20"}`}
                >
                    BANKER (0.95:1)
                </Button>
            </div>

            {message && <div className="text-center text-xl font-bold text-white animate-fade-in">{message}</div>}

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
                        disabled={isPlaying}
                    />
                </div>
                <Button onClick={playGame} disabled={isPlaying} className="flex-1 h-10 w-full bg-yellow-600 hover:bg-yellow-700 font-bold text-lg text-black">
                    Deal
                </Button>
            </div>
        </CardFooter>
      </Card>
    </div>
  )
}

function SmallCard({ card, index }: { card: CardType, index: number }) {
    return (
        <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: index * 0.2 }}
            className={`w-16 h-24 rounded-lg bg-white border border-gray-200 flex flex-col items-center justify-center shadow-lg relative z-${index}`}
        >
             <div className={`text-lg font-bold ${getCardColor(card.suit)}`}>{card.rank}</div>
             <div className={`text-2xl ${getCardColor(card.suit)}`}>{getSuitSymbol(card.suit)}</div>
        </motion.div>
    )
}
