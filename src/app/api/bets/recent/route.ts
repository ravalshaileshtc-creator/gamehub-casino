import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma, { fastDbQuery } from '@/lib/prisma'

const MOCK_RECENT_BETS = [
  { id: '1', user: 'Da***e', game: 'PLINKO', wager: '50.00', multiplier: '10.00', payout: '500.00', profit: 450.00, isWin: true, won: true, createdAt: new Date(Date.now() - 60000).toISOString() },
  { id: '2', user: 'Al***a', game: 'SLOTS', wager: '25.00', multiplier: '50.00', payout: '1250.00', profit: 1225.00, isWin: true, won: true, createdAt: new Date(Date.now() - 120000).toISOString() },
  { id: '3', user: 'Ro***t', game: 'CRASH', wager: '100.00', multiplier: '2.40', payout: '240.00', profit: 140.00, isWin: true, won: true, createdAt: new Date(Date.now() - 180000).toISOString() },
  { id: '4', user: 'Mi***l', game: 'MINES', wager: '10.00', multiplier: '0.00', payout: '0.00', profit: -10.00, isWin: false, won: false, createdAt: new Date(Date.now() - 240000).toISOString() },
  { id: '5', user: 'Sa***h', game: 'ROULETTE', wager: '200.00', multiplier: '2.00', payout: '400.00', profit: 200.00, isWin: true, won: true, createdAt: new Date(Date.now() - 300000).toISOString() },
  { id: '6', user: 'Jo***n', game: 'COINFLIP', wager: '75.00', multiplier: '1.95', payout: '146.25', profit: 71.25, isWin: true, won: true, createdAt: new Date(Date.now() - 360000).toISOString() },
  { id: '7', user: 'Em***a', game: 'DICE', wager: '30.00', multiplier: '2.00', payout: '60.00', profit: 30.00, isWin: true, won: true, createdAt: new Date(Date.now() - 420000).toISOString() }
]

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const userSpecific = searchParams.get('user') === 'true'

    if (session?.user?.id && userSpecific) {
      const userBets = await fastDbQuery(
        () => prisma.bet.findMany({
          where: { userId: session.user.id },
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            game: true,
            wager: true,
            multiplier: true,
            payout: true,
            profit: true,
            isWin: true,
            createdAt: true,
          }
        }),
        []
      )
      if (userBets.length > 0) return NextResponse.json({ success: true, bets: userBets })
    }

    const allBets = await fastDbQuery(
      () => prisma.bet.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      []
    )

    if (allBets.length > 0) {
      const formattedBets = allBets.map(b => ({
        id: b.id,
        user: 'Pl***r',
        game: b.game,
        wager: b.wager.toFixed(2),
        multiplier: b.multiplier.toFixed(2),
        payout: b.payout.toFixed(2),
        profit: b.profit,
        isWin: b.isWin,
        won: b.isWin,
        createdAt: b.createdAt.toISOString()
      }))
      return NextResponse.json({ success: true, bets: formattedBets })
    }

    return NextResponse.json({ success: true, bets: MOCK_RECENT_BETS.slice(0, limit) })
  } catch (e) {
    return NextResponse.json({ success: true, bets: MOCK_RECENT_BETS })
  }
}
