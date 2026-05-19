import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../stores/auth.store'
import { api } from '../lib/api'
import {
  ArrowRight, Leaf, ChevronDown, Bike, Zap, Utensils,
  BarChart2, Award, MessageCircle, Check, TreePine, Wind, Droplets,
} from 'lucide-react'

// ─── Intersection Observer hook ───────────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

// ─── Animated counter ─────────────────────────────────────────────────────────
function Counter({ target, suffix = '', decimals = 0 }: { target: number; suffix?: string; decimals?: number }) {
  const [val, setVal] = useState(0)
  const { ref, inView } = useInView()
  useEffect(() => {
    if (!inView) return
    let start = 0
    const step = target / 60
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setVal(target); clearInterval(timer) }
      else setVal(start)
    }, 16)
    return () => clearInterval(timer)
  }, [inView, target])
  return (
    <span ref={ref}>
      {decimals > 0 ? val.toFixed(decimals) : Math.floor(val).toLocaleString('id-ID')}{suffix}
    </span>
  )
}

// ─── Emission factors data ────────────────────────────────────────────────────
const EMISSION_FACTORS = [
  {
    category: 'Transportasi', icon: Bike, color: 'bg-blue-50 text-blue-700',
    items: [
      { label: 'Ojol / motor bensin', value: '0.089', unit: 'kgCO₂e/km', source: 'KLHK 2023' },
      { label: 'Angkot / bus kota',   value: '0.042', unit: 'kgCO₂e/km', source: 'IPCC AR6' },
      { label: 'KRL / MRT / LRT',     value: '0.018', unit: 'kgCO₂e/km', source: 'PLN RUPTL 2023' },
    ],
  },
  {
    category: 'Makanan', icon: Utensils, color: 'bg-green-50 text-green-700',
    items: [
      { label: 'Warteg / warung nasi', value: '0.620', unit: 'kgCO₂e/porsi', source: 'FAO 2021' },
      { label: 'GoFood (+ delivery)',  value: '0.665', unit: 'kgCO₂e/porsi', source: 'KLHK + IPCC' },
      { label: 'Masak sendiri',        value: '0.480', unit: 'kgCO₂e/porsi', source: 'FAO 2021' },
      { label: 'Vegetarian/nabati',    value: '0.210', unit: 'kgCO₂e/porsi', source: 'FAO 2021' },
    ],
  },
  {
    category: 'Energi & Sampah', icon: Zap, color: 'bg-amber-50 text-amber-700',
    items: [
      { label: 'Listrik PLN',          value: '0.724', unit: 'kgCO₂e/kWh', source: 'PLN RUPTL 2023' },
      { label: 'Bakar sampah campuran',value: '2.100', unit: 'kgCO₂e/kg',  source: 'IPCC AR6' },
      { label: 'Kantong plastik',      value: '0.025', unit: 'kgCO₂e/lembar', source: 'UNEP 2021' },
    ],
  },
]

const HOW_IT_WORKS = [
  {
    step: '01', icon: Leaf,
    title: 'Catat harian dalam 60 detik',
    desc: 'Isi aktivitas transportasi, makan siang, dan konsumsi energimu. Tidak perlu data rumit — cukup pilih yang sesuai.',
  },
  {
    step: '02', icon: BarChart2,
    title: 'Lihat jejak karbonmu',
    desc: 'Emisimu dihitung secara real-time berdasarkan faktor ilmiah dari PLN, KLHK, dan IPCC. Bandingkan dengan rata-rata nasional.',
  },
  {
    step: '03', icon: Award,
    title: 'Bangun streak & menangkan tantangan',
    desc: 'Kumpulkan badge, bangun streak harian, dan bersaing dengan kota lain. Karena perubahan iklim butuh aksi kolektif.',
  },
]

