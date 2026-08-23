import prisma from '@/lib/prisma'
import { DepositStatus, WithdrawalStatus, PaymentMethod } from '@prisma/client'
import { WalletService } from './wallet.service'
import { AuditService } from './audit.service'
import { NotificationService } from './notification.service'
import bcrypt from 'bcryptjs'

/**
 * Payment Service - Handles deposits and withdrawals
 */
export class PaymentService {
  /**
   * Create deposit request
   */
  static async createDeposit(params: {
    userId: string
    amount: number
    method: PaymentMethod
    upiId?: string
  }) {
    const { userId, amount, method, upiId } = params

    if (amount < 100) throw new Error('Minimum deposit is ₹100')
    if (amount > 100000) throw new Error('Maximum deposit is ₹1,00,000')

    const deposit = await prisma.deposit.create({
      data: {
        userId,
        amount,
        method,
        upiId,
        status: DepositStatus.PENDING,
      },
    })

    await AuditService.logDeposit(userId, deposit.id, amount)
    return deposit
  }

  /**
   * Complete deposit (called by webhook or admin approval)
   */
  static async completeDeposit(depositId: string) {
    const deposit = await prisma.deposit.findUnique({
      where: { id: depositId },
    })

    if (!deposit) throw new Error('Deposit not found')
    if (deposit.status === DepositStatus.COMPLETED) {
      throw new Error('Deposit already completed')
    }

    // 1. Credit wallet via WalletService (handles atomicity and logging)
    await WalletService.deposit(deposit.userId, deposit.amount, depositId)

    // 2. Update deposit status
    const updatedDeposit = await prisma.deposit.update({
      where: { id: depositId },
      data: {
        status: DepositStatus.COMPLETED,
        completedAt: new Date(),
      },
    })

    // 3. Post-transaction actions
    await NotificationService.notifyDeposit(deposit.userId, deposit.amount)

    // 4. Referral rewards
    const user = await prisma.user.findUnique({
      where: { id: deposit.userId },
      select: { referredBy: true },
    })

    if (user?.referredBy) {
      const depositsCount = await prisma.deposit.count({
        where: { userId: deposit.userId, status: DepositStatus.COMPLETED },
      })

      if (depositsCount === 1) {
        const { BonusService } = await import('./bonus.service')
        await BonusService.grantReferralBonus(user.referredBy, deposit.userId, 'FIRST_DEPOSIT')
      }
    }

    return updatedDeposit
  }

