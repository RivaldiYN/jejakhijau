import { create } from 'zustand'

interface AdminAuthState {
  token: string | null
  user: { id: string; name: string; role: string } | null
  setAuth: (token: string, user: { id: string; name: string; role: string }) => void
  logout: () => void
}

export const useAdminAuth = create<AdminAuthState>((set) => ({
  token: localStorage.getItem('jh_admin_token'),
  user: (() => { try { return JSON.parse(localStorage.getItem('jh_admin_user') ?? 'null') } catch { return null } })(),
  setAuth: (token, user) => {
    localStorage.setItem('jh_admin_token', token)
    localStorage.setItem('jh_admin_user', JSON.stringify(user))
    set({ token, user })
  },
  logout: () => {
    localStorage.removeItem('jh_admin_token')
    localStorage.removeItem('jh_admin_user')
    set({ token: null, user: null })
  },
}))
