// env vars loaded via tsx --env-file flag in package.json (points to monorepo root .env)
import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'
import type { FastifyRequest, FastifyReply } from 'fastify'

import { authRoutes } from './routes/auth.routes'
import { diaryRoutes } from './routes/diary.routes'
import { leaderboardRoutes } from './routes/leaderboard.routes'
import { coachRoutes } from './routes/coach.routes'
import { badgeRoutes } from './routes/badge.routes'
import { adminRoutes } from './routes/admin/index'
import { publicTipsRoute } from './routes/admin/admin-tips.routes'
import { publicAnnouncementsRoute } from './routes/admin/admin-announcements.routes'
import { statsRoutes } from './routes/stats.routes'
import { aiScanRoutes } from './routes/ai-scan.routes'

async function main() {
  const app = Fastify({ logger: true })

  // ── Plugins ──────────────────────────────────────────────────────────────────

  // Build allowed origins list from env vars (comma-separated) + fallback for dev
  const allowedOrigins: (string | RegExp)[] = [
    /https:\/\/.*\.run\.app$/,          // semua Cloud Run services
    'http://localhost:5173',            // web dev
    'http://localhost:5174',            // admin dev
  ]
  if (process.env.FRONTEND_URL) allowedOrigins.push(process.env.FRONTEND_URL)
  if (process.env.ADMIN_URL)    allowedOrigins.push(process.env.ADMIN_URL)

  await app.register(cors, {
    origin: allowedOrigins,
    credentials: true,
  })

  await app.register(jwt, {
    secret: process.env.JWT_SECRET ?? 'dev-secret-change-in-production-min-32-chars!!',
  })

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  })

  // ── Decorators ───────────────────────────────────────────────────────────────

  app.decorate('authenticate', async function (req: FastifyRequest, reply: FastifyReply) {
    try {
      await req.jwtVerify()
    } catch (err) {
      reply.send(err)
    }
  })

  // ── Routes ───────────────────────────────────────────────────────────────────

  await app.register(authRoutes,        { prefix: '/auth' })
  await app.register(diaryRoutes,       { prefix: '/diary' })
  await app.register(leaderboardRoutes, { prefix: '/leaderboard' })
  await app.register(coachRoutes,       { prefix: '/coach' })
  await app.register(badgeRoutes,       { prefix: '/badges' })
  await app.register(adminRoutes,       { prefix: '/admin' })

  // Public CMS content (consumed by user app)
  await app.register(publicTipsRoute,          { prefix: '/content' })
  await app.register(publicAnnouncementsRoute, { prefix: '/content' })

  // Public platform + World Bank stats (no auth)
  await app.register(statsRoutes, { prefix: '/stats' })

  // AI features: scan receipt, proactive insight
  await app.register(aiScanRoutes, { prefix: '/ai' })

  // Health check
  app.get('/health', async () => ({ status: 'ok', ts: new Date(), env: process.env.NODE_ENV }))

  // ── Start ─────────────────────────────────────────────────────────────────────

  const port = parseInt(process.env.PORT ?? '3001')
  await app.listen({ port, host: '0.0.0.0' })
  console.log(`🌿 API running at http://localhost:${port}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
