'use client';

import React, { useState, useMemo } from 'react';
import { useAffiliate } from '@/lib/store/useAffiliateStore';
import { Shipment, Creator } from '@/types';
import { CategoryBadge } from '@/components/common/Badge';
import { 
  Package, 
  Truck, 
  Send, 
  Copy, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Search, 
  FileSpreadsheet,
  ExternalLink,
  ClipboardPaste,
  X
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { renderTemplate, buildWhatsAppLink } from '@/lib/utils/template';
import { toast } from 'sonner';

export default function SeedingSamplePage() {
  const { shipments, creators, templates, currentUser, config, upsertShipment, batchUpdateTracking } = useAffiliate();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'sent'>('all');
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchInput, setBatchInput] = useState('');

  // Combine shipment with creator details
  const enrichedShipments = useMemo(() => {
    return shipments.map(s => {
      const creator = creators.find(c => c.id === s.creator_id);
      return {
        ...s,
        creator,
      };
    }).filter(item => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mUser = item.creator?.username.toLowerCase().includes(q);
        const mRecip = item.recipient_name.toLowerCase().includes(q);
        const mTracking = item.tracking_no?.toLowerCase().includes(q);
        const mAddr = item.address.toLowerCase().includes(q);
        if (!mUser && !mRecip && !mTracking && !mAddr) return false;
      }
      return true;
    });
  }, [shipments, creators, statusFilter, searchQuery]);

  // Address validation helper
  const validateAddress = (addr: string) => {
    if (!addr) return { valid: false, reason: 'Alamat kosong' };
    const hasPostalCode = /\b\d{5}\b/.test(addr);
    const isLongEnough = addr.trim().length >= 20;

    if (!hasPostalCode && !isLongEnough) {
      return { valid: false, reason: 'Alamat terlalu pendek & tanpa kode pos' };
    }
    if (!hasPostalCode) {
      return { valid: false, reason: 'Perlu cek kode pos (5 digit)' };
    }
    if (!isLongEnough) {
      return { valid: false, reason: 'Alamat terlalu singkat' };
    }
    return { valid: true, reason: 'Lengkap' };
  };

  // Copy address for delivery packaging
  const handleCopyAddress = (s: Shipment) => {
    const text = `${s.recipient_name} (${s.recipient_phone})\n${s.address}\nProduk: ${s.product}`;
    navigator.clipboard.writeText(text);
    toast.success('Alamat penerima disalin');
  };

  // Send WhatsApp with Resi Confirmation
  const handleSendResiWA = (item: any) => {
    if (!item.creator || !item.creator.phone_e164) {
      toast.error('Creator tidak memiliki nomor WhatsApp');
      return;
    }
    if (!item.tracking_no) {
      toast.error('Masukkan nomor resi terlebih dahulu');
      return;
    }

    const tpl = templates.find(t => t.id === 'sample_resi') || templates[0];
    const message = renderTemplate(tpl.content, {
      nama: item.creator.display_name || item.creator.username,
      pengirim: currentUser.name,
      produk_sample: item.product,
      kurir: item.courier || config.default_courier || '',
      resi: item.tracking_no,
      deadline_posting: config.posting_deadline || '15 Desember',
    });

    const link = buildWhatsAppLink(item.creator.phone_e164, message);
    window.open(link, '_blank', 'noopener,noreferrer');
    toast.success(`Pesan konfirmasi resi terkirim ke @${item.creator.username}`);
  };

  // Process Batch Tracking input
  const handleProcessBatch = () => {
    if (!batchInput.trim()) return;

    const lines = batchInput.split('\n');
    const items: { username: string; tracking_no: string; courier?: string }[] = [];

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Match comma, tab, or space separated: username resi
      const parts = trimmed.split(/[\t, ]+/);
      if (parts.length >= 2) {
        items.push({
          username: parts[0],
          tracking_no: parts[1],
          courier: parts[2] || config.default_courier || '',
        });
      }
    });

    const matched = batchUpdateTracking(items);
    toast.success(`${matched} nomor resi berhasil diperbarui dan status diubah ke Sent!`);
    setIsBatchModalOpen(false);
    setBatchInput('');
  };

  // Export for Courier Expedition (J&T / CSV)
  const handleExportExpedition = () => {
    try {
      const rows = shipments.map(s => {
        const creator = creators.find(c => c.id === s.creator_id);
        return {
          'Username Creator': creator?.username || '-',
          'Nama Penerima': s.recipient_name,
          'No Telepon': s.recipient_phone,
          'Alamat Lengkap': s.address,
          'Produk Sample': s.product,
          Kurir: s.courier || 'J&T',
          'No Resi': s.tracking_no || '',
          Status: s.status,
        };
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Pengiriman Sample');
      XLSX.writeFile(wb, `DewTheory_SeedingSample_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Data pengiriman sample berhasil diexport!');
    } catch (err: any) {
      toast.error('Gagal export: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Package className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            Seeding Sample & Pelacakan Resi
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Kelola data pengiriman sample free product dari Google Form registrasi, input resi massal, dan kirim notifikasi WhatsApp ke creator.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsBatchModalOpen(true)}
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <ClipboardPaste className="w-3.5 h-3.5 text-teal-600" />
            <span>Paste Banyak Resi</span>
          </button>

          <button
            onClick={handleExportExpedition}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white transition-all shadow-md shadow-teal-500/20 flex items-center justify-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export untuk Ekspedisi</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
              statusFilter === 'all' ? 'bg-teal-600 text-white' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Semua ({shipments.length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
              statusFilter === 'pending' ? 'bg-teal-600 text-white' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Pending Resi ({shipments.filter(s => s.status === 'pending').length})
          </button>
          <button
            onClick={() => setStatusFilter('sent')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
              statusFilter === 'sent' ? 'bg-teal-600 text-white' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Terkirim ({shipments.filter(s => s.status === 'sent').length})
          </button>
        </div>

        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Cari penerima, username, resi..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none"
          />
        </div>
      </div>

      {/* Shipments Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Creator</th>
                <th className="py-3 px-4">Penerima & Kontak</th>
                <th className="py-3 px-4">Alamat Pengiriman</th>
                <th className="py-3 px-4">Produk Sample</th>
                <th className="py-3 px-4">Resi & Kurir</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {enrichedShipments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Belum ada data pengiriman sample yang cocok.
                  </td>
                </tr>
              ) : (
                enrichedShipments.map(s => {
                  const addrCheck = validateAddress(s.address);

                  return (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {s.creator ? (
                          <div className="flex items-center gap-1.5">
                            <span>@{s.creator.username}</span>
                            <CategoryBadge category={s.creator.category} />
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-100">{s.recipient_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{s.recipient_phone}</div>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                          {s.address}
                        </p>
                        {!addrCheck.valid && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                            <AlertTriangle className="w-3 h-3" />
                            {addrCheck.reason}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                        {s.product}
                      </td>

                      <td className="py-3.5 px-4">
                        {s.tracking_no ? (
                          <div>
                            <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                              {s.tracking_no}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{s.courier}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Belum ada resi</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {s.status === 'sent' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200">
                            Terkirim
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200">
                            Pending
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleCopyAddress(s)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Salin Alamat untuk Label"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleSendResiWA(s)}
                            disabled={!s.tracking_no}
                            className="px-2.5 py-1 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-[11px] disabled:opacity-40 inline-flex items-center gap-1 shadow-sm"
                            title="Kirim Notifikasi Resi via WhatsApp"
                          >
                            <Send className="w-3 h-3" />
                            <span>Kirim Resi</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Batch Paste Resi Modal */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <ClipboardPaste className="w-4 h-4 text-teal-600" />
                Paste Banyak Resi Sekaligus
              </h3>
              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Paste daftar username dan resi (pisahkan dengan spasi, tab, atau koma per baris):
            </p>

            <textarea
              rows={8}
              value={batchInput}
              onChange={e => setBatchInput(e.target.value)}
              placeholder="skincarebyrani JT1234567890ID&#10;clarissa.dew JT9876543210ID&#10;glowwithdevina JT1122334455ID"
              className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-teal-500"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={handleProcessBatch}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-500/20"
              >
                Proses & Update Resi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
