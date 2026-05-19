import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Plus, Pencil, Trash2, Eye, EyeOff, X } from 'lucide-react'

interface Tip { id: string; title: string; body: string; category: string; isPublished: boolean; createdAt: string }

const CATEGORIES = ['transport', 'food', 'energy', 'waste', 'general']

export default function Tips() {
  const qc = useQueryClient()
  const [modal, setModal] = useState<null | 'create' | Tip>(null)
  const [form, setForm] = useState({ title: '', body: '', category: 'general' })
  const [catFilter, setCatFilter] = useState('')

  const { data: tips = [], isLoading } = useQuery<Tip[]>({
    queryKey: ['admin', 'tips', catFilter],
    queryFn: () => api.get(`/admin/tips${catFilter ? `?category=${catFilter}` : ''}`).then((r) => r.data),
  })

  const create = useMutation({
    mutationFn: () => api.post('/admin/tips', form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'tips'] }); setModal(null); setForm({ title: '', body: '', category: 'general' }) },
  })

  const update = useMutation({
    mutationFn: (id: string) => api.put(`/admin/tips/${id}`, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'tips'] }); setModal(null) },
  })

  const togglePublish = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/tips/${id}/publish`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'tips'] }),
  })

  const deleteTip = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/tips/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'tips'] }),
  })

  const isEditing = modal && typeof modal === 'object'

  function openEdit(tip: Tip) {
    setForm({ title: tip.title, body: tip.body, category: tip.category })
    setModal(tip)
  }

  const catColors: Record<string, string> = {
    transport: 'bg-blue-100 text-blue-700', food: 'bg-green-100 text-green-700',
    energy: 'bg-amber-100 text-amber-700', waste: 'bg-red-100 text-red-700', general: 'bg-gray-100 text-gray-700',
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tips & Konten</h1>
          <p className="text-gray-500 text-sm mt-1">{tips.length} tips</p>
        </div>
        <button onClick={() => { setForm({ title: '', body: '', category: 'general' }); setModal('create') }}
          className="flex items-center gap-2 bg-[#3B6D11] text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-[#27500A] transition-colors">
          <Plus className="w-4 h-4" /> Tambah Tip
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['', ...CATEGORIES].map((c) => (
          <button key={c} onClick={() => setCatFilter(c)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              catFilter === c ? 'bg-[#3B6D11] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {c === '' ? 'Semua' : c}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-[#3B6D11] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {tips.map((tip) => (
            <div key={tip.id} className={`bg-white rounded-2xl border ${tip.isPublished ? 'border-[#C0DD97]' : 'border-gray-100'} p-4 shadow-sm`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catColors[tip.category] ?? catColors.general}`}>
                      {tip.category}
                    </span>
                    {tip.isPublished && <span className="text-xs bg-[#EAF3DE] text-[#3B6D11] px-2 py-0.5 rounded-full font-medium">Published</span>}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">{tip.title}</h3>
                  <p className="text-gray-500 text-sm mt-1 line-clamp-2">{tip.body}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => togglePublish.mutate(tip.id)}
                    className={`p-1.5 rounded-lg transition-colors ${tip.isPublished ? 'text-[#3B6D11] hover:bg-[#EAF3DE]' : 'text-gray-400 hover:bg-gray-100'}`}
                    title={tip.isPublished ? 'Unpublish' : 'Publish'}>
                    {tip.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button onClick={() => openEdit(tip)} className="p-1.5 rounded-lg text-gray-400 hover:text-[#3B6D11] hover:bg-[#EAF3DE] transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => window.confirm('Hapus tip ini?') && deleteTip.mutate(tip.id)}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {tips.length === 0 && <p className="text-gray-400 text-sm text-center py-12">Belum ada tips</p>}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">{isEditing ? 'Edit Tip' : 'Tambah Tip Baru'}</h2>
              <button onClick={() => setModal(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); isEditing ? update.mutate((modal as Tip).id) : create.mutate() }} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Judul</label>
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-[#639922] outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Isi konten</label>
                <textarea value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} required rows={4}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-[#639922] outline-none resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Kategori</label>
                <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-[#639922] outline-none bg-white">
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setModal(null)}
                  className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-xl text-sm hover:bg-gray-50">Batal</button>
                <button type="submit" className="flex-1 bg-[#3B6D11] text-white py-2 rounded-xl text-sm font-medium hover:bg-[#27500A]">
                  {isEditing ? 'Simpan' : 'Buat tip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
