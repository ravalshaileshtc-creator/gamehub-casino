import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function generateStaticParams() {
  return []
}

export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ userId: string }> }
) {
  const params = await props.params;
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!admin || (admin.role !== 'ADMIN' && admin.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { userId } = params
    const body = await req.json()
    const { name, email, role, vipLevel, kycStatus, isBanned } = body

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { name, email, role, vipLevel, kycStatus, isBanned },
    })

    return NextResponse.json({ success: true, user: updatedUser })
  } catch (err: unknown) {
    console.error('Update user error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
