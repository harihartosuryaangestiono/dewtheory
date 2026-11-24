'use client';

import React, { useState, useMemo } from 'react';
import { useAffiliate } from '@/lib/store/useAffiliateStore';
import { CategoryBadge, StatusBadge } from '@/components/common/Badge';
import { 
  Video, 
  Send, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Download, 
  Search, 
  FileSpreadsheet,
  Calendar,
  Sparkles,
  Link as LinkIcon,
  Users
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { renderTemplate, buildWhatsAppLink } from '@/lib/utils/template';
import { toast } from 'sonner';

export default function SOWTrackerPage() {
  const { creators, sows, shipments, templates, currentUser, upsertSOW } = useAffiliate();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'need_reminder' | 'completed'>('all');

  // Combined creator + SOW data
  const creatorSOWList = useMemo(() => {
    // Only creators who joined or had sample sent
    const activeCreators = creators.filter(c => 
      ['join', 'form_filled', 'sample_sent', 'sow_1', 'sow_2', 'completed'].includes(c.pipeline_status)
    );

    return activeCreators.map(c => {
      const sow1 = sows.find(s => s.creator_id === c.id && s.sow_no === 1);
      const sow2 = sows.find(s => s.creator_id === c.id && s.sow_no === 2);
      const shipment = shipments.find(s => s.creator_id === c.id);

      const hasSow1 = Boolean(sow1?.link);
      const hasSow2 = Boolean(sow2?.link);
      const isCompleted = hasSow1 && hasSow2;

      // Deadline check
      const deadline = new Date('2026-12-15');
      const now = new Date();
      const isOverdue = now > deadline && !isCompleted;

      return {
        creator: c,
        sow1,
        sow2,
        shipment,
        hasSow1,
        hasSow2,
        isCompleted,
        isOverdue,
      };
    }).filter(item => {
      if (filterStatus === 'completed' && !item.isCompleted) return false;
      if (filterStatus === 'need_reminder' && item.isCompleted) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mUser = item.creator.username.toLowerCase().includes(q);
        const mLink1 = item.sow1?.link?.toLowerCase().includes(q);
        const mLink2 = item.sow2?.link?.toLowerCase().includes(q);
        if (!mUser && !mLink1 && !mLink2) return false;
      }
      return true;
    });
  }, [creators, sows, shipments, filterStatus, searchQuery]);

  // Handle send reminder WhatsApp
  const handleSendReminderWA = (creator: any) => {
    if (!creator.phone_e164) {
      toast.error('Creator tidak memiliki nomor WhatsApp');
      return;
    }

    const tpl = templates.find(t => t.id === 'reminder_posting') || templates[0];
    const message = renderTemplate(tpl.content, {
      nama: creator.display_name || creator.username,
      pengirim: currentUser.name,
      deadline_posting: '15 Desember',
    });

    const link = buildWhatsAppLink(creator.phone_e164, message);
    window.open(link, '_blank', 'noopener,noreferrer');
    toast.success(`Reminder posting terkirim ke @${creator.username}`);
  };

  // Quick edit SOW link
  const handleUpdateLink = (creatorId: string, sowNo: number, link: string) => {
    upsertSOW({
      creator_id: creatorId,
      sow_no: sowNo,
      link,
      posted_at: new Date().toISOString().split('T')[0],
      status: link.trim() ? 'verified' : 'pending',
    });
    toast.success(`Link SOW ${sowNo} berhasil disimpan`);
  };

  // Export Final SOW Report (Client Dew Theory ready format)
  const handleExportClientReport = () => {
    try {
      const rows = creators.map((c, idx) => {
        const sow1 = sows.find(s => s.creator_id === c.id && s.sow_no === 1);
        const sow2 = sows.find(s => s.creator_id === c.id && s.sow_no === 2);
        const shipment = shipments.find(s => s.creator_id === c.id);

        return {
          No: idx + 1,
          Username: c.username,
          Platform: c.platform,
          Channel: 'Video TikTok',
          Category: c.category,
          'Regist Form?': shipment ? 'Yes' : 'No',
          'Posting Date SOW 1': sow1?.posted_at || '',
          'Link SOW 1': sow1?.link || '',
          'Posting Date SOW 2': sow2?.posted_at || '',
          'Link SOW 2': sow2?.link || '',
          'Status SOW': (sow1?.link && sow2?.link) ? 'Completed (2 SOW)' : (sow1?.link ? '1 Video Posted' : 'Pending'),
        };
      });

      const wb = XLSX.utils.book_new();

      // Summary Sheet
      const summaryRows = [
        { 'Metrik Kampanye': 'Total Target Affiliate', Nilai: 100 },
        { 'Metrik Kampanye': 'Target Kuota Kategori A (Toner)', Nilai: 35 },
        { 'Metrik Kampanye': 'Target Kuota Kategori B (Lotion)', Nilai: 25 },
        { 'Metrik Kampanye': 'Target Kuota Kategori C (Cleanser)', Nilai: 15 },
        { 'Metrik Kampanye': 'Target Kuota Kategori D (Duo)', Nilai: 25 },
        { 'Metrik Kampanye': 'Batas Waktu Posting Creator', Nilai: '15 Desember 2026' },
      ];
      const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');

      // Detail SOW Sheet
      const wsDetail = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, wsDetail, 'SOW Report');

      XLSX.writeFile(wb, `DewTheory_Final_SOW_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Laporan Final SOW Report berhasil diexport!');
    } catch (err: any) {
      toast.error('Gagal export laporan: ' + err.message);
    }
  };

  const totalCompletedSOW = creatorSOWList.filter(i => i.isCompleted).length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Video className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            SOW Video Tracker & Final Report
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Mandatory per creator: minimal 2 Video TikTok / 2 sesi Livestream (min. 3 jam) dengan keranjang kuning. Batas posting: 15 Desember.
          </p>
        </div>

        <button
          onClick={handleExportClientReport}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white transition-all shadow-md shadow-teal-500/20 flex items-center gap-2"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Final Report (.xlsx)</span>
        </button>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Creator dalam Alur SOW</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{creatorSOWList.length}</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Lengkap (2 Video)</span>
            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-0.5">{totalCompletedSOW}</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Deadline Posting</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">15 Des</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
              filterStatus === 'all' ? 'bg-teal-600 text-white' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Semua ({creatorSOWList.length})
          </button>
          <button
            onClick={() => setFilterStatus('need_reminder')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
              filterStatus === 'need_reminder' ? 'bg-teal-600 text-white' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Perlu Reminder ({creatorSOWList.filter(i => !i.isCompleted).length})
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
              filterStatus === 'completed' ? 'bg-teal-600 text-white' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Selesai 2 SOW ({totalCompletedSOW})
          </button>
        </div>

        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Cari username atau link..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none"
          />
        </div>
      </div>

      {/* SOW Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Creator</th>
                <th className="py-3 px-4">Kategori & Sample</th>
                <th className="py-3 px-4">SOW 1 (Video / Live)</th>
                <th className="py-3 px-4">SOW 2 (Video / Live)</th>
                <th className="py-3 px-4">Status Posting</th>
                <th className="py-3 px-4 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {creatorSOWList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Belum ada creator pada tahap SOW.
                  </td>
                </tr>
              ) : (
                creatorSOWList.map(({ creator, sow1, sow2, hasSow1, hasSow2, isCompleted, isOverdue }) => (
                  <tr key={creator.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        @{creator.username}
                        <a
                          href={`https://www.tiktok.com/@${creator.username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-teal-600"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <span className="text-[11px] text-slate-400 block">{creator.display_name}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <CategoryBadge category={creator.category} showDesc />
                    </td>

                    {/* SOW 1 */}
                    <td className="py-3.5 px-4">
                      {hasSow1 ? (
                        <div className="space-y-1">
                          <a
                            href={sow1?.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-teal-600 hover:underline font-semibold"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Link Video 1</span>
                          </a>
                          <span className="text-[10px] text-slate-400 block">
                            Diposting: {sow1?.posted_at || '-'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            placeholder="Paste link SOW 1..."
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                handleUpdateLink(creator.id, 1, (e.target as HTMLInputElement).value);
                              }
                            }}
                            className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs w-40 outline-none"
                          />
                        </div>
                      )}
                    </td>

                    {/* SOW 2 */}
                    <td className="py-3.5 px-4">
                      {hasSow2 ? (
                        <div className="space-y-1">
                          <a
                            href={sow2?.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-teal-600 hover:underline font-semibold"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Link Video 2</span>
                          </a>
                          <span className="text-[10px] text-slate-400 block">
                            Diposting: {sow2?.posted_at || '-'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            placeholder="Paste link SOW 2..."
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                handleUpdateLink(creator.id, 2, (e.target as HTMLInputElement).value);
                              }
                            }}
                            className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs w-40 outline-none"
                          />
                        </div>
                      )}
                    </td>

                    {/* Status Posting */}
                    <td className="py-3.5 px-4">
                      {isCompleted ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200">
                          Selesai (2 Video)
                        </span>
                      ) : isOverdue ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 flex items-center gap-1 w-fit">
                          <AlertTriangle className="w-3 h-3" />
                          Terlambat
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200">
                          {hasSow1 ? 'Baru 1 Video' : 'Belum Posting'}
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      {!isCompleted && (
                        <button
                          onClick={() => handleSendReminderWA(creator)}
                          className="px-2.5 py-1 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-[11px] inline-flex items-center gap-1 shadow-sm"
                          title="Kirim Reminder Posting WhatsApp"
                        >
                          <Send className="w-3 h-3" />
                          <span>Kirim Reminder</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
