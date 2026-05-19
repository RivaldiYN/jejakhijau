import { GoogleGenAI } from '@google/genai'
import { config } from 'dotenv'
import { resolve } from 'path'
import { existsSync } from 'fs'

// Probe all possible .env locations — works regardless of which dir turborepo uses as CWD
const ENV_CANDIDATES = [
  resolve(process.cwd(), '.env'),           // root if run from monorepo root
  resolve(process.cwd(), '../../.env'),     // root if run from apps/api
  resolve(process.cwd(), '../../../.env'),  // root if run from apps/api/src
  resolve(__dirname, '../../../../.env'),   // absolute: services→src→api→apps→root
]
for (const p of ENV_CANDIDATES) {
  if (existsSync(p)) {
    const result = config({ path: p })
    if (!result.error) {
      console.log(`[Gemini] Loaded .env from: ${p}`)
      break
    }
  }
}


// ─── Lazy initialization ───────────────────────────────────────────────────────
// Do NOT initialize at module load time — env vars might not be loaded yet.
// Instead, create the client on first use via getAI().
let _ai: GoogleGenAI | null | undefined = undefined // undefined = "not checked yet"

function getAI(): GoogleGenAI | null {
  if (_ai !== undefined) return _ai
  const key = process.env.GEMINI_API_KEY
  console.log('[Gemini] GEMINI_API_KEY loaded:', key ? `✅ (${key.slice(0, 8)}...)` : '❌ NOT FOUND')
  _ai = key && key !== 'YOUR_GEMINI_API_KEY_HERE' ? new GoogleGenAI({ apiKey: key }) : null
  if (_ai) console.log('✅ [Gemini] AI client initialized — real AI active')
  else console.warn('⚠️  [Gemini] No valid GEMINI_API_KEY — mock mode active')
  return _ai
}

export const geminiService = {
  isAvailable: () => !!getAI(),

  // ─── AI Coach chat ───────────────────────────────────────────────────────────
  async getCoachResponse(context: {
    name: string
    city: string
    currentStreak: number
    avgKgco2e: number
    message: string
  }): Promise<string> {
    const ai = getAI()
    if (!ai) return getMockCoachResponse(context)

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        config: {
          systemInstruction: `Kamu adalah JejakCoach, AI coach karbon personal yang ramah dan memotivasi untuk aplikasi JejakHijau di Indonesia.

Konteks pengguna:
- Nama: ${context.name}
- Kota: ${context.city}
- Streak saat ini: ${context.currentStreak} hari berturut-turut
- Rata-rata emisi 7 hari: ${context.avgKgco2e.toFixed(2)} kgCO₂e/hari
- Rata-rata nasional Indonesia: 5.97 kgCO₂e/hari

Panduan respons:
1. Selalu sapa dengan nama pengguna di awal
2. Respons dalam Bahasa Indonesia yang hangat dan personal
3. Berikan saran konkret, spesifik, dan actionable (bukan tips generik)
4. Sebutkan angka estimasi penghematan CO₂ bila memungkinkan
5. Maksimal 3 paragraf pendek
6. Akhiri dengan 1 kalimat motivasi singkat`,
        },
        contents: context.message,
      })
      return response.text ?? getMockCoachResponse(context)
    } catch (err) {
      console.error('[Gemini] getCoachResponse error:', err)
      return getMockCoachResponse(context)
    }
  },

  // ─── Proactive insight ────────────────────────────────────────────────────────
  async getProactiveInsight(context: {
    name: string
    avgKgco2e: number
    highestCategory: string
    trend: 'up' | 'down' | 'stable'
  }): Promise<string> {
    const ai = getAI()
    if (!ai) return getMockInsight(context)

    const trendText = context.trend === 'up' ? 'naik' : context.trend === 'down' ? 'turun' : 'stabil'
    const prompt = `Buat insight singkat dan personal untuk ${context.name} tentang jejak karbonnya.
Data: rata-rata ${context.avgKgco2e.toFixed(2)} kgCO₂e/hari, tren minggu ini: ${trendText}, kategori emisi terbesar: ${context.highestCategory}.
Berikan 1 saran aksi yang konkret dan spesifik.
Gunakan Bahasa Indonesia yang hangat dan friendly. Maksimal 2 kalimat.`

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
      })
      return response.text ?? getMockInsight(context)
    } catch (err) {
      console.error('[Gemini] getProactiveInsight error:', err)
      return getMockInsight(context)
    }
  },

  // ─── AI Vision: scan receipt ──────────────────────────────────────────────────
  async scanReceipt(imageBase64: string, mimeType: string): Promise<ScanResult> {
    const ai = getAI()
    if (!ai) return getMockScanResult()

    const prompt = `Kamu adalah asisten yang mengekstrak data emisi karbon dari foto/struk belanja atau tagihan.
Analisis gambar dan kembalikan HANYA JSON (tanpa markdown, tanpa penjelasan) dengan format:
{
  "type": "transport" | "food" | "energy" | "unknown",
  "items": [
    {
      "label": "nama item yang ditemukan",
      "value": angka_numerik_atau_null,
      "unit": "km" | "kWh" | "kg" | "porsi" | "lembar" | null,
      "emissionField": "ojolKm" | "angkotKm" | "krlKm" | "listrikKwh" | "bakarSampahKg" | "plastikCount" | "mealType",
      "mealTypeValue": "warteg" | "gofood" | "masak_sendiri" | "vegetarian"
    }
  ],
  "confidence": 0.0,
  "description": "deskripsi singkat bahasa Indonesia"
}

Aturan:
- Struk GoFood/GrabFood/ShopeeFood → emissionField: "mealType", mealTypeValue: "gofood"
- Struk PLN/listrik → emissionField: "listrikKwh", value: jumlah kWh dari tagihan
- Struk SPBU Pertamina/Shell (bensin) → hitung km: volume_liter × 45 (asumsi motor), emissionField: "ojolKm"
- Struk warteg/restoran/coffee shop → emissionField: "mealType", mealTypeValue: "warteg"
- Jika tidak ada data relevan → confidence: 0.1, items: []`

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { mimeType, data: imageBase64 } },
              { text: prompt },
            ],
          },
        ],
      })
      const text = response.text?.trim() ?? '{}'
      // Strip markdown code fences if present
      const cleaned = text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim()
      return JSON.parse(cleaned) as ScanResult
    } catch (err) {
      console.error('[Gemini] scanReceipt error:', err)
      return getMockScanResult()
    }
  },
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ScanItem {
  label: string
  value?: number
  unit?: string
  emissionField: string
  mealTypeValue?: string
}

