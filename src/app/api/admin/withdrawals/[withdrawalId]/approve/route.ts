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

    const withdrawal = await prisma.withdrawal.findUnique({ where: { id: withdrawalId } })
    if (!withdrawal) {
      return NextResponse.json({ success: false, error: 'Withdrawal not found' }, { status: 404 })
    }

    const updated = await prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        status: 'COMPLETED',
        processedAt: new Date(),
        approvedAt: new Date()
      }
    })

    try {
      const wRef = doc(db, 'withdrawals', withdrawalId)
      await setDoc(wRef, {
        status: 'APPROVED',
        processedAt: new Date().toISOString()
      }, { merge: true })
    } catch (e) {
      console.warn('Firebase Withdrawal Approval Sync:', e)
    }

    return NextResponse.json({ success: true, withdrawal: updated })
  } catch (error) {
    console.error('Approve withdrawal error:', error)
    return NextResponse.json({ success: false, error: 'Failed to approve withdrawal' }, { status: 500 })
  }
}

export const dynamic = "force-dynamic";
