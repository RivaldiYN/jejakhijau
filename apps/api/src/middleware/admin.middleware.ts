import type { FastifyRequest, FastifyReply } from 'fastify'

/**
 * Admin guard — use after authenticate.
 * Route example: { onRequest: [fastify.authenticate, adminGuard] }
 */
export async function adminGuard(req: FastifyRequest, reply: FastifyReply) {
  if (req.user?.role !== 'admin') {
    return reply.status(403).send({ error: 'Forbidden: admin only' })
  }
}
