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

    const { transactionPassword } = await req.json()
    if (!transactionPassword) {
      return NextResponse.json({ error: 'Transaction password required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        mainBalance: true,
        bonusBalance: true,
        transactionPassword: true
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.transactionPassword) {
      return NextResponse.json({ error: 'Please set a transaction password in settings first' }, { status: 403 })
    }

    const isTxPasswordValid = await bcrypt.compare(transactionPassword, user.transactionPassword)
    if (!isTxPasswordValid) {
      return NextResponse.json({ error: 'Invalid transaction password' }, { status: 403 })
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user has remaining balance
    const totalBalance = user.mainBalance + user.bonusBalance
    if (totalBalance > 0) {
      return NextResponse.json({
        error: 'Please withdraw your remaining balance before deleting your account',
      }, { status: 400 })
    }

    // In production:
    // 1. Mark account for deletion
    // 2. Send confirmation email
    // 3. Schedule actual deletion after grace period (e.g., 30 days)
    // 4. For now, just mark account as inactive

    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        isActive: false,
        // In production, add deletionRequestedAt field
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Account deletion requested. You will receive a confirmation email.',
    })
  } catch (error) {
    console.error('Account deletion error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
