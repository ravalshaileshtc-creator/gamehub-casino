import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { PaymentService } from '@/services/payment.service'
import { WithdrawalStatus } from '@prisma/client'

/**
 * GET /api/admin/withdrawals
 * Get pending withdrawals
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!admin || (admin.role !== 'ADMIN' && admin.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') as WithdrawalStatus | null
    const limit = parseInt(searchParams.get('limit') || '50')

    const withdrawals = await PaymentService.getWithdrawals(status || undefined, limit)

    return NextResponse.json({ success: true, withdrawals })
  } catch (error) {
    console.error('Pending withdrawals error:', error)
    return NextResponse.json(
      { error: (error instanceof Error ? error.message : 'An error occurred') || 'Failed to get withdrawals' },
      { status: 500 }
    )
  }
}


export const dynamic = "force-dynamic";
