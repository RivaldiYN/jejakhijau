import { useState, useMemo, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { calculateTotal, MEAL_LABELS, MEAL_EMOJIS, INDONESIA_DAILY_AVG } from '@jejakhijau/shared'
import type { MealType } from '@jejakhijau/shared'
import { api } from '../lib/api'
import {
  Flame, CheckCircle2, Info, Scan, Upload, X, Sparkles, Camera,
  Loader2, ChevronDown, ChevronUp,
} from 'lucide-react'

const MEAL_TYPES: MealType[] = ['warteg', 'gofood', 'masak_sendiri', 'vegetarian']

const TRANSPORT = [
  { key: 'ojolKm',   label: 'Ojol / motor',  unit: 'km', step: 0.5, emoji: '🛵', factor: '0.089 kg/km' },
  { key: 'angkotKm', label: 'Angkot / bus',  unit: 'km', step: 1,   emoji: '🚌', factor: '0.042 kg/km' },
  { key: 'krlKm',    label: 'KRL / MRT',     unit: 'km', step: 1,   emoji: '🚆', factor: '0.018 kg/km' },
]
const OTHERS = [
  { key: 'plastikCount',  label: 'Kantong plastik', unit: 'lbr', step: 1,   emoji: '🛍️', factor: '0.025 kg/lbr' },
  { key: 'listrikKwh',    label: 'Listrik PLN',     unit: 'kWh', step: 0.5, emoji: '⚡', factor: '0.724 kg/kWh' },
  { key: 'bakarSampahKg', label: 'Bakar sampah',    unit: 'kg',  step: 0.5, emoji: '🔥', factor: '2.10 kg/kg' },
]

const defaultForm = {
  ojolKm: 0, angkotKm: 0, krlKm: 0,
  plastikCount: 0, listrikKwh: 0, bakarSampahKg: 0,
  mealType: 'warteg' as MealType,
}

// ─── Stepper ──────────────────────────────────────────────────────────────────
function Stepper({ value, unit, onDec, onInc }: {
  value: number; unit: string
  onDec: () => void; onInc: () => void
}) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={onDec}
        className="w-7 h-7 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 font-bold text-sm flex items-center justify-center"
        aria-label="Kurangi">−</button>
      <span className="w-14 text-center text-sm font-semibold text-gray-900 tabular-nums">
        {value}<span className="text-xs font-normal text-gray-400 ml-0.5">{unit}</span>
      </span>
      <button type="button" onClick={onInc}
        className="w-7 h-7 rounded-lg border border-[#C0DD97] bg-[#EAF3DE] text-[#3B6D11] hover:bg-[#C0DD97] font-bold text-sm flex items-center justify-center"
        aria-label="Tambah">+</button>
    </div>
  )
}

