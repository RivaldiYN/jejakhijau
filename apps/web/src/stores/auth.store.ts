import { create } from 'zustand'
import type { User } from '@jejakhijau/shared'

interface AuthState {
  token: string | null
  user: Pick<User, 'id' | 'name' | 'city' | 'role'> | null
  setAuth: (token: string, user: Pick<User, 'id' | 'name' | 'city' | 'role'>) => void
  logout: () => void
  isAdmin: () => boolean
}

const savedToken = localStorage.getItem('jh_token')
const savedUser = (() => {
  try { return JSON.parse(localStorage.getItem('jh_user') ?? 'null') } catch { return null }
})()

export const useAuthStore = create<AuthState>((set, get) => ({
  token: savedToken,
  user: savedUser,
  setAuth: (token, user) => {
    localStorage.setItem('jh_token', token)
    localStorage.setItem('jh_user', JSON.stringify(user))
    set({ token, user })
  },
  logout: () => {
    localStorage.removeItem('jh_token')
    localStorage.removeItem('jh_user')
    set({ token: null, user: null })
  },
  isAdmin: () => get().user?.role === 'admin',
}))
