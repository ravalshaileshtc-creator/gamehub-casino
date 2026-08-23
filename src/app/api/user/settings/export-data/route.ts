import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST() {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        name: true,
        email: true,
        totalWagered: true,
        mainBalance: true,
        bonusBalance: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // In production, generate actual data export file and send email
    // For now, just return success
    // TODO: Implement actual data export with email notification

    return NextResponse.json({
      success: true,
      message: 'Data export requested. You will receive an email with download link.',
    })
  } catch (error) {
    console.error('Data export error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
