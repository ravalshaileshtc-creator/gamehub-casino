import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const submissions = await prisma.user.findMany({
      where: {
        kycStatus: 'PENDING'
      },
      select: {
        id: true,
        name: true,
        email: true,
        kycStatus: true,
        kycDocument: true,
        kycSubmittedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      submissions,
    })
  } catch (error) {
    console.error('Get pending KYC error:', error)
    return NextResponse.json({
      success: false,
      submissions: [],
      error: 'Failed to fetch KYC submissions',
    }, { status: 500 })
  }
}

export const dynamic = "force-dynamic";
