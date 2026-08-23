import prisma from '@/lib/prisma'
import { GameType, Prisma } from '@prisma/client'

/**
 * Initialize default game settings on first run
 * This would typically be run once during deployment
 */
export async function initializeGameSettings() {
  const games = [
    { game: 'DICE', houseEdge: 2.0, minBet: 1, maxBet: 10000, maxProfit: 100000 },
    { game: 'COINFLIP', houseEdge: 2.0, minBet: 1, maxBet: 10000, maxProfit: 100000 },
    { game: 'ROULETTE', houseEdge: 2.7, minBet: 1, maxBet: 5000, maxProfit: 50000 },
    { game: 'CRASH', houseEdge: 3.0, minBet: 1, maxBet: 5000, maxProfit: 50000 },
    { game: 'MINES', houseEdge: 2.5, minBet: 1, maxBet: 3000, maxProfit: 30000 },
    { game: 'SLOTS', houseEdge: 5.0, minBet: 1, maxBet: 1000, maxProfit: 20000 },
  ]

  for (const gameConfig of games) {
    await prisma.gameSettings.upsert({
      where: { game: gameConfig.game as GameType },
      update: { ...gameConfig, game: gameConfig.game as GameType },
      create: { ...gameConfig, isActive: true } as Prisma.GameSettingsCreateInput,
    })
  }

  console.log('Game settings initialized')
}

/**
 * Initialize system settings
 */
export async function initializeSystemSettings() {
  const settings = [
    {
      key: 'MIN_DEPOSIT',
      value: 100,
      description: 'Minimum deposit amount in ₹',
    },
    {
      key: 'MAX_DEPOSIT',
      value: 100000,
      description: 'Maximum deposit amount in ₹',
    },
    {
      key: 'MIN_WITHDRAWAL',
      value: 500,
      description: 'Minimum withdrawal amount in ₹',
    },
    {
      key: 'MAX_WITHDRAWAL',
      value: 50000,
      description: 'Maximum withdrawal amount per request in ₹',
    },
    {
      key: 'WITHDRAWAL_FEE_PERCENT',
      value: 2,
      description: 'Withdrawal fee percentage',
    },
    {
      key: 'MIN_WITHDRAWAL_FEE',
      value: 10,
      description: 'Minimum withdrawal fee in ₹',
    },
    {
      key: 'SIGNUP_BONUS',
      value: 100,
      description: 'Signup bonus amount in ₹',
    },
    {
      key: 'DAILY_REWARD',
      value: 10,
      description: 'Daily reward amount in ₹',
    },
  ]

  for (const setting of settings) {
    await prisma.systemSettings.upsert({
      where: { key: setting.key },
      update: { value: setting.value, description: setting.description },
      create: setting,
    })
  }

  console.log('System settings initialized')
}

/**
 * Run all initializations
 */
export async function runInitializations() {
  await initializeGameSettings()
  await initializeSystemSettings()
}
