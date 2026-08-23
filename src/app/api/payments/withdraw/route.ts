import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { PaymentService } from '@/services/payment.service'
import { withdrawalSchema } from '@/lib/schemas/wallet'
import { IdempotencyService } from '@/services/idempotency.service'

/**
 * POST /api/payments/withdraw
 * Create withdrawal request
 */
export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Idempotency Check
    const idempotencyKey = req.headers.get('x-idempotency-key')
    if (idempotencyKey) {
      try {
        const lock = await IdempotencyService.lock(idempotencyKey, session.user.id, '/api/payments/withdraw', {})
        if (lock.status === 'COMPLETED') {
          return NextResponse.json(lock.response, { status: lock.statusCode })
        }
      } catch {
        return NextResponse.json({ error: 'Request already processing' }, { status: 409 })
      }
    }

    const body = await req.json()
    const validation = withdrawalSchema.safeParse({
      amount: body.amount,
      method: body.method,
      details: {
        bankName: body.bankName,
        accountNumber: body.accountNumber,
        ifscCode: body.ifscCode,
        upiId: body.upiId,
        cryptoAddress: body.cryptoAddress,
      }
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.format() },
        { status: 400 }
      )
    }

    if (!body.otp) {
      return NextResponse.json({ error: 'OTP is required' }, { status: 400 })
    }

    const { amount, method, details } = validation.data

    const withdrawal = await PaymentService.createWithdrawal({
      userId: session.user.id,
      amount,
      method,
      otp: body.otp,
      bankName: details.bankName,
      accountNumber: details.accountNumber,
      ifscCode: details.ifscCode,
      upiId: details.upiId,
      cryptoAddress: details.cryptoAddress,
    })

    const responseBody = {
      success: true,
      withdrawal,
      message: 'Withdrawal request submitted for approval',
    }

    if (idempotencyKey) {
      await IdempotencyService.complete(idempotencyKey, responseBody, 200)
    }

    return NextResponse.json(responseBody)
  } catch (error) {
    console.error('Withdrawal error:', error)
    return NextResponse.json(
      { error: (error instanceof Error ? error.message : 'An error occurred') || 'Failed to create withdrawal' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/payments/withdraw
 * Get withdrawal history
 */
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const withdrawals = await PaymentService.getWithdrawalHistory(session.user.id)

    return NextResponse.json({ success: true, withdrawals })
  } catch (error) {
    console.error('Withdrawal history error:', error)
    return NextResponse.json(
      { error: (error instanceof Error ? error.message : 'An error occurred') || 'Failed to get withdrawals' },
      { status: 500 }
    )
  }
}


export const dynamic = "force-dynamic";
