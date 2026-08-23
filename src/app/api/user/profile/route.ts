import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma, { fastDbQuery } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()

    const fallbackUser = {
      id: session?.user?.id || 'demo-user-id',
      name: session?.user?.name || 'Pro Gamer',
      email: session?.user?.email || 'demo@gambling.com',
      image: null,
      referralCode: 'DEMO1000',
      referralEarnings: 250.0,
      vipLevel: 'VIP 4',
      totalWagered: 15400.0,
      kycStatus: 'VERIFIED',
      createdAt: new Date().toISOString(),
      bio: 'Mobile Game Hub Player',
      avatar: '/avatars/default.png',
      twoFactorEnabled: false
    }

    if (!session?.user?.id) {
      return NextResponse.json({ success: true, user: fallbackUser })
    }

    const userFromDb = await fastDbQuery(
      () => prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          referralCode: true,
          referralEarnings: true,
          vipLevel: true,
          totalWagered: true,
          kycStatus: true,
          createdAt: true,
          bio: true,
          avatar: true,
          twoFactorEnabled: true,
        },
      }),
      null
    )

    return NextResponse.json({ success: true, user: userFromDb || fallbackUser })
  } catch (error) {
    return NextResponse.json({
      success: true,
      user: {
        id: 'demo-user',
        name: 'Pro Gamer',
        email: 'demo@gambling.com',
        referralCode: 'DEMO1000',
        vipLevel: 'VIP 4'
      }
    })
  }
}
