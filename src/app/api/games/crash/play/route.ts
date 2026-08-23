import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { GameType } from '@prisma/client'
import { ProvablyFairService } from '@/services/provably-fair.service'
import { AuditService } from '@/services/audit.service'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { betAmount, clientSeed: providedClientSeed } = await req.json()

    if (!betAmount || betAmount <= 0) {
      return NextResponse.json({ error: 'Invalid bet amount' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { mainBalance: true, bonusBalance: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const totalBalance = (user.mainBalance || 0) + (user.bonusBalance || 0)

    if (totalBalance < betAmount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    }

    // Provably Fair Logic
    const serverSeed = ProvablyFairService.generateServerSeed()
    // In a real system, clientSeed should be provided by the user. 
    // Fallback to user ID if not provided (not ideal but better than nothing for now)
    const clientSeed = providedClientSeed || session.user.id
    const nonce = Date.now()

    // Hash the server seed to show to the user (commitment)
    const serverSeedHash = ProvablyFairService.hashServerSeed(serverSeed)

    // Calculate Crash Point using Service
    const crashPoint = ProvablyFairService.calculateCrashPoint(serverSeed, clientSeed, nonce)

    // Database Transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Deduct Balance
      // Priority: Deduct from Main Balance first, then Bonus
      let newMainBalance = user.mainBalance
      let newBonusBalance = user.bonusBalance
      let deductFromMain = 0
      let deductFromBonus = 0

      if (user.mainBalance >= betAmount) {
        newMainBalance -= betAmount
        deductFromMain = betAmount
      } else {
        deductFromMain = user.mainBalance
        newMainBalance = 0
        deductFromBonus = betAmount - deductFromMain
        newBonusBalance -= deductFromBonus
      }

      await tx.user.update({
        where: { id: session.user.id },
        data: {
          mainBalance: newMainBalance,
          bonusBalance: newBonusBalance,
          totalWagered: { increment: betAmount }
        }
      })

      // 2. Create Transaction Record
      await tx.transaction.create({
        data: {
          userId: session.user.id,
          type: 'BET',
          amount: betAmount,
          balanceBefore: totalBalance,
          balanceAfter: totalBalance - betAmount,
          status: 'COMPLETED',
          description: `Bet on Crash`,
          referenceId: `game_crash_${Date.now()}` // Temporary Ref
        }
      })

      // 3. Create Bet Record (Status: Pending/Loss initially, updated on cashout or crash)
      // Since we need to know if they WON or LOST, and currently we don't have a separate "Game Session" table,
      // we will store it as a PENDING bet or a LOST bet depending on how we handle the flow.
      // If we simply return the crashPoint, strictly speaking the result is determined.
      // But we want to allow "Cashout". 
      // Strategy: Mark as LOST initially (safe default). If they cashout, update to WIN.
      // If they don't cashout, it remains LOST.

      const bet = await tx.bet.create({
        data: {
          userId: session.user.id,
          game: GameType.CRASH,
          wager: betAmount,
          payout: 0,
          multiplier: 0,
          profit: -betAmount,
          isWin: false, // Default to loss until cashed out
          serverSeed,
          serverSeedHash,
          clientSeed,
          nonce,
          result: { crashPoint } // Store the determined crash point
        }
      })

      return { bet, newBalance: totalBalance - betAmount }
    })

    // Audit Log (Fire and forget)
    AuditService.log({
      userId: session.user.id,
      action: 'BET_PLACED',
      resource: 'BET',
      resourceId: result.bet.id,
      details: `Crash Bet: ${betAmount}`,
      changes: { amount: betAmount, game: 'CRASH' }
    })

    return NextResponse.json({
      success: true,
      gameId: result.bet.id,
      crashPoint, // Identifying this is secure for MVP
      hash: serverSeedHash,
      newBalance: result.newBalance
    })

  } catch (error) {
    console.error('Crash play error:', error)
    return NextResponse.json({ error: (error instanceof Error ? error.message : 'An error occurred') || 'Game init failed' }, { status: 500 })
  }
}
