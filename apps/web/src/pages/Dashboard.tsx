import { useQuery } from '@tanstack/react-query'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { api } from '../lib/api'
import { useAuthStore } from '../stores/auth.store'
import { INDONESIA_DAILY_AVG } from '@jejakhijau/shared'
import type { DiaryEntry } from '@jejakhijau/shared'
import {
  Flame, TrendingDown, TrendingUp, Leaf, Info, Sparkles,
  ArrowRight, CheckCircle, AlertCircle,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent = false, icon: Icon }: {
  label: string; value: string; sub?: string; accent?: boolean
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className={`rounded-2xl border p-4 flex flex-col gap-1 ${
      accent ? 'bg-[#EAF3DE] border-[#C0DD97]' : 'bg-white border-gray-100 shadow-sm'
    }`}>
      {Icon && (
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-1 ${
          accent ? 'bg-[#3B6D11]/10' : 'bg-gray-100'
        }`}>
          <Icon className={`w-3.5 h-3.5 ${accent ? 'text-[#3B6D11]' : 'text-gray-500'}`} />
        </div>
      )}
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className={`text-xl font-black ${accent ? 'text-[#1a3a06]' : 'text-gray-900'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

// ─── Proactive AI Insight card ────────────────────────────────────────────────
function InsightCard() {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({
    queryKey: ['coach', 'insight'],
    queryFn: () => api.get('/coach/insight').then((r) => r.data),
    staleTime: 30 * 60_000, // refresh every 30 min
    retry: 1,
  })

  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-[#0f2406] to-[#1a3a06] rounded-2xl p-5 animate-pulse">
        <div className="h-4 bg-white/20 rounded w-32 mb-3" />
        <div className="h-3 bg-white/10 rounded w-full mb-2" />
        <div className="h-3 bg-white/10 rounded w-4/5" />
      </div>
    )
  }

  const trendIcon = data?.trend === 'up'
    ? <TrendingUp className="w-4 h-4 text-amber-400" />
    : data?.trend === 'down'
    ? <TrendingDown className="w-4 h-4 text-green-400" />
    : null

  return (
    <div className="bg-gradient-to-br from-[#0f2406] via-[#1a3a06] to-[#0f2406] rounded-2xl p-5 text-white relative overflow-hidden">
      {/* Decorative circle */}
      <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/5 rounded-full" />
      <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/5 rounded-full" />

      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 bg-[#a8d470]/20 rounded-lg flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-[#a8d470]" />
          </div>
          <p className="text-xs font-semibold text-[#a8d470] uppercase tracking-wide">
            AI Coach Insight
          </p>
          {trendIcon && <div className="ml-auto">{trendIcon}</div>}
        </div>

        <p className="text-sm text-white/85 leading-relaxed mb-4">
          {data?.insight ?? 'Mulai check-in harian untuk mendapatkan saran personal dari AI Coach!'}
        </p>

        {data?.avgKgco2e && (
          <div className="flex items-center gap-3 mb-4">
            {data.avgKgco2e < INDONESIA_DAILY_AVG ? (
              <div className="flex items-center gap-1.5 text-xs text-green-400 font-medium">
                <CheckCircle className="w-3.5 h-3.5" />
                Di bawah rata-rata nasional
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                {((data.avgKgco2e / INDONESIA_DAILY_AVG - 1) * 100).toFixed(0)}% di atas nasional
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => navigate('/app/coach')}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#a8d470] hover:text-white transition-colors"
        >
          Chat dengan AI Coach <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuthStore()

  const { data: entries = [], isLoading } = useQuery<DiaryEntry[]>({
    queryKey: ['diary', 'list'],
    queryFn: () => api.get('/diary?days=30').then((r) => r.data),
  })

  const { data: me } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.get('/auth/me').then((r) => r.data),
  })

  const streak = me?.currentStreak ?? 0
  const longest = me?.longestStreak ?? 0

  const last7 = entries.slice(0, 7)
  const avg7d = last7.length
    ? last7.reduce((s, e) => s + e.totalKgco2e, 0) / last7.length
    : 0
  const isBelow = avg7d < INDONESIA_DAILY_AVG

  const chartData = [...entries].reverse().map((e) => ({
    date: new Date(e.entryDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
    emisi: parseFloat(e.totalKgco2e.toFixed(2)),
  }))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#3B6D11] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-[#EAF3DE] rounded-full flex items-center justify-center mb-4">
          <Leaf className="w-8 h-8 text-[#3B6D11]" />
        </div>
        <h2 className="text-lg font-bold text-gray-800 mb-2">Belum ada data</h2>
        <p className="text-gray-500 text-sm max-w-xs">
          Mulai check-in harian untuk melihat dashboard karbon personalmu
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">Halo, {user?.name} 👋 — ini jejak karbonmu</p>
      </div>

      {/* Desktop: 2-column layout (left: stats + chart, right: insight + recent) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Left column (2/3 width on desktop) ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Streak hero card */}
          <div className="bg-[#0f2406] rounded-2xl p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-white/60 text-xs font-medium mb-1">Streak aktif</p>
                <p className="text-4xl font-black text-white flex items-center gap-2">
                  <Flame className="w-7 h-7 text-amber-400" />
                  {streak}
                  <span className="text-xl font-normal text-white/50">hari</span>
                </p>
                <p className="text-white/40 text-xs mt-1">Rekor terpanjang: {longest} hari</p>
              </div>
              <div className="text-right">
                <p className="text-white/40 text-xs mb-0.5">Avg 7 hari</p>
                <p className="text-3xl font-black text-white">{avg7d.toFixed(2)}</p>
                <p className="text-white/40 text-xs">kgCO₂e/hari</p>
                <span className={`inline-flex items-center gap-1 text-xs font-semibold mt-1 px-2 py-0.5 rounded-full ${
                  isBelow ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {isBelow ? '↓ Di bawah nasional' : '↑ Di atas nasional'}
                </span>
              </div>
            </div>
          </div>

          {/* Stats grid — 2x2 on mobile, 4 columns on desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              icon={Leaf}
              label="Total check-in"
              value={`${entries.length}`}
              sub="30 hari terakhir"
            />
            <StatCard
              label="Rata-rata nasional"
              value={`${INDONESIA_DAILY_AVG} kg`}
              sub="kgCO₂e per hari"
            />
            <StatCard
              icon={TrendingDown}
              label="Emisi terendah"
              value={`${Math.min(...entries.map(e => e.totalKgco2e)).toFixed(2)} kg`}
              sub="30 hari terakhir"
              accent
            />
            <StatCard
              label="Emisi tertinggi"
              value={`${Math.max(...entries.map(e => e.totalKgco2e)).toFixed(2)} kg`}
              sub="30 hari terakhir"
            />
          </div>

          {/* Area chart */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-[#3B6D11]" />
                Emisi 30 hari terakhir
              </h2>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-[#3B6D11] inline-block rounded" /> Emisimu
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-amber-400 inline-block rounded" /> Nasional
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B6D11" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3B6D11" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: '1px solid #F3F4F6', fontSize: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                  formatter={(v: any) => [`${v} kgCO₂e`, 'Emisi']}
                />
                <ReferenceLine y={INDONESIA_DAILY_AVG} stroke="#F59E0B" strokeDasharray="4 4" strokeWidth={1.5} />
                <Area type="monotone" dataKey="emisi" stroke="#3B6D11" fill="url(#grad)" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#3B6D11', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400">
              <Info className="w-3 h-3 flex-shrink-0" />
              Garis kuning = rata-rata nasional {INDONESIA_DAILY_AVG} kgCO₂e (PLN RUPTL 2023)
            </div>
          </div>
        </div>

        {/* ── Right column (1/3 width on desktop) ── */}
        <div className="space-y-4">
          {/* Proactive AI Insight */}
          <InsightCard />

          {/* Recent entries */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
              <Flame className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-700">Check-in terakhir</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {entries.slice(0, 7).map((e) => {
                const below = e.totalKgco2e < INDONESIA_DAILY_AVG
                return (
                  <div key={e.id} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-xs text-gray-600">
                      {new Date(e.entryDate).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </span>
                    <span className={`text-xs font-bold ${below ? 'text-[#3B6D11]' : 'text-amber-700'}`}>
                      {e.totalKgco2e.toFixed(2)} kg
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
