import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import bcrypt from 'bcrypt'

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const defaultEmail = 'admin@domain.com'
  const passwordHash = await bcrypt.hash('defaultpass', 10)

  const admin = await prisma.user.upsert({
    where: { email: defaultEmail },
    update: {},
    create: {
      name: 'Admin User',
      email: defaultEmail,
      password: passwordHash,
      role: 'SUPERADMIN', // from your Role enum
      activatedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })

  console.log('✅ Seeded admin user:', admin.email)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
