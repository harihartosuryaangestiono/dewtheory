'use client';

import React from 'react';
import { useAffiliate } from '@/lib/store/useAffiliateStore';
import { Search, Flame, Target, Calendar, Bell, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  onOpenCommandPalette: () => void;
}

export function Header({ onOpenCommandPalette }: HeaderProps) {
  const { campaign, currentUser, dailyOutreachCount, dailyTarget } = useAffiliate();

  const progressPercent = Math.min(100, Math.round((dailyOutreachCount / dailyTarget) * 100));

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Search trigger & Campaign label */}
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-3 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-500 dark:text-slate-400 hover:border-teal-400 transition-all w-64 text-left shadow-sm group"
        >
          <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-500" />
          <span className="flex-1">Cari username atau nomor...</span>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px] font-mono text-slate-600 dark:text-slate-300">
            ⌘K
          </kbd>
        </button>

        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-slate-800 pl-4">
          <Calendar className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          <span>Periode: <strong className="text-slate-700 dark:text-slate-200 font-semibold">{campaign.name}</strong></span>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span>Target: <strong className="text-teal-600 dark:text-teal-400 font-semibold">{campaign.target_affiliates} Affiliate</strong></span>
        </div>
      </div>

      {/* Right side: Daily Outreach Progress & User indicator */}
      <div className="flex items-center gap-5">
        {/* Daily Outreach Tracker Badge */}
        <div className="flex items-center gap-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900/60 px-3 py-1.5 rounded-xl">
          <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-xs shadow-sm shadow-teal-500/30">
            <Flame className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-600 dark:text-slate-400 font-medium">{currentUser.name} hari ini:</span>
              <span className="font-bold text-teal-700 dark:text-teal-300">
                {dailyOutreachCount} / {dailyTarget} WA
              </span>
            </div>
            <div className="w-28 bg-teal-200 dark:bg-teal-900 h-1.5 rounded-full overflow-hidden mt-0.5">
              <div
                className="bg-teal-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* User status */}
        <div className="flex items-center gap-2 pl-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-500 to-indigo-500 text-white font-bold text-xs flex items-center justify-center shadow-sm">
            {currentUser.name[0]}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
              {currentUser.name}
              <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
            </div>
            <div className="text-[10px] text-slate-400">KOL Specialist</div>
          </div>
        </div>
      </div>
    </header>
  );
}
