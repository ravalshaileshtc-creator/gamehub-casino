import prisma from '@/lib/prisma'
import { GameType, Prisma } from '@prisma/client'
import { WalletService } from './wallet.service'
import { ProvablyFairService } from './provably-fair.service'
import { getMultipliers, PlinkoRisk } from '@/lib/plinko'

/**
 * Betting Service - Handles bet placement and resolution
 * Works with WalletService and ProvablyFairService
 */

interface DiceConfig { target: number; isOver: boolean }
interface CoinFlipConfig { choice: 'HEADS' | 'TAILS' }
interface RouletteConfig { bet: { type: 'number' | 'color'; value: number | string } }
interface CrashConfig { cashoutAt: number }
interface MinesConfig { mines: number; selections: number[] }
interface PlinkoConfig { rows: number; risk: PlinkoRisk }

type GameConfig = DiceConfig | CoinFlipConfig | RouletteConfig | CrashConfig | MinesConfig | PlinkoConfig

interface PlaceBetParams {
  userId: string
  game: GameType
  wager: number
  clientSeed?: string
  gameConfig?: GameConfig
}

interface BetResult {
  betId: string
  wager: number
  payout: number
  multiplier: number
  profit: number
  isWin: boolean
  result: Prisma.InputJsonValue
  serverSeed: string
  clientSeed: string
  nonce: number
  newBalance: number
}

export class BettingService {
  /**
   * Place a bet - main entry point for all games
   */
  static async placeBet(params: PlaceBetParams): Promise<BetResult> {
    const { userId, game, wager, clientSeed, gameConfig } = params

    // 1. Validate bet amount
    await this.validateBet(userId, game, wager)

    // 2. Get user's current nonce
    // 2. Increment user nonce (Atomic Operation)
    const user = await prisma.user.update({
      where: { id: userId },
      data: { nonce: { increment: 1 } },
      select: { id: true, nonce: true },
    })

    if (!user) throw new Error('User not found')

    // Use previous nonce (0-based index)
    const nonce = user.nonce - 1

    // 3. Generate provably fair seeds
    const serverSeed = ProvablyFairService.generateServerSeed()
    const serverSeedHash = ProvablyFairService.hashServerSeed(serverSeed)
    const finalClientSeed = clientSeed || ProvablyFairService.generateClientSeed()

    // 4. Lock balance
    await WalletService.lockBalance(userId, wager, {
      game,
      nonce,
      serverSeedHash,
    })

    try {
      // 5. Calculate game outcome
      const { multiplier, result } = await this.calculateOutcome(
        game,
        serverSeed,
        finalClientSeed,
        nonce,
        gameConfig
      )

      const isWin = multiplier > 0
      const payout = isWin ? wager * multiplier : 0
      const profit = payout - wager

      // 6. Create bet record
      const bet = await prisma.bet.create({
        data: {
          userId,
          game,
          wager,
          payout,
          multiplier,
          profit,
          serverSeed,
          serverSeedHash,
          clientSeed: finalClientSeed,
          nonce,
          result,
          isWin,
        },
      })

      // 7. Release locked balance and credit winnings
      const walletResult = await WalletService.releaseAndCredit(
        userId,
        wager,
        payout,
        { betId: bet.id }
      )

      // 8. Update total wagered for VIP system
      await this.updateTotalWagered(userId, wager)

      // 9. Check and update VIP level
      await this.checkVIPLevelUp(userId)

      // 10. Process wagering requirements for bonuses
      await this.processWageringRequirements(userId, wager)

      return {
        betId: bet.id,
        wager,
        payout,
        multiplier,
        profit,
        isWin,
        result,
        serverSeed,
        clientSeed: finalClientSeed,
        nonce,
        newBalance: walletResult.newMainBalance,
      }
    } catch (error) {
      // If anything fails, release the locked balance back to user
      await WalletService.releaseAndCredit(userId, wager, wager, {
        error: 'Bet failed - refunded',
      })
      throw error
    }
  }

