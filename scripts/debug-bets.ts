import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Testing Bets Query...')
  try {
    const limit = 20
    console.log('Fetching bets...')
    const bets = await prisma.bet.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
    })
    console.log(`Fetched ${bets.length} bets.`)
    console.log('First bet:', bets[0])

    const userIds = [...new Set(bets.map(b => b.userId))]
    console.log('Fetching users:', userIds)
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, image: true, avatar: true }
    })
    console.log(`Fetched ${users.length} users.`)

  } catch (error) {
    console.error('ERROR:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
