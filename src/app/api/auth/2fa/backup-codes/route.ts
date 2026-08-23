import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { TwoFactorService } from '@/services/twofa.service'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.twoFactorEnabled) {
      return NextResponse.json({
        success: false,
        error: '2FA is not enabled',
      }, { status: 400 })
    }

    // Generate new backup codes
    const backupCodes = await TwoFactorService.regenerateBackupCodes(user.id)

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: '2FA_BACKUP_CODES_REGENERATED',
        resource: 'USER',
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || '',
        details: 'Backup codes regenerated',
      },
    })

    return NextResponse.json({
      success: true,
      backupCodes,
      message: 'New backup codes generated',
    })
  } catch (error) {
    console.error('Backup codes regeneration error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to regenerate backup codes',
    }, { status: 500 })
  }
}
