'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Warga {
  id: string;
  nama: string;
  alamat: string;
  telepon: string;
  foto_url?: string;
}

export default function Home() {
  const [wargaList, setWargaList] = useState<Warga[]>([]);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [loading, setLoading] = useState(true);

  // Ambil data warga dari Supabase
  const fetchWarga = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('warga')
      .select('*')
      .order('nama', { ascending: true });

    if (!error && data) {
      setWargaList(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWarga();
  }, []);

  // Filter pencarian
  const filteredWarga = wargaList.filter(
    (w) =>
      w.nama?.toLowerCase().includes(search.toLowerCase()) ||
      w.alamat?.toLowerCase().includes(search.toLowerCase())
  );

  // Fungsi Cetak PDF
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* CSS Khusus Cetak/PDF (Menyembunyikan Tombol & Header saat di-print) */}
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
          .page-break {
            page-break-after: always;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th, td {
            border: 1px solid #333 !important;
            padding: 8px !important;
            font-size: 12px !important;
          }
        }
        .print-only {
          display: none;
        }
      `}</style>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header - Disembunyikan saat print */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 no-print">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">🏠 Database Warga RT</h1>
            <p className="text-gray-500 text-sm">Sistem Informasi Pendataan Warga Terpadu</p>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition">
            + Tambah Warga Baru
          </button>
        </div>

        {/* Tab Switcher & Search Bar - Disembunyikan saat print */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 no-print">
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <input
              type="text"
              placeholder="🔍 Cari nama atau alamat rumah warga..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-4 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Navigasi Tampilan & Tombol Cetak */}
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

            {/* Tombol Cetak PDF hanya muncul di mode List Tabel */}
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

        {/* Header Khusus Hasil Cetak PDF */}
        <div className="print-only text-center mb-6">
          <h1 className="text-xl font-bold uppercase tracking-wide">DAFTAR DATA WARGA RT</h1>
          <p className="text-xs text-gray-600">Dicetak pada tanggal: {new Date().toLocaleDateString('id-ID')}</p>
        </div>

        {/* CONTENT TAMPILAN 1: KARTU FOTO */}
        {viewMode === 'card' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 no-print">
            {filteredWarga.map((w) => (
              <div key={w.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col">
                <div className="h-48 bg-gray-100 relative">
                  {w.foto_url ? (
                    <img src={w.foto_url} alt={w.nama} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">Tidak ada foto</div>
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg uppercase">{w.nama}</h3>
                    <p className="text-gray-500 text-sm mt-1">🏠 {w.alamat}</p>
                    <p className="text-gray-500 text-sm">📱 {w.telepon}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <a
                      href={`https://wa.me/${w.telepon}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-emerald-50 text-emerald-600 text-center py-2 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition"
                    >
                      WhatsApp
                    </a>
                    <a
                      href={`tel:${w.telepon}`}
                      className="bg-blue-50 text-blue-600 text-center py-2 rounded-lg text-xs font-semibold hover:bg-blue-100 transition"
                    >
                      Telepon
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CONTENT TAMPILAN 2: DAFTAR LIST TABEL (BISA DINETAK KE PDF) */}
        {viewMode === 'table' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <th className="p-4 w-12 text-center">No</th>
                    <th className="p-4">Nama Lengkap</th>
                    <th className="p-4">Alamat / Blok</th>
                    <th className="p-4">No. Telepon / WA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
                  {filteredWarga.length > 0 ? (
                    filteredWarga.map((w, idx) => (
                      <tr key={w.id} className="hover:bg-gray-50 transition">
                        <td className="p-4 text-center font-medium text-gray-400">{idx + 1}</td>
                        <td className="p-4 font-bold text-gray-900 uppercase">{w.nama}</td>
                        <td className="p-4">{w.alamat}</td>
                        <td className="p-4">{w.telepon || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-gray-400">
                        Data warga tidak ditemukan
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}