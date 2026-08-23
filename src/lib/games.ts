import {
  Coins,
  Dices,
  RefreshCw,
  Bomb,
  ShieldCheck,
  Disc,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  Grid,
  Zap,
  Rocket,
  Crown,
  Club,
  Trophy,
  Sparkles
} from "lucide-react"

export const GAMES = [
  {
    title: "Plinko",
    description: "Physics ball peg drop. Target the edge buckets for max 100x payout.",
    icon: ArrowDown,
    href: "/plinko",
    color: "text-pink-500",
    gradient: "from-pink-500/20 to-pink-600/5",
    category: "Ball Games"
  },
  {
    title: "3D Sphere Lottery",
    description: "Animated 3D glass sphere tumbler with pneumatic tube suction reveal & ticket system.",
    icon: Sparkles,
    href: "/lottery",
    color: "text-amber-400",
    gradient: "from-amber-500/20 to-orange-600/5",
    category: "Ball Games"
  },
  {
    title: "Penalty Shootout",
    description: "Shoot the football into 6 target goal zones vs the keeper for up to 4.8x payout.",
    icon: Trophy,
    href: "/penalty",
    color: "text-emerald-400",
    gradient: "from-emerald-500/20 to-teal-600/5",
    category: "Ball Games"
  },
  {
    title: "Roulette Ball",
    description: "3D European wheel ball spin. Predict Red/Black, Even/Odd, or exact numbers.",
    icon: Disc,
    href: "/roulette",
    color: "text-red-500",
    gradient: "from-red-500/20 to-red-600/5",
    category: "Ball Games"
  },
  {
    title: "Slots",
    description: "Spin 3 reels. Match 777s, bells, or cherries for up to 25x multiplier.",
    icon: RefreshCw,
    href: "/slots",
    color: "text-purple-400",
    gradient: "from-purple-400/20 to-purple-600/5",
    category: "Casino"
  },
  {
    title: "Crash",
    description: "Multiplier rises to infinity. Cash out before the crash to secure your gains.",
    icon: TrendingUp,
    href: "/crash",
    color: "text-orange-500",
    gradient: "from-orange-500/20 to-orange-600/5",
    category: "Live"
  },
  {
    title: "Mines",
    description: "Grid of 25 tiles. Reveal gems to increase your multiplier, but don't hit a mine!",
    icon: Bomb,
    href: "/mines",
    color: "text-red-400",
    gradient: "from-red-400/20 to-red-600/5",
    category: "Casual"
  },
  {
    title: "Coin Flip",
    description: "Heads or Tails? 50/50 3D flip. Win 1.95x payout instantly.",
    icon: Coins,
    href: "/coinflip",
    color: "text-yellow-400",
    gradient: "from-yellow-400/20 to-yellow-600/5",
    category: "Casual"
  },
  {
    title: "Dice Roll",
    description: "Predict High (4-6) or Low (1-3) with 3D rolling dice. Target 1-99.",
    icon: Dices,
    href: "/dice",
    color: "text-blue-400",
    gradient: "from-blue-400/20 to-blue-600/5",
    category: "Casual"
  }
]
