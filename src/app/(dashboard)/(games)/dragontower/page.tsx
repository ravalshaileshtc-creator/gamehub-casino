import DragonTowerGame from "@/components/games/dragontower/DragonTowerGame"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dragon Tower | Mobile Game Hub",
  description: "Climb the 9-level Dragon Tower. Step on dragon eggs to multiply winnings up to 239,440x.",
}

export default function DragonTowerPage() {
  return (
    <div className="h-full w-full overflow-hidden text-white select-none">
      <DragonTowerGame />
    </div>
  )
}
