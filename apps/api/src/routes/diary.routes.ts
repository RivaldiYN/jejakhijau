import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { calculateTotal } from '@jejakhijau/shared'
import { streakService } from '../services/streak.service'
import { badgeService } from '../services/badge.service'

const CheckinSchema = z.object({
  ojolKm:        z.number().min(0).default(0),
  angkotKm:      z.number().min(0).default(0),
  krlKm:         z.number().min(0).default(0),
  plastikCount:  z.number().int().min(0).default(0),
  listrikKwh:    z.number().min(0).default(0),
  mealType:      z.enum(['warteg', 'gofood', 'masak_sendiri', 'vegetarian']).default('warteg'),
  bakarSampahKg: z.number().min(0).default(0),
})

export const diaryRoutes: FastifyPluginAsync = async (fastify) => {
  const auth = { onRequest: [fastify.authenticate] }

  // POST /diary — submit check-in harian
  fastify.post('/', auth, async (req, reply) => {
    const result = CheckinSchema.safeParse(req.body)
    if (!result.success) {
      return reply.status(400).send({ error: result.error.errors[0].message })
    }
    const body = result.data

    // Load active emission factor overrides from admin CMS
    const overrideRows = await prisma.emissionFactorOverride.findMany()
    const overrides: Record<string, number> = {}
    for (const row of overrideRows) overrides[row.key] = row.value

    const totalKgco2e = calculateTotal(body, overrides)

    // Store at midnight UTC for the user's "today"
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Check if first ever check-in
    const prevCount = await prisma.diaryEntry.count({ where: { userId: req.user.sub } })
    const isFirstCheckin = prevCount === 0

    const entry = await prisma.diaryEntry.upsert({
      where: { userId_entryDate: { userId: req.user.sub, entryDate: today } },
      update: { ...body, totalKgco2e },
      create: { userId: req.user.sub, entryDate: today, ...body, totalKgco2e },
    })

    const streak = await streakService.update(req.user.sub)
    const newBadges = await badgeService.checkAndAward(
      req.user.sub, streak, totalKgco2e, body.mealType, isFirstCheckin
    )

    return reply.status(201).send({ entry, streak, newBadges })
  })

  // GET /diary?days=30
  fastify.get('/', auth, async (req) => {
    const { days = '30' } = req.query as { days?: string }
    const since = new Date()
    since.setDate(since.getDate() - parseInt(days))
    since.setHours(0, 0, 0, 0)

    return prisma.diaryEntry.findMany({
      where: { userId: req.user.sub, entryDate: { gte: since } },
      orderBy: { entryDate: 'desc' },
    })
  })

  // GET /diary/today
  fastify.get('/today', auth, async (req) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return prisma.diaryEntry.findUnique({
      where: { userId_entryDate: { userId: req.user.sub, entryDate: today } },
    })
  })
}
