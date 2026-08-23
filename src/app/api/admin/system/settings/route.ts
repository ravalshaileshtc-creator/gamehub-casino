import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'


const CONFIG_KEY = 'global_system_config'

// Default config if DB is empty
const DEFAULT_CONFIG = {
  maintenanceMode: false,
  registrationEnabled: true,
  minDeposit: 100,
  maxWithdrawal: 50000,
  defaultRtp: 98.0
}

export async function GET() {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') return new NextResponse('Unauthorized', { status: 401 })

  try {
    const setting = await prisma.systemSettings.findUnique({
      where: { key: CONFIG_KEY }
    })

    return NextResponse.json({ success: true, config: setting?.value || DEFAULT_CONFIG })
  } catch (error) {
    console.error('Failed to fetch system settings:', error)
    return NextResponse.json({ success: true, config: DEFAULT_CONFIG })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') return new NextResponse('Unauthorized', { status: 401 })

  const newConfig = await req.json()

  try {
    // Upsert the config
    await prisma.systemSettings.upsert({
      where: { key: CONFIG_KEY },
      update: {
        value: newConfig,
        updatedBy: session.user.id
      },
      create: {
        key: CONFIG_KEY,
        value: newConfig,
        updatedBy: session.user.id
      }
    })

    // Log action
    await prisma.auditLog.create({
      data: {
        action: 'SYSTEM_SETTINGS_UPDATE',
        resource: 'SYSTEM',
        changes: newConfig as Prisma.InputJsonValue,
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
        userId: session.user.id,
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update settings:', error)
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') return new NextResponse('Unauthorized', { status: 401 })

  const newConfig = await req.json()

  try {
    // Upsert the config
    await prisma.systemSettings.upsert({
      where: { key: CONFIG_KEY },
      update: {
        value: newConfig,
        updatedBy: session.user.id
      },
      create: {
        key: CONFIG_KEY,
        value: newConfig,
        updatedBy: session.user.id
      }
    })

    // Log action
    await prisma.auditLog.create({
      data: {
        action: 'SYSTEM_SETTINGS_UPDATE',
        resource: 'SYSTEM',
        changes: newConfig as Prisma.InputJsonValue,
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
        userId: session.user.id,
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update settings:', error)
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 })
  }
}



export const dynamic = "force-dynamic";
