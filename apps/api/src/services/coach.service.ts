/**
 * Mock AI Coach — returns canned contextual advice.
 * Phase 2: replace with real Claude streaming.
 */

interface CoachContext {
  name: string
  city: string
  currentStreak: number
  avgKgco2e: number // 7-day average
}

const MOCK_TIPS = [
  (ctx: CoachContext) =>
    `Halo ${ctx.name}! Streak ${ctx.currentStreak} harimu di ${ctx.city} luar biasa 🎉. ` +
    `Rata-rata emisimu 7 hari terakhir ${ctx.avgKgco2e.toFixed(2)} kgCO₂e — ` +
    `${ctx.avgKgco2e < 5.97 ? 'sudah di bawah rata-rata nasional, pertahankan!' : 'masih bisa kita tekan lebih rendah.'}`,
  (ctx: CoachContext) =>
    `Untuk ${ctx.city}, coba perhatikan penggunaan transportasi. ` +
    `Mengganti satu perjalanan ojol 5 km dengan angkot bisa hemat ~0.24 kgCO₂e per hari.`,
  (ctx: CoachContext) =>
    `Pilihan makan nabati/vegetarian sekali sehari bisa memangkas sekitar 0.4 kgCO₂e ` +
    `dibanding makan warteg biasa. Coba sesekali! 🥦`,
]

export const coachService = {
  async getMockResponse(ctx: CoachContext): Promise<string> {
    // Simulate streaming delay in mock
    await new Promise((r) => setTimeout(r, 300))
    const tip = MOCK_TIPS[Math.floor(Math.random() * MOCK_TIPS.length)]
    return tip(ctx)
  },
}
