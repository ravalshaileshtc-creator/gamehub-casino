import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const { currentPassword, newTransactionPassword } = await req.json()

    if (!newTransactionPassword || newTransactionPassword.length < 6) {
      return NextResponse.json({ success: false, error: 'Transaction password must be at least 6 digits/characters' }, { status: 400 })
    }

    // 1. Verify main account password first for security
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true, transactionPassword: true }
    })

    if (!user) return new NextResponse('User not found', { status: 404 })

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isPasswordValid) {
      return NextResponse.json({ success: false, error: 'Invalid account password' }, { status: 403 })
    }

    // 2. Hash and update transaction password
    const hashedTxPassword = await bcrypt.hash(newTransactionPassword, 10)

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        transactionPassword: hashedTxPassword
      }
    })

    return NextResponse.json({ success: true, message: 'Transaction password set successfully' })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'An error occurred'
    console.error('Transaction password error:', error)
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

export async function GET() {
  const session = await auth()
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 })

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { transactionPassword: true }
    })

    return NextResponse.json({
      success: true,
      isSet: !!user?.transactionPassword
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch status' }, { status: 500 })
  }
}


export const dynamic = "force-dynamic";
