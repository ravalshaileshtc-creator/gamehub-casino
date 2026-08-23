import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { NotificationService } from '@/services/notification.service'

/**
 * GET /api/notifications
 * Get user notifications
 */
export async function GET(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = parseInt(searchParams.get('skip') || '0')

    const notifications = await NotificationService.getNotifications(
      session.user.id,
      limit,
      skip
    )

    const unreadCount = await NotificationService.getUnreadCount(session.user.id)

    return NextResponse.json({ success: true, notifications, unreadCount })
  } catch (error) {
    console.error('Notifications error:', error)
    return NextResponse.json(
      { error: (error instanceof Error ? error.message : 'An error occurred') || 'Failed to get notifications' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/notifications
 * Mark all as read
 */
export async function PUT() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await NotificationService.markAllAsRead(session.user.id)

    return NextResponse.json({ success: true, message: 'All notifications marked as read' })
  } catch (error) {
    console.error('Mark read error:', error)
    return NextResponse.json(
      { error: (error instanceof Error ? error.message : 'An error occurred') || 'Failed to mark notifications as read' },
      { status: 500 }
    )
  }
}


export const dynamic = "force-dynamic";
