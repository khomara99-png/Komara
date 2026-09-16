'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Warga {
  id: string;
  nama_lengkap?: string;
  nama?: string;
  alamat?: string;
  no_telepon?: string;
  telepon?: string;
  no_hp?: string;
  foto_url?: string;
}

export default function Home() {
  const [wargaList, setWargaList] = useState<Warga[]>([]);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [loading, setLoading] = useState(true);

  // State Modal & Form Input
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [namaInput, setNamaInput] = useState('');
  const [alamatInput, setAlamatInput] = useState('');
  const [teleponInput, setTeleponInput] = useState('');
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Ambil Data Warga dari Supabase
  const fetchWarga = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('warga')
      .select('*');

    if (!error && data) {
      setWargaList(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWarga();
  }, []);

  // Helper Nama & Nomor Telepon
  const getNama = (w: Warga) => w.nama_lengkap || w.nama || 'NAMA KOSONG';
  const getTelepon = (w: Warga) => w.no_telepon || w.telepon || w.no_hp || '-';

  // FUNGSI PENGURUTAN ALAMAT / BLOK (Natural Sort: G1/1 -> G1/20 -> G2/1, dst)
  const sortAlamatNatural = (a: Warga, b: Warga) => {
    const alamatA = (a.alamat || '').trim().toUpperCase();
    const alamatB = (b.alamat || '').trim().toUpperCase();

    return alamatA.localeCompare(alamatB, undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  };

  // Filter Pencarian + Diurutkan berdasarkan Blok / Alamat Terkecil -> Terbesar
  const filteredWarga = wargaList
    .filter((w) => {
      const nama = getNama(w).toLowerCase();
      const alamat = (w.alamat || '').toLowerCase();
      const query = search.toLowerCase();
      return nama.includes(query) || alamat.includes(query);
    })
    .sort(sortAlamatNatural);

  // Cetak Dokumen / PDF
  const handlePrint = () => {
    window.print();
  };

  // Simpan Warga Baru
  const handleTambahWarga = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaInput) return alert('Nama lengkap wajib diisi!');

    setSubmitting(true);
    let publicFotoUrl = '';

    try {
      if (fotoFile) {
        const fileExt = fotoFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('foto-warga')
          .upload(fileName, fotoFile);

        if (!uploadError) {
          const { data } = supabase.storage.from('foto-warga').getPublicUrl(fileName);
          publicFotoUrl = data.publicUrl;
        }
      }

      const payload: Record<string, any> = {
        nama_lengkap: namaInput,
        alamat: alamatInput,
        foto_url: publicFotoUrl || null,
      };

      if (teleponInput) {
        payload.no_telepon = teleponInput;
      }

      const { error } = await supabase.from('warga').insert([payload]);

      if (error) {
        alert('Gagal menambah warga: ' + error.message);
      } else {
        alert('Berhasil menambah warga baru!');
        setNamaInput('');
        setAlamatInput('');
        setTeleponInput('');
        setFotoFile(null);
        setIsModalOpen(false);
        fetchWarga();
      }
    } catch (err: any) {
      alert('Terjadi kesalahan: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* CSS Cetak / PDF */}
      <style jsx global>{`
        @media print {
          body {
            background-color: #fff !important;
            color: #000 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th, td {
            border: 1px solid #333 !important;
            padding: 8px !important;
            font-size: 12px !important;
            color: #000 !important;
          }
        }
        .print-only {
          display: none;
        }
      `}</style>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Utama */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 no-print">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">🏠 Database Warga RT</h1>
            <p className="text-gray-500 text-sm">Sistem Informasi Pendataan Warga Terpadu</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition"
          >
            + Tambah Warga Baru
          </button>
        </div>

        {/* Bar Search & Navigasi Tampilan */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 no-print">
          <div className="relative w-full md:w-96">
            <input
              type="text"
              placeholder="🔍 Cari nama atau alamat rumah warga..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-4 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-800"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <div className="bg-gray-100 p-1 rounded-xl flex gap-1">
              <button
                onClick={() => setViewMode('card')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                  viewMode === 'card'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🖼️ Kartu Foto
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                  viewMode === 'table'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📋 Daftar List
              </button>
            </div>

            {viewMode === 'table' && (
              <button
                onClick={handlePrint}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 shadow-sm"
              >
                🖨️ Cetak / Download PDF
              </button>
            )}
          </div>
        </div>

        {/* Header Cetak PDF */}
        <div className="print-only text-center mb-6">
          <h1 className="text-xl font-bold uppercase tracking-wide">DAFTAR DATA WARGA RT</h1>
          <p className="text-xs text-gray-600">Dicetak pada: {new Date().toLocaleDateString('id-ID')}</p>
        </div>

        {/* MODE 1: KARTU FOTO */}
        {viewMode === 'card' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 no-print">
            {filteredWarga.map((w) => (
              <div key={w.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col">
                <div className="h-48 bg-gray-100 relative">
                  {w.foto_url ? (
                    <img src={w.foto_url} alt={getNama(w)} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">Tidak ada foto</div>
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-gray-900 text-lg uppercase">{getNama(w)}</h3>
                      <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-md border border-blue-100">
                        {w.alamat || 'G0/0'}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">📱 {getTelepon(w)}</p>
                  </div>
                  {getTelepon(w) !== '-' && (
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <a
                        href={`https://wa.me/${getTelepon(w)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-emerald-50 text-emerald-600 text-center py-2 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition"
                      >
                        WhatsApp
                      </a>
                      <a
                        href={`tel:${getTelepon(w)}`}
                        className="bg-blue-50 text-blue-600 text-center py-2 rounded-lg text-xs font-semibold hover:bg-blue-100 transition"
                      >
                        Telepon
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MODE 2: DAFTAR LIST TABEL */}
        {viewMode === 'table' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-700 uppercase tracking-wider">
                    <th className="p-4 w-12 text-center">NO</th>
                    <th className="p-4">ALAMAT / BLOK</th>
                    <th className="p-4">NAMA LENGKAP</th>
                    <th className="p-4">NO. TELEPON / WA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm">
                  {filteredWarga.length > 0 ? (
                    filteredWarga.map((w, idx) => (
                      <tr key={w.id} className="hover:bg-gray-50 transition">
                        <td className="p-4 text-center font-medium text-gray-500">{idx + 1}</td>
                        <td className="p-4 font-bold text-blue-600 uppercase">{w.alamat || '-'}</td>
                        <td className="p-4 font-bold text-gray-900 uppercase">{getNama(w)}</td>
                        <td className="p-4 text-gray-800">{getTelepon(w)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-gray-400">
                        {loading ? 'Memuat data...' : 'Data warga tidak ditemukan'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL POP-UP FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative">
            <h2 className="text-xl font-bold text-gray-800 mb-4">➕ Tambah Warga Baru</h2>

            <form onSubmit={handleTambahWarga} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: MASLUKHUL MASWAN"
                  value={namaInput}
                  onChange={(e) => setNamaInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm text-gray-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Alamat / Blok (Contoh: G1/1, G2/10)</label>
                <input
                  type="text"
                  placeholder="Contoh: G2/22"
                  value={alamatInput}
                  onChange={(e) => setAlamatInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm text-gray-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">No. Telepon / WA (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: 081234567890"
                  value={teleponInput}
                  onChange={(e) => setTeleponInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm text-gray-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Foto Rumah / Warga (Opsional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFotoFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}