import Razorpay from 'razorpay'
import crypto from 'crypto'
import prisma from '@/lib/prisma'
import { WalletService } from './wallet.service'
import { AuditService } from './audit.service'

// Initialize Razorpay
let razorpay: Razorpay | null = null

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  })
  console.log('[Razorpay] Payment gateway initialized')
} else {
  console.warn('[Razorpay] Payment gateway not configured')
}

/**
 * Interface for Razorpay Webhook Payload
 */
interface RazorpayWebhookBody {
  event: string;
  payload: {
    payment: {
      entity: {
        id: string;
        order_id: string;
        notes: {
          userId: string;
        };
      };
    };
  };
}

export class PaymentGatewayService {
  /**
   * Create Razorpay order for deposit
   */
  static async createDepositOrder(userId: string, amount: number) {
    // In development, if Razorpay is not configured, create a mock order
    if (!razorpay) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Razorpay] Generating MOCK order (Dev Mode)')
        const mockOrderId = `order_mock_${Date.now()}`

        const deposit = await prisma.deposit.create({
          data: {
            userId,
            amount,
            method: 'RAZORPAY',
            status: 'PENDING',
            referenceId: mockOrderId,
          },
        })

        return {
          orderId: mockOrderId,
          amount: amount * 100,
          currency: 'INR',
          depositId: deposit.id,
        }
      }
      throw new Error('Payment gateway not configured')
    }

    if (amount < 100 || amount > 100000) {
      throw new Error('Amount must be between ₹100 and ₹100,000')
    }

    try {
      // Create Razorpay order
      const order = await razorpay.orders.create({
        amount: amount * 100, // Convert to paise
        currency: 'INR',
        receipt: `deposit_${userId}_${Date.now()}`,
        notes: {
          userId,
          type: 'deposit',
        },
      })

      // Store deposit request in database
      const deposit = await prisma.deposit.create({
        data: {
          userId,
          amount,
          method: 'RAZORPAY',
          status: 'PENDING',
          referenceId: order.id,
        },
      })

      return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        depositId: deposit.id,
      }
    } catch (error) {
      console.error('[Razorpay] Order creation error:', error)
      throw new Error('Failed to create payment order')
    }
  }

  /**
   * Verify Razorpay payment signature
   */
  static verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string
  ): boolean {
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    // In development, if secret is missing or we are using mock order, verify properly
    if (!keySecret) {
      if (process.env.NODE_ENV === 'development') {
        // If using mock secret logic
        // For now, if no key is present, we can't standard verify.
        // But if we are in dev, we might accept a "mock_signature" if we implemented that way.
        // However, the cleanest way is:
        console.warn('[Razorpay] Verifying with MOCK secret (Dev Mode)')
        const mockSecret = 'mock_secret'
        const text = `${orderId}|${paymentId}`
        const generatedSignature = crypto
          .createHmac('sha256', mockSecret)
          .update(text)
          .digest('hex')
        return generatedSignature === signature
      }
      throw new Error('Razorpay secret not configured')
    }

    const text = `${orderId}|${paymentId}`
    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(text)
      .digest('hex')

    return generatedSignature === signature
  }

  /**
   * Process successful payment
   */
  static async processSuccessfulPayment(
    orderId: string,
    paymentId: string,
    signature: string,
    userId: string
  ) {
    // Verify signature
    const isValid = this.verifyPaymentSignature(orderId, paymentId, signature)
    if (!isValid) {
      throw new Error('Invalid payment signature')
    }

    // Find deposit
    const deposit = await prisma.deposit.findFirst({
      where: {
        userId,
        referenceId: orderId,
        status: 'PENDING',
      },
    })

    if (!deposit) {
      throw new Error('Deposit not found')
    }

    // Update deposit status
    await prisma.deposit.update({
      where: { id: deposit.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    })

    // Credit wallet
    await WalletService.deposit(userId, deposit.amount, deposit.id)

    // Log the action
    await AuditService.log({
      userId,
      action: 'DEPOSIT_COMPLETED',
      resource: 'DEPOSIT',
      resourceId: deposit.id,
      details: `Razorpay deposit of ₹${deposit.amount}`,
    })

    return deposit
  }

  /**
   * Process failed payment
   */
  static async processFailedPayment(orderId: string, userId: string) {
    const deposit = await prisma.deposit.findFirst({
      where: {
        userId,
        referenceId: orderId,
        status: 'PENDING',
      },
    })

    if (deposit) {
      await prisma.deposit.update({
        where: { id: deposit.id },
        data: { status: 'FAILED' },
      })
    }
  }

  /**
   * Create payout for withdrawal
   */
  static async createPayout(withdrawalId: string) {
    if (!razorpay) {
      throw new Error('Payment gateway not configured')
    }

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      include: { user: true },
    })

    if (!withdrawal || withdrawal.status !== 'APPROVED') {
      throw new Error('Withdrawal not found or not approved')
    }

    try {
      // Create Razorpay payout (requires X plan)
      // For now, mark as processing - manual payouts
      await prisma.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: 'PROCESSING',
          approvedAt: new Date(),
        },
      })

      return {
        message: 'Withdrawal processing. Funds will be transferred within 24 hours.',
      }
    } catch (error) {
      console.error('[Razorpay] Payout error:', error)
      throw new Error('Failed to process payout')
    }
  }

  /**
   * Razorpay Webhook Body Interface
   */
  private static getWebhookPayload(body: unknown): RazorpayWebhookBody {
    return body as RazorpayWebhookBody;
  }

  /**
   * Handle Razorpay webhook
   */
  static async handleWebhook(body: unknown, signature: string) {
    // Verify webhook signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
    if (!webhookSecret) {
      throw new Error('Webhook secret not configured')
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(body))
      .digest('hex')

    if (expectedSignature !== signature) {
      throw new Error('Invalid webhook signature')
    }

    const webhookBody = this.getWebhookPayload(body)
    const event = webhookBody.event
    const payload = webhookBody.payload.payment.entity

    switch (event) {
      case 'payment.captured':
        // Payment successful
        await this.processSuccessfulPayment(
          payload.order_id,
          payload.id,
          '',
          payload.notes.userId
        )
        break

      case 'payment.failed':
        // Payment failed
        await this.processFailedPayment(payload.order_id, payload.notes.userId)
        break

      default:
        console.log('[Razorpay] Unhandled webhook event:', event)
    }

    return { success: true }
  }
}
