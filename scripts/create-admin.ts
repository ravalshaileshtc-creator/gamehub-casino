
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2] || 'admin@gambling.com'
  const password = process.argv[3] || 'Admin123!'
  const name = process.argv[4] || 'System Admin'

  console.log(`Configuring admin user: ${email}`)

  const hashedPassword = await bcrypt.hash(password, 10)
  const referralCode = `ADMIN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        role: 'ADMIN',
        password: hashedPassword,
      },
      create: {
        email,
        name,
        password: hashedPassword,
        role: 'ADMIN',
        referralCode,
      },
    })

    console.log('✅ Admin user configured successfully!')
    console.log(`Email: ${user.email}`)
    console.log(`Password: ${password}`)
    console.log(`Role: ${user.role}`)
  } catch (error) {
    console.error('❌ Error creating admin:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
