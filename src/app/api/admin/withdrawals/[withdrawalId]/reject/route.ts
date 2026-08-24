import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { db } from '@/lib/firebase'
import { doc, setDoc } from 'firebase/firestore'

export async function generateStaticParams() {
  return []
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ withdrawalId: string }> }) {
  try {
    const { withdrawalId } = await params
    const { reason } = await req.json().catch(() => ({ reason: 'Admin rejection' }))

    const withdrawal = await prisma.withdrawal.findUnique({ where: { id: withdrawalId } })
    if (!withdrawal) {
      return NextResponse.json({ success: false, error: 'Withdrawal not found' }, { status: 404 })
    }

    if (withdrawal.status === 'REJECTED') {
      return NextResponse.json({ success: true, message: 'Already rejected' })
    }

    // 1. Update Withdrawal status
    const updated = await prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        status: 'REJECTED',
        rejectedReason: reason || 'Rejected by Admin',
        processedAt: new Date()
      }
    })

    // 2. Refund balance to user
    await prisma.user.update({
      where: { id: withdrawal.userId },
      data: {
        mainBalance: { increment: withdrawal.amount }
      }
    })

    try {
      const wRef = doc(db, 'withdrawals', withdrawalId)
      await setDoc(wRef, {
        status: 'REJECTED',
        rejectedReason: reason || 'Rejected by Admin',
        processedAt: new Date().toISOString()
      }, { merge: true })
    } catch (e) {
      console.warn('Firebase Withdrawal Rejection Sync:', e)
    }

    return NextResponse.json({ success: true, withdrawal: updated })
  } catch (error) {
    console.error('Reject withdrawal error:', error)
    return NextResponse.json({ success: false, error: 'Failed to reject withdrawal' }, { status: 500 })
  }
}

export const dynamic = "force-dynamic";
