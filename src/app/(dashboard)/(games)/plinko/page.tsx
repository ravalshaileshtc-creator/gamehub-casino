import PlinkoGame from "@/components/games/plinko/PlinkoGame"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Plinko | Mobile Game Hub",
  description: "Drop the ball through the pegs for up to 100x payout.",
}

export default function PlinkoPage() {
  return (
    <div className="h-full w-full overflow-hidden text-white select-none">
      <PlinkoGame />
    </div>
  )
}
