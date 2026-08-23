import { NextRequest, NextResponse } from 'next/server'
import { PaymentGatewayService } from '@/services/payment-gateway.service'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('x-razorpay-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    const parsedBody = JSON.parse(body)

    // Handle webhook
    await PaymentGatewayService.handleWebhook(parsedBody, signature)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({
      success: false,
      error: 'Webhook processing failed',
    }, { status: 500 })
  }
}