export interface ScanResult {
  type: 'transport' | 'food' | 'energy' | 'unknown'
  items: ScanItem[]
  confidence: number
  description: string
}

// ─── Fallback mocks ───────────────────────────────────────────────────────────
function getMockCoachResponse(ctx: { name: string; avgKgco2e: number; currentStreak: number }): string {
  const below = ctx.avgKgco2e < 5.97
  if (ctx.currentStreak >= 7) {
    return `Luar biasa, ${ctx.name}! 🔥 Sudah ${ctx.currentStreak} hari check-in berturut-turut — konsistensi yang nyata!\n\nRata-rata emisimu ${ctx.avgKgco2e.toFixed(2)} kgCO₂e/hari${below ? ', sudah di bawah rata-rata nasional 5.97 kg. Pertahankan!' : '. Coba ganti 1–2 perjalanan ojol dengan KRL minggu ini untuk hemat ~0.3 kg CO₂e per hari.'}\n\nTerus catat jejakmu — setiap tindakan kecil berkontribusi besar untuk bumi. 🌿`
  }
  return `Halo ${ctx.name}! Rata-rata emisimu ${ctx.avgKgco2e.toFixed(2)} kgCO₂e/hari. ${below ? 'Keren, sudah di bawah rata-rata nasional!' : 'Coba ganti 1 perjalanan ojol dengan KRL untuk hemat ~0.35 kg CO₂e.'}\n\nYuk bangun streak harianmu — konsistensi mencatat adalah kunci kesadaran lingkungan. 💚`
}

function getMockInsight(ctx: { name: string; avgKgco2e: number; trend: string }): string {
  const trendMsg = ctx.trend === 'up' ? 'naik minggu ini ⚠️' : ctx.trend === 'down' ? 'turun — kerja bagus! 👍' : 'stabil'
  return `Emisimu ${ctx.avgKgco2e.toFixed(2)} kgCO₂e/hari, tren ${trendMsg}. Coba ganti 1 meal GoFood dengan masak sendiri besok untuk hemat ~0.18 kg CO₂e! 🌿`
}

function getMockScanResult(): ScanResult {
  return {
    type: 'unknown',
    items: [],
    confidence: 0,
    description: 'Mode demo — tambahkan GEMINI_API_KEY yang valid di .env untuk mengaktifkan AI Vision.',
  }
}
