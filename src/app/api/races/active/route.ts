import { NextResponse } from 'next/server'
import prisma, { fastDbQuery } from '@/lib/prisma'

const MOCK_RACE = {
  active: true,
  race: {
    id: 'race-1',
    title: '⚡ $10,000 Daily Wager Race',
    description: 'Wager on any game to climb the leaderboard!',
    prizePool: 10000.0,
    startTime: new Date(Date.now() - 3600000).toISOString(),
    endTime: new Date(Date.now() + 82800000).toISOString(),
    status: 'ACTIVE'
  },
  leaderboard: [
    { _id: 'u1', totalWagered: 12450.0, user: { name: 'CryptoKing', image: null, vipLevel: 'DIAMOND' } },
    { _id: 'u2', totalWagered: 8900.0, user: { name: 'VegasHighRoller', image: null, vipLevel: 'PLATINUM' } },
    { _id: 'u3', totalWagered: 5400.0, user: { name: 'LuckyWhale', image: null, vipLevel: 'GOLD' } },
    { _id: 'u4', totalWagered: 3200.0, user: { name: 'SpinMaster', image: null, vipLevel: 'SILVER' } },
    { _id: 'u5', totalWagered: 1800.0, user: { name: 'DemoPlayer', image: null, vipLevel: 'GOLD' } }
  ]
}

export async function GET() {
  const activeRace = await fastDbQuery(
    () => prisma.race.findFirst({
      where: {
        status: 'ACTIVE',
        startTime: { lte: new Date() },
        endTime: { gte: new Date() }
      }
    }),
    null
  )

  if (activeRace) {
    return NextResponse.json({
      active: true,
      race: activeRace,
      leaderboard: MOCK_RACE.leaderboard
    })
  }

  return NextResponse.json(MOCK_RACE)
}

export const dynamic = "force-dynamic";
