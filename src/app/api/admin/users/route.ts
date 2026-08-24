import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = parseInt(searchParams.get('skip') || '0')
    const query = searchParams.get('q') || ''

    const whereClause: any = {}
    if (query) {
      whereClause.OR = [
        { email: { contains: query, mode: 'insensitive' } },
        { name: { contains: query, mode: 'insensitive' } }
      ]
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        mainBalance: true,
        bonusBalance: true,
        vipLevel: true,
        totalWagered: true,
        kycStatus: true,
        isBanned: true,
        createdAt: true,
        lastLogin: true,
      },
    })

    const totalCount = await prisma.user.count({ where: whereClause })

    return NextResponse.json({ success: true, users, totalCount })
  } catch (error) {
    console.error('Admin users error:', error)
    return NextResponse.json(
      { success: false, users: [], totalCount: 0, error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export const dynamic = "force-dynamic";
