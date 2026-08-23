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
        profileVisibility: true,
        showBettingHistory: true,
        allowFriendRequests: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const settings = {
      profileVisibility: user.profileVisibility || 'PUBLIC',
      showBettingHistory: user.showBettingHistory ?? false,
      allowFriendRequests: user.allowFriendRequests ?? true,
      shareDataForImprovements: true,
    }

    return NextResponse.json({
      success: true,
      settings,
    })
  } catch (error) {
    console.error('Privacy settings fetch error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await req.json()

    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        profileVisibility: settings.profileVisibility,
        showBettingHistory: settings.showBettingHistory,
        allowFriendRequests: settings.allowFriendRequests,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Privacy settings updated',
    })
  } catch (error) {
    console.error('Privacy settings update error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}


export const dynamic = "force-dynamic";