// ─── AI Scan Modal ────────────────────────────────────────────────────────────
function AiScanPanel({ onApply, onClose }: {
  onApply: (data: Partial<typeof defaultForm>) => void
  onClose: () => void
}) {
  const [preview, setPreview] = useState<string | null>(null)
  const [scanResult, setScanResult] = useState<any>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scanMutation = useMutation({
    mutationFn: (body: { imageBase64: string; mimeType: string }) =>
      api.post('/ai/scan', body).then((r) => r.data),
    onSuccess: (data) => setScanResult(data),
  })

  function handleFile(file: File) {
    setScanResult(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      setPreview(dataUrl)
      const base64 = dataUrl.split(',')[1]
      scanMutation.mutate({ imageBase64: base64, mimeType: file.type })
    }
    reader.readAsDataURL(file)
  }

  function applyResult() {
    if (!scanResult?.items?.length) return
    const patch: Partial<typeof defaultForm> = {}
    for (const item of scanResult.items) {
      if (item.emissionField === 'mealType' && item.mealTypeValue) {
        patch.mealType = item.mealTypeValue
      } else if (item.value !== undefined && item.emissionField in defaultForm) {
        (patch as any)[item.emissionField] = item.value
      }
    }
    onApply(patch)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#EAF3DE] rounded-lg flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-[#3B6D11]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">AI Scan Struk</h2>
              <p className="text-xs text-gray-400">Upload foto struk untuk kalkulasi otomatis</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Upload area */}
          <div
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              preview ? 'border-[#C0DD97] bg-[#EAF3DE]/30' : 'border-gray-200 hover:border-[#C0DD97] hover:bg-[#EAF3DE]/20'
            }`}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
            {preview ? (
              <img src={preview} alt="Preview struk" className="max-h-40 mx-auto rounded-lg object-contain" />
            ) : (
              <div className="space-y-2">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto">
                  <Camera className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-600">Klik untuk pilih foto</p>
                <p className="text-xs text-gray-400">Struk PLN, GoFood, Pertamina, dll · JPEG / PNG / WebP</p>
              </div>
            )}
          </div>

          {/* Scanning state */}
          {scanMutation.isPending && (
            <div className="flex items-center gap-3 bg-[#EAF3DE] rounded-xl px-4 py-3">
              <Loader2 className="w-4 h-4 text-[#3B6D11] animate-spin flex-shrink-0" />
              <p className="text-sm text-[#3B6D11] font-medium">AI sedang menganalisis gambar...</p>
            </div>
          )}

          {/* Scan result */}
          {scanResult && !scanMutation.isPending && (
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-700">
                  {scanResult.isDemo
                    ? '🔑 Mode Demo — tambahkan Gemini API key'
                    : `✅ Ditemukan: ${scanResult.description}`}
                </p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  scanResult.confidence > 0.7
                    ? 'bg-green-100 text-green-700'
                    : scanResult.confidence > 0.4
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {Math.round(scanResult.confidence * 100)}% yakin
                </span>
              </div>

              {scanResult.items?.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {scanResult.items.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between px-4 py-2.5">
                      <p className="text-sm text-gray-700">{item.label}</p>
                      <p className="text-sm font-semibold text-[#3B6D11]">
                        {item.value !== undefined ? `${item.value} ${item.unit}` : item.mealTypeValue}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="px-4 py-3 text-sm text-gray-500">
                  Tidak ada data emisi yang terdeteksi. Coba foto yang lebih jelas.
                </p>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl text-sm hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={applyResult}
              disabled={!scanResult?.items?.length || scanMutation.isPending}
              className="flex-1 bg-[#3B6D11] hover:bg-[#27500A] disabled:opacity-40 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Terapkan ke Form
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Diary ───────────────────────────────────────────────────────────────
export default function Diary() {
  const qc = useQueryClient()
  const [form, setForm] = useState(defaultForm)
  const [newBadges, setNewBadges] = useState<any[]>([])
  const [showScan, setShowScan] = useState(false)
  const [showOthers, setShowOthers] = useState(false)

  const { data: todayEntry } = useQuery({
    queryKey: ['diary', 'today'],
    queryFn: () => api.get('/diary/today').then((r) => r.data),
  })

  const total = useMemo(() => calculateTotal(form), [form])
  const diff = total - INDONESIA_DAILY_AVG
  const isGood = diff <= 0

  const mutation = useMutation({
    mutationFn: () => api.post('/diary', form),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['diary'] })
      qc.invalidateQueries({ queryKey: ['coach', 'insight'] })
      if (res.data.newBadges?.length) setNewBadges(res.data.newBadges)
    },
  })

  const set = (key: string, val: number) =>
    setForm((f) => ({ ...f, [key]: parseFloat(Math.max(0, val).toFixed(1)) }))

  function applyAiScan(patch: Partial<typeof defaultForm>) {
    setForm((f) => ({ ...f, ...patch }))
  }

  // ── Already checked in ────────────────────────────────────────────────────
  if (todayEntry) {
    const below = todayEntry.totalKgco2e < INDONESIA_DAILY_AVG
    return (
      <div className="flex flex-col items-center justify-center text-center py-14">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
          below ? 'bg-[#EAF3DE]' : 'bg-amber-50'
        }`}>
          <CheckCircle2 className={`w-8 h-8 ${below ? 'text-[#3B6D11]' : 'text-amber-600'}`} />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">Sudah check-in hari ini!</h1>
        <p className="text-gray-500 text-sm mb-5">Kembali besok untuk melanjutkan streak 🔥</p>
        <div className={`inline-block rounded-2xl px-8 py-4 ${below ? 'bg-[#EAF3DE]' : 'bg-amber-50'}`}>
          <p className={`text-4xl font-black ${below ? 'text-[#1a3a06]' : 'text-amber-800'}`}>
            {todayEntry.totalKgco2e?.toFixed(2)}
            <span className="text-lg font-normal ml-1">kgCO₂e</span>
          </p>
          <p className={`text-xs mt-1.5 font-medium ${below ? 'text-[#3B6D11]' : 'text-amber-700'}`}>
            {below
              ? `↓ ${Math.abs(diff).toFixed(2)} kg di bawah rata-rata nasional`
              : `↑ ${Math.abs(diff).toFixed(2)} kg di atas rata-rata nasional`}
          </p>
        </div>
        {newBadges.length > 0 && (
          <div className="mt-5 bg-[#EAF3DE] border border-[#C0DD97] rounded-2xl p-4 max-w-xs">
            <p className="font-bold text-[#1a3a06] text-sm mb-2">🏅 Badge baru diraih!</p>
            {newBadges.map((b: any) => (
              <p key={b.id} className="text-sm text-[#3B6D11]">✨ {b.name}</p>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── Check-in form ─────────────────────────────────────────────────────────
  return (
    <>
      {showScan && <AiScanPanel onApply={applyAiScan} onClose={() => setShowScan(false)} />}

      <div className="space-y-4 max-w-2xl mx-auto">
        {/* Page header + AI scan button */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Check-in hari ini</h1>
            <p className="text-gray-500 text-sm mt-0.5">Catat aktivitas harianmu</p>
          </div>
          <button
            type="button"
            onClick={() => setShowScan(true)}
            className="flex-shrink-0 flex items-center gap-1.5 bg-[#0f2406] hover:bg-[#1a3a06] text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-md"
          >
            <Scan className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Scan Struk AI</span>
            <span className="sm:hidden">AI Scan</span>
            <span className="bg-[#a8d470] text-[#0f2406] text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-0.5">BARU</span>
          </button>
        </div>

        {/* Live emission preview */}
        <div className={`rounded-2xl p-5 transition-colors ${isGood ? 'bg-[#EAF3DE]' : 'bg-amber-50'}`}>
          <p className="text-xs font-medium text-gray-500 mb-1">Estimasi emisi hari ini</p>
          <p className={`text-4xl font-black ${isGood ? 'text-[#1a3a06]' : 'text-amber-900'}`}>
            {total.toFixed(2)}{' '}
            <span className="text-base font-normal text-gray-500">kgCO₂e</span>
          </p>
          <p className={`text-xs mt-1.5 font-medium ${isGood ? 'text-[#3B6D11]' : 'text-amber-700'}`}>
            {isGood
              ? `↓ ${Math.abs(diff).toFixed(2)} kg di bawah rata-rata nasional (${INDONESIA_DAILY_AVG} kg)`
              : `↑ ${diff.toFixed(2)} kg di atas rata-rata nasional (${INDONESIA_DAILY_AVG} kg)`}
          </p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate() }} className="space-y-3">
          {/* Transport */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50">
              <h2 className="text-sm font-semibold text-gray-800">🚗 Transportasi hari ini</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {TRANSPORT.map(({ key, label, unit, step, emoji, factor }) => (
                <div key={key} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700">{emoji} {label}</p>
                    <p className="text-xs text-gray-400">{factor}</p>
                  </div>
                  <Stepper
                    value={(form as any)[key]} unit={unit}
                    onDec={() => set(key, (form as any)[key] - step)}
                    onInc={() => set(key, (form as any)[key] + step)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Meal */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">🍽️ Pilihan makan</h2>
            <div className="grid grid-cols-2 gap-2">
              {MEAL_TYPES.map((m) => (
                <label
                  key={m}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors ${
                    form.mealType === m
                      ? 'border-[#3B6D11] bg-[#EAF3DE]'
                      : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                  }`}
                >
                  <input
                    type="radio" name="mealType" value={m}
                    checked={form.mealType === m}
                    onChange={() => setForm((f) => ({ ...f, mealType: m }))}
                    className="sr-only"
                  />
                  <span className="text-base leading-none">{MEAL_EMOJIS[m]}</span>
                  <span className="text-xs font-medium text-gray-700 leading-snug">{MEAL_LABELS[m]}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Others — collapsible */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setShowOthers(!showOthers)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
            >
              <h2 className="text-sm font-semibold text-gray-800">⚡ Energi & sampah</h2>
              {showOthers ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {showOthers && (
              <div className="divide-y divide-gray-50">
                {OTHERS.map(({ key, label, unit, step, emoji, factor }) => (
                  <div key={key} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700">{emoji} {label}</p>
                      <p className="text-xs text-gray-400">{factor}</p>
                    </div>
                    <Stepper
                      value={(form as any)[key]} unit={unit}
                      onDec={() => set(key, (form as any)[key] - step)}
                      onInc={() => set(key, (form as any)[key] + step)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-start gap-2 text-xs text-gray-400 px-1">
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>Faktor emisi: PLN RUPTL 2023, KLHK, IPCC AR6, FAO 2021</span>
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full flex items-center justify-center gap-2 bg-[#3B6D11] hover:bg-[#27500A] disabled:opacity-50 text-white font-semibold py-4 rounded-2xl text-sm shadow-md"
          >
            <Flame className="w-4 h-4" />
            {mutation.isPending ? 'Menyimpan...' : 'Simpan diary hari ini'}
          </button>
        </form>
      </div>
    </>
  )
}
