'use client';

import React, { useState, useMemo } from 'react';
import { useAffiliate } from '@/lib/store/useAffiliateStore';
import { Creator, PipelineStatus, Category } from '@/types';
import { CategoryBadge, PhoneBadge, PlatformBadge, StatusBadge } from '@/components/common/Badge';
import { VirtualTable } from '@/components/common/VirtualTable';
import { 
  Users, 
  Kanban, 
  Table, 
  Filter, 
  Search, 
  ExternalLink, 
  Send, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  MessageSquare,
  Package,
  Video,
  X
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

const PIPELINE_COLUMNS: { id: PipelineStatus; label: string; color: string }[] = [
  { id: 'curated', label: 'OKE / Siap Kontak', color: 'border-sky-400 bg-sky-50/30' },
  { id: 'contacted', label: 'Contacted', color: 'border-blue-400 bg-blue-50/30' },
  { id: 'replied', label: 'Replied', color: 'border-purple-400 bg-purple-50/30' },
  { id: 'join', label: 'Join / Form Terisi', color: 'border-emerald-400 bg-emerald-50/30' },
  { id: 'sample_sent', label: 'Sample Dikirim', color: 'border-violet-400 bg-violet-50/30' },
  { id: 'sow_1', label: 'SOW 1 Posted', color: 'border-amber-400 bg-amber-50/30' },
  { id: 'sow_2', label: 'Selesai (2 SOW)', color: 'border-teal-400 bg-teal-50/30' },
];

export default function CreatorsPipelinePage() {
  const { creators, shipments, sows, activityLogs, currentUser } = useAffiliate();

  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedAssignment, setSelectedAssignment] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);

  // Filtered creators
  const filteredCreators = useMemo(() => {
    return creators.filter(c => {
      if (selectedCategory !== 'ALL' && c.category !== selectedCategory) return false;
      if (selectedAssignment === 'ME' && c.assigned_to !== currentUser.name) return false;
      if (selectedAssignment === 'PARTNER' && (!c.assigned_to || c.assigned_to === currentUser.name)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mUser = c.username.toLowerCase().includes(q);
        const mName = c.display_name?.toLowerCase().includes(q);
        const mPhone = c.phone_raw.includes(q) || c.phone_e164.includes(q);
        if (!mUser && !mName && !mPhone) return false;
      }
      return true;
    });
  }, [creators, selectedCategory, selectedAssignment, currentUser.name, searchQuery]);

  // Group creators for kanban
  const kanbanGroups = useMemo(() => {
    const groups: Record<string, Creator[]> = {};
    PIPELINE_COLUMNS.forEach(col => { groups[col.id] = []; });
    filteredCreators.forEach(c => {
      // Map form_filled to join column for visual simplicity
      let statusKey = c.pipeline_status;
      if (statusKey === 'form_filled') statusKey = 'join';
      if (statusKey === 'completed') statusKey = 'sow_2';

      if (groups[statusKey]) {
        groups[statusKey].push(c);
      }
    });
    return groups;
  }, [filteredCreators]);

  return (
    <div className="space-y-6">
      {/* Page Title & View Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            Pipeline & Tracking Creator
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pantau alur konversi dari OKE, Contacted, Join, Sample Dikirim, hingga Posting Video SOW.
          </p>
        </div>

        {/* View Switcher */}
        <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'kanban'
                ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Kanban Board</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'table'
                ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Tabel Lengkap</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 dark:text-slate-300 outline-none"
          >
            <option value="ALL">Semua Kategori</option>
            <option value="A">Kat A (Dew Bright Toner)</option>
            <option value="B">Kat B (Bright Milky Lotion)</option>
            <option value="C">Kat C (Milky Dew Cleanser)</option>
            <option value="D">Kat D (Toner + Lotion Duo)</option>
          </select>

          <select
            value={selectedAssignment}
            onChange={e => setSelectedAssignment(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 dark:text-slate-300 outline-none"
          >
            <option value="ALL">Semua PIC</option>
            <option value="ME">Milik Saya ({currentUser.name})</option>
            <option value="PARTNER">Milik Partner</option>
          </select>
        </div>

        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Cari creator..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none"
          />
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-6">
          {PIPELINE_COLUMNS.map(col => {
            const list = kanbanGroups[col.id] || [];

            return (
              <div
                key={col.id}
                className="w-72 flex-shrink-0 bg-slate-100/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col max-h-[750px]"
              >
                {/* Column Header */}
                <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
                    {col.label}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-sm">
                    {list.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="p-2 space-y-2.5 overflow-y-auto flex-1">
                  {list.length === 0 ? (
                    <div className="py-8 text-center text-[11px] text-slate-400">
                      Kosong
                    </div>
                  ) : (
                    list.map(c => (
                      <div
                        key={c.id}
                        onClick={() => setSelectedCreator(c)}
                        className="bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 hover:border-teal-400 p-3.5 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-teal-600">
                            @{c.username}
                          </span>
                          <CategoryBadge category={c.category} />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <PlatformBadge platform={c.platform} />
                          <span>{c.source}</span>
                        </div>

                        {c.contacted_by && (
                          <div className="pt-1.5 border-t border-slate-100 dark:border-slate-700/60 text-[10px] text-slate-400 flex items-center justify-between">
                            <span>Oleh: <strong>{c.contacted_by}</strong></span>
                            {c.contacted_at && (
                              <span>{new Date(c.contacted_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Virtualized Table View (Smooth for 10,000+ creators) */
        <VirtualTable<Creator>
          items={filteredCreators}
          rowHeight={52}
          containerHeight={620}
          emptyMessage="Tidak ada creator ditemukan dengan filter saat ini."
          renderHeader={() => (
            <tr>
              <th className="py-3 px-4">Username</th>
              <th className="py-3 px-4">Kategori</th>
              <th className="py-3 px-4">Status Pipeline</th>
              <th className="py-3 px-4">WhatsApp</th>
              <th className="py-3 px-4">PIC Contact</th>
              <th className="py-3 px-4">Tanggal Kontak</th>
              <th className="py-3 px-4 text-right">Detail</th>
            </tr>
          )}
          renderRow={(c: Creator) => (
            <tr
              key={c.id}
              onClick={() => setSelectedCreator(c)}
              className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer h-[52px]"
            >
              <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                @{c.username}
              </td>
              <td className="py-3 px-4">
                <CategoryBadge category={c.category} showDesc />
              </td>
              <td className="py-3 px-4">
                <StatusBadge status={c.pipeline_status} />
              </td>
              <td className="py-3 px-4">
                <PhoneBadge status={c.phone_status} phone={c.phone_e164 ? `+${c.phone_e164}` : undefined} />
              </td>
              <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                {c.contacted_by || c.assigned_to || '-'}
              </td>
              <td className="py-3 px-4 text-slate-400">
                {c.contacted_at ? new Date(c.contacted_at).toLocaleDateString('id-ID') : '-'}
              </td>
              <td className="py-3 px-4 text-right">
                <ChevronRight className="w-4 h-4 text-slate-400 inline" />
              </td>
            </tr>
          )}
        />
      )}

      {/* Creator Detail Slide-over Modal */}
      {selectedCreator && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                    @{selectedCreator.username}
                  </h3>
                  <a
                    href={`https://www.tiktok.com/@${selectedCreator.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded text-teal-600 hover:bg-teal-50"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                <button
                  onClick={() => setSelectedCreator(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status & Badges */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <CategoryBadge category={selectedCreator.category} showDesc />
                  <StatusBadge status={selectedCreator.pipeline_status} />
                  <PlatformBadge platform={selectedCreator.platform} />
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">WhatsApp:</span>
                  <PhoneBadge status={selectedCreator.phone_status} phone={selectedCreator.phone_e164 ? `+${selectedCreator.phone_e164}` : undefined} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Sumber Lead:</span>
                  <span className="font-semibold">{selectedCreator.source}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">PIC / Dihubungi Oleh:</span>
                  <span className="font-bold text-teal-600">{selectedCreator.contacted_by || 'Belum dihubungi'}</span>
                </div>
              </div>

              {/* Notes */}
              {selectedCreator.notes && (
                <div className="p-3 bg-teal-50/50 dark:bg-teal-950/30 rounded-xl border border-teal-100 dark:border-teal-900/40 text-xs text-teal-900 dark:text-teal-200 italic">
                  &ldquo;{selectedCreator.notes}&rdquo;
                </div>
              )}

              {/* Quick Action */}
              <div className="pt-2">
                <Link
                  href={`/outreach?creatorId=${selectedCreator.id}`}
                  className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-teal-500/20"
                >
                  <Send className="w-4 h-4" />
                  <span>Buka di Focus Mode Outreach</span>
                </Link>
              </div>
            </div>

            <button
              onClick={() => setSelectedCreator(null)}
              className="w-full py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
