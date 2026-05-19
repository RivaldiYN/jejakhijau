import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Plus, Pencil, Trash2, X, ToggleLeft, ToggleRight } from 'lucide-react'

interface Ann {
  id: string; title: string; body: string; ctaLabel?: string; ctaUrl?: string
  startsAt: string; endsAt: string; isActive: boolean
}

const empty = { title: '', body: '', ctaLabel: '', ctaUrl: '', startsAt: '', endsAt: '', isActive: true }

export default function Announcements() {
  const qc = useQueryClient()
  const [modal, setModal] = useState<null | 'create' | Ann>(null)
  const [form, setForm] = useState(empty)

  const { data: anns = [], isLoading } = useQuery<Ann[]>({
    queryKey: ['admin', 'announcements'],
    queryFn: () => api.get('/admin/announcements').then((r) => r.data),
  })

  const create = useMutation({
    mutationFn: () => api.post('/admin/announcements', form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'announcements'] }); setModal(null); setForm(empty) },
  })

  const update = useMutation({
    mutationFn: (id: string) => api.put(`/admin/announcements/${id}`, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'announcements'] }); setModal(null) },
  })

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.put(`/admin/announcements/${id}`, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'announcements'] }),
  })

  const deleteAnn = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/announcements/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'announcements'] }),
  })

  const isEditing = modal && typeof modal === 'object'

  function openEdit(ann: Ann) {
    setForm({
      title: ann.title, body: ann.body, ctaLabel: ann.ctaLabel ?? '', ctaUrl: ann.ctaUrl ?? '',
      startsAt: ann.startsAt.slice(0, 16), endsAt: ann.endsAt.slice(0, 16), isActive: ann.isActive,
    })
    setModal(ann)
  }

  const isActiveNow = (ann: Ann) => {
    const now = new Date()
    return ann.isActive && new Date(ann.startsAt) <= now && new Date(ann.endsAt) >= now
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengumuman</h1>
          <p className="text-gray-500 text-sm mt-1">Banner yang tampil di homepage user</p>
        </div>
        <button onClick={() => { setForm(empty); setModal('create') }}
          className="flex items-center gap-2 bg-[#3B6D11] text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-[#27500A] transition-colors">
          <Plus className="w-4 h-4" /> Buat Pengumuman
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-[#3B6D11] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {anns.map((ann) => {
            const active = isActiveNow(ann)
            return (
              <div key={ann.id} className={`bg-white rounded-2xl border ${active ? 'border-[#C0DD97]' : 'border-gray-100'} p-5 shadow-sm`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {active && <span className="text-xs bg-[#EAF3DE] text-[#3B6D11] px-2 py-0.5 rounded-full font-medium">Live sekarang</span>}
                      {!ann.isActive && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">Nonaktif</span>}
                    </div>
                    <h3 className="font-semibold text-gray-900">{ann.title}</h3>
                    <p className="text-gray-500 text-sm mt-1">{ann.body}</p>
                    {ann.ctaLabel && <p className="text-xs text-[#3B6D11] mt-1">CTA: {ann.ctaLabel} → {ann.ctaUrl}</p>}
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(ann.startsAt).toLocaleString('id-ID')} – {new Date(ann.endsAt).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => toggleActive.mutate({ id: ann.id, isActive: !ann.isActive })}
                      className={`p-1.5 rounded-lg transition-colors ${ann.isActive ? 'text-[#3B6D11] hover:bg-[#EAF3DE]' : 'text-gray-400 hover:bg-gray-100'}`}>
                      {ann.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                    <button onClick={() => openEdit(ann)} className="p-1.5 rounded-lg text-gray-400 hover:text-[#3B6D11] hover:bg-[#EAF3DE] transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => window.confirm('Hapus pengumuman ini?') && deleteAnn.mutate(ann.id)}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
          {anns.length === 0 && <p className="text-gray-400 text-sm text-center py-12">Belum ada pengumuman</p>}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl my-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">{isEditing ? 'Edit Pengumuman' : 'Buat Pengumuman'}</h2>
              <button onClick={() => setModal(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); isEditing ? update.mutate((modal as Ann).id) : create.mutate() }} className="space-y-3">
              {[
                { key: 'title', label: 'Judul', type: 'text', required: true },
                { key: 'ctaLabel', label: 'Teks tombol (opsional)', type: 'text', required: false },
                { key: 'ctaUrl', label: 'URL tombol (opsional)', type: 'url', required: false },
                { key: 'startsAt', label: 'Mulai tayang', type: 'datetime-local', required: true },
                { key: 'endsAt', label: 'Selesai tayang', type: 'datetime-local', required: true },
              ].map(({ key, label, type, required }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
                  <input type={type} value={(form as any)[key]} required={required}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-[#639922] outline-none" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Isi pengumuman</label>
                <textarea value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} required rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-[#639922] outline-none resize-none" />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setModal(null)}
                  className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-xl text-sm hover:bg-gray-50">Batal</button>
                <button type="submit" className="flex-1 bg-[#3B6D11] text-white py-2 rounded-xl text-sm font-medium hover:bg-[#27500A]">
                  {isEditing ? 'Simpan' : 'Buat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
