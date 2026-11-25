'use client';

import React, { useMemo, useState } from 'react';
import { Copy, Database, Search, Tags, Users } from 'lucide-react';
import { VirtualTable } from '@/components/common/VirtualTable';
import { CategoryBadge, PlatformBadge, StatusBadge } from '@/components/common/Badge';
import { useAffiliate } from '@/lib/store/useAffiliateStore';
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

const CATEGORY_CARDS: {
  value: Category;
  label: string;
  description: string;
  color: string;
  bar: string;
}[] = [
  { value: 'A', label: 'Kategori A', description: 'Dew Bright Toner', color: 'text-teal-700 dark:text-teal-300', bar: 'bg-teal-500' },
  { value: 'B', label: 'Kategori B', description: 'Bright Milky Lotion', color: 'text-indigo-700 dark:text-indigo-300', bar: 'bg-indigo-500' },
  { value: 'C', label: 'Kategori C', description: 'Milky Dew Cleanser', color: 'text-amber-700 dark:text-amber-300', bar: 'bg-amber-500' },
  { value: 'D', label: 'Kategori D', description: 'Toner + Lotion Duo', color: 'text-rose-700 dark:text-rose-300', bar: 'bg-rose-500' },
  { value: 'UNASSIGNED', label: 'Belum dikategorikan', description: 'Perlu ditinjau', color: 'text-slate-600 dark:text-slate-300', bar: 'bg-slate-400' },
];

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

  const categoryCounts = useMemo(() => {
    const counts: Record<Category, number> = {
      A: 0,
      B: 0,
      C: 0,
      D: 0,
      UNASSIGNED: 0,
    };
    creators.forEach(creator => {
      counts[creator.category] += 1;
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
  const assignedCreators = creators.length - categoryCounts.UNASSIGNED;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 via-teal-950 to-cyan-900 px-6 py-7 text-white shadow-xl shadow-teal-950/10 sm:px-8">
        <div className="absolute -right-10 -top-20 h-64 w-64 rounded-full border-[36px] border-white/[0.06]" />
        <div className="absolute -bottom-28 right-40 h-56 w-56 rounded-full bg-teal-400/10 blur-2xl" />
        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-teal-100">
              <Database className="h-3.5 w-3.5" />
              CREATOR DIRECTORY
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Database Creator</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-teal-100/75">
              Semua creator dalam satu tempat. Cari, filter, dan tinjau data sesuai kolom pada sheet Pool.
            </p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 backdrop-blur">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-100/70">Total database</p>
            <p className="mt-1 text-3xl font-black">{creators.length.toLocaleString('id-ID')}</p>
            <p className="text-[11px] text-teal-100/70">creator terdaftar</p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Creator</span>
            <span className="rounded-xl bg-teal-50 p-2 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300"><Users className="h-4 w-4" /></span>
          </div>
          <p className="mt-3 text-2xl font-black text-slate-900 dark:text-white">{creators.length.toLocaleString('id-ID')}</p>
          <p className="mt-1 text-[11px] text-slate-400">Seluruh data yang dimuat</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Sudah Berkategori</span>
            <span className="rounded-xl bg-indigo-50 p-2 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"><Tags className="h-4 w-4" /></span>
          </div>
          <p className="mt-3 text-2xl font-black text-slate-900 dark:text-white">{assignedCreators.toLocaleString('id-ID')}</p>
          <p className="mt-1 text-[11px] text-slate-400">Kategori A sampai D</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Belum Berkategori</span>
            <span className="rounded-xl bg-amber-50 p-2 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"><Tags className="h-4 w-4" /></span>
          </div>
          <p className="mt-3 text-2xl font-black text-slate-900 dark:text-white">{categoryCounts.UNASSIGNED.toLocaleString('id-ID')}</p>
          <p className="mt-1 text-[11px] text-slate-400">Perlu ditinjau atau dilengkapi</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Username Duplikat</span>
            <span className="rounded-xl bg-rose-50 p-2 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"><Copy className="h-4 w-4" /></span>
          </div>
          <p className="mt-3 text-2xl font-black text-slate-900 dark:text-white">{duplicateCreators.toLocaleString('id-ID')}</p>
          <p className="mt-1 text-[11px] text-slate-400">Berdasarkan username di database</p>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">Sebaran Kategori</h2>
            <p className="mt-0.5 text-[11px] text-slate-400">Pilih kategori untuk menyaring daftar creator.</p>
          </div>
          {categoryFilter !== 'ALL' && (
            <button
              type="button"
              onClick={() => setCategoryFilter('ALL')}
              className="text-[11px] font-semibold text-teal-700 hover:text-teal-800 dark:text-teal-300"
            >
              Hapus filter
            </button>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {CATEGORY_CARDS.map(category => {
            const count = categoryCounts[category.value];
            const percentage = creators.length ? Math.round((count / creators.length) * 100) : 0;
            const isSelected = categoryFilter === category.value;

            return (
              <button
                key={category.value}
                type="button"
                onClick={() => setCategoryFilter(isSelected ? 'ALL' : category.value)}
                aria-pressed={isSelected}
                className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900 ${
                  isSelected
                    ? 'border-teal-500 ring-2 ring-teal-500/15'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className={`text-xs font-bold ${category.color}`}>{category.label}</p>
                    <p className="mt-1 text-[10px] text-slate-400">{category.description}</p>
                  </div>
                  <span className="text-lg font-black text-slate-900 dark:text-white">{count.toLocaleString('id-ID')}</span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className={`h-full rounded-full ${category.bar}`} style={{ width: `${percentage}%` }} />
                </div>
                <p className="mt-1.5 text-right text-[10px] font-medium text-slate-400">{percentage}% dari total</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">Semua Creator</h2>
            <p className="mt-1 text-[11px] text-slate-400">
              Menampilkan {filteredCreators.length.toLocaleString('id-ID')} dari {creators.length.toLocaleString('id-ID')} data
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative min-w-56">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                placeholder="Cari creator..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <select
              value={statusFilter}
              onChange={event => setStatusFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <option value="ALL">Semua status</option>
              {Object.entries(STATUS_LABELS).map(([status, label]) => (
                <option key={status} value={status}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <VirtualTable<Creator>
          items={filteredCreators}
          rowHeight={56}
          containerHeight={680}
          emptyMessage="Tidak ada creator yang cocok dengan pencarian atau filter."
          className="rounded-none border-0 shadow-none"
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
            const curatedStyle = creator.curation_status === 'oke'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
              : creator.curation_status === 'reject'
                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';

            return (
              <tr key={creator.id} className="h-14 transition-colors hover:bg-teal-50/40 dark:hover:bg-teal-950/20">
                <td className="px-4 py-3">
                  <div className="font-bold text-slate-900 dark:text-white">@{creator.username}</div>
                  {creator.display_name && creator.display_name !== creator.username && (
                    <div className="mt-0.5 text-[10px] text-slate-400">{creator.display_name}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${curatedStyle}`}>
                    {CURATION_LABELS[creator.curation_status]}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">
                  {usernameCounts.get(username) || 0}
                </td>
                <td className="px-4 py-3"><CategoryBadge category={creator.category} /></td>
                <td className="px-4 py-3"><PlatformBadge platform={creator.platform} /></td>
                <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">{creator.source || '-'}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">
                  {creator.phone_raw || creator.phone_e164 || '-'}
                </td>
                <td className="px-4 py-3"><StatusBadge status={creator.pipeline_status} /></td>
              </tr>
            );
          }}
        />
        <div className="border-t border-slate-100 px-5 py-3 text-[10px] leading-5 text-slate-400 dark:border-slate-800">
          Kolom mengikuti data creator di sheet Pool. Kolom tambahan `reject` pada workbook berisi catatan/rekap sheet, bukan nilai per creator.
        </div>
      </section>
    </div>
  );
}
