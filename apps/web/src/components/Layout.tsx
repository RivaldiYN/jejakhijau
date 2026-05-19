import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/auth.store'
import {
  BookOpen, BarChart2, Trophy, MessageCircle, User,
  Leaf, LogOut, Scan,
} from 'lucide-react'

const NAV = [
  { to: '/app/diary',       icon: BookOpen,      label: 'Diary',       desc: 'Check-in harian' },
  { to: '/app/dashboard',   icon: BarChart2,     label: 'Dashboard',   desc: 'Statistik & grafik' },
  { to: '/app/leaderboard', icon: Trophy,        label: 'City Rank',   desc: 'Peringkat kota' },
  { to: '/app/coach',       icon: MessageCircle, label: 'AI Coach',    desc: 'Saran personal' },
  { to: '/app/profile',     icon: User,          label: 'Profil',      desc: 'Akun & badge' },
]

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* ── Desktop Sidebar (≥ 768px) ────────────────────────────────────── */}
      <aside className="hidden md:flex md:flex-col md:w-56 lg:w-64 bg-white border-r border-gray-100 fixed top-0 left-0 h-full z-40">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-gray-100 flex-shrink-0">
          <div className="w-8 h-8 bg-[#3B6D11] rounded-xl flex items-center justify-center">
            <Leaf className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm leading-tight">JejakHijau</p>
            <p className="text-[10px] text-gray-400 leading-tight">Carbon Diary</p>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <div className="px-3 space-y-0.5">
            {NAV.map(({ to, icon: Icon, label, desc }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                    isActive
                      ? 'bg-[#EAF3DE] text-[#1a3a06]'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                      isActive ? 'bg-[#3B6D11] text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200 group-hover:text-gray-600'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold leading-tight ${isActive ? 'text-[#1a3a06]' : 'text-gray-700'}`}>
                        {label}
                      </p>
                      <p className="text-[10px] text-gray-400 leading-tight truncate">{desc}</p>
                    </div>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* User section + Logout */}
        <div className="border-t border-gray-100 p-3 flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50">
            <div className="w-8 h-8 rounded-full bg-[#3B6D11] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate leading-tight">{user?.name}</p>
              <p className="text-[10px] text-gray-400 truncate leading-tight">{user?.city}</p>
            </div>
            <button
              onClick={() => { logout(); navigate('/') }}
              aria-label="Keluar"
              className="text-gray-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* AI Scan shortcut */}
          <NavLink
            to="/app/diary"
            className="mt-2 flex items-center gap-2 justify-center w-full bg-[#3B6D11] hover:bg-[#27500A] text-white text-xs font-semibold py-2 px-3 rounded-xl transition-colors"
          >
            <Scan className="w-3.5 h-3.5" />
            Scan Struk AI
          </NavLink>
        </div>
      </aside>

      {/* ── Main content area ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col md:ml-56 lg:ml-64 min-h-screen">

        {/* Mobile top bar (< 768px only) */}
        <header className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#3B6D11] rounded-md flex items-center justify-center">
              <Leaf className="w-3 h-3 text-white" />
            </div>
            <span className="font-semibold text-gray-900 text-sm">JejakHijau</span>
          </div>
          <button
            onClick={() => { logout(); navigate('/') }}
            aria-label="Keluar"
            className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </header>

        {/* Desktop page header bar */}
        <header className="hidden md:flex sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-6 h-14 items-center justify-between">
          <div />
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Selamat datang,</span>
            <span className="font-semibold text-gray-800">{user?.name}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 pb-20 md:pb-8">
          <div className="max-w-5xl mx-auto px-4 py-5 sm:px-6 md:px-8 md:py-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* ── Mobile Bottom Navigation (< 768px only) ───────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 z-50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex justify-around max-w-lg mx-auto">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 pt-2 pb-2.5 px-2 text-[10px] font-medium transition-colors min-w-0 flex-1 ${
                  isActive ? 'text-[#3B6D11]' : 'text-gray-400 hover:text-gray-600'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`w-8 h-6 flex items-center justify-center rounded-xl transition-colors ${
                    isActive ? 'bg-[#EAF3DE]' : ''
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="truncate">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
