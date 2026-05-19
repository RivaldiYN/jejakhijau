import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useAuthStore } from '../stores/auth.store'
import { Trophy, Users, Info } from 'lucide-react'
import type { CityRank } from '@jejakhijau/shared'

export default function Leaderboard() {
  const { user } = useAuthStore()
  const { data: cities = [], isLoading } = useQuery<CityRank[]>({
    queryKey: ['leaderboard', 'cities'],
    queryFn: () => api.get('/leaderboard/cities').then((r) => r.data),
    staleTime: 5 * 60_000,
  })

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">🏆 City Challenge</h1>
        <p className="text-gray-500 text-sm mt-0.5">Emisi rata-rata per pengguna minggu ini · Semakin rendah, semakin baik</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-7 h-7 border-2 border-[#3B6D11] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : cities.length === 0 ? (
        <div className="text-center py-14">
          <Trophy className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Belum ada data. Ajak teman check-in dari kotamu!</p>
        </div>
      ) : (
        <>
          {/* Top 3 podium */}
          {cities.length >= 3 && (
            <div className="grid grid-cols-3 gap-2">
              {[1, 0, 2].map((rank) => {
                const city = cities[rank]
                if (!city) return <div key={rank} />
                const isFirst = rank === 0
                return (
                  <div
                    key={city.city}
                    className={`rounded-2xl border p-3 text-center ${
                      isFirst
                        ? 'bg-[#0f2406] border-transparent'
                        : 'bg-white border-gray-100'
                    }`}
                    style={{ order: rank === 0 ? -1 : undefined }}
                  >
                    <div className="text-2xl">{medals[rank]}</div>
                    <p className={`text-xs font-semibold mt-1 truncate ${isFirst ? 'text-white' : 'text-gray-800'}`}>
                      {city.city}
                    </p>
                    <p className={`text-base font-black mt-0.5 ${isFirst ? 'text-[#a8d470]' : 'text-[#3B6D11]'}`}>
                      {city.avgKgco2eWeek.toFixed(2)}
                    </p>
                    <p className={`text-[10px] ${isFirst ? 'text-white/50' : 'text-gray-400'}`}>kgCO₂e/minggu</p>
                    <p className={`text-[10px] mt-1 flex items-center justify-center gap-0.5 ${isFirst ? 'text-white/40' : 'text-gray-400'}`}>
                      <Users className="w-2.5 h-2.5" />{city.userCount}
                    </p>
                  </div>
                )
              })}
            </div>
          )}

          {/* Full ranking list */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-50">
              {cities.map((city, i) => {
                const isMyCity = city.city === user?.city
                return (
                  <div
                    key={city.city}
                    className={`flex items-center px-4 py-3 ${isMyCity ? 'bg-[#EAF3DE]' : ''}`}
                  >
                    <span className={`w-7 text-sm font-bold tabular-nums ${
                      i === 0 ? 'text-amber-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-700' : 'text-gray-300'
                    }`}>
                      #{city.rank}
                    </span>
                    <div className="flex-1 ml-2 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {city.city}
                        {isMyCity && (
                          <span className="ml-1.5 text-xs font-normal text-[#3B6D11]">(kotamu)</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Users className="w-3 h-3" /> {city.userCount} pengguna aktif
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{city.avgKgco2eWeek.toFixed(2)}</p>
                      <p className="text-xs text-gray-400">kgCO₂e</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-gray-400 justify-center">
            <Info className="w-3 h-3" />
            Diperbarui setiap jam · Basis data 7 hari terakhir
          </div>
        </>
      )}
    </div>
  )
}
