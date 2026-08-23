import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma, { fastDbQuery } from "@/lib/prisma"

// In-memory demo balances storage when DB is offline
const demoBalances: Record<string, number> = {}

export async function GET() {
  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.json({ balance: 0 }, { status: 401 })
  }

  const email = session.user.email

  const user = await fastDbQuery(
    () => prisma.user.findUnique({
      where: { email },
      select: { mainBalance: true, bonusBalance: true },
    }),
    null
  )

  if (user) {
    return NextResponse.json({
      mainBalance: user.mainBalance || 0,
      bonusBalance: user.bonusBalance || 0,
      totalBalance: (user.mainBalance || 0) + (user.bonusBalance || 0)
    })
  }

  // Fallback for Demo & Admin users (Fast Instant Response)
  const isDemo = email.includes('demo')
  const defaultBalance = isDemo ? 1000.0 : 10000.0
  const currentMain = demoBalances[email] !== undefined ? demoBalances[email] : defaultBalance

  return NextResponse.json({
    mainBalance: currentMain,
    bonusBalance: 250.0,
    totalBalance: currentMain + 250.0
  })
}

export async function POST(req: Request) {
  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const email = session.user.email

  try {
    const { amount, type, balanceType = 'main' } = await req.json()

    const user = await fastDbQuery(
      () => prisma.user.findUnique({ where: { email } }),
      null
    )

    if (user) {
      const field = balanceType === 'main' ? 'mainBalance' : 'bonusBalance'
      const currentBalance = user[field] || 0
      const newBalance = type === 'add' ? currentBalance + amount : Math.max(0, currentBalance - amount)

      const updatedUser = await fastDbQuery(
        () => prisma.user.update({
          where: { email },
          data: { [field]: newBalance }
        }),
        null
      )

      if (updatedUser) {
        return NextResponse.json({
          success: true,
          mainBalance: updatedUser.mainBalance,
          bonusBalance: updatedUser.bonusBalance,
          totalBalance: updatedUser.mainBalance + updatedUser.bonusBalance
        })
      }
    }

    // In-memory demo fallback update
    const currentMain = demoBalances[email] !== undefined ? demoBalances[email] : 10000.0
    const newMain = type === 'add' ? currentMain + amount : Math.max(0, currentMain - amount)
    demoBalances[email] = newMain

    return NextResponse.json({
      success: true,
      mainBalance: newMain,
      bonusBalance: 250.0,
      totalBalance: newMain + 250.0
    })
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
