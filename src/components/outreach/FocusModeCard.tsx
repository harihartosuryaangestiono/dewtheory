'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Creator, WhatsAppTemplate } from '@/types';
import { useAffiliate } from '@/lib/store/useAffiliateStore';
import { 
  getCreatorTemplateVariables, 
  renderTemplate, 
  buildWhatsAppLink 
} from '@/lib/utils/template';
import { CategoryBadge, PhoneBadge, PlatformBadge, StatusBadge } from '../common/Badge';
import { 
  Send, 
  Copy, 
  ExternalLink, 
  ChevronLeft, 
  ChevronRight, 
  SkipForward, 
  XCircle, 
  Undo2, 
  Lock, 
  CheckCircle2, 
  Keyboard, 
  Clock,
  Sparkles,
  Phone,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface FocusModeCardProps {
  creators: Creator[];
  initialIndex?: number;
  onDone?: () => void;
}

export function FocusModeCard({ creators, initialIndex = 0, onDone }: FocusModeCardProps) {
  const { 
    currentUser, 
    config, 
    templates, 
    claimCreator, 
    releaseCreator, 
    markContacted, 
    undoContacted, 
    markRefuse, 
    markInvalidPhone 
  } = useAffiliate();

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [lastContactedId, setLastContactedId] = useState<string | null>(null);
  const [lastContactedUsername, setLastContactedUsername] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const currentCreator = creators[currentIndex] || null;

  // Advance to next creator
  const goToNext = useCallback(() => {
    if (currentIndex < creators.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      toast.success('Semua creator dalam antrean selesai!');
      if (onDone) onDone();
    }
  }, [currentIndex, creators.length, onDone]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  // Set default template matching creator's category & platform
  useEffect(() => {
    if (!currentCreator) return;
    if (currentCreator.platform === 'Shopee') {
      setSelectedTemplateId('shopee');
    } else {
      const cat = currentCreator.category?.toLowerCase() || 'a';
      const defaultTpl = templates.find(t => t.id === `tiktok_${cat}`) || templates[0];
      setSelectedTemplateId(defaultTpl.id);
    }
  }, [currentCreator, templates]);

  // Atomic realtime claim lock for current card
  useEffect(() => {
    let active = true;
    const creatorId = currentCreator?.id;
    if (creatorId) {
      claimCreator(creatorId).then(res => {
        if (!active) return;
        if (!res.success) {
          toast.warning(`Sedang dikerjakan oleh ${res.locked_by || 'Pengguna Lain'}. Beralih ke antrean berikutnya...`);
          goToNext();
        }
      });
    }
    return () => {
      active = false;
      if (creatorId) {
        releaseCreator(creatorId);
      }
    };
  }, [currentCreator, claimCreator, releaseCreator, goToNext]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Compile WhatsApp message
  const activeTemplate = useMemo(() => {
    return templates.find(t => t.id === selectedTemplateId) || templates[0];
  }, [templates, selectedTemplateId]);

  const compiledMessage = useMemo(() => {
    if (!currentCreator || !activeTemplate) return '';
    const vars = getCreatorTemplateVariables(currentCreator, currentUser.name, config);
    return renderTemplate(activeTemplate.content, vars);
  }, [currentCreator, activeTemplate, currentUser.name, config]);

  const waLink = useMemo(() => {
    if (!currentCreator || !currentCreator.phone_e164) return '#';
    return buildWhatsAppLink(currentCreator.phone_e164, compiledMessage);
  }, [currentCreator, compiledMessage]);

  // Primary action: Send WhatsApp
  const handleSendWhatsApp = useCallback(() => {
    if (!currentCreator) return;
    if (currentCreator.phone_status !== 'valid' || !currentCreator.phone_e164) {
      toast.error('Nomor telepon tidak valid atau kosong');
      return;
    }

    // Open WhatsApp
    window.open(waLink, '_blank', 'noopener,noreferrer');

    // Mark contacted
    markContacted(currentCreator.id, activeTemplate.title, compiledMessage);
    setLastContactedId(currentCreator.id);
    setLastContactedUsername(currentCreator.username);

    // Set suggested delay cooldown if enabled
    if (config.enable_safety_delay !== false) {
      setCooldown(config.safety_delay_seconds || 3);
    }

    toast.success(`Pesan terkirim ke @${currentCreator.username}`);

    // Auto advance
    goToNext();
  }, [currentCreator, waLink, markContacted, activeTemplate.title, compiledMessage, goToNext, config.enable_safety_delay, config.safety_delay_seconds]);

  // Copy message
  const handleCopyMessage = useCallback(() => {
    if (!compiledMessage) return;
    navigator.clipboard.writeText(compiledMessage);
    setCopied(true);
    toast.success('Pesan disalin ke clipboard');
    setTimeout(() => setCopied(false), 2000);
  }, [compiledMessage]);

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.key === 'Enter') {
        e.preventDefault();
        handleSendWhatsApp();
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        goToNext();
        toast.info('Creator dilewati (Skip)');
      } else if (e.key === 'x' || e.key === 'X') {
        e.preventDefault();
        if (currentCreator) {
          markInvalidPhone(currentCreator.id);
          goToNext();
        }
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        if (currentCreator) {
          markRefuse(currentCreator.id, 'Ditandai refuse lewat shortcut R');
          goToNext();
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSendWhatsApp, goToNext, goToPrev, currentCreator, markInvalidPhone, markRefuse]);

  // Empty state
  if (!currentCreator || creators.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center max-w-xl mx-auto shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Antrean Outreach Kosong 🎉</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          Luar biasa! Semua creator yang berstatus OKE dan siap kontak sudah selesai dihubungi.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => window.location.href = '/curation'}
            className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold hover:bg-teal-700 transition-colors"
          >
            Promosikan Second Option
          </button>
          <button
            onClick={() => window.location.href = '/import-export'}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Import Creator Baru
          </button>
        </div>
      </div>
    );
  }

  const isLockedByOther = Boolean(
    currentCreator.locked_by && 
    currentCreator.locked_by !== currentUser.name && 
    currentCreator.locked_until && 
    new Date(currentCreator.locked_until) > new Date()
  );

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Undo Banner if last sent */}
      {lastContactedId && (
        <div className="bg-teal-500 text-white px-4 py-2.5 rounded-2xl flex items-center justify-between text-xs font-medium shadow-md shadow-teal-500/20 animate-in slide-in-from-top duration-200">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-white" />
            Pesan terkirim ke <strong>@{lastContactedUsername}</strong> dan status otomatis diubah ke Contacted.
          </span>
          <button
            onClick={() => {
              undoContacted(lastContactedId);
              setLastContactedId(null);
            }}
            className="inline-flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white font-bold px-3 py-1 rounded-lg transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5" />
            Undo
          </button>
        </div>
      )}

      {/* Main Outreach Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden">
        {/* Card Header & Navigation */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Antrean {currentIndex + 1} dari {creators.length}
            </span>
            {isLockedByOther && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300">
                <Lock className="w-3 h-3" />
                Dikunci oleh {currentCreator.locked_by}
              </span>
            )}
            {currentCreator.assigned_to && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
                Tugas: {currentCreator.assigned_to}
              </span>
            )}
          </div>

          {/* Quick Pagination Arrows */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={goToPrev}
              disabled={currentIndex === 0}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
              title="Sebelumnya (ArrowLeft)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToNext}
              disabled={currentIndex >= creators.length - 1}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
              title="Berikutnya (ArrowRight)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Creator Identity & Meta Section */}
        <div className="p-6 md:p-8 grid md:grid-cols-2 gap-8">
          {/* Left Column: Profile & Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <PlatformBadge platform={currentCreator.platform} />
                <CategoryBadge category={currentCreator.category} showDesc />
                <StatusBadge status={currentCreator.pipeline_status} />
              </div>

              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  @{currentCreator.username}
                </h2>
                <a
                  href={`https://www.tiktok.com/@${currentCreator.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400 hover:underline font-semibold bg-teal-50 dark:bg-teal-950/40 px-2.5 py-1 rounded-lg border border-teal-200 dark:border-teal-800"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Buka TikTok
                </a>
              </div>

              {currentCreator.display_name && currentCreator.display_name !== currentCreator.username && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Nama: <strong>{currentCreator.display_name}</strong>
                </p>
              )}
            </div>

            {/* Contact details */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Nomor WhatsApp:</span>
                <PhoneBadge status={currentCreator.phone_status} phone={currentCreator.phone_e164 ? `+${currentCreator.phone_e164}` : undefined} />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Sumber Lead:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{currentCreator.source || 'Database'}</span>
              </div>
              {currentCreator.notes && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 italic">
                  &ldquo;{currentCreator.notes}&rdquo;
                </div>
              )}
            </div>

            {/* Template Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center justify-between">
                <span>Pilih Template WhatsApp:</span>
                <span className="text-[11px] text-teal-600 dark:text-teal-400 font-normal">Pengirim: {currentUser.name}</span>
              </label>
              <select
                value={selectedTemplateId}
                onChange={e => setSelectedTemplateId(e.target.value)}
                className="w-full text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-teal-500"
              >
                {templates.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons Row */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleSendWhatsApp}
                disabled={isLockedByOther || currentCreator.phone_status !== 'valid'}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-extrabold text-sm flex items-center justify-center gap-3 shadow-lg shadow-teal-500/25 active:scale-[0.99] transition-all disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
                <span>Buka WhatsApp & Kirim</span>
                <kbd className="hidden sm:inline-block px-2 py-0.5 rounded bg-teal-700/60 text-white font-mono text-[10px]">
                  ENTER
                </kbd>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleCopyMessage}
                  className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? 'Tersalin!' : 'Salin Pesan'}
                </button>

                <button
                  onClick={goToNext}
                  className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  <span>Lewati (S)</span>
                </button>
              </div>

              {/* Status flag options */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => {
                    markInvalidPhone(currentCreator.id);
                    goToNext();
                  }}
                  className="text-xs text-slate-400 hover:text-rose-500 flex items-center gap-1 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Nomor Invalid (X)</span>
                </button>

                <button
                  onClick={() => {
                    markRefuse(currentCreator.id, 'Ditandai tawarannya ditolak');
                    goToNext();
                  }}
                  className="text-xs text-slate-400 hover:text-amber-500 flex items-center gap-1 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Tolak / Refuse (R)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live WhatsApp Chat Preview */}
          <div className="flex flex-col h-full">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center justify-between">
              <span>Preview Pesan WhatsApp Final:</span>
              <span className="text-[10px] text-teal-600 bg-teal-50 dark:bg-teal-950/60 dark:text-teal-300 px-2 py-0.5 rounded-full font-bold">
                Target: &lt;10 detik
              </span>
            </div>

            {/* Chat Box Simulation */}
            <div className="flex-1 bg-[#efeae2] dark:bg-slate-950 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 overflow-y-auto flex flex-col justify-end min-h-[360px] relative">
              {/* WhatsApp Bubble */}
              <div className="bg-[#dcf8c6] dark:bg-teal-950/80 border border-teal-200 dark:border-teal-800/60 text-slate-800 dark:text-slate-100 p-4 rounded-2xl rounded-tr-none shadow-sm text-xs leading-relaxed whitespace-pre-line self-end max-w-[95%]">
                {compiledMessage}
                <div className="text-[10px] text-slate-400 text-right mt-1.5 font-sans">
                  {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • Terkirim
                </div>
              </div>
            </div>

            {/* Delay recommendation info */}
            {cooldown > 0 && (
              <div className="mt-2 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 px-3 py-1.5 rounded-xl flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                <span>Saran jeda aman anti-banned: tunggu <strong>{cooldown} detik</strong> sebelum kirim berikutnya.</span>
              </div>
            )}
          </div>
        </div>

        {/* Keyboard Shortcuts Helper Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1 font-medium">
              <Keyboard className="w-3.5 h-3.5 text-slate-400" /> Shortcut:
            </span>
            <span><kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono text-slate-700 dark:text-slate-300">Enter</kbd> Kirim & Next</span>
            <span><kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono text-slate-700 dark:text-slate-300">S</kbd> Skip</span>
            <span><kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono text-slate-700 dark:text-slate-300">X</kbd> Invalid</span>
            <span><kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono text-slate-700 dark:text-slate-300">R</kbd> Refuse</span>
            <span><kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono text-slate-700 dark:text-slate-300">←/→</kbd> Navigasi</span>
          </div>

          <span className="font-semibold text-teal-600 dark:text-teal-400">
            Manual 1-Click (Aman dari banned)
          </span>
        </div>
      </div>
    </div>
  );
}
