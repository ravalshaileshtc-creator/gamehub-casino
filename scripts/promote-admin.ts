
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2]

  if (!email) {
    console.log('Please provide an email address.')
    console.log('Usage: npx tsx scripts/promote-admin.ts <email>')
    // List all users
    try {
      const users = await prisma.user.findMany({ select: { email: true, role: true } })
      console.log('\nExisting Users:')
      if (users.length === 0) {
        console.log('No users found. Please register an account first at /login')
      } else {
        users.forEach(u => console.log(`- ${u.email} (${u.role})`))
      }
    } catch (e) {
      console.error("Failed to connect to DB", e)
    }
    return
  }

  try {
    const user = await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' }
    })
    console.log(`Success! User ${user.email} is now an ADMIN.`)
  } catch (e) {
    if (e instanceof Error) console.error('Error:', e.message)
    else console.error('Error:', e)
    console.log('User might not exist.')
  }
}

main()
  .catch(e => {
    throw e
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
