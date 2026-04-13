import { prisma } from './index'

export async function notify(userId: string, type: string, text: string, refId?: string) {
  try {
    await prisma.notification.create({
      data: { userId, type, text, refId },
    })
  } catch {}
}
