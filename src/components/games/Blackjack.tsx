"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useBalance } from "@/context/BalanceContext"
import { createDeck, shuffleDeck, type Card as CardType, getCardColor, getSuitSymbol } from "@/lib/deck"
import { ShieldCheck } from "lucide-react"

export default function Blackjack() {
  const { balance, updateBalance } = useBalance()
  // Initialize deck lazily
  const [deck, setDeck] = useState<CardType[]>(() => shuffleDeck(createDeck()))
  const [betAmount, setBetAmount] = useState<number>(10)
  const [playerHand, setPlayerHand] = useState<CardType[]>([])
  const [dealerHand, setDealerHand] = useState<CardType[]>([])
  const [gameState, setGameState] = useState<"betting" | "playing" | "dealerTurn" | "gameOver">("betting")
  const [message, setMessage] = useState("")
  const [outcome, setOutcome] = useState<"win" | "lose" | "push" | null>(null)

  // Initialize deck

  const calculateHandValue = (hand: CardType[]) => {
    let value = 0
    let aces = 0
    hand.forEach(card => {
      value += card.value
      if (card.rank === 'A') aces += 1
    })
    while (value > 21 && aces > 0) {
      value -= 10
      aces -= 1
    }
    return value
  }

  const dealCard = (target: "player" | "dealer", currentDeck: CardType[] = deck) => {
    if (currentDeck.length === 0) return { card: null, newDeck: currentDeck }
    const newDeck = [...currentDeck]
    const card = newDeck.pop()!
    if (target === "player") setPlayerHand(prev => [...prev, card])
    if (target === "dealer") setDealerHand(prev => [...prev, card])
    setDeck(newDeck)
    return { card, newDeck }
  }

  const startGame = () => {
    if (betAmount > balance) return setMessage("Insufficient balance")
    if (isNaN(betAmount) || betAmount <= 0) return setMessage("Invalid bet")

    updateBalance(-betAmount)
    setGameState("playing")
    setMessage("")
    setOutcome(null)
    setPlayerHand([])
    setDealerHand([])

    const currentDeck = shuffleDeck(createDeck())
    // Deal initial cards: P, D, P, D
    const p1 = currentDeck.pop()!
    const d1 = currentDeck.pop()!
    const p2 = currentDeck.pop()!
    const d2 = currentDeck.pop()!

    setPlayerHand([p1, p2])
    setDealerHand([d1, d2])
    setDeck(currentDeck)

    // Check blackjack immediately
    const pValue = calculateHandValue([p1, p2])
    if (pValue === 21) {
       handleGameOver("blackjack", [d1, d2])
    }
  }

  const hit = () => {
    const { card } = dealCard("player")
    if (!card) return
    
    // Check bust
    const newValue = calculateHandValue([...playerHand, card])
    if (newValue > 21) {
      setGameState("gameOver")
      setOutcome("lose")
      setMessage("Bust! You lose.")
    }
  }

  const stand = () => {
    setGameState("dealerTurn")
    // Dealer plays logic
    let currentDealerHand = [...dealerHand]
    const currentDeck = [...deck]
    let dValue = calculateHandValue(currentDealerHand)

    const playDealer = async () => {
      while (dValue < 17) {
        await new Promise(r => setTimeout(r, 800)) // Delay for suspense
        const card = currentDeck.pop()!
        currentDealerHand = [...currentDealerHand, card]
        setDealerHand([...currentDealerHand])
        setDeck([...currentDeck])
        dValue = calculateHandValue(currentDealerHand)
      }
      handleGameOver("stand", currentDealerHand)
    }
    playDealer()
  }

  const handleGameOver = (trigger: "blackjack" | "stand", finalDealerHand: CardType[]) => {
    const pValue = calculateHandValue(playerHand)
    const dValue = calculateHandValue(finalDealerHand)

    setGameState("gameOver")

    if (trigger === "blackjack") {
        if (dValue === 21) {
             setOutcome("push")
             updateBalance(betAmount)
             setMessage("Push! Both have Blackjack.")
        } else {
            setOutcome("win")
            updateBalance(betAmount * 2.5) // 3:2 payout
            setMessage("Blackjack! You win 3:2 payout.")
        }
        return
    }

    if (dValue > 21) {
      setOutcome("win")
      updateBalance(betAmount * 2)
      setMessage("Dealer busts! You win.")
    } else if (pValue > dValue) {
      setOutcome("win")
      updateBalance(betAmount * 2)
      setMessage("You win!")
    } else if (pValue < dValue) {
      setOutcome("lose")
      setMessage("Dealer wins.")
    } else {
      setOutcome("push")
      updateBalance(betAmount)
      setMessage("Push!")
    }
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-2xl glass-card border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-green-400">
            <ShieldCheck className="h-6 w-6" /> Blackjack
          </CardTitle>
          <CardDescription className="text-gray-400">Beat the dealer to 21. Dealer stands on 17.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 min-h-[400px] flex flex-col justify-between">
          
          {/* Dealer Area */}
          <div className="flex flex-col items-center gap-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500">Dealer</h3>
            <div className="flex gap-2 h-32">
              {dealerHand.map((card, i) => (
                <PlayingCard 
                    key={i} 
                    card={card} 
                    hidden={gameState !== "gameOver" && gameState !== "dealerTurn" && i === 1} 
                />
              ))}
              {dealerHand.length === 0 && <div className="w-24 h-36 rounded-lg border-2 border-dashed border-white/10 bg-white/5" />}
            </div>
            {gameState !== "betting" && gameState !== "playing" && (
                 <div className="text-xl font-bold text-white">{calculateHandValue(dealerHand)}</div>
            )}
          </div>

          {/* Message Area */}
          <div className="h-16 flex items-center justify-center">
             <AnimatePresence>
                {message && (
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`px-6 py-2 rounded-full font-bold text-lg border ${outcome === "win" ? "bg-green-500/20 border-green-500 text-green-400" : outcome === "lose" ? "bg-red-500/20 border-red-500 text-red-400" : "bg-white/10 border-white text-white"}`}
                    >
                        {message}
                    </motion.div>
                )}
             </AnimatePresence>
          </div>

          {/* Player Area */}
          <div className="flex flex-col items-center gap-4">
             <div className="flex gap-2 h-32">
              {playerHand.map((card, i) => (
                <PlayingCard key={i} card={card} />
              ))}
              {playerHand.length === 0 && <div className="w-24 h-36 rounded-lg border-2 border-dashed border-white/10 bg-white/5" />}
            </div>
            {gameState !== "betting" && (
                 <div className="text-xl font-bold text-white">{calculateHandValue(playerHand)}</div>
            )}
             <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500">You</h3>
          </div>

        </CardContent>
        <CardFooter className="flex flex-col gap-4">
            {gameState === "betting" ? (
                 <div className="flex w-full gap-4 items-end">
                     <div className="space-y-2 flex-1">
                        <label className="text-sm font-medium text-gray-400">Bet Amount</label>
                        <Input
                            type="number"
                            value={betAmount}
                            onChange={(e) => setBetAmount(Number(e.target.value))}
                            min={1}
                            className="bg-black/50 border-white/10 focus:border-green-500/50 text-white"
                        />
                    </div>
                    <Button onClick={startGame} className="flex-1 h-10 w-full bg-green-600 hover:bg-green-700 font-bold text-lg">Deal</Button>
                 </div>
            ) : gameState === "playing" ? (
                <div className="flex gap-4 w-full">
                    <Button onClick={hit} variant="secondary" className="flex-1 h-12 text-lg font-bold">Hit</Button>
                    <Button onClick={stand} className="flex-1 h-12 text-lg font-bold bg-green-600 hover:bg-green-700">Stand</Button>
                </div>
            ) : (
                <Button onClick={() => setGameState("betting")} className="w-full h-12 text-lg font-bold bg-white text-black hover:bg-gray-200">Play Again</Button>
            )}
        </CardFooter>
      </Card>
    </div>
  )
}

