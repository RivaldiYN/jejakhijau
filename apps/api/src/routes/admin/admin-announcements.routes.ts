import type { FastifyPluginAsync } from 'fastify'
import { prisma } from '../../lib/prisma'
import { adminGuard } from '../../middleware/admin.middleware'

export const adminAnnouncementsRoutes: FastifyPluginAsync = async (fastify) => {
  const guard = { onRequest: [fastify.authenticate, adminGuard] }

  fastify.get('/', guard, async () =>
    prisma.announcement.findMany({ orderBy: { startsAt: 'desc' } })
  )

  fastify.post('/', guard, async (req, reply) => {
    const body = req.body as {
      title: string; body: string; ctaLabel?: string; ctaUrl?: string
      startsAt: string; endsAt: string
    }
    if (!body.title || !body.body || !body.startsAt || !body.endsAt) {
      return reply.status(400).send({ error: 'title, body, startsAt, endsAt wajib diisi' })
    }
    const ann = await prisma.announcement.create({
      data: {
        ...body,
        startsAt: new Date(body.startsAt),
        endsAt: new Date(body.endsAt),
      },
    })
    return reply.status(201).send(ann)
  })

  fastify.put('/:id', guard, async (req) => {
    const { id } = req.params as { id: string }
    const data = req.body as Record<string, unknown>
    if (data.startsAt) data.startsAt = new Date(data.startsAt as string)
    if (data.endsAt) data.endsAt = new Date(data.endsAt as string)
    return prisma.announcement.update({ where: { id }, data })
  })

  fastify.delete('/:id', guard, async (req) => {
    const { id } = req.params as { id: string }
    await prisma.announcement.delete({ where: { id } })
    return { success: true }
  })
}

// Public endpoint — returns active announcements for the user app
export const publicAnnouncementsRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/announcements', async () => {
    const now = new Date()
    return prisma.announcement.findMany({
      where: { isActive: true, startsAt: { lte: now }, endsAt: { gte: now } },
      orderBy: { startsAt: 'desc' },
    })
  })
}
