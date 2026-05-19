import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAdminAuth } from '../stores/adminAuth.store'
import { Leaf, Eye, EyeOff } from 'lucide-react'
import type { AuthResponse } from '@jejakhijau/shared'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const { setAuth } = useAdminAuth()
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: () => api.post<AuthResponse>('/auth/login', { email, password }).then((r) => r.data),
    onSuccess: (data) => {
      if (data.user.role !== 'admin') {
        setError('Akun ini tidak memiliki akses admin')
        return
      }
      setAuth(data.token, data.user)
      navigate('/dashboard')
    },
    onError: (err: any) => setError(err.response?.data?.error ?? 'Login gagal'),
  })

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1117]">
      <div className="w-full max-w-sm px-4">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#3B6D11] rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Leaf className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">JejakHijau Admin</h1>
          <p className="text-white/50 text-sm mt-1">CMS Dashboard</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <form onSubmit={(e) => { e.preventDefault(); setError(''); mutation.mutate() }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5" htmlFor="admin-email">Email</label>
              <input id="admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:border-[#639922] focus:ring-2 focus:ring-[#3B6D11]/30 outline-none"
                placeholder="admin@jejakhijau.id" />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5" htmlFor="admin-password">Password</label>
              <div className="relative">
                <input id="admin-password" type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required
                  className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2.5 pr-10 text-sm text-white placeholder-white/30 focus:border-[#639922] outline-none"
                  placeholder="••••••••" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 text-red-300 text-sm rounded-xl px-3 py-2">{error}</div>
            )}

            <button type="submit" disabled={mutation.isPending}
              className="w-full bg-[#3B6D11] hover:bg-[#27500A] disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors">
              {mutation.isPending ? 'Memproses...' : 'Masuk ke Admin'}
            </button>
          </form>
        </div>
        <p className="text-center text-white/20 text-xs mt-6">
          Hanya untuk administrator JejakHijau
        </p>
      </div>
    </div>
  )
}
