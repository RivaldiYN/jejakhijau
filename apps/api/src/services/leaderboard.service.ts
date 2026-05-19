import { prisma } from '../lib/prisma'

export const leaderboardService = {
  async getCityRanking(limit = 20) {
    // SQLite-compatible aggregation via Prisma groupBy
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // Get all diary entries from last 7 days with user city
    const entries = await prisma.diaryEntry.findMany({
      where: { entryDate: { gte: sevenDaysAgo } },
      include: { user: { select: { city: true } } },
    })

    // Group by city in memory
    const cityMap = new Map<string, { total: number; userIds: Set<string> }>()

    for (const entry of entries) {
      const city = entry.user.city
      if (!city) continue
      if (!cityMap.has(city)) {
        cityMap.set(city, { total: 0, userIds: new Set() })
      }
      const c = cityMap.get(city)!
      c.total += entry.totalKgco2e
      c.userIds.add(entry.userId)
    }

    // Build ranking — filter cities with < 1 user (relax for dev)
    const ranking = Array.from(cityMap.entries())
      .filter(([, v]) => v.userIds.size >= 1)
      .map(([city, v]) => ({
        city,
        avgKgco2eWeek: parseFloat((v.total / v.userIds.size).toFixed(3)),
        userCount: v.userIds.size,
      }))
      .sort((a, b) => a.avgKgco2eWeek - b.avgKgco2eWeek)
      .slice(0, limit)
      .map((r, i) => ({ ...r, rank: i + 1 }))

    return ranking
  },
}
