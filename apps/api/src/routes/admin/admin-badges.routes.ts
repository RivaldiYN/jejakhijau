import type { FastifyPluginAsync } from 'fastify'
import { prisma } from '../../lib/prisma'
import { adminGuard } from '../../middleware/admin.middleware'

export const adminBadgesRoutes: FastifyPluginAsync = async (fastify) => {
  const guard = { onRequest: [fastify.authenticate, adminGuard] }

  fastify.get('/', guard, async () => prisma.badge.findMany({ orderBy: { name: 'asc' } }))

  fastify.post('/', guard, async (req, reply) => {
    const { slug, name, description, iconUrl } = req.body as Record<string, string>
    if (!slug || !name || !description || !iconUrl) {
      return reply.status(400).send({ error: 'slug, name, description, iconUrl wajib diisi' })
    }
    const badge = await prisma.badge.create({ data: { slug, name, description, iconUrl } })
    return reply.status(201).send(badge)
  })

  fastify.put('/:id', guard, async (req, reply) => {
    const { id } = req.params as { id: string }
    const data = req.body as Partial<{ slug: string; name: string; description: string; iconUrl: string }>
    const badge = await prisma.badge.update({ where: { id }, data })
    return badge
  })

  fastify.delete('/:id', guard, async (req) => {
    const { id } = req.params as { id: string }
    await prisma.badge.delete({ where: { id } })
    return { success: true }
  })
}
