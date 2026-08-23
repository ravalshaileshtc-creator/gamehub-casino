
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { GameType, Prisma } from '@prisma/client'

const GAME_LIST: GameType[] = ['SLOTS', 'ROULETTE', 'BLACKJACK', 'MINES', 'CRASH', 'DICE', 'COINFLIP', 'PLINKO', 'WHEEL', 'BACCARAT']

export async function GET() {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') return new NextResponse('Unauthorized', { status: 401 })

  try {
    // Ensure all games exist in DB
    const existingSettings = await prisma.gameSettings.findMany()
    const missingGames = GAME_LIST.filter(g => !existingSettings.find(s => s.game === g))

    if (missingGames.length > 0) {
      await prisma.gameSettings.createMany({
        data: missingGames.map(game => ({
          game,
          houseEdge: 2.0, // Default house edge
          isActive: true
        }))
      })
    }

    // Fetch settings and aggregating stats
    const settings = await prisma.gameSettings.findMany()

    // Aggregate bet stats per game
    const stats = await prisma.bet.groupBy({
      by: ['game'],
      _sum: {
        wager: true,
        payout: true
      }
    })

    const gamesPayload = settings.map(setting => {
      const gameStats = stats.find(s => s.game === setting.game)
      const totalWagered = gameStats?._sum.wager || 0
      const totalPayout = gameStats?._sum.payout || 0
      // Calculate actual RTP based on history, fallback to theoretical (100 - houseEdge)
      const actualRtp = totalWagered > 0 ? (totalPayout / totalWagered) * 100 : (100 - setting.houseEdge)

      return {
        id: setting.id,
        name: setting.game,
        enabled: setting.isActive,
        maintenance: !setting.isActive, // Mapping isActive=false to maintenance=true
        rtp: actualRtp,
        totalWagered,
        totalPayout,
        houseEdge: setting.houseEdge
      }
    })

    return NextResponse.json({ success: true, games: gamesPayload })
  } catch (error) {
    console.error('Games fetch error:', error)
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') return new NextResponse('Unauthorized', { status: 401 })

  const { gameId, field, value } = await req.json()

  try {
    const updateData: Prisma.GameSettingsUpdateInput = {}
    if (field === 'maintenance') {
      updateData.isActive = !value
    } else if (field === 'enabled') {
      updateData.isActive = value
    } else if (field === 'houseEdge') {
      updateData.houseEdge = parseFloat(value)
    } else {
      return NextResponse.json({ success: false, error: 'Invalid field' }, { status: 400 })
    }

    if (session.user?.id) {
      // Note: updateBy is not in schema but maybe meant to be tracked?
      // If it's not in schema,prisma will error. Let's check schema later.
      // For now, removing it if it's causing issues or keeping it if schema has it.
      // The original code had it.
    }

    await prisma.gameSettings.update({
      where: { id: gameId },
      data: updateData
    })

    // Log admin action
    await prisma.auditLog.create({
      data: {
        action: `GAME_UPDATE_${field.toUpperCase()}`,
        resource: 'GAME',
        resourceId: gameId,
        changes: { field, value } as Prisma.InputJsonValue,
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
        userId: session.user?.id || 'system',
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Game update error:', error)
    return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 })
  }
}


export const dynamic = "force-dynamic";
