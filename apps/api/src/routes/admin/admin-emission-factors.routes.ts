import type { FastifyPluginAsync } from 'fastify'
import { prisma } from '../../lib/prisma'
import { adminGuard } from '../../middleware/admin.middleware'
import { DEFAULT_EMISSION_FACTORS } from '@jejakhijau/shared'

export const adminEmissionFactorsRoutes: FastifyPluginAsync = async (fastify) => {
  const guard = { onRequest: [fastify.authenticate, adminGuard] }

  // GET /admin/emission-factors — returns defaults merged with overrides
  fastify.get('/', guard, async () => {
    const overrides = await prisma.emissionFactorOverride.findMany()
    const overrideMap: Record<string, number> = {}
    for (const row of overrides) overrideMap[row.key] = row.value

    // Flatten the nested defaults
    const defaults: Record<string, number> = {
      ojolPerKm:          DEFAULT_EMISSION_FACTORS.ojolPerKm,
      angkotPerKm:        DEFAULT_EMISSION_FACTORS.angkotPerKm,
      krlPerKm:           DEFAULT_EMISSION_FACTORS.krlPerKm,
      plastikKresek:      DEFAULT_EMISSION_FACTORS.plastikKresek,
      listrikPlnPerKwh:   DEFAULT_EMISSION_FACTORS.listrikPlnPerKwh,
      bakarSampahPerKg:   DEFAULT_EMISSION_FACTORS.bakarSampahPerKg,
      'meal.warteg':      DEFAULT_EMISSION_FACTORS.meal.warteg,
      'meal.gofood':      DEFAULT_EMISSION_FACTORS.meal.gofood,
      'meal.masak_sendiri': DEFAULT_EMISSION_FACTORS.meal.masak_sendiri,
      'meal.vegetarian':  DEFAULT_EMISSION_FACTORS.meal.vegetarian,
    }

    return Object.entries(defaults).map(([key, defaultValue]) => ({
      key,
      defaultValue,
      currentValue: overrideMap[key] ?? defaultValue,
      isOverridden: key in overrideMap,
    }))
  })

  // PUT /admin/emission-factors — upsert a single override
  fastify.put('/', guard, async (req, reply) => {
    const { key, value } = req.body as { key: string; value: number }
    if (!key || value == null) {
      return reply.status(400).send({ error: 'key dan value wajib diisi' })
    }
    const updated = await prisma.emissionFactorOverride.upsert({
      where: { key },
      update: { value, updatedBy: req.user.sub },
      create: { key, value, updatedBy: req.user.sub },
    })
    return updated
  })

  // DELETE /admin/emission-factors/:key — restore to default
  fastify.delete('/:key', guard, async (req) => {
    const { key } = req.params as { key: string }
    await prisma.emissionFactorOverride.deleteMany({ where: { key } })
    return { success: true, message: `${key} dikembalikan ke default` }
  })
}
