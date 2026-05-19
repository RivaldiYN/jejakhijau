import type { FastifyPluginAsync } from 'fastify'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import { prisma } from '../lib/prisma'

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  name: z.string().min(2),
  city: z.string().min(2),
})

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /auth/register
  fastify.post('/register', async (req, reply) => {
    const result = RegisterSchema.safeParse(req.body)
    if (!result.success) {
      return reply.status(400).send({ error: result.error.errors[0].message })
    }
    const { email, password, name, city } = result.data

    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) {
      return reply.status(409).send({ error: 'Email sudah terdaftar' })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { email, passwordHash, name, city },
    })

    const token = fastify.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    })

    return reply.status(201).send({
      token,
      user: { id: user.id, name: user.name, city: user.city, role: user.role },
    })
  })

  // POST /auth/login
  fastify.post('/login', async (req, reply) => {
    const result = LoginSchema.safeParse(req.body)
    if (!result.success) {
      return reply.status(400).send({ error: 'Email atau password tidak valid' })
    }
    const { email, password } = result.data

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return reply.status(401).send({ error: 'Email atau password salah' })
    }

    const token = fastify.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    })

    return {
      token,
      user: { id: user.id, name: user.name, city: user.city, role: user.role },
    }
  })

  // GET /auth/me
  fastify.get('/me', { onRequest: [fastify.authenticate] }, async (req) => {
    return prisma.user.findUnique({
      where: { id: req.user.sub },
      select: {
        id: true,
        email: true,
        name: true,
        city: true,
        role: true,
        currentStreak: true,
        longestStreak: true,
        lastCheckin: true,
      },
    })
  })
}
