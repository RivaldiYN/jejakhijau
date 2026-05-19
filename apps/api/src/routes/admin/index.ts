import type { FastifyPluginAsync } from 'fastify'
import { adminUsersRoutes } from './admin-users.routes'
import { adminBadgesRoutes } from './admin-badges.routes'
import { adminEmissionFactorsRoutes } from './admin-emission-factors.routes'
import { adminTipsRoutes } from './admin-tips.routes'
import { adminAnnouncementsRoutes } from './admin-announcements.routes'
import { adminAnalyticsRoutes } from './admin-analytics.routes'

export const adminRoutes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(adminAnalyticsRoutes,      { prefix: '/analytics' })
  await fastify.register(adminUsersRoutes,           { prefix: '/users' })
  await fastify.register(adminBadgesRoutes,          { prefix: '/badges' })
  await fastify.register(adminEmissionFactorsRoutes, { prefix: '/emission-factors' })
  await fastify.register(adminTipsRoutes,            { prefix: '/tips' })
  await fastify.register(adminAnnouncementsRoutes,   { prefix: '/announcements' })
}