  /**
   * Validate bet according to game settings
   */
  private static async validateBet(userId: string, game: GameType, wager: number) {
    // Check game settings
    const settings = await prisma.gameSettings.findUnique({
      where: { game },
    })

    if (!settings) {
      throw new Error('Game settings not found')
    }

    if (!settings.isActive) {
      throw new Error('Game is currently disabled')
    }

    if (wager < settings.minBet) {
      throw new Error(`Minimum bet is ${settings.minBet}`)
    }

    if (wager > settings.maxBet) {
      throw new Error(`Maximum bet is ${settings.maxBet}`)
    }

    // Check user balance
    const wallet = await WalletService.getWallet(userId)
    if (wallet.mainBalance + wallet.bonusBalance < wager) {
      throw new Error('Insufficient balance')
    }
  }

  /**
   * Calculate game outcome based on game type
   */
  private static async calculateOutcome(
    game: GameType,
    serverSeed: string,
    clientSeed: string,
    nonce: number,
    gameConfig?: GameConfig
  ): Promise<{ multiplier: number; result: Prisma.InputJsonValue }> {
    const outcome = ProvablyFairService.generateOutcome(serverSeed, clientSeed, nonce)

    switch (game) {
      case GameType.DICE:
        return this.calculateDiceOutcome(outcome, gameConfig as DiceConfig)

      case GameType.COINFLIP:
        return this.calculateCoinFlipOutcome(outcome, gameConfig as CoinFlipConfig)

      case GameType.ROULETTE:
        return this.calculateRouletteOutcome(outcome, gameConfig as RouletteConfig)

      case GameType.CRASH:
        return this.calculateCrashOutcome(outcome, gameConfig as CrashConfig)

      case GameType.MINES:
        return this.calculateMinesOutcome(serverSeed, clientSeed, nonce, gameConfig as MinesConfig)

      case GameType.SLOTS:
        return this.calculateSlotsOutcome(serverSeed, clientSeed, nonce)

      case GameType.PLINKO:
        return this.calculatePlinkoOutcome(serverSeed, clientSeed, nonce, gameConfig as PlinkoConfig)

      default:
        throw new Error(`Game ${game} not implemented`)
    }
  }

  private static calculatePlinkoOutcome(
    serverSeed: string,
    clientSeed: string,
    nonce: number,
    config?: PlinkoConfig
  ) {
    const rows = config?.rows || 16
    const risk = config?.risk || 'MEDIUM'

    const bucketIndex = ProvablyFairService.outcomeToPlinko(serverSeed, clientSeed, nonce, rows)
    const multipliers = getMultipliers(rows, risk)
    const multiplier = multipliers[bucketIndex] || 0

    return {
      multiplier,
      result: { bucketIndex, rows, risk },
    }
  }

  private static calculateDiceOutcome(outcome: number, config?: DiceConfig) {
    const roll = ProvablyFairService.outcomeToDice(outcome)
    const target = config?.target ?? 50
    const isOver = config?.isOver ?? true

    const isWin = isOver ? roll > target : roll < target
    const winChance = isOver ? (100 - target) / 100 : target / 100
    const multiplier = isWin ? (0.98 / winChance) : 0 // 2% house edge

    return {
      multiplier,
      result: { roll, target, isOver, isWin },
    }
  }

  private static calculateCoinFlipOutcome(outcome: number, config?: CoinFlipConfig) {
    const result = ProvablyFairService.outcomeToCoinFlip(outcome)
    const choice = config?.choice || 'HEADS'
    const isWin = result === choice
    const multiplier = isWin ? 1.98 : 0 // 2% house edge

    return {
      multiplier,
      result: { flip: result, choice, isWin },
    }
  }

