import { PrismaClient } from '@prisma/client'
import { ACHIEVEMENTS } from '../packages/shared/src/models'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding achievements...')

  for (const a of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { id: a.id },
      update: {
        name: a.name,
        description: a.description,
        icon: a.icon,
        category: a.category,
        threshold: a.threshold,
        reward: a.reward,
      },
      create: {
        id: a.id,
        name: a.name,
        description: a.description,
        icon: a.icon,
        category: a.category,
        threshold: a.threshold,
        reward: a.reward,
      },
    })
    console.log(`  ✓ ${a.id}: ${a.name}`)
  }

  // Create a test promo code
  await prisma.promoCode.upsert({
    where: { code: 'WELCOME2024' },
    update: {},
    create: {
      code: 'WELCOME2024',
      tokens: 50,
      maxUses: 1000,
      isActive: true,
    },
  })
  console.log('  ✓ Promo code: WELCOME2024 (50 tokens)')

  await prisma.promoCode.upsert({
    where: { code: 'PICPULSE100' },
    update: {},
    create: {
      code: 'PICPULSE100',
      tokens: 100,
      maxUses: 100,
      isActive: true,
    },
  })
  console.log('  ✓ Promo code: PICPULSE100 (100 tokens)')

  console.log('\nDone!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
