import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { PaymentGatewayService } from '@/services/payment-gateway.service'
import prisma from '@/lib/prisma'

const createOrderSchema = z.object({
  amount: z.number().min(100).max(100000),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { amount } = createOrderSchema.parse(body)

    if (!prisma) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create Razorpay order
    const order = await PaymentGatewayService.createDepositOrder(user.id, amount)

    return NextResponse.json({
      success: true,
      order,
    })
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create order',
    }, { status: 500 })
  }
}
