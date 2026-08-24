import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { db } from '@/lib/firebase'
import { doc, setDoc } from 'firebase/firestore'

export async function generateStaticParams() {
  return []
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params
    const { amount, action, reason } = await req.json()

    const numericAmount = parseFloat(amount)
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    let newBalance = user.mainBalance
    if (action === 'ADD') {
      newBalance += numericAmount
    } else if (action === 'DEDUCT') {
      newBalance = Math.max(0, newBalance - numericAmount)
    } else if (action === 'SET') {
      newBalance = numericAmount
    }

    // 1. Update PostgreSQL Prisma DB
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { mainBalance: newBalance }
    })

    // 2. Create Transaction Log
    await prisma.transaction.create({
      data: {
        userId,
        type: 'ADJUSTMENT',
        amount: action === 'DEDUCT' ? -numericAmount : numericAmount,
        balanceBefore: user.mainBalance,
        balanceAfter: newBalance,
        status: 'COMPLETED',
        description: `Admin balance adjustment: ${action} ₹${numericAmount} (${reason || 'Manual Admin Adjust'})`,
        completedAt: new Date()
      }
    })

    // 3. Sync to Firebase Firestore
    if (user.email) {
      try {
        const docId = user.email.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_')
        const userRef = doc(db, 'users', docId)
        await setDoc(userRef, {
          mainBalance: newBalance,
          updatedAt: new Date().toISOString()
        }, { merge: true })
      } catch (e) {
        console.warn('Firebase User Balance Sync Note:', e)
      }
    }

    return NextResponse.json({
      success: true,
      newBalance,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        mainBalance: updatedUser.mainBalance
      }
    })
  } catch (error) {
    console.error('Admin balance update error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update balance' }, { status: 500 })
  }
}

export const dynamic = "force-dynamic";
