import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { PaymentGatewayService } from '@/services/payment-gateway.service'
import prisma from '@/lib/prisma'

const verifySchema = z.object({
  orderId: z.string(),
  paymentId: z.string(),
  signature: z.string(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { orderId, paymentId, signature } = verifySchema.parse(body)

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Process payment
    const deposit = await PaymentGatewayService.processSuccessfulPayment(
      orderId,
      paymentId,
      signature,
      user.id
    )

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      deposit: {
        id: deposit.id,
        amount: deposit.amount,
        status: deposit.status,
      },
    })
  } catch (error) {
    console.error('Verify payment error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to verify payment',
    }, { status: 500 })
  }
}
