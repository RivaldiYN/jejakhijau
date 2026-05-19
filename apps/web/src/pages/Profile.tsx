import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useAuthStore } from '../stores/auth.store'
import { Award, Flame, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Badge } from '@jejakhijau/shared'

export default function Profile() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const { data: earnedBadges = [] } = useQuery<(Badge & { earnedAt: string })[]>({
    queryKey: ['badges', 'me'],
    queryFn: () => api.get('/badges/me').then((r) => r.data),
  })

  const { data: allBadges = [] } = useQuery<Badge[]>({
    queryKey: ['badges', 'all'],
    queryFn: () => api.get('/badges').then((r) => r.data),
  })

  const { data: me } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.get('/auth/me').then((r) => r.data),
  })

  const earnedSlugs = new Set(earnedBadges.map((b) => b.slug))

  return (
    <div className="space-y-4">
      {/* Profile card */}
      <div className="bg-[#0f2406] rounded-2xl p-5 text-white">
        <div className="flex items-start justify-between">
          <div>
            <div className="w-12 h-12 bg-white/15 rounded-full flex items-center justify-center text-xl font-bold mb-3">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-lg font-bold">{user?.name}</h2>
            <p className="text-white/50 text-sm">{user?.city}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1.5 justify-end">
              <Flame className="w-5 h-5 text-amber-400" />
              <span className="text-3xl font-black">{me?.currentStreak ?? 0}</span>
            </div>
            <p className="text-white/40 text-xs">hari streak</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-lg font-black">{me?.longestStreak ?? 0}</p>
            <p className="text-white/40 text-xs">Streak terpanjang</p>
          </div>
          <div>
            <p className="text-lg font-black">{earnedBadges.length}</p>
            <p className="text-white/40 text-xs">Badge diraih</p>
          </div>
          <div>
            <p className="text-lg font-black">{allBadges.length}</p>
            <p className="text-white/40 text-xs">Total badge</p>
          </div>
        </div>
      </div>

      {/* Badge collection */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <h2 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Award className="w-4 h-4 text-gray-400" />
          Koleksi badge ({earnedBadges.length}/{allBadges.length})
        </h2>
        <div className="grid grid-cols-3 gap-2.5">
          {allBadges.map((badge) => {
            const earned = earnedSlugs.has(badge.slug)
            const earnedData = earnedBadges.find((b) => b.slug === badge.slug)
            return (
              <div
                key={badge.id}
                title={badge.description}
                className={`rounded-xl p-3 text-center border transition-colors ${
                  earned
                    ? 'bg-[#EAF3DE] border-[#C0DD97]'
                    : 'bg-gray-50 border-gray-100'
                }`}
              >
                <div className={`text-xl mb-1 ${earned ? '' : 'grayscale opacity-30'}`}>🏅</div>
                <p className={`text-[10px] font-semibold leading-tight ${earned ? 'text-[#1a3a06]' : 'text-gray-400'}`}>
                  {badge.name}
                </p>
                {earned && earnedData && (
                  <p className="text-[9px] text-[#3B6D11] mt-0.5">
                    {new Date(earnedData.earnedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </p>
                )}
                {!earned && (
                  <p className="text-[9px] text-gray-300 mt-0.5">🔒 Belum</p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Logout */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button
          onClick={() => { logout(); navigate('/') }}
          className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 font-medium transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Keluar dari akun
        </button>
      </div>

      <p className="text-center text-xs text-gray-300">
        JejakHijau v0.1.0 · JuaraVibeCoding 2026 🌿
      </p>
    </div>
  )
}
