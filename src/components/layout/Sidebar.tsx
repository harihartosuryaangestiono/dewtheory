'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Send, 
  Users, 
  CheckSquare, 
  Package, 
  Video, 
  MessageSquare, 
  FileSpreadsheet, 
  Settings, 
  Sparkles,
  UserCheck,
  Moon,
  Sun,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { useAffiliate } from '@/lib/store/useAffiliateStore';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Outreach WA', href: '/outreach', icon: Send, badgeKey: 'outreach' },
  { label: 'Pipeline Creator', href: '/creators', icon: Users },
  { label: 'Kurasi', href: '/curation', icon: CheckSquare, badgeKey: 'curation' },
  { label: 'Seeding Sample', href: '/samples', icon: Package, badgeKey: 'samples' },
  { label: 'SOW Video', href: '/sow', icon: Video, badgeKey: 'sow' },
  { label: 'Template WA', href: '/templates', icon: MessageSquare },
  { label: 'Import / Export', href: '/import-export', icon: FileSpreadsheet },
  { label: 'Profil Saya', href: '/profile', icon: UserCheck },
  { label: 'Pengaturan', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { currentUser, setCurrentUser, creators, shipments, sows } = useAffiliate();

  // Dynamic badges
  const uncontactedCount = creators.filter(c => c.curation_status === 'oke' && c.pipeline_status === 'curated' && c.phone_status === 'valid').length;
  const pendingCurationCount = creators.filter(c => c.curation_status === 'pending').length;
  const pendingShipmentCount = shipments.filter(s => s.status === 'pending').length;
  const pendingSOWCount = sows.filter(s => s.status === 'pending').length;

  const getBadgeValue = (key?: string) => {
    if (key === 'outreach' && uncontactedCount > 0) return uncontactedCount;
    if (key === 'curation' && pendingCurationCount > 0) return pendingCurationCount;
    if (key === 'samples' && pendingShipmentCount > 0) return pendingShipmentCount;
    if (key === 'sow' && pendingSOWCount > 0) return pendingSOWCount;
    return null;
  };

  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/80 backdrop-blur-md flex flex-col justify-between h-screen sticky top-0 z-30 select-none">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
                Dew Theory
              </span>
              <span className="text-[10px] uppercase tracking-wider text-teal-600 dark:text-teal-400 font-semibold block -mt-0.5">
                Affiliate Hub
              </span>
            </div>
          </Link>
        </div>

        {/* User Profile Card */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <Link
            href="/profile"
            className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-teal-500 transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-teal-600 text-white font-bold text-xs flex items-center justify-center">
                {currentUser.name[0]?.toUpperCase() || 'U'}
              </div>
              <div className="text-left">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block group-hover:text-teal-600">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-slate-400 block -mt-0.5">
                  KOL Specialist
                </span>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 transition-colors" />
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          {NAV_ITEMS.map(item => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            const badge = getBadgeValue(item.badgeKey);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all group',
                  isActive
                    ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 font-semibold shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      'w-4 h-4 transition-colors',
                      isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                    )}
                  />
                  <span>{item.label}</span>
                </div>

                {badge !== null && (
                  <span
                    className={cn(
                      'px-2 py-0.5 text-xs rounded-full font-bold',
                      item.badgeKey === 'outreach'
                        ? 'bg-teal-600 text-white animate-pulse'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    )}
                  >
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}

          <button
            type="button"
            onClick={async () => {
              try {
                await supabase.auth.signOut();
                toast.info('Anda telah keluar.');
                window.location.href = '/login';
              } catch (err: any) {
                toast.error('Gagal keluar: ' + err.message);
              }
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors group"
          >
            <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-500 transition-colors" />
            <span>Keluar</span>
          </button>
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500 flex items-center justify-between">
        <div>
          <p className="font-semibold text-slate-600 dark:text-slate-300">Dew Theory v1.0</p>
          <p className="text-[11px]">Kampanye Desember 2026</p>
        </div>
        <button
          onClick={() => {
            const isDark = document.documentElement.classList.toggle('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
          }}
          title="Toggle Dark Mode"
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
        >
          <Moon className="w-4 h-4 hidden dark:block" />
          <Sun className="w-4 h-4 block dark:hidden" />
        </button>
      </div>
    </aside>
  );
}
