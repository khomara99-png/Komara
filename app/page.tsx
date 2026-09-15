'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Warga {
  id: string
  nama_lengkap: string
  alamat: string
  no_telepon: string
  foto_url: string | null
  created_at: string
}

export default function Home() {
  const [dataWarga, setDataWarga] = useState<Warga[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)

  // Form State
  const [nama, setNama] = useState('')
  const [alamat, setAlamat] = useState('')
  const [noTelepon, setNoTelepon] = useState('')
  const [fotoFile, setFotoFile] = useState<File | null>(null)

  // Fetch Data Warga dari Supabase
  const fetchWarga = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('warga')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching data:', error)
    } else {
      setDataWarga(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchWarga()
  }, [])

  // Handle Submit Form + Upload Foto
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nama || !alamat || !noTelepon) {
      alert('Mohon isi semua bidang yang wajib!')
      return
    }

    setSubmitting(true)
    let publicFotoUrl = null

    try {
      // 1. Upload Foto ke Supabase Storage (jika ada file)
      if (fotoFile) {
        const fileExt = fotoFile.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `warga/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('foto-warga')
          .upload(filePath, fotoFile)

        if (uploadError) throw uploadError

        // Ambil URL Publik foto
        const { data: urlData } = supabase.storage
          .from('foto-warga')
          .getPublicUrl(filePath)

        publicFotoUrl = urlData.publicUrl
      }

      // 2. Simpan Data ke Tabel 'warga'
      const { error: insertError } = await supabase.from('warga').insert([
        {
          nama_lengkap: nama,
          alamat: alamat,
          no_telepon: noTelepon,
          foto_url: publicFotoUrl,
        },
      ])

      if (insertError) throw insertError

      // Reset Form & Close Modal
      setNama('')
      setAlamat('')
      setNoTelepon('')
      setFotoFile(null)
      setShowModal(false)
      fetchWarga() // Refresh list
      alert('Data warga berhasil ditambahkan!')
    } catch (err: any) {
      alert('Gagal menyimpan data: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Filter Search
  const filteredWarga = dataWarga.filter(
    (item) =>
      item.nama_lengkap.toLowerCase().includes(search.toLowerCase()) ||
      item.alamat.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8">
      {/* Header */}
      <header className="max-w-5xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">🏡 Database Warga RT</h1>
          <p className="text-sm text-slate-500">Sistem Informasi Pendataan Warga Terpadu</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-xl transition-all shadow-md active:scale-95 text-center"
        >
          + Tambah Warga Baru
        </button>
      </header>

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto">
        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="🔍 Cari nama atau alamat rumah warga..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>

        {/* List Grid Warga */}
        {loading ? (
          <div className="text-center py-12 text-slate-500">Memuat data warga...</div>
        ) : filteredWarga.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-500">
            Belum ada data warga terdaftar.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWarga.map((w) => (
              <div
                key={w.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Container Foto */}
                  <div className="w-full h-48 bg-slate-100 rounded-xl overflow-hidden mb-4 border border-slate-100 flex items-center justify-center">
                    {w.foto_url ? (
                      <img
                        src={w.foto_url}
                        alt={w.nama_lengkap}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl text-slate-300">👤</span>
                    )}
                  </div>

                  <h3 className="font-bold text-lg text-slate-900 mb-1">{w.nama_lengkap}</h3>
                  <p className="text-slate-600 text-sm mb-2">🏠 {w.alamat}</p>
                  <p className="text-slate-600 text-sm mb-4">📱 {w.no_telepon}</p>
                </div>

                {/* Action Button untuk HP/PC */}
                <div className="pt-2 border-t border-slate-100 flex gap-2">
                  <a
                    href={`https://wa.me/${w.no_telepon.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-semibold py-2 rounded-lg transition-colors"
                  >
                    💬 WhatsApp
                  </a>
                  <a
                    href={`tel:${w.no_telepon}`}
                    className="flex-1 text-center bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-semibold py-2 rounded-lg transition-colors"
                  >
                    📞 Telepon
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal / Pop-up Form Tambah Warga */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-slate-900">Tambah Warga Baru</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Alamat Lengkap (Blok / No) *
                </label>
                <textarea
                  required
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  placeholder="Contoh: Jl. Mawar Blok A3 No. 12"
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  No. Telepon / WhatsApp *
                </label>
                <input
                  type="text"
                  required
                  value={noTelepon}
                  onChange={(e) => setNoTelepon(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Foto Warga (Kamera / Galeri)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFotoFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}