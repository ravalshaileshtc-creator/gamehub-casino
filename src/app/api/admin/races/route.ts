
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, prizePool, startTime, endTime, status } = await req.json()

    if (!title || !prizePool || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const race = await prisma.race.create({
      data: {
        title,
        prizePool: parseFloat(prizePool),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: status || 'UPCOMING'
      }
    })

    return NextResponse.json({ success: true, race })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'An error occurred'
    console.error('Create Race Error:', error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const races = await prisma.race.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ success: true, races })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch races' }, { status: 500 })
  }
}


export const dynamic = "force-dynamic";
