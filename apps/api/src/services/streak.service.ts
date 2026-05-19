import { prisma } from '../lib/prisma'

function daysBetween(a: Date, b: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24
  return Math.floor((b.getTime() - a.getTime()) / msPerDay)
}

export const streakService = {
  async update(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new Error('User not found')

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let newStreak = user.currentStreak

    if (!user.lastCheckin) {
      newStreak = 1 // first ever check-in
    } else {
      const last = new Date(user.lastCheckin)
      last.setHours(0, 0, 0, 0)
      const gap = daysBetween(last, today)

      if (gap === 0) {
        // already checked in today — no change
        newStreak = user.currentStreak
      } else if (gap === 1) {
        // consecutive day
        newStreak = user.currentStreak + 1
      } else {
        // streak broken
        newStreak = 1
      }
    }

    return prisma.user.update({
      where: { id: userId },
      data: {
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, user.longestStreak),
        lastCheckin: today,
      },
      select: { currentStreak: true, longestStreak: true },
    })
  },
}
