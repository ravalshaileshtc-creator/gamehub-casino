import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export class AuditService {
  /**
   * Log an action to the database
   */
  static async log(params: {
    userId?: string
    action: string
    resource: string
    resourceId?: string
    details?: string
    changes?: Prisma.InputJsonValue
    ipAddress?: string
    userAgent?: string
  }) {
    try {
      await prisma.auditLog.create({
        data: {
          userId: params.userId,
          action: params.action,
          resource: params.resource,
          resourceId: params.resourceId,
          details: params.details,
          changes: params.changes ? JSON.parse(JSON.stringify(params.changes)) : undefined, // Ensure JSON safety
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        }
      })
    } catch (error) {
      console.error('Failed to create audit log:', error)
      // Do not throw, as logging failure should not stop the main action
    }
  }

  static async logDeposit(userId: string, resourceId: string, amount: number) {
    return this.log({
      userId,
      action: 'DEPOSIT',
      resource: 'DEPOSIT',
      resourceId,
      details: `Deposit of ${amount}`,
      changes: { amount }
    })
  }

  static async logWithdrawal(userId: string, resourceId: string, amount: number) {
    return this.log({
      userId,
      action: 'WITHDRAWAL',
      resource: 'WITHDRAWAL',
      resourceId,
      details: `Withdrawal of ${amount}`,
      changes: { amount }
    })
  }

  static async logAdminAction(adminId: string, action: string, targetUserId: string | undefined, details: unknown) {
    return this.log({
      userId: adminId,
      action: `ADMIN_${action}`,
      resource: 'USER',
      resourceId: targetUserId,
      details: JSON.stringify(details),
      changes: details as Prisma.InputJsonValue
    })
  }
}
