import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getMultipliers, PlinkoRisk } from '@/lib/plinko'
import prisma from '@/lib/prisma'
import { ProvablyFairService } from '@/services/provably-fair.service'
import { GameType } from '@prisma/client'
import { plinkoBetSchema } from '@/lib/schemas/games'
import { IdempotencyService } from '@/services/idempotency.service'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Idempotency Check
    const idempotencyKey = req.headers.get('x-idempotency-key')
    if (idempotencyKey) {
      try {
        const lock = await IdempotencyService.lock(idempotencyKey, session.user.id, '/api/games/plinko/play', {})
        if (lock.status === 'COMPLETED') {
          return NextResponse.json(lock.response, { status: lock.statusCode })
        }
      } catch {
        return NextResponse.json({ error: 'Request already processing' }, { status: 409 })
      }
    }

    const body = await req.json()
    const validation = plinkoBetSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input', details: validation.error.format() }, { status: 400 })
    }

    const { wager, rows, risk, clientSeed: providedClientSeed } = validation.data

    const multipliers = getMultipliers(rows, risk as PlinkoRisk)

    // 2. Generate result (Provably Fair)
    const serverSeed = ProvablyFairService.generateServerSeed()
    // Validation: clientSeed
    const clientSeed = providedClientSeed || session.user.id
    const nonce = Date.now()
    const serverSeedHash = ProvablyFairService.hashServerSeed(serverSeed)

    const path = ProvablyFairService.calculatePlinkoPath(serverSeed, clientSeed, nonce, rows)

    // Calculate index (sum of rights)
    const index = path.reduce((a, b) => a + b, 0)

    // Safety check for index bounds
    const safeIndex = Math.max(0, Math.min(index, multipliers.length - 1))

    const multiplier = multipliers[safeIndex] || 0
    const payout = wager * multiplier
    const profit = payout - wager

    // 3. Database Transaction
    const result = await prisma.$transaction(async (tx) => {
      // Fetch User
      const user = await tx.user.findUnique({
        where: { id: session.user.id },
        select: { mainBalance: true, bonusBalance: true }
      })

      if (!user) throw new Error('User not found')

      const totalBalance = (user.mainBalance || 0) + (user.bonusBalance || 0)
      if (totalBalance < wager) throw new Error('Insufficient balance')

      // Deduct Wager
      let newMain = user.mainBalance
      let newBonus = user.bonusBalance
      let deductedMain = 0

      if (newMain >= wager) {
        newMain -= wager
        deductedMain = wager
      } else {
        deductedMain = newMain
        newMain = 0
        newBonus -= (wager - deductedMain)
      }

      // Add Payout (if any)
      // Usually payout goes to main balance? Or proportional?
      // Let's add to main balance for simplicity
      newMain += payout

      // Update User
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          mainBalance: newMain,
          bonusBalance: newBonus,
          totalWagered: { increment: wager }
        }
      })

      // Create Bet Record
      const bet = await tx.bet.create({
        data: {
          userId: session.user.id,
          game: GameType.PLINKO,
          wager,
          payout,
          multiplier,
          profit,
          isWin: payout > wager,
          serverSeed,
          serverSeedHash,
          clientSeed,
          nonce,
          result: { path, index: safeIndex, rows, risk }
        }
      })

      // Create Transaction Record (Bet)
      await tx.transaction.create({
        data: {
          userId: session.user.id,
          type: 'BET',
          amount: wager,
          balanceBefore: totalBalance,
          balanceAfter: totalBalance - wager, // Intermediate
          status: 'COMPLETED',
          description: `Plinko Bet (${rows} rows, ${risk})`,
          referenceId: bet.id
        }
      })

      // If win, Create Transaction Record (Win)
      if (payout > 0) {
        await tx.transaction.create({
          data: {
            userId: session.user.id,
            type: 'WIN',
            amount: payout,
            balanceBefore: totalBalance - wager,
            balanceAfter: (totalBalance - wager) + payout,
            status: 'COMPLETED',
            description: `Plinko Win (${multiplier}x)`,
            referenceId: bet.id
          }
        })
      }

      return { bet, newBalance: newMain + newBonus }
    })

    const responseBody = {
      success: true,
      result: {
        index: safeIndex,
        multiplier,
        payout,
        path,
        hash: serverSeedHash
      },
      newBalance: result.newBalance
    }

    // Save Idempotency Result
    if (idempotencyKey) {
      await IdempotencyService.complete(idempotencyKey, responseBody, 200)
    }

    return NextResponse.json(responseBody)


  } catch (error) {
    // Note: We don't save idempotency on 500 errors usually, or we save the error.
    // Saving error prevents retries. Not saving allows retry.
    // For 500, we allow retry.
    console.error("Plinko error:", error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
