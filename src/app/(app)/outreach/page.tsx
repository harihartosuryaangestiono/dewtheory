'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAffiliate } from '@/lib/store/useAffiliateStore';
import { FocusModeCard } from '@/components/outreach/FocusModeCard';
import { OutreachQueueTable } from '@/components/outreach/OutreachQueueTable';
import { 
  Send, 
  LayoutList, 
  Maximize2, 
  Users, 
  Filter, 
  Sparkles, 
  RefreshCw,
  Search,
  CheckCircle2
} from 'lucide-react';
import { Category, Platform } from '@/types';

function OutreachContent() {
  const searchParams = useSearchParams();
  const initialCreatorId = searchParams.get('creatorId');

  const { creators, currentUser, autoSplitQueue } = useAffiliate();

  const [viewMode, setViewMode] = useState<'focus' | 'table'>('focus');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('ALL');
  const [selectedAssignment, setSelectedAssignment] = useState<string>('ALL');
  const [selectedSource, setSelectedSource] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'uncontacted' | 'all'>('uncontacted');

  // Filter creator queue
  const queueCreators = useMemo(() => {
    return creators.filter(c => {
      // Must be OKE
      if (c.curation_status !== 'oke') return false;

      // Status filter
      if (statusFilter === 'uncontacted') {
        if (c.pipeline_status !== 'curated' && c.pipeline_status !== 'queued') return false;
        // Must have valid phone
        if (c.phone_status !== 'valid') return false;
      }

      // Category filter
      if (selectedCategory !== 'ALL' && c.category !== selectedCategory) return false;

      // Platform filter
      if (selectedPlatform !== 'ALL' && c.platform !== selectedPlatform) return false;

      // Source filter
      if (selectedSource !== 'ALL' && c.source !== selectedSource) return false;

      // Assignment filter
      if (selectedAssignment === 'ME') {
        if (c.assigned_to !== currentUser.name) return false;
      } else if (selectedAssignment === 'PARTNER') {
        if (!c.assigned_to || c.assigned_to === currentUser.name) return false;
      } else if (selectedAssignment === 'UNASSIGNED') {
        if (c.assigned_to) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesUser = c.username.toLowerCase().includes(q);
        const matchesName = c.display_name?.toLowerCase().includes(q);
        const matchesPhone = c.phone_e164.includes(q) || c.phone_raw.includes(q);
        if (!matchesUser && !matchesName && !matchesPhone) return false;
      }

      return true;
    });
  }, [creators, statusFilter, selectedCategory, selectedPlatform, selectedSource, selectedAssignment, currentUser.name, searchQuery]);

  // Unique sources for filter
  const sources = useMemo(() => {
    const s = new Set<string>();
    creators.forEach(c => {
      if (c.source) s.add(c.source);
    });
    return Array.from(s);
  }, [creators]);

  // If creatorId query param is passed, find index
  const initialIndex = useMemo(() => {
    if (!initialCreatorId) return 0;
    const idx = queueCreators.findIndex(c => c.id === initialCreatorId);
    return idx >= 0 ? idx : 0;
  }, [initialCreatorId, queueCreators]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Send className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            Outreach WhatsApp Queue
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Kirim pesan WhatsApp creator OKE dalam &lt;10 detik per orang tanpa berpindah Excel.
          </p>
        </div>

        {/* View Mode & Split Action */}
        <div className="flex items-center gap-2.5 w-full lg:w-auto">
          <button
            onClick={() => autoSplitQueue('Dinda', 'Surya')}
            className="flex-1 lg:flex-none px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
            title="Bagi rata creator yang belum kontak ke Dinda & Surya"
          >
            <Users className="w-3.5 h-3.5 text-teal-600" />
            <span>Bagi Dua Otomatis (50:50)</span>
          </button>

          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('focus')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'focus'
                  ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Focus Mode</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>Tabel Antrean</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setStatusFilter('uncontacted')}
              className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-colors ${
                statusFilter === 'uncontacted'
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Siap Kontak ({queueCreators.length})
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-colors ${
                statusFilter === 'all'
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Semua OKE
            </button>
          </div>

          {/* Kategori Filter */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 dark:text-slate-300 outline-none"
          >
            <option value="ALL">Semua Kategori (A/B/C/D)</option>
            <option value="A">Kat A (Dew Bright Toner)</option>
            <option value="B">Kat B (Bright Milky Lotion)</option>
            <option value="C">Kat C (Milky Dew Cleanser)</option>
            <option value="D">Kat D (Toner + Lotion Duo)</option>
          </select>

          {/* Assignment Filter */}
          <select
            value={selectedAssignment}
            onChange={e => setSelectedAssignment(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 dark:text-slate-300 outline-none"
          >
            <option value="ALL">Semua Penugasan</option>
            <option value="ME">Milik Saya ({currentUser.name})</option>
            <option value="PARTNER">Milik Partner</option>
            <option value="UNASSIGNED">Belum Dibagi</option>
          </select>

          {/* Platform Filter */}
          <select
            value={selectedPlatform}
            onChange={e => setSelectedPlatform(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 dark:text-slate-300 outline-none"
          >
            <option value="ALL">Semua Platform</option>
            <option value="TikTok">TikTok</option>
            <option value="Shopee">Shopee</option>
          </select>

          {/* Source Filter */}
          {sources.length > 0 && (
            <select
              value={selectedSource}
              onChange={e => setSelectedSource(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 dark:text-slate-300 outline-none"
            >
              <option value="ALL">Semua Sumber</option>
              {sources.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}
        </div>

        {/* Search in queue */}
        <div className="relative w-full sm:w-56">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Cari di antrean..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'focus' ? (
        <FocusModeCard
          creators={queueCreators}
          initialIndex={initialIndex}
          onDone={() => setViewMode('table')}
        />
      ) : (
        <OutreachQueueTable
          creators={queueCreators}
          onSelectCreator={id => {
            const idx = queueCreators.findIndex(c => c.id === id);
            if (idx >= 0) {
              setViewMode('focus');
            }
          }}
        />
      )}
    </div>
  );
}

export default function OutreachPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Memuat antrean outreach...</div>}>
      <OutreachContent />
    </Suspense>
  );
}
