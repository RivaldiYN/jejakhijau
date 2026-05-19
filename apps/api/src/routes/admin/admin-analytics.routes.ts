import type { FastifyPluginAsync } from 'fastify'
import { prisma } from '../../lib/prisma'
import { adminGuard } from '../../middleware/admin.middleware'

export const adminAnalyticsRoutes: FastifyPluginAsync = async (fastify) => {
  const guard = { onRequest: [fastify.authenticate, adminGuard] }

  // GET /admin/analytics — dashboard overview
  fastify.get('/', guard, async () => {
    const now = new Date()
    const today = new Date(now); today.setHours(0, 0, 0, 0)
    const sevenDaysAgo = new Date(today); sevenDaysAgo.setDate(today.getDate() - 7)
    const thirtyDaysAgo = new Date(today); thirtyDaysAgo.setDate(today.getDate() - 30)

    const [totalUsers, totalEntries, dau, wau, mau, avgEmission7d] = await Promise.all([
      prisma.user.count(),
      prisma.diaryEntry.count(),
      // DAU — unique users who checked in today
      prisma.diaryEntry.groupBy({
        by: ['userId'],
        where: { entryDate: { gte: today } },
      }).then((r) => r.length),
      // WAU
      prisma.diaryEntry.groupBy({
        by: ['userId'],
        where: { entryDate: { gte: sevenDaysAgo } },
      }).then((r) => r.length),
      // MAU
      prisma.diaryEntry.groupBy({
        by: ['userId'],
        where: { entryDate: { gte: thirtyDaysAgo } },
      }).then((r) => r.length),
      // Avg emission last 7 days
      prisma.diaryEntry.aggregate({
        where: { entryDate: { gte: sevenDaysAgo } },
        _avg: { totalKgco2e: true },
      }).then((r) => r._avg.totalKgco2e ?? 0),
    ])

    // Top 5 cities by user count
    const entries = await prisma.diaryEntry.findMany({
      where: { entryDate: { gte: sevenDaysAgo } },
      include: { user: { select: { city: true } } },
    })
    const cityMap = new Map<string, Set<string>>()
    for (const e of entries) {
      if (!cityMap.has(e.user.city)) cityMap.set(e.user.city, new Set())
      cityMap.get(e.user.city)!.add(e.userId)
    }
    const topCities = Array.from(cityMap.entries())
      .map(([city, users]) => ({ city, userCount: users.size }))
      .sort((a, b) => b.userCount - a.userCount)
      .slice(0, 5)

    return {
      totalUsers,
      totalEntries,
      dau,
      wau,
      mau,
      avgEmission7d: parseFloat(avgEmission7d.toFixed(3)),
      topCities,
    }
  })
}
