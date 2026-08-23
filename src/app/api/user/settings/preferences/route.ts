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
        language: true,
        currency: true,
        timezone: true,
        soundEffects: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const preferences = {
      language: user.language || 'en',
      currency: user.currency || 'INR',
      timezone: user.timezone || 'Asia/Kolkata',
      soundEffects: user.soundEffects ?? true,
      theme: 'dark',
    }

    return NextResponse.json({
      success: true,
      preferences,
    })
  } catch (error) {
    console.error('Preferences fetch error:', error)
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
        language: preferences.language,
        currency: preferences.currency,
        timezone: preferences.timezone,
        soundEffects: preferences.soundEffects,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Preferences updated',
    })
  } catch (error) {
    console.error('Preferences update error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}


export const dynamic = "force-dynamic";
