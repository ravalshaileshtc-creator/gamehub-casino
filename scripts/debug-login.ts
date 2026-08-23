import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Testing Login/User Lookup...')
  const testEmail = 'test@example.com' // You can change this to a real user email if known

  try {
    console.log(`Attempting to find user with email: ${testEmail}`)
    const user = await prisma.user.findUnique({
      where: { email: testEmail }
    })

    if (user) {
      console.log('User found:', user.id, user.email)
      console.log('Database connection is working for User table.')
    } else {
      console.log('User not found (this is success for DB connection, just no data).')
    }

  } catch (error) {
    console.error('ERROR: Login/User Lookup failed!')
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
