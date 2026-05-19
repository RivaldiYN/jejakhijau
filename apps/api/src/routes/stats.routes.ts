import type { FastifyPluginAsync } from 'fastify'
import { prisma } from '../lib/prisma'

// ─── Simple TTL in-memory cache ───────────────────────────────────────────────
const _cache = new Map<string, { v: unknown; exp: number }>()

async function withCache<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = _cache.get(key)
  if (hit && Date.now() < hit.exp) return hit.v as T
  const v = await fn()
  _cache.set(key, { v, exp: Date.now() + ttlMs })
  return v
}

// ─── World Bank Open Data — no auth required ─────────────────────────────────
// Indicator EN.ATM.CO2E.PC = CO2 per capita (metric tons/year)
async function fetchWorldBankCO2(iso3: string) {
  const url =
    `https://api.worldbank.org/v2/country/${iso3}/indicator/EN.ATM.CO2E.PC` +
    `?format=json&mrv=3&per_page=3`
  const res = await fetch(url, { signal: AbortSignal.timeout(5_000) })
  if (!res.ok) return null
  const [, values] = (await res.json()) as [
    unknown,
    Array<{ value: number | null; date: string }>,
  ]
  const latest = values?.find((v) => v.value != null)
  if (!latest?.value) return null
  return {
    yearlyTonCO2:  parseFloat(latest.value.toFixed(3)),
    dailyKgCO2:    parseFloat((latest.value * 1_000 / 365).toFixed(2)),
    year:          latest.date,
    source:        'World Bank / IEA (EN.ATM.CO2E.PC)',
  }
}

const HOUR = 60 * 60 * 1_000
const DAY  = 24 * HOUR

// ─── Route ────────────────────────────────────────────────────────────────────
export const statsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async (_req, reply) => {
    reply.header('Cache-Control', 'public, max-age=3600')

    // 1. Platform live stats (cache 1 h)
    const platform = await withCache('platform_stats', HOUR, async () => {
      const since7d = new Date()
      since7d.setDate(since7d.getDate() - 7)

      const [totalUsers, entries] = await Promise.all([
        prisma.user.count({ where: { role: 'user' } }),
        prisma.diaryEntry.findMany({
          where: { entryDate: { gte: since7d } },
          select: { totalKgco2e: true },
        }),
      ])

      const avgKgco2eDay = entries.length
        ? parseFloat((entries.reduce((s, e) => s + e.totalKgco2e, 0) / entries.length).toFixed(2))
        : null

      return { totalUsers, avgKgco2eDay, entriesLast7d: entries.length }
    })

    // 2. World Bank data (cache 24 h — data updates annually)
    const [indonesia, japan] = await Promise.all([
      withCache('wb_IDN', DAY, () => fetchWorldBankCO2('IDN')).catch(() => null),
      withCache('wb_JPN', DAY, () => fetchWorldBankCO2('JPN')).catch(() => null),
    ])

    return {
      platform,
      countries: { indonesia, japan },
      // ── Scientific constants (no public API available) ──────────────────────
      parisTarget: {
        // UNEP Emissions Gap Report 2023 + IPCC AR6 WG3
        // Individual carbon budget to limit warming to 1.5°C
        yearlyTonCO2: 2.0,
        dailyKgCO2:   5.48,
        source: 'UNEP Emissions Gap Report 2023, IPCC AR6 WG3',
      },
      indonesiaRisk: {
        // BMKG Indonesia Climate Risk Assessment 2022
        coastalRiskPercent: 17,
        source: 'BMKG Indonesia Climate Risk Assessment 2022',
      },
      updatedAt: new Date().toISOString(),
    }
  })
}
