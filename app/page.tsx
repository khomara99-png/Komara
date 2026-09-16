'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Warga {
  id: string;
  nama_lengkap?: string;
  nama_warga?: string;
  nama?: string;
  alamat?: string;
  no_telepon?: string;
  telepon?: string;
  no_hp?: string;
  status_warga?: string;
  jumlah_jiwa?: number;
  foto_url?: string;
}

export default function Home() {
  const [wargaList, setWargaList] = useState<Warga[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Semua' | 'Tetap' | 'Ngontrak'>('Semua');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [loading, setLoading] = useState(true);

  // State Keamanan Mode Pengurus (Default FALSE agar Warga Biasa tidak bisa edit/hapus)
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');

  // PASSWORD PENGURUS (Bisa Anda ganti di bawah ini, contoh: 'rt1234')
  const PASSWORD_PENGURUS = 'rt1234';

  // State Modal Form (Tambah & Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [namaInput, setNamaInput] = useState('');
  const [alamatInput, setAlamatInput] = useState('');
  const [teleponInput, setTeleponInput] = useState('');
  const [statusInput, setStatusInput] = useState('Tetap');
  const [jiwaInput, setJiwaInput] = useState(1);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [existingFotoUrl, setExistingFotoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Ambil Data Warga dari Supabase
  const fetchWarga = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('warga').select('*');

    if (!error && data) {
      setWargaList(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWarga();
  }, []);

  // Helper Cerdas Pembaca Nama Lengkap
  const getNama = (w: Warga) => {
    return w.nama_lengkap || w.nama_warga || w.nama || 'TANPA NAMA';
  };

  const getTelepon = (w: Warga) => w.no_telepon || w.telepon || w.no_hp || '-';
  const getStatus = (w: Warga) => w.status_warga || 'Tetap';
  const getJiwa = (w: Warga) => w.jumlah_jiwa || 1;

  // FUNGSI FORMATTER NOMOR WHATSAPP
  const formatWaNumber = (phoneStr: string) => {
    if (!phoneStr || phoneStr === '-') return '';
    let cleaned = phoneStr.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.slice(1);
    }
    return cleaned;
  };

  // FUNGSI PENGURUTAN ALAMAT / BLOK (G1/1 -> G1/20 -> G2/1, dst)
  const sortAlamatNatural = (a: Warga, b: Warga) => {
    const alamatA = (a.alamat || '').trim().toUpperCase();
    const alamatB = (b.alamat || '').trim().toUpperCase();

    return alamatA.localeCompare(alamatB, undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  };

  // Filter Search, Status, & Sorting
  const filteredWarga = wargaList
    .filter((w) => {
      const nama = getNama(w).toLowerCase();
      const alamat = (w.alamat || '').toLowerCase();
      const status = getStatus(w);
      const query = search.toLowerCase();

      const matchSearch = nama.includes(query) || alamat.includes(query);
      const matchStatus = statusFilter === 'Semua' || status === statusFilter;

      return matchSearch && matchStatus;
    })
    .sort(sortAlamatNatural);

  // Hitung Statistik Warga
  const totalWarga = wargaList.length;
  const totalTetap = wargaList.filter((w) => getStatus(w) === 'Tetap').length;
  const totalNgontrak = wargaList.filter((w) => getStatus(w) === 'Ngontrak').length;
  const totalJiwa = wargaList.reduce((acc, curr) => acc + getJiwa(curr), 0);

  // Toggle Mode Pengurus dengan Password
  const handleToggleAdmin = () => {
    if (isAdmin) {
      // Jika sedang aktif, klik untuk Logout Mode Pengurus
      setIsAdmin(false);
      alert('Anda telah keluar dari Mode Pengurus.');
    } else {
      // Jika ingin aktifkan, minta PIN/Password
      setPinInput('');
      setIsPinModalOpen(true);
    }
  };

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === PASSWORD_PENGURUS) {
      setIsAdmin(true);
      setIsPinModalOpen(false);
      alert('Berhasil masuk Mode Pengurus! Akses Tambah, Edit, & Hapus diaktifkan.');
    } else {
      alert('Password Pengurus Salah! Akses ditolak.');
    }
  };

  // Export Data ke CSV / Excel
  const handleExportExcel = () => {
    if (filteredWarga.length === 0) return alert('Tidak ada data untuk diekspor!');

    let csvContent = 'data:text/csv;charset=utf-8,NO,ALAMAT / BLOK,NAMA LENGKAP,STATUS,JUMLAH JIWA,NO TELEPON / WA\n';

    filteredWarga.forEach((w, idx) => {
      const row = [
        idx + 1,
        `"${w.alamat || '-'}"`,
        `"${getNama(w)}"`,
        `"${getStatus(w)}"`,
        getJiwa(w),
        `"${getTelepon(w)}"`,
      ].join(',');
      csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Data_Warga_RT_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print PDF
  const handlePrint = () => {
    window.print();
  };

  // Buka Modal Tambah Warga Baru
  const handleOpenAddModal = () => {
    setEditingId(null);
    setNamaInput('');
    setAlamatInput('');
    setTeleponInput('');
    setStatusInput('Tetap');
    setJiwaInput(1);
    setFotoFile(null);
    setExistingFotoUrl('');
    setIsModalOpen(true);
  };

  // Buka Modal Edit Warga
  const handleOpenEditModal = (w: Warga) => {
    setEditingId(w.id);
    setNamaInput(getNama(w));
    setAlamatInput(w.alamat || '');
    setTeleponInput(getTelepon(w) !== '-' ? getTelepon(w) : '');
    setStatusInput(getStatus(w));
    setJiwaInput(getJiwa(w));
    setExistingFotoUrl(w.foto_url || '');
    setFotoFile(null);
    setIsModalOpen(true);
  };

  // Hapus Data Warga
  const handleHapusWarga = async (id: string, nama: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus data warga: ${nama}?`)) return;

    const { error } = await supabase.from('warga').delete().eq('id', id);

    if (error) {
      alert('Gagal menghapus data: ' + error.message);
    } else {
      alert('Data warga berhasil dihapus.');
      fetchWarga();
    }
  };

  // Simpan Data (Tambah / Edit)
  const handleSaveWarga = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaInput) return alert('Nama lengkap wajib diisi!');

    setSubmitting(true);
    let publicFotoUrl = existingFotoUrl;

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
        no_telepon: teleponInput,
        status_warga: statusInput,
        jumlah_jiwa: Number(jiwaInput) || 1,
        foto_url: publicFotoUrl || null,
      };

      if (editingId) {
        const { error } = await supabase
          .from('warga')
          .update(payload)
          .eq('id', editingId);

        if (error) alert('Gagal mengupdate data: ' + error.message);
        else alert('Data warga berhasil diperbarui!');
      } else {
        const { error } = await supabase.from('warga').insert([payload]);

        if (error) alert('Gagal menambah warga: ' + error.message);
        else alert('Berhasil menambah warga baru!');
      }

      setIsModalOpen(false);
      fetchWarga();
    } catch (err: any) {
      alert('Terjadi kesalahan: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-3 sm:p-6 lg:p-8">
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
            font-size: 11px !important;
            color: #000 !important;
          }
        }
        .print-only {
          display: none;
        }
      `}</style>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER UTAMA */}
        <header className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-900/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 no-print">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-medium text-blue-100 mb-2 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Sistem Informasi Pendataan Terpadu
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">🏠 Database Warga RT</h1>
            <p className="text-blue-100/80 text-xs sm:text-sm max-w-lg">
              Kelola data warga, status hunian, jumlah jiwa, kontak WA, dan dokumen cetak dalam satu sistem terintegrasi.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {/* Toggle Pengurus Mode dengan Password */}
            <button
              onClick={handleToggleAdmin}
              className={`w-full sm:w-auto px-4 py-3 rounded-2xl font-bold text-xs transition border flex items-center justify-center gap-2 ${
                isAdmin
                  ? 'bg-amber-400 text-slate-900 border-amber-300 shadow-md'
                  : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
              }`}
            >
              <span>{isAdmin ? '🔓 Mode Pengurus (Aktif)' : '🔒 Mode Pengurus'}</span>
            </button>

            {isAdmin && (
              <button
                onClick={handleOpenAddModal}
                className="w-full sm:w-auto bg-white text-blue-700 hover:bg-blue-50 px-5 py-3 rounded-2xl font-bold shadow-lg shadow-black/10 transition active:scale-95 flex items-center justify-center gap-2"
              >
                <span className="text-xl">+</span>
                <span>Tambah Warga Baru</span>
              </button>
            )}
          </div>
        </header>

        {/* KARTU RINGKASAN STATISTIK */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 no-print">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Kepala Keluarga</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{loading ? '...' : totalWarga} <span className="text-xs font-normal text-slate-400">KK</span></h3>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg font-bold">
              👨‍👩‍👧‍👦
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Penduduk</p>
              <h3 className="text-2xl font-black text-indigo-600 mt-1">{loading ? '...' : totalJiwa} <span className="text-xs font-normal text-slate-400">Jiwa</span></h3>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg font-bold">
              👥
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Warga Tetap</p>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">{loading ? '...' : totalTetap} <span className="text-xs font-normal text-slate-400">KK</span></h3>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg font-bold">
              🏡
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Warga Ngontrak</p>
              <h3 className="text-2xl font-black text-amber-600 mt-1">{loading ? '...' : totalNgontrak} <span className="text-xs font-normal text-slate-400">KK</span></h3>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg font-bold">
              🔑
            </div>
          </div>
        </section>

        {/* BAR KONTROL (SEARCH, FILTER STATUS, TAMPILAN) */}
        <section className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 lg:space-y-0 lg:flex lg:items-center lg:justify-between lg:gap-4 no-print">
          {/* Form Pencarian */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm">
              🔍
            </span>
            <input
              type="text"
              placeholder="Cari berdasarkan nama lengkap atau nomor blok/alamat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm text-slate-800 transition"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 lg:justify-end">
            {/* Filter Tab Status */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              {(['Semua', 'Tetap', 'Ngontrak'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    statusFilter === status
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Switch Mode Tampilan & Cetak/Export */}
            <div className="flex items-center gap-2">
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setViewMode('card')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    viewMode === 'card'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🖼️ Kartu
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    viewMode === 'table'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📋 Tabel
                </button>
              </div>

              <button
                onClick={handleExportExcel}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 border border-emerald-200"
              >
                📊 Excel
              </button>

              {viewMode === 'table' && (
                <button
                  onClick={handlePrint}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  🖨️ Cetak PDF
                </button>
              )}
            </div>
          </div>
        </section>

        {/* HEADER KHUSUS HANYA UNTUK CETAK PDF */}
        <div className="print-only text-center mb-6">
          <h1 className="text-xl font-black uppercase tracking-wide border-b-2 border-slate-900 pb-2">DAFTAR DATA WARGA RT</h1>
          <p className="text-xs text-slate-600 mt-1">Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        {/* MODE 1: TAMPILAN KARTU FOTO */}
        {viewMode === 'card' && (
          <main className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 no-print">
            {filteredWarga.map((w) => {
              const rawPhone = getTelepon(w);
              const waFormatted = formatWaNumber(rawPhone);

              return (
                <div
                  key={w.id}
                  className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col group"
                >
                  {/* Container Foto */}
                  <div className="h-52 bg-slate-100 relative overflow-hidden">
                    {w.foto_url ? (
                      <img
                        src={w.foto_url}
                        alt={getNama(w)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1 bg-slate-100">
                        <span className="text-3xl">📷</span>
                        <span className="text-xs font-medium">Foto Rumah Belum Ada</span>
                      </div>
                    )}

                    {/* Badge Status Warga */}
                    <div className="absolute top-3 left-3">
                      <span
                        className={`text-[11px] font-bold px-3 py-1 rounded-full shadow-md backdrop-blur-md ${
                          getStatus(w) === 'Ngontrak'
                            ? 'bg-amber-500/90 text-white'
                            : 'bg-emerald-600/90 text-white'
                        }`}
                      >
                        {getStatus(w)}
                      </span>
                    </div>

                    {/* Badge Blok Alamat */}
                    <div className="absolute top-3 right-3">
                      <span className="bg-white/95 backdrop-blur-md text-blue-700 text-xs font-extrabold px-3 py-1 rounded-xl shadow-md border border-white">
                        {w.alamat || 'G0/0'}
                      </span>
                    </div>
                  </div>

                  {/* Isi Kartu */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-extrabold text-slate-900 text-lg tracking-tight uppercase line-clamp-1">
                          {getNama(w)}
                        </h3>
                        <span className="bg-indigo-50 text-indigo-700 text-[11px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap">
                          👨‍👩‍👧 {getJiwa(w)} Jiwa
                        </span>
                      </div>
                      <p className="text-slate-500 text-xs font-medium mt-1 flex items-center gap-1">
                        <span>📱</span> {rawPhone}
                      </p>
                    </div>

                    <div className="space-y-2 pt-3 border-t border-slate-100">
                      {rawPhone !== '-' && (
                        <div className="grid grid-cols-2 gap-2">
                          <a
                            href={`https://wa.me/${waFormatted}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-center py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                          >
                            <span>💬</span> WhatsApp
                          </a>
                          <a
                            href={`tel:${rawPhone}`}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-center py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                          >
                            <span>📞</span> Telepon
                          </a>
                        </div>
                      )}

                      {/* Tombol Edit & Hapus (Hanya Muncul Jika Password Pengurus Benar) */}
                      {isAdmin && (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleOpenEditModal(w)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-center py-2 rounded-xl text-xs font-bold transition"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleHapusWarga(w.id, getNama(w))}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-600 text-center py-2 rounded-xl text-xs font-bold transition"
                          >
                            🗑️ Hapus
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </main>
        )}

        {/* MODE 2: TAMPILAN DAFTAR LIST TABEL */}
        {viewMode === 'table' && (
          <main className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                    <th className="p-4 w-12 text-center">NO</th>
                    <th className="p-4">ALAMAT / BLOK</th>
                    <th className="p-4">NAMA LENGKAP</th>
                    <th className="p-4">STATUS</th>
                    <th className="p-4 text-center">JUMLAH JIWA</th>
                    <th className="p-4">NO. TELEPON / WA</th>
                    {isAdmin && <th className="p-4 text-center no-print">AKSI</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredWarga.length > 0 ? (
                    filteredWarga.map((w, idx) => {
                      const rawPhone = getTelepon(w);
                      const waFormatted = formatWaNumber(rawPhone);

                      return (
                        <tr key={w.id} className="hover:bg-blue-50/30 transition">
                          <td className="p-4 text-center font-semibold text-slate-400 text-xs">{idx + 1}</td>
                          <td className="p-4 font-black text-blue-700 uppercase">{w.alamat || '-'}</td>
                          <td className="p-4 font-bold text-slate-900 uppercase">{getNama(w)}</td>
                          <td className="p-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                                getStatus(w) === 'Ngontrak'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {getStatus(w)}
                            </span>
                          </td>
                          <td className="p-4 text-center font-bold text-slate-700">{getJiwa(w)} Orang</td>
                          <td className="p-4 text-slate-800">
                            {rawPhone !== '-' ? (
                              <a
                                href={`https://wa.me/${waFormatted}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-600 hover:text-emerald-700 font-bold hover:underline inline-flex items-center gap-1"
                              >
                                💬 {rawPhone}
                              </a>
                            ) : (
                              '-'
                            )}
                          </td>
                          {isAdmin && (
                            <td className="p-4 text-center no-print">
                              <div className="flex justify-center gap-1.5">
                                <button
                                  onClick={() => handleOpenEditModal(w)}
                                  className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl transition"
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  onClick={() => handleHapusWarga(w.id, getNama(w))}
                                  className="text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-1.5 rounded-xl transition"
                                >
                                  🗑️ Hapus
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={isAdmin ? 7 : 6} className="p-12 text-center text-slate-400 font-medium">
                        {loading ? 'Memuat data warga...' : 'Data warga tidak ditemukan'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </main>
        )}
      </div>

      {/* MODAL POP-UP VERIFIKASI PASSWORD PENGURUS */}
      {isPinModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative border border-slate-100">
            <h2 className="text-lg font-extrabold text-slate-900 mb-1">🔑 Masukkan Password Pengurus</h2>
            <p className="text-xs text-slate-500 mb-4">Verifikasi ini diperlukan untuk mengubah data warga.</p>

            <form onSubmit={handleVerifyPin} className="space-y-4">
              <input
                type="password"
                required
                placeholder="Masukkan password pengurus..."
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm text-slate-800 transition"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md"
                >
                  Masuk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL POP-UP FORM (TAMBAH / EDIT) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {editingId ? '✏️ Edit Data Warga' : '➕ Tambah Warga Baru'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 font-bold flex items-center justify-center text-sm transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveWarga} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: MASLUKHUL MASWAN"
                  value={namaInput}
                  onChange={(e) => setNamaInput(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm text-slate-800 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Alamat / Blok (Contoh: G1/1)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: G2/22"
                  value={alamatInput}
                  onChange={(e) => setAlamatInput(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm text-slate-800 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Status Warga
                  </label>
                  <select
                    value={statusInput}
                    onChange={(e) => setStatusInput(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm text-slate-800 transition font-medium"
                  >
                    <option value="Tetap">Tetap</option>
                    <option value="Ngontrak">Ngontrak</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Jumlah Jiwa
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={jiwaInput}
                    onChange={(e) => setJiwaInput(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm text-slate-800 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  No. Telepon / WA (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 081234567890"
                  value={teleponInput}
                  onChange={(e) => setTeleponInput(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm text-slate-800 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {editingId ? 'Ganti Foto Rumah (Opsional)' : 'Foto Rumah / Warga (Opsional)'}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFotoFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition disabled:opacity-50 active:scale-95"
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