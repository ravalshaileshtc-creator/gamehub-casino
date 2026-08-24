
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { GameType, Prisma } from '@prisma/client'
import { db } from '@/lib/firebase'
import { doc, setDoc } from 'firebase/firestore'

const GAME_LIST: GameType[] = ['SLOTS', 'ROULETTE', 'BLACKJACK', 'MINES', 'CRASH', 'DICE', 'COINFLIP', 'PLINKO', 'WHEEL', 'BACCARAT']

export async function GET() {
  try {
    // Ensure all games exist in DB
    const existingSettings = await prisma.gameSettings.findMany()
    const missingGames = GAME_LIST.filter(g => !existingSettings.find(s => s.game === g))

    if (missingGames.length > 0) {
      await prisma.gameSettings.createMany({
        data: missingGames.map(game => ({
          game,
          houseEdge: 2.0,
          isActive: true,
          minBet: 1,
          maxBet: 10000
        }))
      })
    }

    const settings = await prisma.gameSettings.findMany()
    const stats = await prisma.bet.groupBy({
      by: ['game'],
      _sum: { wager: true, payout: true }
    })

    const gamesPayload = settings.map(setting => {
      const gameStats = stats.find(s => s.game === setting.game)
      const totalWagered = gameStats?._sum.wager || 0
      const totalPayout = gameStats?._sum.payout || 0
      const actualRtp = totalWagered > 0 ? (totalPayout / totalWagered) * 100 : (100 - setting.houseEdge)

      return {
        id: setting.id,
        name: setting.game,
        enabled: setting.isActive,
        maintenance: !setting.isActive,
        rtp: actualRtp,
        totalWagered,
        totalPayout,
        houseEdge: setting.houseEdge,
        minBet: setting.minBet || 1,
        maxBet: setting.maxBet || 10000
      }
    })

    return NextResponse.json({ success: true, games: gamesPayload })
  } catch (error) {
    console.error('Games fetch error:', error)
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const { gameId, gameName, field, value, mode, forcedTarget, houseEdge, minBet, maxBet } = await req.json()

    // 1. Sync to Firebase Firestore admin_settings/<gameKey>
    const gameKey = (gameName || gameId || 'general').toString().toLowerCase().replace(/[^a-z0-9]/g, '')
    if (gameKey) {
      try {
        const firestoreRef = doc(db, 'admin_settings', gameKey)
        await setDoc(firestoreRef, {
          mode: mode || 'AUTO',
          forcedTarget: forcedTarget !== undefined ? forcedTarget : 0,
          houseEdge: houseEdge !== undefined ? parseFloat(houseEdge) : 2.0,
          minBet: minBet !== undefined ? parseFloat(minBet) : 1,
          maxBet: maxBet !== undefined ? parseFloat(maxBet) : 10000,
          enabled: field === 'enabled' ? Boolean(value) : field === 'maintenance' ? !value : true,
          updatedAt: new Date().toISOString()
        }, { merge: true })
      } catch (e) {
        console.warn('Firebase Admin Settings Sync:', e)
      }
    }

    // 2. Update PostgreSQL Prisma DB GameSettings if gameId exists
    if (gameId) {
      const updateData: Prisma.GameSettingsUpdateInput = {}
      if (field === 'maintenance') {
        updateData.isActive = !value
      } else if (field === 'enabled') {
        updateData.isActive = value
      } else if (field === 'houseEdge') {
        updateData.houseEdge = parseFloat(value)
      } else if (field === 'minBet') {
        updateData.minBet = parseFloat(value)
      } else if (field === 'maxBet') {
        updateData.maxBet = parseFloat(value)
      }

      if (houseEdge !== undefined) updateData.houseEdge = parseFloat(houseEdge)
      if (minBet !== undefined) updateData.minBet = parseFloat(minBet)
      if (maxBet !== undefined) updateData.maxBet = parseFloat(maxBet)

      await prisma.gameSettings.updateMany({
        where: { OR: [{ id: gameId }, { game: gameName as GameType }] },
        data: updateData
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Game update error:', error)
    return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 })
  }
}

export const dynamic = "force-dynamic";
