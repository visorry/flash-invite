import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({
  path: path.join(__dirname, '../../../apps/server/.env'),
})

import db from '../src/index'

async function main() {
  // List all users
  console.log('\n📋 Current users:')
  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      isAdmin: true,
    },
  })

  if (users.length === 0) {
    console.log('❌ No users found in database')
    return
  }

  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.name} (${user.email}) - Admin: ${user.isAdmin ? '✅' : '❌'}`)
  })

  // Get email from command line argument
  const email = process.argv[2]

  if (!email) {
    console.log('\n💡 Usage: bun run scripts/set-admin.ts <email>')
    console.log('Example: bun run scripts/set-admin.ts user@example.com')
    return
  }

  // Set user as admin
  const user = await db.user.findUnique({
    where: { email },
  })

  if (!user) {
    console.log(`\n❌ User with email "${email}" not found`)
    return
  }

  await db.user.update({
    where: { email },
    data: { isAdmin: true },
  })

  console.log(`\n✅ Successfully set ${user.name} (${email}) as admin!`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
