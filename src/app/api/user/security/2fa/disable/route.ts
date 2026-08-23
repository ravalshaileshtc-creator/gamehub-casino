import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { TwoFactorService } from '@/services/twofa.service'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { password } = await req.json()

    // Require password to disable
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user?.password) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 400 })
    }

    await TwoFactorService.disable2FA(session.user.id)

    return NextResponse.json({ success: true, message: '2FA Disabled' })
  } catch (error) {
    console.error('2FA disable error:', error)
    return NextResponse.json({ error: 'Failed to disable 2FA' }, { status: 500 })
  }
}
