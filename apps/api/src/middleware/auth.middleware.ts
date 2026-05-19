import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify'

// Extend Fastify types so `fastify.authenticate` is recognised everywhere
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
  interface FastifyRequest {
    user: { sub: string; email: string; role: string }
  }
}

/**
 * Call app.decorate('authenticate', authMiddleware) once in server.ts.
 * Then protect routes with: { onRequest: [fastify.authenticate] }
 */
export async function authMiddleware(
  this: FastifyInstance,
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    await req.jwtVerify()
  } catch (err) {
    reply.send(err)
  }
}
