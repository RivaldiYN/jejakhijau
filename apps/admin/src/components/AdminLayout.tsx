import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../stores/adminAuth.store'
import {
  LayoutDashboard, Users, Award, Zap, Lightbulb, Megaphone, Trophy, LogOut, Leaf, ChevronRight
} from 'lucide-react'

const navItems = [
  { to: '/dashboard',         icon: LayoutDashboard, label: 'Analytics' },
  { to: '/users',             icon: Users,           label: 'Pengguna' },
  { to: '/badges',            icon: Award,           label: 'Badge CMS' },
  { to: '/emission-factors',  icon: Zap,             label: 'Faktor Emisi' },
  { to: '/tips',              icon: Lightbulb,       label: 'Tips & Konten' },
  { to: '/announcements',     icon: Megaphone,       label: 'Pengumuman' },
]

export default function AdminLayout() {
  const { user, logout } = useAdminAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
      {/* Sidebar */}
      <aside className="w-60 bg-[#0f1117] flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#3B6D11] rounded-lg flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">JejakHijau</p>
              <p className="text-white/40 text-xs">Admin CMS</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-[#3B6D11] text-white font-medium'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
            <div className="w-7 h-7 bg-[#3B6D11]/40 rounded-full flex items-center justify-center text-xs font-bold text-[#C0DD97]">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{user?.name}</p>
              <p className="text-white/40 text-xs">Administrator</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 mt-1 rounded-lg text-sm text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
