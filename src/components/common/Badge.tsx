import React from 'react';
import { Category, PipelineStatus, PhoneStatus, Platform } from '@/types';
import { cn } from '@/lib/utils/cn';
import { CheckCircle2, Clock, AlertCircle, XCircle, PhoneCall, Sparkles, CheckCheck } from 'lucide-react';

interface CategoryBadgeProps {
  category: Category;
  showDesc?: boolean;
  className?: string;
}

export function CategoryBadge({ category, showDesc = false, className }: CategoryBadgeProps) {
  const meta: Record<Category, { label: string; desc: string; style: string }> = {
    A: {
      label: 'Kat A',
      desc: 'Dew Bright Toner',
      style: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800',
    },
    B: {
      label: 'Kat B',
      desc: 'Bright Milky Lotion',
      style: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
    },
    C: {
      label: 'Kat C',
      desc: 'Milky Dew Cleanser',
      style: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    },
    D: {
      label: 'Kat D',
      desc: 'Toner + Lotion Duo',
      style: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
    },
    UNASSIGNED: {
      label: 'Unassigned',
      desc: 'Belum ditentukan',
      style: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
    },
  };

  const item = meta[category] || meta.UNASSIGNED;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all',
        item.style,
        className
      )}
    >
      <span className="font-bold">{item.label}</span>
      {showDesc && <span className="opacity-80 font-normal">({item.desc})</span>}
    </span>
  );
}

interface StatusBadgeProps {
  status: PipelineStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const map: Record<PipelineStatus, { label: string; icon: any; style: string }> = {
    pool: { label: 'Pool', icon: Clock, style: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300' },
    curated: { label: 'OKE / Siap', icon: Sparkles, style: 'bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-950/40 dark:text-sky-300' },
    queued: { label: 'Antrean WA', icon: PhoneCall, style: 'bg-teal-50 text-teal-700 border-teal-300 dark:bg-teal-950/40 dark:text-teal-300' },
    contacted: { label: 'Contacted', icon: CheckCircle2, style: 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300' },
    replied: { label: 'Replied', icon: CheckCheck, style: 'bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300' },
    join: { label: 'Join', icon: CheckCircle2, style: 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold' },
    form_filled: { label: 'Form Terisi', icon: CheckCircle2, style: 'bg-emerald-100 text-emerald-800 border-emerald-400 dark:bg-emerald-900/50 dark:text-emerald-200' },
    sample_sent: { label: 'Sample Dikirim', icon: CheckCircle2, style: 'bg-violet-50 text-violet-700 border-violet-300 dark:bg-violet-950/40 dark:text-violet-300' },
    sow_1: { label: 'SOW 1 Posted', icon: Sparkles, style: 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300' },
    sow_2: { label: 'SOW 2 Posted', icon: Sparkles, style: 'bg-pink-50 text-pink-700 border-pink-300 dark:bg-pink-950/40 dark:text-pink-300 font-bold' },
    completed: { label: 'Selesai (2 SOW)', icon: CheckCircle2, style: 'bg-emerald-500 text-white border-emerald-600' },
    refuse: { label: 'Refuse', icon: XCircle, style: 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300' },
    no_response: { label: 'No Response', icon: AlertCircle, style: 'bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-950/40 dark:text-orange-300' },
    invalid_phone: { label: 'Nomor Invalid', icon: XCircle, style: 'bg-gray-100 text-gray-500 border-gray-300 dark:bg-gray-800 dark:text-gray-400' },
  };

  const item = map[status] || map.pool;
  const Icon = item.icon;

  return (
    <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border', item.style, className)}>
      <Icon className="w-3 h-3" />
      {item.label}
    </span>
  );
}

export function PhoneBadge({ status, phone }: { status: PhoneStatus; phone?: string }) {
  if (status === 'valid') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400 font-medium font-mono">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        {phone || 'Valid'}
      </span>
    );
  }
  if (status === 'missing') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900 font-medium">
        Tidak ada nomor
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900 font-medium">
      Nomor invalid
    </span>
  );
}

export function PlatformBadge({ platform }: { platform: Platform }) {
  const isTikTok = platform === 'TikTok';
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold',
      isTikTok 
        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' 
        : 'bg-orange-500 text-white'
    )}>
      {platform}
    </span>
  );
}
