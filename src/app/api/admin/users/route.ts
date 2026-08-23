import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

/**
 * GET /api/admin/users
 * Get all users (admin only)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = parseInt(searchParams.get('skip') || '0')

    const users = await prisma.user.findMany({
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

    const totalCount = await prisma.user.count()

    return NextResponse.json({ success: true, users, totalCount })
  } catch (error) {
    console.error('Admin users error:', error)
    return NextResponse.json(
      { error: (error instanceof Error ? error.message : 'An error occurred') || 'Failed to get users' },
      { status: 500 }
    )
  }
}


export const dynamic = "force-dynamic";
