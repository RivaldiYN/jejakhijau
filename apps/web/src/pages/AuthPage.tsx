import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Leaf, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { api } from '../lib/api'
import { useAuthStore } from '../stores/auth.store'
import type { AuthResponse } from '@jejakhijau/shared'

const CITIES = ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang', 'Makassar', 'Palembang', 'Tangerang', 'Depok', 'Bekasi', 'Lainnya']

export default function AuthPage() {
  const [params] = useSearchParams()
  const [tab, setTab] = useState<'login' | 'register'>(params.get('tab') === 'login' ? 'login' : 'register')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '', name: '', city: 'Jakarta' })
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const mutation = useMutation({
    mutationFn: async () => {
      const url = tab === 'login' ? '/auth/login' : '/auth/register'
      const { data } = await api.post<AuthResponse>(url, form)
      return data
    },
    onSuccess: (data) => {
      setAuth(data.token, data.user)
      navigate('/app/diary')
    },
    onError: (err: any) => {
      setError(err.response?.data?.error ?? 'Terjadi kesalahan, coba lagi')
    },
  })

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ background: 'linear-gradient(135deg, #EAF3DE 0%, #F7F9F4 100%)' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#3B6D11] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-green-200">
            <Leaf className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#27500A]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>JejakHijau</h1>
          <p className="text-gray-500 text-sm mt-1">Carbon diary untuk Indonesia 🌿</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-[#E5E3DC] p-6">
          {/* Tabs */}
          <div className="flex rounded-xl bg-[#F7F9F4] p-1 mb-6">
            {(['register', 'login'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError('') }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  tab === t ? 'bg-white text-[#3B6D11] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t === 'register' ? 'Daftar' : 'Masuk'}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); setError(''); mutation.mutate() }}
            className="space-y-4"
          >
            {tab === 'register' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">Nama lengkap</label>
                  <input id="name" type="text" value={form.name} onChange={set('name')} required
                    className="w-full border border-[#E5E3DC] rounded-xl px-3 py-2.5 text-sm focus:border-[#639922] focus:ring-2 focus:ring-[#EAF3DE] outline-none"
                    placeholder="Budi Santoso" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="city">Kota</label>
                  <select id="city" value={form.city} onChange={set('city')}
                    className="w-full border border-[#E5E3DC] rounded-xl px-3 py-2.5 text-sm focus:border-[#639922] outline-none bg-white">
                    {CITIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">Email</label>
              <input id="email" type="email" value={form.email} onChange={set('email')} required
                className="w-full border border-[#E5E3DC] rounded-xl px-3 py-2.5 text-sm focus:border-[#639922] focus:ring-2 focus:ring-[#EAF3DE] outline-none"
                placeholder="kamu@email.com" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">Password</label>
              <div className="relative">
                <input id="password" type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')} required
                  minLength={8}
                  className="w-full border border-[#E5E3DC] rounded-xl px-3 py-2.5 pr-10 text-sm focus:border-[#639922] focus:ring-2 focus:ring-[#EAF3DE] outline-none"
                  placeholder="Min. 8 karakter" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-3 py-2">
                {error}
              </div>
            )}

            <button type="submit" disabled={mutation.isPending}
              className="w-full bg-[#3B6D11] hover:bg-[#27500A] text-white font-semibold py-3 rounded-xl shadow-md shadow-green-100">
              {mutation.isPending ? 'Memproses...' : tab === 'login' ? 'Masuk' : 'Daftar sekarang'}
            </button>
          </form>
        </div>

        {/* Back to home */}
        <div className="text-center mt-5">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#3B6D11] font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke halaman utama
          </button>
        </div>
      </div>
    </div>
  )
}
