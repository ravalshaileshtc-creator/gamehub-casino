import prisma from '@/lib/prisma'
import { NotificationType, Prisma } from '@prisma/client'

/**
 * Notification Service - Handles real-time and persistent notifications
 */

export class NotificationService {
  /**
   * Create notification
   */
  static async create(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: Prisma.InputJsonValue
  ) {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data,
      },
    })

    // TODO: Emit WebSocket event to user
    // socketService.emitToUser(userId, 'notification', notification)

    return notification
  }

  /**
   * Notify deposit success
   */
  static async notifyDeposit(userId: string, amount: number) {
    return this.create(
      userId,
      NotificationType.DEPOSIT,
      'Deposit Successful',
      `₹${amount} has been added to your wallet`,
      { amount }
    )
  }

  /**
   * Notify withdrawal status
   */
  static async notifyWithdrawal(
    userId: string,
    amount: number,
    status: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED'
  ) {
    const messages = {
      PENDING: 'Your withdrawal request is being processed',
      APPROVED: 'Your withdrawal has been approved',
      COMPLETED: `₹${amount} has been transferred to your account`,
      REJECTED: 'Your withdrawal request has been rejected',
    }

    return this.create(
      userId,
      NotificationType.WITHDRAWAL,
      `Withdrawal ${status}`,
      messages[status],
      { amount, status }
    )
  }

  /**
   * Notify big win
   */
  static async notifyBigWin(userId: string, game: string, amount: number, multiplier: number) {
    if (amount >= 1000) { // Only notify for big wins
      return this.create(
        userId,
        NotificationType.BET_WIN,
        'Big Win! 🎉',
        `You won ₹${amount} with ${multiplier}x multiplier on ${game}!`,
        { game, amount, multiplier }
      )
    }
  }

  /**
   * Notify bonus received
   */
  static async notifyBonus(userId: string, bonusType: string, amount: number) {
    return this.create(
      userId,
      NotificationType.BONUS,
      'Bonus Received! 🎁',
      `You received ₹${amount} ${bonusType} bonus`,
      { bonusType, amount }
    )
  }

  /**
   * Notify VIP level up
   */
  static async notifyLevelUp(userId: string, newLevel: string) {
    return this.create(
      userId,
      NotificationType.LEVEL_UP,
      `VIP Level Up! 🌟`,
      `Congratulations! You are now ${newLevel} level`,
      { newLevel }
    )
  }

  /**
   * Get user notifications
   */
  static async getNotifications(userId: string, limit: number = 20, skip: number = 0) {
    return await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    })
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string) {
    return await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    })
  }

  /**
   * Mark all as read
   */
  static async markAllAsRead(userId: string) {
    return await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    })
  }

  /**
   * Get unread count
   */
  static async getUnreadCount(userId: string) {
    return await prisma.notification.count({
      where: { userId, isRead: false },
    })
  }
}
