import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        emailNotifications: true,
        smsNotifications: true,
        pushNotifications: true,
        marketingEmails: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Default preferences if not set
    const preferences = {
      emailNotifications: user.emailNotifications ?? true,
      smsNotifications: user.smsNotifications ?? false,
      pushNotifications: user.pushNotifications ?? true,
      marketingEmails: user.marketingEmails ?? true,
      depositNotifications: true,
      withdrawalNotifications: true,
      bonusNotifications: true,
      promotionNotifications: true,
      securityAlerts: true,
    }

    return NextResponse.json({
      success: true,
      preferences,
    })
  } catch (error) {
    console.error('Notification preferences fetch error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const preferences = await req.json()

    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        emailNotifications: preferences.emailNotifications,
        smsNotifications: preferences.smsNotifications,
        pushNotifications: preferences.pushNotifications,
        marketingEmails: preferences.marketingEmails,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Notification preferences updated',
    })
  } catch (error) {
    console.error('Notification preferences update error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}


export const dynamic = "force-dynamic";
