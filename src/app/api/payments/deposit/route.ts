import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { PaymentService } from '@/services/payment.service'
import { PaymentMethod } from '@prisma/client'

/**
 * POST /api/payments/deposit
 * Create deposit request
 */
export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { amount, method, upiId } = body

    if (!amount || !method) {
      return NextResponse.json(
        { error: 'Amount and method are required' },
        { status: 400 }
      )
    }

    if (!Object.values(PaymentMethod).includes(method)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
    }

    const deposit = await PaymentService.createDeposit({
      userId: session.user.id,
      amount,
      method,
      upiId,
    })

    return NextResponse.json({
      success: true,
      deposit,
      message: 'Deposit request created. Please complete payment.',
    })
  } catch (error) {
    console.error('Deposit error:', error)
    return NextResponse.json(
      { error: (error instanceof Error ? error.message : 'An error occurred') || 'Failed to create deposit' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/payments/deposit
 * Get deposit history
 */
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const deposits = await PaymentService.getDepositHistory(session.user.id)

    return NextResponse.json({ success: true, deposits })
  } catch (error) {
    console.error('Deposit history error:', error)
    return NextResponse.json(
      { error: (error instanceof Error ? error.message : 'An error occurred') || 'Failed to get deposits' },
      { status: 500 }
    )
  }
}


export const dynamic = "force-dynamic";
