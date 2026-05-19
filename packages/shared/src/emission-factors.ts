import type { DiaryEntry, MealType } from './types'

/**
 * DEFAULT EMISSION FACTORS — Baseline Indonesia-specific values.
 *
 * These are the fallback defaults. Admins can override any individual factor
 * via Admin CMS → Faktor Emisi without requiring a new deployment.
 * Overrides are stored in the `EmissionFactorOverride` table and applied
 * server-side on every diary check-in.
 *
 * DATA SOURCES
 * ─────────────
 * Electricity (listrikPlnPerKwh):
 *   PLN RUPTL 2023 — National grid emission factor (Rencana Usaha Penyediaan Tenaga Listrik)
 *   National avg 0.724 kgCO2e/kWh | Jawa-Bali: 0.821 | Sumatera: 0.644
 *   https://web.pln.co.id/statics/uploads/2023/06/RUPTL-PLN-2021-2030.pdf
 *
 * Transport — motorcycle / ojol (ojolPerKm):
 *   KLHK (Ministry of Environment & Forestry) Emission Factor Database 2023
 *   Indonesian average petrol motorcycle fleet, IPCC Tier 2 methodology
 *   https://www.klhk.go.id/sipongi
 *
 * Transport — angkot / bus (angkotPerKm):
 *   IPCC AR6 WG3 Table 10.9 — per passenger-km, Southeast Asia regional average
 *   https://www.ipcc.ch/report/ar6/wg3/
 *
 * Transport — KRL / MRT (krlPerKm):
 *   Derived: PT KAI Commuter energy intensity (kWh/pkm) × PLN RUPTL 2023 grid factor
 *   PT KAI Commuter Annual Report 2022 + PLN RUPTL 2023
 *
 * Plastic bags (plastikKresek):
 *   UNEP "Single-use Plastics: A Roadmap for Sustainability" 2021
 *   LDPE bag, lifecycle including production
 *
 * Food — meal emission factors:
 *   FAO GLEAM 2.0 (Global Livestock Environmental Assessment Model)
 *   Localized for Indonesian food patterns by KLHK 2022
 *   https://www.fao.org/gleam/en/
 *
 * Waste burning (bakarSampahPerKg):
 *   IPCC 2006 Guidelines for National GHG Inventories, Vol. 5 (Waste)
 *   Default emission factor for mixed municipal solid waste open burning
 *   https://www.ipcc-nggip.iges.or.jp/public/2006gl/vol5.html
 *
 * National average (INDONESIA_DAILY_AVG):
 *   IEA World Energy Outlook 2023 + World Bank EN.ATM.CO2E.PC indicator
 *   2.18 tCO2/person/year ÷ 365 = 5.97 kgCO2e/day
 *   Live data available via /stats API endpoint (World Bank Open Data)
 */

export const DEFAULT_EMISSION_FACTORS = {
  // Transport — kgCO2e per km
  ojolPerKm:         0.089,  // KLHK 2023 — petrol motorcycle
  angkotPerKm:       0.042,  // IPCC AR6 WG3 — SE Asia bus/angkot per pkm
  krlPerKm:          0.018,  // KAI Commuter + PLN RUPTL 2023
  motorPribadiPerKm: 0.095,  // KLHK 2023 — private motorcycle
  mobilPerKm:        0.192,  // KLHK 2023 — average car
  // Goods & energy
  plastikKresek:    0.025,   // UNEP 2021 — per LDPE bag
  listrikPlnPerKwh: 0.724,   // PLN RUPTL 2023 — national grid avg
  bakarSampahPerKg: 2.100,   // IPCC 2006 Vol.5 — mixed MSW open burning
  // Food — kgCO2e per meal, FAO GLEAM 2.0 + KLHK 2022
  meal: {
    warteg:        0.620,   // Rice + mixed protein, typical warung
    gofood:        0.665,   // warteg meal + 0.045 last-mile delivery motor
    masak_sendiri: 0.480,   // Home-cooked, lower processing & packaging waste
    vegetarian:    0.210,   // Plant-based meal, FAO GLEAM 2.0
  },
} as const

/**
 * Indonesia national average daily emission.
 * Source: World Bank EN.ATM.CO2E.PC (2.18 tCO2/year) ÷ 365
 *
 * NOTE: The /stats API endpoint fetches live data from World Bank Open Data,
 * so frontend should prefer that value over this constant.
 * Last known value: 5.97 kgCO2e/day (World Bank data year 2022, published 2024)
 */
export const INDONESIA_DAILY_AVG = 5.97

export const MEAL_LABELS: Record<MealType, string> = {
  warteg:        'Warteg / warung nasi',
  gofood:        'Pesan GoFood / ojol',
  masak_sendiri: 'Masak sendiri',
  vegetarian:    'Vegetarian / nabati',
}

export const MEAL_EMOJIS: Record<MealType, string> = {
  warteg:        '🍛',
  gofood:        '🛵',
  masak_sendiri: '👨‍🍳',
  vegetarian:    '🥦',
}

// ─── Calculator ───────────────────────────────────────────────────────────────

type EntryFields = Pick<DiaryEntry,
  'ojolKm' | 'angkotKm' | 'krlKm' | 'plastikCount' |
  'listrikKwh' | 'bakarSampahKg' | 'mealType'
>

/**
 * Calculate total daily emission in kgCO2e.
 *
 * @param entry     - Diary entry fields
 * @param overrides - Optional admin CMS overrides (key → value map from DB)
 *                    Keys use dot notation for nested: "meal.vegetarian"
 */
export function calculateTotal(
  entry: EntryFields,
  overrides: Record<string, number> = {}
): number {
  // Separate meal from the numeric top-level factors so TypeScript can
  // type the latter correctly as Record<string, number> without a cast.
  const { meal: _defaultMeal, ...numericDefaults } = DEFAULT_EMISSION_FACTORS

  const factors: Record<string, number> = { ...numericDefaults }
  const meal: Record<MealType, number>  = { ..._defaultMeal }

  for (const [key, val] of Object.entries(overrides)) {
    if (key.startsWith('meal.')) {
      const mealKey = key.replace('meal.', '') as MealType
      if (mealKey in meal) meal[mealKey] = val
    } else if (key in factors) {
      factors[key] = val
    }
  }

  return (
    entry.ojolKm        * factors.ojolPerKm +
    entry.angkotKm      * factors.angkotPerKm +
    entry.krlKm         * factors.krlPerKm +
    entry.plastikCount  * factors.plastikKresek +
    entry.listrikKwh    * factors.listrikPlnPerKwh +
    entry.bakarSampahKg * factors.bakarSampahPerKg +
    meal[entry.mealType]
  )
}
