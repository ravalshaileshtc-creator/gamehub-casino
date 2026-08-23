import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { days, transactionPassword } = await req.json()

    if (!transactionPassword) {
      return NextResponse.json({ error: 'Transaction password required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { transactionPassword: true }
    })

    if (!user?.transactionPassword) {
      return NextResponse.json({ error: 'Please set a transaction password in settings first' }, { status: 403 })
    }

    const isTxPasswordValid = await bcrypt.compare(transactionPassword, user.transactionPassword)
    if (!isTxPasswordValid) {
      return NextResponse.json({ error: 'Invalid transaction password' }, { status: 403 })
    }

    if (![7, 30, 90, 365].includes(days)) {
      return NextResponse.json({ error: 'Invalid exclusion period' }, { status: 400 })
    }

    const excludedUntil = new Date()
    excludedUntil.setDate(excludedUntil.getDate() + days)

    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        selfExcluded: true,
        selfExcludedUntil: excludedUntil,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Self-exclusion activated for ${days} days`,
    })
  } catch (error) {
    console.error('Self-exclusion error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
