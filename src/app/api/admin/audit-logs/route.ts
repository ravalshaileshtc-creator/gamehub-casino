
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') return new NextResponse('Unauthorized', { status: 401 })

  try {
    const logs = await prisma.auditLog.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } }
      }
    })

    // Map to frontend expected format if needed, or update frontend
    const formattedLogs = logs.map(log => ({
      id: log.id,
      action: log.action,
      details: JSON.stringify(log.changes || log.resource),
      ipAddress: log.ipAddress || 'unknown',
      admin: log.user || { name: 'Unknown', email: 'unknown' },
      createdAt: log.createdAt,
      severity: 'INFO' // Default severity as it's not in schema yet
    }))

    return NextResponse.json({ success: true, logs: formattedLogs })
  } catch (error) {
    console.error('Audit log error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch logs' }, { status: 500 })
  }
}


export const dynamic = "force-dynamic";