  private static calculateRouletteOutcome(outcome: number, config?: RouletteConfig) {
    const number = ProvablyFairService.outcomeToRoulette(outcome)
    const bet = config?.bet || { type: 'number', value: 0 }

    let isWin = false
    let payout = 0

    // Simplified roulette logic
    if (bet.type === 'number') {
      isWin = number === bet.value
      payout = isWin ? 35 : 0
    } else if (bet.type === 'color') {
      const isRed = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(number)
      isWin = (bet.value === 'red' && isRed) || (bet.value === 'black' && !isRed && number !== 0)
      payout = isWin ? 1.96 : 0
    }

    return {
      multiplier: payout,
      result: { number, bet, isWin },
    }
  }

  private static calculateCrashOutcome(outcome: number, config?: CrashConfig) {
    const crashPoint = ProvablyFairService.outcomeToCrashMultiplier(outcome)
    const cashoutAt = config?.cashoutAt || 2.0

    const isWin = crashPoint >= cashoutAt
    const multiplier = isWin ? cashoutAt * 0.98 : 0

    return {
      multiplier,
      result: { crashPoint, cashoutAt, isWin },
    }
  }

  private static calculateMinesOutcome(
    serverSeed: string,
    clientSeed: string,
    nonce: number,
    config?: MinesConfig
  ) {
    const mineCount = config?.mines || 3
    const selections = config?.selections || []

    const minePositions = ProvablyFairService.outcomeToMines(serverSeed, clientSeed, nonce, mineCount)

    const hitMine = selections.some((s: number) => minePositions.includes(s))
    const multiplier = hitMine ? 0 : this.calculateMinesMultiplier(mineCount, selections.length)

    return {
      multiplier,
      result: { minePositions, selections, hitMine },
    }
  }

  private static calculateMinesMultiplier(mineCount: number, revealed: number): number {
    // Simplified multiplier calculation
    const safe = 25 - mineCount
    let mult = 1
    for (let i = 0; i < revealed; i++) {
      mult *= (25 / (safe - i)) * 0.98
    }
    return mult
  }

  private static calculateSlotsOutcome(serverSeed: string, clientSeed: string, nonce: number) {
    const reels = ProvablyFairService.outcomeToSlots(serverSeed, clientSeed, nonce)
    const [r1, r2, r3] = reels

    let multiplier = 0

    // Three of a kind
    if (r1 === r2 && r2 === r3) {
      multiplier = (r1 + 1) * 10 // Higher symbols pay more
    }
    // Two of a kind
    else if (r1 === r2 || r2 === r3 || r1 === r3) {
      multiplier = 2
    }

    return {
      multiplier,
      result: { reels, isWin: multiplier > 0 },
    }
  }

  private static async updateTotalWagered(userId: string, amount: number) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        totalWagered: { increment: amount },
      },
    })
  }

  private static async checkVIPLevelUp(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { totalWagered: true, vipLevel: true },
    })

    if (!user) return

    const newLevel =
      user.totalWagered >= 1000000 ? 'DIAMOND' :
        user.totalWagered >= 500000 ? 'PLATINUM' :
          user.totalWagered >= 100000 ? 'GOLD' :
            user.totalWagered >= 10000 ? 'SILVER' : 'BRONZE'

    if (newLevel !== user.vipLevel) {
      await prisma.user.update({
        where: { id: userId },
        data: { vipLevel: newLevel },
      })
    }
  }

  private static async processWageringRequirements(userId: string, amount: number) {
    const activeBonuses = await prisma.userBonus.findMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
    })

    for (const bonus of activeBonuses) {
      const newCompleted = bonus.wagerCompleted + amount

      if (newCompleted >= bonus.wagerRequired) {
        // Bonus wagering complete
        await prisma.userBonus.update({
          where: { id: bonus.id },
          data: {
            wagerCompleted: bonus.wagerRequired,
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        })
      } else {
        await prisma.userBonus.update({
          where: { id: bonus.id },
          data: {
            wagerCompleted: newCompleted,
          },
        })
      }
    }
  }

  /**
   * Get bet history
   */
  static async getBetHistory(userId: string, limit: number = 50, skip: number = 0) {
    return await prisma.bet.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    })
  }

  /**
   * Get live bets feed (all users)
   */
  static async getLiveBets(limit: number = 30) {
    return await prisma.bet.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    })
  }
}
