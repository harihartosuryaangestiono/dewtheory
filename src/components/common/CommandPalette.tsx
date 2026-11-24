'use client';

import React, { useState, useEffect } from 'react';
import { useAffiliate } from '@/lib/store/useAffiliateStore';
import { Search, X, ExternalLink, Send, Phone, UserCheck } from 'lucide-react';
import { CategoryBadge, StatusBadge, PhoneBadge } from './Badge';
import Link from 'next/link';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const { creators } = useAffiliate();
  const [query, setQuery] = useState('');

  // Handle Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose(); // toggle
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = query.trim() === ''
    ? creators.slice(0, 8)
    : creators.filter(c => 
        c.username.toLowerCase().includes(query.toLowerCase()) ||
        c.display_name?.toLowerCase().includes(query.toLowerCase()) ||
        c.phone_raw.includes(query) ||
        c.phone_e164.includes(query) ||
        c.category.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 15);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Input Bar */}
        <div className="flex items-center px-4 border-b border-slate-100 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari creator berdasarkan username, nomor WA, kategori..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
            className="w-full px-3 py-4 text-sm bg-transparent outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400"
          />
          <button 
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results list */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">
              Tidak ada creator yang cocok dengan pencarian &ldquo;{query}&rdquo;
            </div>
          ) : (
            filtered.map(c => (
              <div
                key={c.id}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-bold flex items-center justify-center text-sm">
                    {c.username[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        @{c.username}
                      </span>
                      <CategoryBadge category={c.category} />
                      <StatusBadge status={c.pipeline_status} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                      <PhoneBadge status={c.phone_status} phone={c.phone_e164 ? `+${c.phone_e164}` : undefined} />
                      <span>Sumber: {c.source}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`https://www.tiktok.com/@${c.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                    title="Buka profil TikTok"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <Link
                    href={`/outreach?creatorId=${c.id}`}
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-600 text-white hover:bg-teal-700 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Buka di Outreach
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Tekan <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono text-[10px]">ESC</kbd> untuk menutup</span>
          <span>Menampilkan {filtered.length} creator</span>
        </div>
      </div>
    </div>
  );
}
