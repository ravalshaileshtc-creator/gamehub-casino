import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  return NextResponse.json({
    success: true,
    wallet: {
      userId: session?.user?.id || 'demo-user',
      balance: 10000.0,
      currency: 'DEMO'
    }
  })
}

export const dynamic = "force-dynamic";
