import crypto from 'crypto'

export type DragonDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EXTREME'

export interface DifficultyConfig {
  name: DragonDifficulty
  label: string
  badgeColor: string
  totalTiles: number // Always 5 tiles per floor
  safeTiles: number
  dragonTiles: number
  winChance: number // Percentage (e.g. 80, 60, 40, 20)
  multipliers: number[] // Calculated with 5% house edge across 10 floors
}

// 5% House Edge calculation helper
function calculateMultipliers(safeTiles: number, totalTiles: number = 5, floors: number = 10, houseEdge: number = 0.05): number[] {
  const pWinPerFloor = safeTiles / totalTiles
  const multipliers: number[] = []
  
  for (let k = 1; k <= floors; k++) {
    const cumProb = Math.pow(pWinPerFloor, k)
    const fairMult = 1 / cumProb
    const finalMult = +(fairMult * (1 - houseEdge)).toFixed(2)
    multipliers.push(finalMult)
  }
  return multipliers
}

export const DRAGON_CONFIG: Record<DragonDifficulty, DifficultyConfig> = {
  EASY: {
    name: 'EASY',
    label: '🟢 Easy (80% Win)',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    totalTiles: 5,
    safeTiles: 4,
    dragonTiles: 1,
    winChance: 80,
    multipliers: calculateMultipliers(4, 5) // [1.18, 1.48, 1.85, 2.31, 2.89, 3.62, 4.53, 5.66, 7.07, 8.84]
  },
  MEDIUM: {
    name: 'MEDIUM',
    label: '🟡 Medium (60% Win)',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    totalTiles: 5,
    safeTiles: 3,
    dragonTiles: 2,
    winChance: 60,
    multipliers: calculateMultipliers(3, 5) // [1.58, 2.63, 4.39, 7.33, 12.21, 20.36, 33.93, 56.56, 94.26, 157.11]
  },
  HARD: {
    name: 'HARD',
    label: '🔴 Hard (40% Win)',
    badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
    totalTiles: 5,
    safeTiles: 2,
    dragonTiles: 3,
    winChance: 40,
    multipliers: calculateMultipliers(2, 5) // [2.37, 5.93, 14.84, 37.10, 92.77, 231.93, 579.83, 1449.58, 3623.96, 9059.90]
  },
  EXTREME: {
    name: 'EXTREME',
    label: '🔥 Extreme (20% Win)',
    badgeColor: 'bg-purple-500/20 text-[#d0bcff] border-purple-500/40',
    totalTiles: 5,
    safeTiles: 1,
    dragonTiles: 4,
    winChance: 20,
    multipliers: calculateMultipliers(1, 5) // [4.75, 23.75, 118.75, 593.75, 2968.75, 14843.75, 74218.75, ...]
  }
}

export interface GameRound {
  id: string
  userId: string
  betAmount: number
  difficulty: DragonDifficulty
  serverSeed: string
  serverSeedHash: string
  clientSeed: string
  nonce: number
  currentFloor: number // 0 = not started, 1 to 10
  multiplier: number
  status: 'IN_PROGRESS' | 'CASHED_OUT' | 'BUSTED'
  payout: number
  floorLayouts: boolean[][] // 10 rows x 5 tiles: true = SAFE (Egg 🥚), false = DRAGON (Skull 💀)
  createdAt: string
}

export interface GameMove {
  id: string
  roundId: string
  floor: number // 1-indexed
  selectedTile: number // 0-indexed (0 to 4)
  result: 'SAFE' | 'DRAGON'
  createdAt: string
}

// Provably Fair Randomness Generator: HMAC-SHA256
export function generateFloorLayouts(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  difficulty: DragonDifficulty
): boolean[][] {
  const cfg = DRAGON_CONFIG[difficulty]
  const TOTAL_FLOORS = 10
  const TOTAL_TILES = 5
  const layouts: boolean[][] = []

  for (let floor = 0; floor < TOTAL_FLOORS; floor++) {
    // Generate HMAC-SHA256 hash for this floor
    const hmac = crypto.createHmac('sha256', serverSeed)
    hmac.update(`${clientSeed}:${nonce}:${floor}`)
    const hash = hmac.digest('hex')

    // Take first 8 hex characters as 32-bit unsigned int
    const subHash = hash.substring(0, 8)
    const val = parseInt(subHash, 16)
    const floatRand = val / 0xffffffff

    // Build floor layout: 5 tiles, exact count of safe vs dragon tiles
    const floorTiles: boolean[] = Array(cfg.safeTiles).fill(true).concat(Array(cfg.dragonTiles).fill(false))

    // Deterministic Fisher-Yates shuffle seeded by floatRand
    let currentSeed = floatRand
    for (let i = floorTiles.length - 1; i > 0; i--) {
      currentSeed = (currentSeed * 9301 + 49297) % 233280
      const j = Math.floor((currentSeed / 233280) * (i + 1))
      const temp = floorTiles[i]
      floorTiles[i] = floorTiles[j]
      floorTiles[j] = temp
    }

    layouts.push(floorTiles)
  }

  return layouts
}

// SHA256 helper for public server seed hash
export function sha256(str: string): string {
  return crypto.createHash('sha256').update(str).digest('hex')
}
