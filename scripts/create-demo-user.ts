import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'demo@gambling.com'
  const password = 'Demo123!'
  const name = 'Demo Player'

  console.log(`Configuring Demo User with $1,000 Cash: ${email}`)

  const hashedPassword = await bcrypt.hash(password, 10)
  const referralCode = `DEMO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        password: hashedPassword,
        mainBalance: 1000,
        role: 'USER'
      },
      create: {
        email,
        name,
        password: hashedPassword,
        mainBalance: 1000,
        bonusBalance: 250,
        role: 'USER',
        referralCode
      }
    })

    console.log('✅ Demo user configured successfully!')
    console.log(`Email: ${user.email}`)
    console.log(`Password: ${password}`)
    console.log(`Main Balance: $${user.mainBalance}`)
  } catch (error) {
    console.error('❌ Error creating demo user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
