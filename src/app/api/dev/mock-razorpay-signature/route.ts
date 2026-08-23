import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

/**
 * POST /api/dev/mock-razorpay-signature
 * Generate a valid Razorpay signature for testing purposes
 * ONLY AVAILABLE IN DEVELOPMENT
 */
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { orderId, paymentId } = body

    if (!orderId || !paymentId) {
      return NextResponse.json({ error: 'Missing orderId or paymentId' }, { status: 400 })
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'mock_secret'
    // Fallback to 'mock_secret' in dev if env var is missing, matching the service logic

    if (!process.env.RAZORPAY_KEY_SECRET && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'RAZORPAY_KEY_SECRET not configured' }, { status: 500 })
    }

    const text = `${orderId}|${paymentId}`
    const signature = crypto
      .createHmac('sha256', keySecret)
      .update(text)
      .digest('hex')

    return NextResponse.json({
      success: true,
      signature
    })
  } catch (error) {
    console.error('Mock signature error:', error)
    return NextResponse.json(
      { error: (error instanceof Error ? error.message : 'An error occurred') || 'Failed to generate signature' },
      { status: 500 }
    )
  }
}
