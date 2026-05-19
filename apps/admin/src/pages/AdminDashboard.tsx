import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Users, BookOpen, TrendingDown, Activity } from 'lucide-react'

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string
  icon: React.ElementType; color: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-3xl font-black text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'analytics'],
    queryFn: () => api.get('/admin/analytics').then((r) => r.data),
    refetchInterval: 60_000,
  })

  if (isLoading) return (
    <div className="p-8 flex items-center justify-center h-full">
      <div className="w-8 h-8 border-2 border-[#3B6D11] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Analytics Overview</h1>
        <p className="text-gray-500 text-sm mt-1">Data real-time JejakHijau</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Pengguna" value={data?.totalUsers ?? 0} sub="Terdaftar" icon={Users} color="bg-blue-50 text-blue-600" />
        <StatCard label="DAU (Hari Ini)" value={data?.dau ?? 0} sub="Unik check-in" icon={Activity} color="bg-green-50 text-green-600" />
        <StatCard label="WAU (7 Hari)" value={data?.wau ?? 0} sub="Unik check-in" icon={TrendingDown} color="bg-purple-50 text-purple-600" />
        <StatCard label="Total Entries" value={data?.totalEntries ?? 0} sub="Diary tersimpan" icon={BookOpen} color="bg-amber-50 text-amber-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Avg emission */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Emisi Rata-Rata Platform</h2>
          <div className="text-center py-4">
            <p className="text-5xl font-black text-[#3B6D11]">{data?.avgEmission7d?.toFixed(2) ?? '—'}</p>
            <p className="text-gray-400 text-sm mt-1">kgCO₂e / hari (7 hari terakhir)</p>
            <div className="mt-4 bg-[#EAF3DE] rounded-xl p-3">
              <p className="text-xs text-[#3B6D11]">
                {data?.avgEmission7d < 5.97
                  ? `✓ Platform ${(5.97 - data.avgEmission7d).toFixed(2)} kgCO₂e di bawah rata-rata nasional`
                  : `⚠ Platform ${(data?.avgEmission7d - 5.97).toFixed(2)} kgCO₂e di atas rata-rata nasional`}
              </p>
            </div>
          </div>
        </div>

        {/* Top cities */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Top 5 Kota Aktif</h2>
          <div className="space-y-3">
            {(data?.topCities ?? []).map((city: { city: string; userCount: number }, i: number) => (
              <div key={city.city} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-400 w-5">#{i + 1}</span>
                  <span className="text-sm font-medium text-gray-700">{city.city}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#3B6D11] rounded-full"
                      style={{ width: `${(city.userCount / (data?.topCities[0]?.userCount || 1)) * 100}%` }} />
                  </div>
                  <span className="text-xs text-gray-400 w-12 text-right">{city.userCount} users</span>
                </div>
              </div>
            ))}
            {(!data?.topCities || data.topCities.length === 0) && (
              <p className="text-sm text-gray-400 text-center py-4">Belum ada data kota</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