function PlayingCard({ card, hidden = false }: { card: CardType, hidden?: boolean }) {
    return (
        <motion.div 
            initial={{ scale: 0.5, opacity: 0, rotateY: 180 }}
            animate={{ scale: 1, opacity: 1, rotateY: hidden ? 180 : 0 }}
            transition={{ type: "spring", damping: 15 }}
            className={`
                relative w-24 h-36 rounded-xl border-2 flex items-center justify-center text-3xl font-bold shadow-lg
                ${hidden 
                    ? "bg-linear-to-br from-blue-900 to-black border-blue-800 bg-[url('/card-back.png')] bg-cover" 
                    : "bg-white border-white text-gray-900"}
            `}
            style={{ transformStyle: "preserve-3d" }}
        >
            <div className={`absolute inset-0 backface-hidden flex flex-col items-center justify-center h-full w-full ${hidden ? "hidden" : "block"}`}>
                {!hidden && (
                    <>
                        <div className={`absolute top-2 left-2 text-lg ${getCardColor(card.suit)}`}>{card.rank}</div>
                        <div className={`text-6xl ${getCardColor(card.suit)}`}>{getSuitSymbol(card.suit)}</div>
                        <div className={`absolute bottom-2 right-2 text-lg rotate-180 ${getCardColor(card.suit)}`}>{card.rank}</div>
                    </>
                )}
            </div>
            {/* Back of card (visible when hidden is true due to rotateY) */}
             <div 
                className={`absolute inset-0 backface-hidden w-full h-full rounded-xl bg-linear-to-br from-indigo-600 to-blue-900 flex items-center justify-center border-2 border-indigo-400`}
                style={{ transform: "rotateY(180deg)" }}
            >
                <div className="w-16 h-24 border-2 border-white/20 rounded-lg" />
            </div>
        </motion.div>
    )
}
