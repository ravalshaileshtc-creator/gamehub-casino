import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const admin = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    })

    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get pending KYC submissions
    const pendingKyc = await prisma.user.findMany({
      where: { kycStatus: 'PENDING' },
      select: {
        id: true,
        name: true,
        email: true,
        kycDocument: true,
        kycSubmittedAt: true,
        createdAt: true,
      },
      orderBy: { kycSubmittedAt: 'asc' },
    })

    return NextResponse.json({
      success: true,
      submissions: pendingKyc,
    })
  } catch (error) {
    console.error('Get pending KYC error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch pending KYC',
    }, { status: 500 })
  }
}


export const dynamic = "force-dynamic";
