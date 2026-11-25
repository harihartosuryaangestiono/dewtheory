'use client';

import React, { useMemo, useState } from 'react';
import { Database, Search } from 'lucide-react';
import { useAffiliate } from '@/lib/store/useAffiliateStore';
import { VirtualTable } from '@/components/common/VirtualTable';
import { Category, Creator, CurationStatus, PipelineStatus } from '@/types';

const CURATION_LABELS: Record<CurationStatus, string> = {
  pending: 'PENDING',
  oke: 'OKE',
  second_option: 'SECOND OPTION',
  reject: 'REJECT',
};

const STATUS_LABELS: Record<PipelineStatus, string> = {
  pool: 'Pool',
  curated: 'Curated',
  queued: 'Queued',
  contacted: 'Contacted',
  replied: 'Replied',
  join: 'Join',
  form_filled: 'Form Filled',
  sample_sent: 'Sample Sent',
  sow_1: 'SOW 1',
  sow_2: 'SOW 2',
  completed: 'Completed',
  refuse: 'Refuse',
  no_response: 'No Response',
  invalid_phone: 'Invalid Phone',
};

export default function CreatorDatabasePage() {
  const { creators } = useAffiliate();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const usernameCounts = useMemo(() => {
    const counts = new Map<string, number>();
    creators.forEach(creator => {
      const username = creator.username.trim().replace(/^@/, '').toLowerCase();
      counts.set(username, (counts.get(username) || 0) + 1);
    });
    return counts;
  }, [creators]);

  const filteredCreators = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return creators.filter(creator => {
      if (categoryFilter !== 'ALL' && creator.category !== categoryFilter) return false;
      if (statusFilter !== 'ALL' && creator.pipeline_status !== statusFilter) return false;

      if (query) {
        const searchableValues = [
          creator.username,
          creator.display_name,
          creator.phone_raw,
          creator.phone_e164,
          creator.platform,
          creator.source,
          creator.category,
          CURATION_LABELS[creator.curation_status],
          STATUS_LABELS[creator.pipeline_status],
        ];
        if (!searchableValues.some(value => value?.toLowerCase().includes(query))) return false;
      }

      return true;
    });
  }, [creators, searchQuery, categoryFilter, statusFilter]);

  const duplicateCreators = creators.filter(creator => {
    const username = creator.username.trim().replace(/^@/, '').toLowerCase();
    return (usernameCounts.get(username) || 0) > 1;
  }).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2.5 text-2xl font-black text-slate-900 dark:text-white">
          <Database className="h-6 w-6 text-teal-600 dark:text-teal-400" />
          Database Creator
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Daftar creator lengkap dengan kolom yang tersedia di sheet Pool.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[11px] font-semibold uppercase text-slate-400">Total Creator</p>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
            {creators.length.toLocaleString('id-ID')}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[11px] font-semibold uppercase text-slate-400">Creator dengan Username Duplikat</p>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
            {duplicateCreators.toLocaleString('id-ID')}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-slate-200 bg-white p-4 text-xs shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
            placeholder="Cari username, nomor, platform, sumber..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={event => setCategoryFilter(event.target.value)}
          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-medium text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          <option value="ALL">Semua kategori</option>
          {(['A', 'B', 'C', 'D', 'UNASSIGNED'] as Category[]).map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={event => setStatusFilter(event.target.value)}
          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-medium text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          <option value="ALL">Semua status</option>
          {Object.entries(STATUS_LABELS).map(([status, label]) => (
            <option key={status} value={status}>{label}</option>
          ))}
        </select>
      </div>

      <VirtualTable<Creator>
        items={filteredCreators}
        rowHeight={52}
        containerHeight={680}
        emptyMessage="Tidak ada creator yang cocok dengan pencarian atau filter."
        className="min-w-0"
        renderHeader={() => (
          <tr>
            <th className="px-4 py-3">Username</th>
            <th className="px-4 py-3">Curated</th>
            <th className="px-4 py-3">Dup Checker</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Platform</th>
            <th className="px-4 py-3">Source</th>
            <th className="px-4 py-3">No Telp</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        )}
        renderRow={creator => {
          const username = creator.username.trim().replace(/^@/, '').toLowerCase();

          return (
            <tr key={creator.id} className="h-[52px] hover:bg-slate-50 dark:hover:bg-slate-800/40">
              <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">@{creator.username}</td>
              <td className="px-4 py-3">{CURATION_LABELS[creator.curation_status]}</td>
              <td className="px-4 py-3">{usernameCounts.get(username) || 0}</td>
              <td className="px-4 py-3">{creator.category}</td>
              <td className="px-4 py-3">{creator.platform}</td>
              <td className="px-4 py-3">{creator.source || '-'}</td>
              <td className="px-4 py-3 font-mono">{creator.phone_raw || creator.phone_e164 || '-'}</td>
              <td className="px-4 py-3">{STATUS_LABELS[creator.pipeline_status]}</td>
            </tr>
          );
        }}
      />
      <p className="text-[11px] text-slate-400">
        Menampilkan {filteredCreators.length.toLocaleString('id-ID')} dari {creators.length.toLocaleString('id-ID')} creator.
        Kolom tambahan `reject` pada workbook berisi catatan/rekap sheet, bukan nilai per creator.
      </p>
    </div>
  );
}
