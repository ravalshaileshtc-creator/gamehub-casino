
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') return new NextResponse('Unauthorized', { status: 401 })

  try {
    const transactions = await prisma.transaction.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } }
      }
    })

    return NextResponse.json({ success: true, transactions })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch transactions' }, { status: 500 })
  }
}


export const dynamic = "force-dynamic";
