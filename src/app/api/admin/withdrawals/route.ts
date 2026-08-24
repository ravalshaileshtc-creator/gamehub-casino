import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { WithdrawalStatus } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const statusParam = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    const whereClause: any = {}
    if (statusParam && statusParam !== 'ALL') {
      whereClause.status = statusParam as WithdrawalStatus
    }

    const withdrawals = await prisma.withdrawal.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            kycStatus: true,
          }
        }
      }
    })

    return NextResponse.json({ success: true, withdrawals })
  } catch (error) {
    console.error('Pending withdrawals error:', error)
    return NextResponse.json(
      { success: false, withdrawals: [], error: 'Failed to get withdrawals' },
      { status: 500 }
    )
  }
}

export const dynamic = "force-dynamic";
