
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  const session = await auth()

  if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. Total User Balances (Liabilities)
    const userBalances = await prisma.user.aggregate({
      _sum: {
        mainBalance: true,
        bonusBalance: true
      }
    })

    // 2. Total Deposits (Real Money In)
    const deposits = await prisma.transaction.aggregate({
      where: {
        type: 'DEPOSIT',
        status: 'COMPLETED'
      },
      _sum: {
        amount: true
      }
    })

    // 3. Total Withdrawals (Real Money Out)
    const withdrawals = await prisma.transaction.aggregate({
      where: {
        type: 'WITHDRAWAL',
        status: 'COMPLETED'
      },
      _sum: {
        amount: true
      }
    })

    // 4. Game Performance (Theoretical Profit)
    // Profit = Payout - Wager. 
    // If User wins, profit > 0. Platform loses.
    // If User loses, profit < 0. Platform wins.
    // So Platform Profit = -Sum(profit)
    const gameStats = await prisma.bet.aggregate({
      _sum: {
        profit: true,
        wager: true
      }
    })

    const totalLiability = userBalances._sum.mainBalance || 0
    const totalBonusLiability = userBalances._sum.bonusBalance || 0
    const totalDeposited = deposits._sum.amount || 0
    const totalWithdrawn = withdrawals._sum.amount || 0

    // Cash Flow Profit = (In - Out) - Current Liabilities (Solvency check)
    // If (In - Out) > Liabilities, we are solvent and profitable.
    const netCashFlow = totalDeposited - totalWithdrawn
    const solvency = netCashFlow - totalLiability

    const platformGameProfit = -(gameStats._sum.profit || 0)
    const totalWagered = gameStats._sum.wager || 0

    return NextResponse.json({
      success: true,
      stats: {
        totalLiability,
        totalBonusLiability,
        totalDeposited,
        totalWithdrawn,
        netCashFlow,
        solvency,
        platformGameProfit,
        totalWagered
      }
    })

  } catch (error) {
    console.error('Financial stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch financial stats' }, { status: 500 })
  }
}


export const dynamic = "force-dynamic";
