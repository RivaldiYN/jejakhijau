import { prisma } from '../lib/prisma'

interface StreakInfo {
  currentStreak: number
}

const BADGE_RULES: Array<{
  slug: string
  check: (streak: number, todayTotal?: number, isFirstCheckin?: boolean) => boolean
}> = [
  { slug: 'first_checkin', check: (_s, _t, first) => first === true },
  { slug: 'streak_7',      check: (s) => s >= 7 },
  { slug: 'streak_30',     check: (s) => s >= 30 },
  { slug: 'streak_100',    check: (s) => s >= 100 },
  { slug: 'low_carbon_day',check: (_s, t) => (t ?? 999) < 2.0 },
  { slug: 'vegetarian_day',check: () => false }, // triggered separately by mealType check
]

export const badgeService = {
  async checkAndAward(
    userId: string,
    streak: StreakInfo,
    todayTotal?: number,
    mealType?: string,
    isFirstCheckin?: boolean
  ) {
    const existing = await prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
    })
    const owned = new Set(existing.map((b) => b.badge.slug))
    const newBadges = []

    // Vegetarian badge check
    const rules = [
      ...BADGE_RULES,
      { slug: 'vegetarian_day', check: () => mealType === 'vegetarian' },
    ]

    for (const rule of rules) {
      if (owned.has(rule.slug)) continue
      if (!rule.check(streak.currentStreak, todayTotal, isFirstCheckin)) continue

      const badge = await prisma.badge.findUnique({ where: { slug: rule.slug } })
      if (!badge) continue

      try {
        await prisma.userBadge.create({ data: { userId, badgeId: badge.id } })
        newBadges.push(badge)
      } catch {
        // unique constraint — already awarded (race condition guard)
      }
    }

    return newBadges
  },
}
