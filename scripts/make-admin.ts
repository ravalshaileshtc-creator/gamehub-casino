import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2]

  if (!email) {
    console.log('Please provide an email address')
    console.log('Usage: npx tsx scripts/make-admin.ts <email>')
    process.exit(1)
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      console.error(`User with email ${email} not found!`)
      process.exit(1)
    }

    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' },
    })

    console.log(`Successfully promoted ${updatedUser.email} to ADMIN`)
    console.log('Role:', updatedUser.role)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()