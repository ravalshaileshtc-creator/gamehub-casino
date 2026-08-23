import { GameRound, generateFloorLayouts, sha256, DragonDifficulty, DRAGON_CONFIG } from './dragonTowerDb'
import crypto from 'crypto'

// Active server rounds cache
const activeRounds = new Map<string, GameRound>()
const userNonces = new Map<string, number>()

export function createRound(
  userId: string,
  betAmount: number,
  difficulty: DragonDifficulty,
  customClientSeed?: string
): { round: GameRound; secretLayouts: boolean[][] } {
  const roundId = `dt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
  
  // Provably Fair Cryptographic Seed Setup
  const serverSeed = crypto.randomBytes(32).toString('hex')
  const serverSeedHash = sha256(serverSeed)
  const clientSeed = customClientSeed && customClientSeed.trim() ? customClientSeed.trim() : crypto.randomBytes(16).toString('hex')
  
  const currentNonce = (userNonces.get(userId) || 0) + 1
  userNonces.set(userId, currentNonce)

  // Generate 10 Floor Layouts using HMAC-SHA256
  const secretLayouts = generateFloorLayouts(serverSeed, clientSeed, currentNonce, difficulty)
  const config = DRAGON_CONFIG[difficulty]

  const round: GameRound = {
    id: roundId,
    userId,
    betAmount,
    difficulty,
    serverSeed,
    serverSeedHash,
    clientSeed,
    nonce: currentNonce,
    currentFloor: 0,
    multiplier: 1.00,
    status: 'IN_PROGRESS',
    payout: 0,
    floorLayouts: secretLayouts,
    createdAt: new Date().toISOString()
  }

  activeRounds.set(roundId, round)
  return { round, secretLayouts }
}

export function getRound(roundId: string): GameRound | undefined {
  return activeRounds.get(roundId)
}

export function updateRound(round: GameRound): void {
  activeRounds.set(round.id, round)
}
