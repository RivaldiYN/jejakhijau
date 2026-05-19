import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { RotateCcw, Save } from 'lucide-react'
import { useState } from 'react'

interface Factor { key: string; defaultValue: number; currentValue: number; isOverridden: boolean }

const LABEL_MAP: Record<string, string> = {
  ojolPerKm: 'Ojol per km',
  angkotPerKm: 'Angkot per km',
  krlPerKm: 'KRL per km',
  plastikKresek: 'Kantong plastik (per lembar)',
  listrikPlnPerKwh: 'Listrik PLN (per kWh)',
  bakarSampahPerKg: 'Bakar sampah (per kg)',
  'meal.warteg': 'Makan warteg',
  'meal.gofood': 'Makan GoFood/ojol',
  'meal.masak_sendiri': 'Masak sendiri',
  'meal.vegetarian': 'Makan vegetarian',
}

export default function EmissionFactors() {
  const qc = useQueryClient()
  const [values, setValues] = useState<Record<string, string>>({})

  const { data: factors = [], isLoading } = useQuery<Factor[]>({
    queryKey: ['admin', 'emission-factors'],
    queryFn: () => api.get('/admin/emission-factors').then((r) => r.data),
  })

  const update = useMutation({
    mutationFn: ({ key, value }: { key: string; value: number }) =>
      api.put('/admin/emission-factors', { key, value }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'emission-factors'] }),
  })

  const restore = useMutation({
    mutationFn: (key: string) => api.delete(`/admin/emission-factors/${encodeURIComponent(key)}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'emission-factors'] }),
  })

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Faktor Emisi</h1>
        <p className="text-gray-500 text-sm mt-1">
          Edit faktor emisi tanpa perlu deploy ulang. Override akan langsung diterapkan pada check-in baru.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-[#3B6D11] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Kategori</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Default (kgCO₂e)</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nilai Saat Ini</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {factors.map((f) => {
                const inputVal = values[f.key] ?? f.currentValue.toString()
                const hasLocalChange = parseFloat(inputVal) !== f.currentValue
                return (
                  <tr key={f.key} className={`border-b border-gray-50 ${f.isOverridden ? 'bg-amber-50/50' : ''}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-700">{LABEL_MAP[f.key] ?? f.key}</p>
                      <code className="text-xs text-gray-400">{f.key}</code>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{f.defaultValue}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <input type="number" step="0.001" value={inputVal}
                          onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                          className={`w-24 border rounded-lg px-2 py-1.5 text-sm focus:outline-none ${
                            f.isOverridden ? 'border-amber-300 focus:border-amber-500' : 'border-gray-200 focus:border-[#639922]'
                          }`} />
                        {f.isOverridden && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">override</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        {hasLocalChange && (
                          <button onClick={() => update.mutate({ key: f.key, value: parseFloat(inputVal) })}
                            className="flex items-center gap-1 text-xs bg-[#3B6D11] text-white px-3 py-1.5 rounded-lg hover:bg-[#27500A] transition-colors">
                            <Save className="w-3 h-3" /> Simpan
                          </button>
                        )}
                        {f.isOverridden && (
                          <button onClick={() => restore.mutate(f.key)}
                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                            title="Kembalikan ke default">
                            <RotateCcw className="w-3 h-3" /> Reset
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
        ⚠️ Perubahan faktor emisi akan langsung mempengaruhi kalkulasi emisi pada check-in baru. Data historis tidak akan berubah.
      </div>
    </div>
  )
}
