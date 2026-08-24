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

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        kycStatus: 'APPROVED',
        kycApprovedAt: new Date()
      }
    })

    if (user.email) {
      try {
        const docId = user.email.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_')
        const userRef = doc(db, 'users', docId)
        await setDoc(userRef, {
          kycStatus: 'APPROVED',
          kycApprovedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { merge: true })
      } catch (e) {
        console.warn('Firebase KYC Sync Note:', e)
      }
    }

    return NextResponse.json({ success: true, user: updatedUser })
  } catch (error) {
    console.error('KYC approval error:', error)
    return NextResponse.json({ success: false, error: 'Failed to approve KYC' }, { status: 500 })
  }
}

export const dynamic = "force-dynamic";
