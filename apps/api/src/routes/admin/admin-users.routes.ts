import type { FastifyPluginAsync } from 'fastify'
import { prisma } from '../../lib/prisma'
import { adminGuard } from '../../middleware/admin.middleware'

export const adminUsersRoutes: FastifyPluginAsync = async (fastify) => {
  const guard = { onRequest: [fastify.authenticate, adminGuard] }

  // GET /admin/users?page=1&limit=20&q=search
  fastify.get('/', guard, async (req) => {
    const { page = '1', limit = '20', q = '' } = req.query as Record<string, string>
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const where = q
      ? { OR: [{ name: { contains: q } }, { email: { contains: q } }, { city: { contains: q } }] }
      : {}

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, name: true, city: true, role: true, currentStreak: true, longestStreak: true, createdAt: true, _count: { select: { diaryEntries: true } } },
      }),
      prisma.user.count({ where }),
    ])

    return { users, total, page: parseInt(page), limit: parseInt(limit) }
  })

  // PATCH /admin/users/:id
  fastify.patch('/:id', guard, async (req, reply) => {
    const { id } = req.params as { id: string }
    const { role } = req.body as { role?: string }

    if (role && !['user', 'admin'].includes(role)) {
      return reply.status(400).send({ error: 'Role harus user atau admin' })
    }

    const user = await prisma.user.update({
      where: { id },
      data: { ...(role && { role }) },
      select: { id: true, email: true, name: true, role: true },
    })
    return user
  })

  // DELETE /admin/users/:id
  fastify.delete('/:id', guard, async (req, reply) => {
    const { id } = req.params as { id: string }
    // Prevent admin from deleting themselves
    if (id === req.user.sub) {
      return reply.status(400).send({ error: 'Tidak bisa menghapus akun sendiri' })
    }
    await prisma.user.delete({ where: { id } })
    return { success: true }
  })
}