// ─── Main component ───────────────────────────────────────────────────────────
export default function Home() {
  const { token } = useAuthStore()
  const navigate = useNavigate()
  const heroRef = useRef<HTMLElement>(null)

  useEffect(() => { if (token) navigate('/app/diary') }, [token, navigate])

  // Fetch live stats: World Bank CO2 data + platform DB stats
  const { data: stats } = useQuery({
    queryKey: ['public', 'stats'],
    queryFn: () => api.get('/stats').then((r) => r.data),
    staleTime: 60 * 60_000, // 1 hour — data changes annually
    retry: 1,
  })

  // Dynamic values with scientific fallbacks
  const idnDaily   = stats?.countries?.indonesia?.dailyKgCO2   ?? 5.97
  const idnYearly  = stats?.countries?.indonesia?.yearlyTonCO2 ?? 2.18
  const idnYear    = stats?.countries?.indonesia?.year          ?? '2022'
  const jpnDaily   = stats?.countries?.japan?.dailyKgCO2       ?? 8.22
  const parisDaily = stats?.parisTarget?.dailyKgCO2            ?? 5.48
  const riskPct    = stats?.indonesiaRisk?.coastalRiskPercent  ?? 17
  const maxDaily   = Math.max(idnDaily, jpnDaily, 10)

  function scrollDown() {
    heroRef.current?.nextElementSibling?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* ── Sticky nav ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#3B6D11] rounded-lg flex items-center justify-center">
              <Leaf className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-[#1a3a06] text-sm">JejakHijau</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/auth?tab=login')}
              className="text-sm font-medium text-gray-600 hover:text-[#3B6D11] px-3 py-1.5 rounded-lg hover:bg-[#EAF3DE]"
            >
              Masuk
            </button>
            <button
              onClick={() => navigate('/auth')}
              className="text-sm font-semibold bg-[#3B6D11] hover:bg-[#27500A] text-white px-4 py-1.5 rounded-lg"
            >
              Daftar Akun
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative bg-[#0f2406] text-white overflow-hidden">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28 lg:py-36">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/80 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
              <Wind className="w-3.5 h-3.5" />
              Untuk Indonesia yang lebih hijau
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight mb-6"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Rata-rata orang Indonesia menghasilkan{' '}
              <span className="text-[#a8d470]">{idnDaily.toFixed(2)} kg CO₂</span>{' '}
              setiap hari.{' '}
              <span className="text-white/70">Kamu sudah tahu punyamu?</span>
            </h1>

            <p className="text-white/60 text-base sm:text-lg leading-relaxed mb-8 max-w-2xl">
              JejakHijau adalah carbon diary pertama di Indonesia — catat jejak karbonmu dari transportasi, makanan, dan energi dalam 60 detik sehari. Gratis, transparan, dan berbasis data ilmiah.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/auth')}
                className="inline-flex items-center gap-2 bg-[#4E8A1A] hover:bg-[#639922] text-white font-semibold px-6 py-3 rounded-xl text-sm shadow-lg shadow-green-900/30 hover:-translate-y-0.5"
              >
                Mulai lacak sekarang <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={scrollDown}
                className="inline-flex items-center gap-2 border border-white/20 hover:bg-white/10 text-white/80 font-medium px-6 py-3 rounded-xl text-sm"
              >
                Pelajari lebih lanjut <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Floating stat card — live World Bank data */}
          <div className="mt-12 lg:mt-0 lg:absolute lg:right-6 lg:top-1/2 lg:-translate-y-1/2 max-w-xs">
            <div className="bg-white/10 backdrop-blur border border-white/15 rounded-2xl p-5">
              <p className="text-white/50 text-xs font-medium uppercase tracking-wide mb-3">Emisi harian per kapita</p>
              <div className="space-y-2.5">
                {[
                  { label: `Indonesia (${idnYear})`,  val: `${idnDaily.toFixed(2)} kg`,   pct: (idnDaily / maxDaily) * 100,   active: true },
                  { label: `Jepang (${stats?.countries?.japan?.year ?? '2022'})`, val: `${jpnDaily.toFixed(2)} kg`, pct: (jpnDaily / maxDaily) * 100 },
                  { label: 'Target Paris 2030',        val: `${parisDaily.toFixed(2)} kg`, pct: (parisDaily / maxDaily) * 100 },
                ].map(({ label, val, pct, active }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className={active ? 'text-[#a8d470] font-semibold' : 'text-white/60'}>{label}</span>
                      <span className={active ? 'text-white font-bold' : 'text-white/50'}>{val}</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${active ? 'bg-[#a8d470]' : 'bg-white/30'}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-white/30 text-[10px] mt-3">
                {stats ? `World Bank Open Data · Diperbarui ${idnYear}` : 'World Bank / IEA · PLN RUPTL 2023'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Urgency stats strip — dynamic World Bank + scientific constants ── */}
      <section className="border-b border-gray-100 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-0 sm:divide-x divide-gray-200">
            {[
              {
                icon: TreePine,
                val: <Counter target={Math.round(idnYearly * 1000)} suffix=" kg" />,
                label: 'Emisi CO₂ rata-rata per orang Indonesia per tahun',
                sub: `World Bank Open Data EN.ATM.CO2E.PC · Data tahun ${idnYear}`,
              },
              {
                icon: Wind,
                val: <>1.5°C</>,
                label: 'Batas kritis pemanasan global Perjanjian Paris',
                // Scientific constant — not available via API
                sub: 'IPCC AR6 WG1, 2021 · Konstanta ilmiah',
              },
              {
                icon: Droplets,
                val: <Counter target={riskPct} suffix="%" />,
                label: 'Wilayah pesisir Indonesia berisiko terdampak pada 2050',
                sub: stats?.indonesiaRisk?.source ?? 'BMKG Indonesia Climate Risk Assessment 2022',
              },
            ].map(({ icon: Icon, val, label, sub }) => (
              <div key={label} className="sm:px-8 first:pl-0 last:pr-0 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#EAF3DE] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-5 h-5 text-[#3B6D11]" />
                </div>
                <div>
                  <p className="text-2xl font-black text-[#1a3a06]">{val}</p>
                  <p className="text-sm text-gray-700 font-medium mt-0.5 leading-snug">{label}</p>
                  <p className="text-xs text-gray-400 mt-1">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Cara perhitungan emisi ─────────────────────────────────────── */}
      <section id="cara-perhitungan" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[#EAF3DE] text-[#3B6D11] text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            Transparan & Berbasis Sains
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Bagaimana kami menghitung emisimu?
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
            Setiap angka yang tampil di JejakHijau berasal dari sumber ilmiah yang dapat diverifikasi.
            Tidak ada black box — semua faktor emisi kami publikasikan secara terbuka.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {EMISSION_FACTORS.map(({ category, icon: Icon, color, items }) => (
            <div key={category} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">{category}</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {items.map(({ label, value, unit, source }) => (
                  <div key={label} className="px-5 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 font-medium leading-snug">{label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Sumber: {source}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-[#3B6D11]">{value}</p>
                        <p className="text-xs text-gray-400">{unit}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 text-sm text-gray-600">
            <strong className="text-gray-900">Formula:</strong>{' '}
            Total emisi = (km ojol × 0.089) + (km KRL × 0.018) + (kWh × 0.724) + faktor makanan
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────── */}
      <section className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Mulai dalam 3 langkah
            </h2>
            <p className="text-gray-500 text-sm sm:text-base">Tidak butuh alat canggih. Cukup kamu dan 60 detik sehari.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="relative">
                <div className="w-10 h-10 bg-[#3B6D11] rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="absolute top-5 -right-4 hidden md:block text-6xl font-black text-gray-100 select-none leading-none">
                  {step}
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-sm sm:text-base">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: BarChart2, title: 'Dashboard visual',
              desc: 'Grafik area emisi 30 hari, perbandingan rata-rata nasional, dan tren mingguan.',
              points: ['Recharts area chart', 'Referensi rata-rata nasional', 'History 30 hari'],
            },
            {
              icon: Award, title: 'Gamifikasi & Badge',
              desc: 'Streak harian, sistem badge, dan leaderboard kota — agar perubahan terasa menyenangkan.',
              points: ['6 badge tersedia', 'Streak counter', 'City leaderboard'],
            },
            {
              icon: MessageCircle, title: 'AI Coach personal',
              desc: 'Saran spesifik berdasarkan data emisimu, bukan tips generik yang sama untuk semua orang.',
              points: ['Berbasis data aktualmu', 'Kontekstual per kota', 'Claude AI (segera)'],
            },
          ].map(({ icon: Icon, title, desc, points }) => (
            <div key={title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-[#EAF3DE] rounded-xl flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-[#3B6D11]" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-4">{desc}</p>
              <ul className="space-y-1.5">
                {points.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-xs text-gray-600">
                    <Check className="w-3.5 h-3.5 text-[#3B6D11] flex-shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA block ─────────────────────────────────────────────────── */}
      <section className="bg-[#0f2406]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
          <div className="text-4xl mb-6">🌿</div>
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-4"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Hari ini adalah hari terbaik untuk mulai
          </h2>
          <p className="text-white/60 text-sm sm:text-base mb-8 max-w-xl mx-auto leading-relaxed">
            Setiap hari yang terlewat adalah data yang hilang — dan kesempatan untuk berubah yang tidak kembali.
            Daftar gratis sekarang, tidak butuh kartu kredit.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/auth')}
              className="inline-flex items-center justify-center gap-2 bg-[#4E8A1A] hover:bg-[#639922] text-white font-bold px-8 py-4 rounded-xl text-base shadow-lg shadow-black/30 hover:-translate-y-0.5"
            >
              Buat akun gratis <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/auth?tab=login')}
              className="inline-flex items-center justify-center gap-2 border border-white/20 hover:bg-white/10 text-white font-medium px-8 py-4 rounded-xl text-base"
            >
              Sudah punya akun? Masuk
            </button>
          </div>
          <p className="text-white/30 text-xs mt-6">
            Gratis selamanya · Tidak ada iklan · Data sumber terbuka
          </p>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-[#3B6D11] rounded flex items-center justify-center">
              <Leaf className="w-2.5 h-2.5 text-white" />
            </div>
            <span>© 2026 JejakHijau · JuaraVibeCoding 2026</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Faktor emisi: PLN RUPTL 2023, KLHK, IPCC AR6, FAO 2021</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
