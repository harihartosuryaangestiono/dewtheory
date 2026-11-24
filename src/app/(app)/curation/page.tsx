'use client';

import React, { useState, useMemo } from 'react';
import { useAffiliate } from '@/lib/store/useAffiliateStore';
import { Category, CurationStatus, Creator } from '@/types';
import { CategoryBadge, PhoneBadge, PlatformBadge, StatusBadge } from '@/components/common/Badge';
import { 
  CheckSquare, 
  Sparkles, 
  ArrowUpRight, 
  Trash2, 
  Filter, 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  ExternalLink,
  Layers,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

export default function CurationPage() {
  const { creators, campaign, updateCuration, batchUpdateCuration, promoteSecondOption } = useAffiliate();

  const [activeTab, setActiveTab] = useState<CurationStatus | 'pending'>('oke');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Count per tab
  const counts = useMemo(() => {
    return {
      oke: creators.filter(c => c.curation_status === 'oke').length,
      second_option: creators.filter(c => c.curation_status === 'second_option').length,
      reject: creators.filter(c => c.curation_status === 'reject').length,
      pending: creators.filter(c => c.curation_status === 'pending').length,
    };
  }, [creators]);

  // Quota deficit check for Smart Suggestion
  const categoryQuotaStatus = useMemo(() => {
    const joinedOrContactedA = creators.filter(c => c.category === 'A' && ['contacted', 'replied', 'join', 'sample_sent', 'sow_1', 'sow_2'].includes(c.pipeline_status)).length;
    const joinedOrContactedB = creators.filter(c => c.category === 'B' && ['contacted', 'replied', 'join', 'sample_sent', 'sow_1', 'sow_2'].includes(c.pipeline_status)).length;
    const joinedOrContactedC = creators.filter(c => c.category === 'C' && ['contacted', 'replied', 'join', 'sample_sent', 'sow_1', 'sow_2'].includes(c.pipeline_status)).length;
    const joinedOrContactedD = creators.filter(c => c.category === 'D' && ['contacted', 'replied', 'join', 'sample_sent', 'sow_1', 'sow_2'].includes(c.pipeline_status)).length;

    return {
      A: { current: joinedOrContactedA, target: campaign.quota_a, diff: campaign.quota_a - joinedOrContactedA },
      B: { current: joinedOrContactedB, target: campaign.quota_b, diff: campaign.quota_b - joinedOrContactedB },
      C: { current: joinedOrContactedC, target: campaign.quota_c, diff: campaign.quota_c - joinedOrContactedC },
      D: { current: joinedOrContactedD, target: campaign.quota_d, diff: campaign.quota_d - joinedOrContactedD },
    };
  }, [creators, campaign]);

  // Filter list
  const filteredList = useMemo(() => {
    return creators.filter(c => {
      if (c.curation_status !== activeTab) return false;
      if (selectedCategory !== 'ALL' && c.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mUser = c.username.toLowerCase().includes(q);
        const mNotes = c.notes?.toLowerCase().includes(q);
        const mPhone = c.phone_raw.includes(q) || c.phone_e164.includes(q);
        if (!mUser && !mNotes && !mPhone) return false;
      }
      return true;
    });
  }, [creators, activeTab, selectedCategory, searchQuery]);

  // Bulk actions
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filteredList.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredList.map(c => c.id)));
    }
  };

  const handleBulkPromote = (cat?: Category) => {
    if (selectedIds.size === 0) return;
    batchUpdateCuration(Array.from(selectedIds), 'oke', cat);
    setSelectedIds(new Set());
  };

  const handleBulkReject = () => {
    if (selectedIds.size === 0) return;
    batchUpdateCuration(Array.from(selectedIds), 'reject');
    setSelectedIds(new Set());
  };

  const handleBulkChangeCategory = (cat: Category) => {
    if (selectedIds.size === 0) return;
    batchUpdateCuration(Array.from(selectedIds), activeTab as CurationStatus, cat);
    setSelectedIds(new Set());
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
          <CheckSquare className="w-6 h-6 text-teal-600 dark:text-teal-400" />
          Manajemen Kurasi Creator
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Kelola hasil kurasi dari Chrome extension atau manual. Second Option berfungsi sebagai cadangan cepat jika kuota kurang.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setActiveTab('oke'); setSelectedIds(new Set()); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'oke'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>OKE ({counts.oke})</span>
          </button>

          <button
            onClick={() => { setActiveTab('second_option'); setSelectedIds(new Set()); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'second_option'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Second Option / Cadangan ({counts.second_option})</span>
          </button>

          <button
            onClick={() => { setActiveTab('reject'); setSelectedIds(new Set()); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'reject'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Reject ({counts.reject})</span>
          </button>

          {counts.pending > 0 && (
            <button
              onClick={() => { setActiveTab('pending'); setSelectedIds(new Set()); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'pending'
                  ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <span>Belum Dikurasi ({counts.pending})</span>
            </button>
          )}
        </div>
      </div>

      {/* Smart Assistant Alert Banner for Second Option */}
      {activeTab === 'second_option' && (
        <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-indigo-900 dark:text-indigo-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
              💡
            </div>
            <div>
              <p className="font-bold">Asisten Kuota Pintar:</p>
              <p className="text-[11px] text-indigo-700 dark:text-indigo-300">
                Kategori A (Toner) butuh {categoryQuotaStatus.A.diff} lagi • Kat B (Lotion) butuh {categoryQuotaStatus.B.diff} • Kat C butuh {categoryQuotaStatus.C.diff} • Kat D butuh {categoryQuotaStatus.D.diff}.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-indigo-900/50 px-2.5 py-1 rounded-lg">
            Gunakan tombol &ldquo;Promosikan ke OKE&rdquo; di bawah untuk mengisi kuota
          </span>
        </div>
      )}

      {/* Filter and Bulk Bar */}
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
            <option value="UNASSIGNED">Belum Ada Kategori</option>
          </select>

          <div className="relative w-48 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Cari username atau catatan..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none"
            />
          </div>
        </div>

        {/* Bulk Action Controls */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 animate-in fade-in">
            <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">
              {selectedIds.size} terpilih:
            </span>

            {activeTab !== 'oke' && (
              <button
                onClick={() => handleBulkPromote()}
                className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold text-[11px] transition-colors"
              >
                Jadikan OKE
              </button>
            )}

            {/* Quick change category */}
            <select
              onChange={e => {
                if (e.target.value) handleBulkChangeCategory(e.target.value as Category);
              }}
              defaultValue=""
              className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 outline-none"
            >
              <option value="" disabled>Ubah Kategori...</option>
              <option value="A">Set Kat A</option>
              <option value="B">Set Kat B</option>
              <option value="C">Set Kat C</option>
              <option value="D">Set Kat D</option>
            </select>

            {activeTab !== 'reject' && (
              <button
                onClick={handleBulkReject}
                className="px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 rounded-lg font-semibold text-[11px] border border-rose-200 transition-colors"
              >
                Reject
              </button>
            )}
          </div>
        )}
      </div>

      {/* Curation List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={filteredList.length > 0 && selectedIds.size === filteredList.length}
                    onChange={selectAll}
                    className="rounded text-teal-600 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4">Creator</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Nomor WhatsApp</th>
                <th className="py-3 px-4">Sumber</th>
                <th className="py-3 px-4">Catatan Kurasi</th>
                <th className="py-3 px-4 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Tidak ada creator pada tab {activeTab.toUpperCase()}.
                  </td>
                </tr>
              ) : (
                filteredList.map(c => {
                  const isChecked = selectedIds.has(c.id);

                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                        isChecked ? 'bg-teal-50/40 dark:bg-teal-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelect(c.id)}
                          className="rounded text-teal-600 cursor-pointer"
                        />
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <a
                            href={`https://www.tiktok.com/@${c.username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-slate-900 dark:text-white hover:text-teal-600 flex items-center gap-1"
                          >
                            @{c.username}
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </a>
                          <PlatformBadge platform={c.platform} />
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <CategoryBadge category={c.category} showDesc />
                      </td>

                      <td className="py-3 px-4">
                        <PhoneBadge status={c.phone_status} phone={c.phone_e164 ? `+${c.phone_e164}` : undefined} />
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-500">
                        {c.source}
                      </td>

                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 italic max-w-xs truncate">
                        {c.notes || '-'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {activeTab === 'second_option' && (
                            <button
                              onClick={() => promoteSecondOption(c.id, c.category !== 'UNASSIGNED' ? c.category : 'A')}
                              className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-sm"
                              title="Promosikan creator cadangan ini ke OKE"
                            >
                              <ArrowUpRight className="w-3 h-3" />
                              <span>Promote ke OKE</span>
                            </button>
                          )}

                          {activeTab === 'oke' && (
                            <button
                              onClick={() => updateCuration(c.id, 'second_option')}
                              className="px-2 py-1 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-[11px] font-semibold"
                              title="Jadikan cadangan (Second Option)"
                            >
                              Cadangan
                            </button>
                          )}

                          {activeTab !== 'reject' && (
                            <button
                              onClick={() => updateCuration(c.id, 'reject')}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                              title="Tolak / Reject"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
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
    </div>
  );
}
