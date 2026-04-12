import { prisma } from './index'
import { ACHIEVEMENTS } from '@aibot/shared'

export async function checkAchievements(userId: string): Promise<string[]> {
  const unlocked: string[] = []

  const [user, genCount, referralCount, existingAchievements] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.generation.count({ where: { userId, status: 'DONE' } }),
    prisma.user.count({ where: { referrerId: userId } }),
    prisma.userAchievement.findMany({ where: { userId }, select: { achievementId: true } }),
  ])

  if (!user) return []

  const alreadyUnlocked = new Set(existingAchievements.map(a => a.achievementId))

  for (const ach of ACHIEVEMENTS) {
    if (alreadyUnlocked.has(ach.id)) continue

    let earned = false

    switch (ach.category) {
      case 'generation':
        earned = genCount >= ach.threshold
        break
      case 'social':
        earned = referralCount >= ach.threshold
        break
      case 'spending':
        earned = user.totalSpent >= ach.threshold
        break
      case 'streak':
        earned = user.dailyStreak >= ach.threshold
        break
    }

    if (earned) {
      try {
        await prisma.$transaction([
          prisma.userAchievement.create({
            data: { userId, achievementId: ach.id },
          }),
          prisma.user.update({
            where: { id: userId },
            data: { balance: { increment: ach.reward } },
          }),
          prisma.transaction.create({
            data: {
              userId,
              amount: ach.reward,
              type: 'ACHIEVEMENT',
              description: `Achievement: ${ach.name}`,
            },
          }),
        ])
        unlocked.push(ach.id)
      } catch {
        // Already unlocked (race condition), skip
      }
    }
  }

  return unlocked
}