  /**
   * Create withdrawal request
   */
  static async createWithdrawal(params: {
    userId: string
    amount: number
    method: PaymentMethod
    otp: string
    bankName?: string
    accountNumber?: string
    ifscCode?: string
    upiId?: string
    cryptoAddress?: string
  }) {
    const { userId, amount, method, otp, ...bankDetails } = params

    if (amount < 500) throw new Error('Minimum withdrawal is ₹500')
    if (amount > 50000) throw new Error('Maximum withdrawal per request is ₹50,000')

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { transactionPassword: true, kycStatus: true },
    })

    if (!user) throw new Error('User not found')
    if (user.kycStatus !== 'APPROVED') throw new Error('KYC verification required for withdrawals')

    // Transaction Password Verification
    if (!user.transactionPassword) throw new Error('Please set a transaction password in settings first.')

    // Check if OTP (split by :) or Hashed Password (bcrypt usually starts with $2)
    // To maintain compatibility or just switch fully, let's switch fully.
    const isTxPasswordValid = await bcrypt.compare(otp, user.transactionPassword)
    if (!isTxPasswordValid) throw new Error('Invalid transaction password')

    const fee = Math.max(10, amount * 0.02)
    const finalAmount = amount - fee

    const withdrawal = await prisma.withdrawal.create({
      data: {
        userId,
        amount,
        fee,
        finalAmount,
        method,
        ...bankDetails,
        status: WithdrawalStatus.PENDING,
      },
    })

    try {
      // LOCK FUNDS IMMEDIATELY — moves amount from mainBalance → lockedBalance atomically
      await WalletService.lockForWithdrawal(userId, amount, withdrawal.id)

      // NOTE: transactionPassword is a permanent credential, NOT a one-time OTP.
      // It must NOT be cleared here; the user needs it for future withdrawals.

      await AuditService.logWithdrawal(userId, withdrawal.id, amount)
      return withdrawal
    } catch (error) {
      await prisma.withdrawal.delete({ where: { id: withdrawal.id } })
      throw error
    }
  }

  /**
   * Approve withdrawal (admin only)
   */
  static async approveWithdrawal(withdrawalId: string, adminId: string, notes?: string) {
    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
    })

    if (!withdrawal) throw new Error('Withdrawal not found')
    if (withdrawal.status !== WithdrawalStatus.PENDING) {
      throw new Error('Withdrawal already processed')
    }

    // 1. Deduct from locked balance permanently
    await WalletService.completeWithdrawalFromLocked(withdrawal.userId, withdrawal.amount, withdrawalId)

    // 2. Update record
    const updatedWithdrawal = await prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        status: WithdrawalStatus.APPROVED,
        approvedBy: adminId,
        approvedAt: new Date(),
        adminNotes: notes,
      },
    })

    // 3. Notifications & Audit
    await NotificationService.notifyWithdrawal(withdrawal.userId, withdrawal.finalAmount, 'APPROVED')
    await AuditService.logAdminAction(adminId, 'APPROVE_WITHDRAWAL', withdrawal.userId, { withdrawalId, amount: withdrawal.amount })

    return updatedWithdrawal
  }

  /**
   * Reject withdrawal (admin only)
   */
  static async rejectWithdrawal(withdrawalId: string, adminId: string, reason: string) {
    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
    })

    if (!withdrawal) throw new Error('Withdrawal not found')
    if (withdrawal.status !== WithdrawalStatus.PENDING) {
      throw new Error('Withdrawal already processed')
    }

    // 1. Refund funds to main balance
    await WalletService.refundWithdrawal(withdrawal.userId, withdrawal.amount, withdrawalId, reason)

    // 2. Update record
    const updatedWithdrawal = await prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        status: WithdrawalStatus.REJECTED,
        rejectedReason: reason,
        processedAt: new Date(),
      },
    })

    // 3. Notifications & Audit
    await NotificationService.notifyWithdrawal(withdrawal.userId, withdrawal.amount, 'REJECTED')
    await AuditService.logAdminAction(adminId, 'REJECT_WITHDRAWAL', withdrawal.userId, { withdrawalId, reason })

    return updatedWithdrawal
  }

  /**
   * Admin: Get Withdrawals
   */
  static async getWithdrawals(status?: WithdrawalStatus, limit: number = 50) {
    const where = status ? { status } : {}
    return await prisma.withdrawal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { name: true, email: true, kycStatus: true } },
      },
    })
  }

  /**
   * Admin: Bulk actions
   */
  static async processBulkWithdrawals(ids: string[], action: 'APPROVE' | 'REJECT', adminId: string, reason?: string) {
    const results = { success: 0, failed: 0, errors: [] as string[] }
    for (const id of ids) {
      try {
        if (action === 'APPROVE') await this.approveWithdrawal(id, adminId, reason)
        else await this.rejectWithdrawal(id, adminId, reason || 'Bulk rejection')
        results.success++
      } catch (e) {
        results.failed++
        results.errors.push(`ID ${id}: ${e instanceof Error ? e.message : String(e)}`)
      }
    }
    return results
  }

  /**
   * User: Withdrawal History
   */
  static async getWithdrawalHistory(userId: string) {
    return await prisma.withdrawal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
  }

  /**
   * User: Deposit History
   */
  static async getDepositHistory(userId: string) {
    return await prisma.deposit.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
  }
}
