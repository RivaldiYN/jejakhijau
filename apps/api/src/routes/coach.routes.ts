import type { FastifyPluginAsync } from 'fastify'
import { prisma } from '../lib/prisma'
import { geminiService } from '../services/gemini.service'

export const coachRoutes: FastifyPluginAsync = async (fastify) => {
  const auth = { onRequest: [fastify.authenticate] }

  // ─── Helper: fetch user context for AI ────────────────────────────────────
  async function getUserContext(userId: string) {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    const [user, recentEntries, prevEntries] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, city: true, currentStreak: true },
      }),
      prisma.diaryEntry.findMany({
        where: { userId, entryDate: { gte: sevenDaysAgo } },
        select: { totalKgco2e: true, mealType: true, ojolKm: true, listrikKwh: true },
        orderBy: { entryDate: 'desc' },
      }),
      prisma.diaryEntry.findMany({
        where: { userId, entryDate: { gte: fourteenDaysAgo, lt: sevenDaysAgo } },
        select: { totalKgco2e: true },
      }),
    ])

    const avgNow = recentEntries.length
      ? recentEntries.reduce((s, e) => s + e.totalKgco2e, 0) / recentEntries.length
      : 0

    const avgPrev = prevEntries.length
      ? prevEntries.reduce((s, e) => s + e.totalKgco2e, 0) / prevEntries.length
      : 0

    const trend: 'up' | 'down' | 'stable' =
      avgPrev === 0 ? 'stable'
        : avgNow > avgPrev * 1.05 ? 'up'
        : avgNow < avgPrev * 0.95 ? 'down'
        : 'stable'

    // Find highest emission category
    const categoryTotals = { transport: 0, food: 0, energy: 0 }
    for (const e of recentEntries) {
      categoryTotals.transport += e.ojolKm * 0.089
      categoryTotals.energy += e.listrikKwh * 0.724
      categoryTotals.food += 0.62 // approximate per meal
    }
    const highestCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0][0]

    return { user, avgKgco2e: avgNow, trend, highestCategory }
  }

  // POST /coach/chat — AI-powered chat with Gemini
  fastify.post('/chat', auth, async (req, reply) => {
    const { message } = req.body as { message: string }
    if (!message?.trim()) {
      return reply.status(400).send({ error: 'Message is required' })
    }

    const ctx = await getUserContext(req.user.sub)
    if (!ctx.user) return reply.status(404).send({ error: 'User not found' })

    const response = await geminiService.getCoachResponse({
      name: ctx.user.name,
      city: ctx.user.city,
      currentStreak: ctx.user.currentStreak,
      avgKgco2e: ctx.avgKgco2e,
      message,
    })

    return { response, isDemo: !geminiService.isAvailable() }
  })

  // GET /coach/insight — proactive AI insight for dashboard card
  fastify.get('/insight', auth, async (req, reply) => {
    const ctx = await getUserContext(req.user.sub)
    if (!ctx.user) return reply.status(404).send({ error: 'User not found' })

    const insight = await geminiService.getProactiveInsight({
      name: ctx.user.name,
      avgKgco2e: ctx.avgKgco2e,
      highestCategory: ctx.highestCategory,
      trend: ctx.trend,
    })

    return {
      insight,
      trend: ctx.trend,
      avgKgco2e: parseFloat(ctx.avgKgco2e.toFixed(2)),
      isDemo: !geminiService.isAvailable(),
    }
  })
}
