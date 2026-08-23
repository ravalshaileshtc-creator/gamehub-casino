import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { AuditService } from '@/services/audit.service'

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, kycDocument: true, kycStatus: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if all documents uploaded
    const docs = user.kycDocument ? JSON.parse(user.kycDocument) : {}
    if (!docs.idProof || !docs.addressProof || !docs.selfie) {
      return NextResponse.json({
        success: false,
        error: 'Please upload all required documents',
      }, { status: 400 })
    }

    // Submit for review
    await prisma.user.update({
      where: { id: user.id },
      data: {
        kycStatus: 'PENDING',
        kycSubmittedAt: new Date(),
      },
    })

    // Log the action
    await AuditService.log({
      userId: user.id,
      action: 'KYC_SUBMITTED',
      resource: 'USER',
      resourceId: user.id,
      changes: { details: 'KYC documents submitted for verification' },
    })

    return NextResponse.json({
      success: true,
      message: 'KYC documents submitted for review',
    })
  } catch (error) {
    console.error('KYC submit error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to submit KYC',
    }, { status: 500 })
  }
}
