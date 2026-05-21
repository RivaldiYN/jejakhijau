import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Plus, Pencil, Trash2, X } from 'lucide-react'

interface Badge { id: string; slug: string; name: string; description: string; iconUrl: string }

export default function Badges() {
  const qc = useQueryClient()
  const [modal, setModal] = useState<null | 'create' | Badge>(null)
  const [form, setForm] = useState({ slug: '', name: '', description: '', iconUrl: '' })

  const { data: badges = [], isLoading } = useQuery<Badge[]>({
    queryKey: ['admin', 'badges'],
    queryFn: () => api.get('/admin/badges').then((r) => r.data),
  })

  const createBadge = useMutation({
    mutationFn: () => api.post('/admin/badges', form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'badges'] }); setModal(null); setForm({ slug: '', name: '', description: '', iconUrl: '' }) },
  })

  const updateBadge = useMutation({
    mutationFn: (id: string) => api.put(`/admin/badges/${id}`, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'badges'] }); setModal(null) },
  })

  const deleteBadge = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/badges/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'badges'] }),
  })

  function openEdit(badge: Badge) {
    setForm({ slug: badge.slug, name: badge.name, description: badge.description, iconUrl: badge.iconUrl })
    setModal(badge)
  }

  const isEditing = modal && typeof modal === 'object'

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Badge CMS</h1>
          <p className="text-gray-500 text-sm mt-1">{badges.length} badge tersedia</p>
        </div>
        <button onClick={() => { setForm({ slug: '', name: '', description: '', iconUrl: '' }); setModal('create') }}
          className="flex items-center gap-2 bg-[#3B6D11] hover:bg-[#27500A] text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
          <Plus className="w-4 h-4" /> Tambah Badge
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-[#3B6D11] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {badges.map((badge) => (
            <div key={badge.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm group">
              <div className="text-3xl mb-2">🏅</div>
              <p className="font-semibold text-gray-900 text-sm">{badge.name}</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{badge.description}</p>
              <code className="text-xs text-[#3B6D11] bg-[#EAF3DE] px-2 py-0.5 rounded mt-2 inline-block">{badge.slug}</code>
              <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(badge)}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#3B6D11] px-2 py-1 rounded-lg hover:bg-[#EAF3DE] transition-colors">
                  <Pencil className="w-3 h-3" /> Edit
                </button>
                <button onClick={() => window.confirm(`Hapus badge ${badge.name}?`) && deleteBadge.mutate(badge.id)}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">
                  <Trash2 className="w-3 h-3" /> Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">{isEditing ? 'Edit Badge' : 'Tambah Badge Baru'}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); isEditing ? updateBadge.mutate((modal as Badge).id) : createBadge.mutate() }}
              className="space-y-3">
              {['slug', 'name', 'description', 'iconUrl'].map((field) => (
                <div key={field}>
                  <label className="block text-xs font-medium text-gray-700 mb-1 capitalize">{field}</label>
                  <input value={(form as any)[field]}
                    onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                    required className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-[#639922] outline-none"
                    placeholder={field === 'slug' ? 'e.g. streak_7' : field === 'iconUrl' ? '/badges/streak-7.svg' : ''} />
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setModal(null)}
                  className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-xl text-sm hover:bg-gray-50">Batal</button>
                <button type="submit" disabled={createBadge.isPending || updateBadge.isPending}
                  className="flex-1 bg-[#3B6D11] text-white py-2 rounded-xl text-sm font-medium hover:bg-[#27500A] disabled:opacity-50">
                  {isEditing ? 'Simpan perubahan' : 'Buat badge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
