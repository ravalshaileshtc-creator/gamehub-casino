
import { PrismaClient, TransactionType, TransactionStatus, GameType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = 'admin@gambling.com'
  const admin = await prisma.user.findUnique({ where: { email } })

  if (!admin) {
    console.error('Admin user not found. Run create-admin.ts first.')
    return
  }

  console.log('🌱 Seeding initial admin data...')

  // 1. Seed Game Settings
  const games: GameType[] = ['SLOTS', 'ROULETTE', 'BLACKJACK', 'MINES', 'CRASH', 'DICE', 'COINFLIP', 'PLINKO', 'WHEEL', 'BACCARAT']
  for (const game of games) {
    await prisma.gameSettings.upsert({
      where: { game },
      update: {},
      create: {
        game,
        houseEdge: 2.0,
        isActive: true,
        updatedBy: admin.id
      }
    })
  }
  console.log('✅ Game Settings seeded')

  // 2. Seed System Settings
  await prisma.systemSettings.upsert({
    where: { key: 'global_system_config' },
    update: {},
    create: {
      key: 'global_system_config',
      value: {
        maintenanceMode: false,
        registrationEnabled: true,
        minDeposit: 100,
        maxWithdrawal: 50000,
        defaultRtp: 98.0
      },
      updatedBy: admin.id
    }
  })
  console.log('✅ System Settings seeded')

  // 3. Seed Mock Transactions & Bets (if empty)
  const txCount = await prisma.transaction.count()
  if (txCount === 0) {
    console.log('Creating mock transaction history...')
    for (let i = 0; i < 20; i++) {
      const type = i % 2 === 0 ? TransactionType.DEPOSIT : TransactionType.BET
      const amount = Math.floor(Math.random() * 5000) + 100
      await prisma.transaction.create({
        data: {
          userId: admin.id,
          type,
          amount,
          balanceBefore: 0,
          balanceAfter: amount,
          status: TransactionStatus.COMPLETED,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 1000000000))
        }
      })
    }
  }

  console.log('🌱 Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
