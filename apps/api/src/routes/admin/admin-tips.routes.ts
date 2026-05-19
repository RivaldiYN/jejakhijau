import type { FastifyPluginAsync } from 'fastify'
import { prisma } from '../../lib/prisma'
import { adminGuard } from '../../middleware/admin.middleware'

export const adminTipsRoutes: FastifyPluginAsync = async (fastify) => {
  const guard = { onRequest: [fastify.authenticate, adminGuard] }

  fastify.get('/', guard, async (req) => {
    const { category } = req.query as { category?: string }
    return prisma.tip.findMany({
      where: category ? { category } : {},
      orderBy: { createdAt: 'desc' },
    })
  })

  fastify.post('/', guard, async (req, reply) => {
    const { title, body, category = 'general' } = req.body as Record<string, string>
    if (!title || !body) return reply.status(400).send({ error: 'title dan body wajib diisi' })

    const tip = await prisma.tip.create({
      data: { title, body, category, createdBy: req.user.sub },
    })
    return reply.status(201).send(tip)
  })

  fastify.put('/:id', guard, async (req) => {
    const { id } = req.params as { id: string }
    const data = req.body as Partial<{ title: string; body: string; category: string; isPublished: boolean }>
    return prisma.tip.update({ where: { id }, data })
  })

  // PATCH /admin/tips/:id/publish — toggle publish status
  fastify.patch('/:id/publish', guard, async (req) => {
    const { id } = req.params as { id: string }
    const tip = await prisma.tip.findUnique({ where: { id } })
    return prisma.tip.update({ where: { id }, data: { isPublished: !tip?.isPublished } })
  })

  fastify.delete('/:id', guard, async (req) => {
    const { id } = req.params as { id: string }
    await prisma.tip.delete({ where: { id } })
    return { success: true }
  })
}

// Public endpoint — consumed by user app
export const publicTipsRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/tips', async () =>
    prisma.tip.findMany({ where: { isPublished: true }, orderBy: { createdAt: 'desc' }, take: 10 })
  )
}
