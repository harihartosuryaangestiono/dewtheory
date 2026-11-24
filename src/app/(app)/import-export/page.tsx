'use client';

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { parseWorkbook, ParseResult } from '@/lib/utils/excel';
import { useAffiliate } from '@/lib/store/useAffiliateStore';
import { CategoryBadge, PhoneBadge, StatusBadge } from '@/components/common/Badge';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  HelpCircle, 
  FileCheck,
  RefreshCw,
  Layers,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

export default function ImportExportPage() {
  const { creators, shipments, sows, campaign, importCreatorsBatch, resetToDefaultSeed } = useAffiliate();

  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'creators' | 'shipments' | 'sows'>('creators');

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const result = parseWorkbook(workbook);

        // Check duplicates against current state
        let dupes = 0;
        const existingUsernames = new Set(creators.map(c => c.username));
        result.creators.forEach(c => {
          if (c.username && existingUsernames.has(c.username)) {
            dupes++;
          }
        });
        result.duplicatesCount = dupes;

        setParseResult(result);
        toast.success(`Berhasil membaca file: ${result.creators.length} creator terdeteksi`);
      } catch (err: any) {
        console.error('Import error', err);
        toast.error('Gagal membaca file Excel/CSV: ' + (err.message || 'Format tidak didukung'));
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Commit parsed data into store then persist to Supabase
  const handleSaveToStore = () => {
    if (!parseResult) return;
    const { added, updated } = importCreatorsBatch(
      parseResult.creators,
      parseResult.shipments,
      parseResult.sows
    );
    toast.success(
      `${added} creator baru + ${updated} diperbarui — menyimpan ke database…`,
      { duration: 4000 }
    );
    setParseResult(null);
    setFileName('');
  };

  // Export all current data to Master Excel (.xlsx)
  const handleExportMaster = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Data (KOL WA)
      const dataRows = creators.map(c => ({
        'USERNAME TIKTOK': c.username,
        'NO WA KOL': c.phone_raw || c.phone_e164 || '0',
        'STATUS NO': c.phone_status,
      }));
      const wsData = XLSX.utils.json_to_sheet(dataRows);
      XLSX.utils.book_append_sheet(wb, wsData, 'Data');

      // Sheet 2: Pool
      const poolRows = creators.map(c => ({
        Username: c.username,
        Curated: c.curation_status === 'oke',
        Category: c.category,
        Platform: c.platform,
        Source: c.source,
        'No Telp': c.phone_e164 || c.phone_raw,
        Status: c.pipeline_status,
      }));
      const wsPool = XLSX.utils.json_to_sheet(poolRows);
      XLSX.utils.book_append_sheet(wb, wsPool, 'Pool');

      // Sheet 3: Final Status
      const finalRows = creators.filter(c => ['contacted', 'replied', 'join', 'refuse'].includes(c.pipeline_status)).map(c => ({
        Username: c.username,
        Status: c.pipeline_status,
        'Contacted At': c.contacted_at || '',
        'Contacted By': c.contacted_by || '',
      }));
      const wsFinal = XLSX.utils.json_to_sheet(finalRows);
      XLSX.utils.book_append_sheet(wb, wsFinal, 'Final Status');

      // Sheet 4: Seeding Sample
      const seedingRows = shipments.map(s => {
        const creator = creators.find(c => c.id === s.creator_id);
        return {
          Username: creator?.username || '-',
          'Nama Penerima': s.recipient_name,
          'No Telp Penerima': s.recipient_phone,
          Alamat: s.address,
          Produk: s.product,
          Status: s.status,
          Tracking: s.tracking_no || '',
          Kurir: s.courier || 'J&T',
        };
      });
      const wsSeeding = XLSX.utils.json_to_sheet(seedingRows);
      XLSX.utils.book_append_sheet(wb, wsSeeding, 'Seeding Sample');

      // Sheet 5: SOW Report
      const sowRows = creators.map((c, i) => {
        const sow1 = sows.find(s => s.creator_id === c.id && s.sow_no === 1);
        const sow2 = sows.find(s => s.creator_id === c.id && s.sow_no === 2);
        return {
          No: i + 1,
          Username: c.username,
          Platform: c.platform,
          Channel: 'Video',
          Category: c.category,
          'Posting Date SOW 1': sow1?.posted_at || '',
          'Link SOW 1': sow1?.link || '',
          'Posting Date SOW 2': sow2?.posted_at || '',
          'Link SOW 2': sow2?.link || '',
        };
      });
      const wsSow = XLSX.utils.json_to_sheet(sowRows);
      XLSX.utils.book_append_sheet(wb, wsSow, 'SOW Report');

      XLSX.writeFile(wb, `DewTheory_MasterExport_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('File Master Excel berhasil diexport!');
    } catch (err: any) {
      toast.error('Gagal export data: ' + err.message);
    }
  };

  // Download Empty Template
  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const samplePool = [
      { Username: 'contoh_creator1', Category: 'A', Source: 'RKP', 'No Telp': '81290001742', Status: 'OKE' },
      { Username: 'contoh_creator2', Category: 'B', Source: 'Amore', 'No Telp': '085337817052', Status: 'SECOND OPTION' },
      { Username: 'contoh_creator3', Category: 'C', Source: 'Direct', 'No Telp': '0', Status: 'REJECT' },
    ];
    const ws = XLSX.utils.json_to_sheet(samplePool);
    XLSX.utils.book_append_sheet(wb, ws, 'Pool');
    XLSX.writeFile(wb, 'DewTheory_Template_Import.xlsx');
    toast.success('Template Excel berhasil diunduh');
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
          <FileSpreadsheet className="w-6 h-6 text-teal-600 dark:text-teal-400" />
          Import & Normalisasi Data
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Upload file Excel (.xlsx) atau CSV. Sistem otomatis menggabungkan sheet, menormalisasi nomor WA ke 62..., mengecek duplikat, dan mengklasifikasikan status.
        </p>
      </div>

      {/* Upload Box */}
      <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-teal-500 rounded-3xl p-8 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md text-center transition-all group">
        <input
          type="file"
          id="excel-file-input"
          accept=".xlsx, .xls, .csv"
          onChange={handleFileUpload}
          className="hidden"
        />
        <label htmlFor="excel-file-input" className="cursor-pointer block">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-sm">
            <Upload className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {fileName ? `File terpilih: ${fileName}` : 'Klik untuk upload atau drag & drop file Excel / CSV'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Mendukung 1 workbook master (sheet Data, Pool, Final Status, Seeding, SOW) atau upload per sheet terpisah.
          </p>
        </label>
      </div>

      {/* Preview Section if File Loaded */}
      {parseResult && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-teal-600" />
                Hasil Parsing & Normalisasi: {fileName}
              </h3>
              <p className="text-xs text-slate-400">
                Sheet ditemukan: {parseResult.sheetNamesFound.join(', ')}
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setParseResult(null)}
                className="flex-1 sm:flex-none px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSaveToStore}
                className="flex-1 sm:flex-none px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-500/20 transition-all flex items-center justify-center gap-2"
              >
                <span>Simpan & Gabungkan Data</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Stats Badges */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Total Creator</span>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{parseResult.creators.length}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/60">
              <span className="text-[11px] text-teal-600 dark:text-teal-400 uppercase font-semibold">Nomor Valid (62...)</span>
              <p className="text-xl font-black text-teal-700 dark:text-teal-300 mt-0.5">{parseResult.validPhoneCount}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/60">
              <span className="text-[11px] text-amber-600 dark:text-amber-400 uppercase font-semibold">Tidak Ada Nomor (0)</span>
              <p className="text-xl font-black text-amber-700 dark:text-amber-300 mt-0.5">{parseResult.missingPhoneCount}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/60">
              <span className="text-[11px] text-rose-600 dark:text-rose-400 uppercase font-semibold">Nomor Invalid</span>
              <p className="text-xl font-black text-rose-700 dark:text-rose-300 mt-0.5">{parseResult.invalidPhoneCount}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/60">
              <span className="text-[11px] text-purple-600 dark:text-purple-400 uppercase font-semibold">Duplikat Terdeteksi</span>
              <p className="text-xl font-black text-purple-700 dark:text-purple-300 mt-0.5">{parseResult.duplicatesCount}</p>
            </div>
          </div>

          {/* Warnings list if any */}
          {parseResult.warnings.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Catatan Penting Format Tanggal:
              </div>
              <ul className="list-disc list-inside space-y-0.5">
                {parseResult.warnings.slice(0, 5).map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Preview Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-80 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Username</th>
                  <th className="py-2.5 px-3">Kategori</th>
                  <th className="py-2.5 px-3">Nomor Raw</th>
                  <th className="py-2.5 px-3">Normalisasi (e164)</th>
                  <th className="py-2.5 px-3">Status No</th>
                  <th className="py-2.5 px-3">Kurasi</th>
                  <th className="py-2.5 px-3">Pipeline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {parseResult.creators.slice(0, 50).map((c, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-100">@{c.username}</td>
                    <td className="py-2.5 px-3">
                      <CategoryBadge category={c.category || 'UNASSIGNED'} />
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono">{c.phone_raw || '-'}</td>
                    <td className="py-2.5 px-3 font-mono font-medium text-emerald-600 dark:text-emerald-400">
                      {c.phone_e164 ? `+${c.phone_e164}` : '-'}
                    </td>
                    <td className="py-2.5 px-3">
                      <PhoneBadge status={c.phone_status || 'missing'} />
                    </td>
                    <td className="py-2.5 px-3 font-semibold uppercase">{c.curation_status}</td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={c.pipeline_status || 'pool'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Export & Utility Section */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Export Data */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Export Semua Data (Anti-Lock-In)</h3>
              <p className="text-xs text-slate-400">Download data lengkap ke format Excel (.xlsx multi-sheet)</p>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Export mencakup 5 sheet lengkap: <strong>Data</strong> (nomor WA), <strong>Pool</strong> (seluruh creator & kategori), <strong>Final Status</strong> (hasil outreach), <strong>Seeding Sample</strong>, dan <strong>SOW Report</strong>.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportMaster}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-teal-500/20 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Master Excel (.xlsx)
            </button>
            <button
              onClick={handleDownloadTemplate}
              className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Unduh Template Kosong
            </button>
          </div>
        </div>

        {/* Database Management */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Reset & Database Demo</h3>
              <p className="text-xs text-slate-400">Kembalikan data ke contoh awal untuk simulasi pengujian</p>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Saat ini database lokal Anda berisi <strong>{creators.length} creator</strong>, <strong>{shipments.length} pengiriman sample</strong>, dan <strong>{sows.length} SOW</strong>.
          </p>

          <div className="pt-2">
            <button
              onClick={() => {
                if (confirm('Apakah Anda yakin ingin mereset database lokal ke data seed awal?')) {
                  resetToDefaultSeed();
                }
              }}
              className="px-4 py-2.5 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-semibold transition-colors"
            >
              Reset ke Seed Default
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
