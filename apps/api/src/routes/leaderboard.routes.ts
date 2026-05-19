import type { FastifyPluginAsync } from 'fastify'
import { leaderboardService } from '../services/leaderboard.service'

export const leaderboardRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /leaderboard/cities
  fastify.get('/cities', async (_req, reply) => {
    const ranking = await leaderboardService.getCityRanking()
    return reply.send(ranking)
  })
}
