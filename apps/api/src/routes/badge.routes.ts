import type { FastifyPluginAsync } from 'fastify'
import { prisma } from '../lib/prisma'

export const badgeRoutes: FastifyPluginAsync = async (fastify) => {
  const auth = { onRequest: [fastify.authenticate] }

  // GET /badges/me
  fastify.get('/me', auth, async (req) => {
    const userBadges = await prisma.userBadge.findMany({
      where: { userId: req.user.sub },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    })
    return userBadges.map((ub) => ({
      ...ub.badge,
      earnedAt: ub.earnedAt,
    }))
  })

  // GET /badges — all available badges
  fastify.get('/', async () => {
    return prisma.badge.findMany({ orderBy: { name: 'asc' } })
  })
}
