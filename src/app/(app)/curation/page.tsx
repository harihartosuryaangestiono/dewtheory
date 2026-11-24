'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useAffiliate } from '@/lib/store/useAffiliateStore';
import { Category, CurationStatus, Creator, PipelineStatus } from '@/types';
import { CategoryBadge, PhoneBadge, PlatformBadge, StatusBadge } from '@/components/common/Badge';
import { VirtualTable } from '@/components/common/VirtualTable';
import { cleanUsername } from '@/lib/utils/excel';
import { 
  CheckSquare, 
  Sparkles, 
  ExternalLink, 
  Undo2, 
  ArrowLeft, 
  ArrowRight, 
  HelpCircle, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Flame, 
  SlidersHorizontal, 
  Layers, 
  Search, 
  Users, 
  Check, 
  ChevronRight, 
  Info, 
  Lock,
  ChevronLeft,
  Smartphone,
  Eye,
  RefreshCw,
  FolderSync
} from 'lucide-react';
import { toast } from 'sonner';

// Quick Niche Tag Options
const NICHE_TAGS = [
  'skincare reviewer',
  'GRWM',
  'beauty lifestyle',
  'acne/oily',
  'male grooming',
  'affiliate/KOC',
];

// Quick GMV Tier Options
const GMV_TIERS = [
  { label: 'Nano (<10k)', value: 'nano' },
  { label: 'Micro (10k-50k / GMV min 1jt)', value: 'micro' },
  { label: 'Mid (50k-250k)', value: 'mid' },
  { label: 'Macro (>250k)', value: 'macro' },
];

// Quick Reject Reasons
const REJECT_REASONS = [
  { key: '1', label: 'GMV rendah (< 1jt / non-performer)' },
  { key: '2', label: 'Niche tidak cocok / bukan beauty' },
  { key: '3', label: 'Akun tidak aktif / pasif' },
  { key: '4', label: 'Akun private / dibatasi' },
  { key: '5', label: 'Kompetitor brand langsung' },
  { key: '6', label: 'Lainnya' },
];

interface UndoAction {
  creatorId: string;
  creatorUsername: string;
  previousState: {
    curation_status: CurationStatus;
    category: Category;
    pipeline_status: PipelineStatus;
    notes?: string;
    tags?: string[];
  };
  decisionLabel: string;
}

export default function CurationPage() {
  const { 
    creators, 
    campaign, 
    currentUser, 
    updateCuration, 
    restoreCreatorState,
    batchUpdateCuration, 
    promoteSecondOption,
    claimCreator,
    releaseCreator,
    splitCurationQueue,
    activityLogs
  } = useAffiliate();

  // Mode: 'fast' (Mode Kurasi Cepat Keyboard-first) vs 'review' (Tab Tinjau Ulang Tabel)
  const [viewMode, setViewMode] = useState<'fast' | 'review'>('fast');

  // Queue Filters
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [platformFilter, setPlatformFilter] = useState<string>('ALL');
  const [phoneFilter, setPhoneFilter] = useState<'ALL' | 'has_phone' | 'no_phone'>('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('ALL');

  // Fast Curation Index
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Quick inputs for current creator
  const [quickFollowers, setQuickFollowers] = useState<string>('');
  const [quickGmvTier, setQuickGmvTier] = useState<string>('');
  const [quickSelectedTags, setQuickSelectedTags] = useState<string[]>([]);
  const [quickNotes, setQuickNotes] = useState<string>('');

  // Last used memory to quick apply
  const [lastUsedTags, setLastUsedTags] = useState<string[]>([]);
  const [lastUsedTier, setLastUsedTier] = useState<string>('');

  // Modal / Popover states
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [quotaConfirmCategory, setQuotaConfirmCategory] = useState<'A' | 'B' | 'C' | 'D' | null>(null);

  // Undo stack (min 20 history steps)
  const [undoStack, setUndoStack] = useState<UndoAction[]>([]);

  // Review Table state
  const [reviewTab, setReviewTab] = useState<CurationStatus | 'pending'>('oke');
  const [reviewCategoryFilter, setReviewCategoryFilter] = useState<string>('ALL');
  const [reviewSearchQuery, setReviewSearchQuery] = useState('');
  const [reviewSelectedIds, setReviewSelectedIds] = useState<Set<string>>(new Set());

  // Touch Swipe coordinates for Mobile
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // 1. Pending Queue Computation
  const pendingQueue = useMemo(() => {
    return creators.filter(c => {
      if (c.curation_status !== 'pending') return false;
      if (sourceFilter !== 'ALL' && c.source !== sourceFilter) return false;
      if (platformFilter !== 'ALL' && c.platform !== platformFilter) return false;
      if (phoneFilter === 'has_phone' && c.phone_status !== 'valid') return false;
      if (phoneFilter === 'no_phone' && c.phone_status === 'valid') return false;
      if (assigneeFilter !== 'ALL' && c.assigned_to !== assigneeFilter) return false;
      return true;
    });
  }, [creators, sourceFilter, platformFilter, phoneFilter, assigneeFilter]);

  // Unique Sources in creators for filter dropdown
  const uniqueSources = useMemo(() => {
    const s = new Set<string>();
    creators.forEach(c => {
      if (c.source) s.add(c.source);
    });
    return Array.from(s);
  }, [creators]);

  // Ensure currentIndex stays within bounds
  const safeCurrentIndex = Math.min(currentIndex, Math.max(0, pendingQueue.length - 1));
  const currentCreator = pendingQueue[safeCurrentIndex] || null;

  // Prefetch 5 next creators for 0ms transition
  const nextPrefetched = useMemo(() => {
    return pendingQueue.slice(safeCurrentIndex + 1, safeCurrentIndex + 6);
  }, [pendingQueue, safeCurrentIndex]);

  // 2. Live Category Quota Stats
  const categoryQuota = useMemo(() => {
    const compute = (cat: 'A' | 'B' | 'C' | 'D', target: number) => {
      const okeCount = creators.filter(c => c.category === cat && (c.curation_status === 'oke' || ['contacted', 'replied', 'join', 'sample_sent', 'sow_1', 'sow_2', 'completed'].includes(c.pipeline_status))).length;
      const percent = target > 0 ? Math.round((okeCount / target) * 100) : 0;
      const isFull = percent >= 100;
      const isNearFull = percent >= 90 && percent < 100;
      return {
        cat,
        target,
        current: okeCount,
        percent,
        isFull,
        isNearFull,
        remaining: Math.max(0, target - okeCount),
      };
    };

    return {
      A: compute('A', campaign.quota_a || 35),
      B: compute('B', campaign.quota_b || 25),
      C: compute('C', campaign.quota_c || 15),
      D: compute('D', campaign.quota_d || 25),
    };
  }, [creators, campaign]);

  // Counts for Review Tabs
  const tabCounts = useMemo(() => {
    return {
      oke: creators.filter(c => c.curation_status === 'oke').length,
      second_option: creators.filter(c => c.curation_status === 'second_option').length,
      reject: creators.filter(c => c.curation_status === 'reject').length,
      pending: creators.filter(c => c.curation_status === 'pending').length,
    };
  }, [creators]);

  // Daily Curation progress per user
  const curationDailyProgress = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    // Count from activity log today
    const dindaCount = activityLogs.filter(a => a.user_name === 'Dinda' && a.action === 'Kurasi Creator' && a.created_at.startsWith(today)).length;
    const suryaCount = activityLogs.filter(a => a.user_name === 'Surya' && a.action === 'Kurasi Creator' && a.created_at.startsWith(today)).length;
    return { Dinda: dindaCount, Surya: suryaCount };
  }, [activityLogs]);

  // Duplicate check for current creator
  const duplicateWarning = useMemo(() => {
    if (!currentCreator) return null;
    const cleanCurrent = cleanUsername(currentCreator.username);
    const duplicates = creators.filter(c => c.id !== currentCreator.id && cleanUsername(c.username) === cleanCurrent);
    if (duplicates.length > 0) {
      return `Peringatan: Username @${currentCreator.username} muncul ${duplicates.length + 1} kali di database (Status duplikat: ${duplicates[0].curation_status.toUpperCase()}).`;
    }
    return null;
  }, [currentCreator, creators]);

  // Pipeline Status Warning (e.g. already contacted/join)
  const pipelineWarning = useMemo(() => {
    if (!currentCreator) return null;
    if (['contacted', 'replied', 'join', 'sample_sent', 'sow_1', 'sow_2', 'refuse'].includes(currentCreator.pipeline_status)) {
      return `Creator ini sudah memiliki progres pipeline: ${currentCreator.pipeline_status.toUpperCase()}`;
    }
    return null;
  }, [currentCreator]);

  // Claim Lock effect when current creator changes in Fast Mode
  useEffect(() => {
    if (viewMode !== 'fast' || !currentCreator) return;

    let isMounted = true;
    claimCreator(currentCreator.id).then(({ success, locked_by }) => {
      if (!isMounted) return;
      if (!success && locked_by && locked_by !== currentUser.name) {
        toast.warning(`@${currentCreator.username} sedang dikurasi oleh ${locked_by}. Melompat ke creator berikutnya...`);
        // Jump to next
        setCurrentIndex(prev => prev + 1);
      }
    });

    return () => {
      isMounted = false;
      if (currentCreator) {
        releaseCreator(currentCreator.id);
      }
    };
  }, [currentCreator, viewMode, currentUser.name, claimCreator, releaseCreator]);

  // 3. Open TikTok Profile Popup in Right Half of Screen (Shortcut T)
  const openTikTokProfile = useCallback(() => {
    if (!currentCreator) return;
    const cleanUser = cleanUsername(currentCreator.username);
    const url = `https://www.tiktok.com/@${cleanUser}`;
    
    // Position on right half of screen
    const screenWidth = typeof window !== 'undefined' ? window.screen.availWidth : 1200;
    const screenHeight = typeof window !== 'undefined' ? window.screen.availHeight : 800;
    const halfWidth = Math.floor(screenWidth / 2);

    window.open(
      url,
      'tiktok_popup_curation',
      `width=${halfWidth},height=${screenHeight},left=${halfWidth},top=0,resizable=yes,scrollbars=yes,status=no,toolbar=no`
    );
  }, [currentCreator]);

  // Helper to compile tags and notes
  const buildCurrentMetadata = useCallback(() => {
    const tags = [...quickSelectedTags];
    if (quickGmvTier) tags.push(`tier:${quickGmvTier}`);
    if (quickFollowers.trim()) tags.push(`followers:${quickFollowers.trim()}`);
    return {
      tags: tags.length > 0 ? tags : undefined,
      notes: quickNotes.trim() ? quickNotes.trim() : undefined,
    };
  }, [quickSelectedTags, quickGmvTier, quickFollowers, quickNotes]);

  // 4. Undo Handler (Shortcut Z)
  const handleUndo = useCallback(async () => {
    if (undoStack.length === 0) {
      toast.info('Tidak ada riwayat untuk di-undo');
      return;
    }

    const [lastAction, ...remainingStack] = undoStack;
    setUndoStack(remainingStack);

    // Restore previous state in store and Supabase
    await restoreCreatorState(lastAction.creatorId, lastAction.previousState);

    // Adjust currentIndex to focus on the restored creator if present
    setCurrentIndex(prev => Math.max(0, prev - 1));

    toast.success(`Berhasil Undo: @${lastAction.creatorUsername} dikembalikan ke ${lastAction.previousState.curation_status.toUpperCase()}`);
  }, [undoStack, restoreCreatorState]);

  // 5. Decision Handlers
  const handleDecide = useCallback(async (
    status: CurationStatus, 
    category?: Category, 
    customNotes?: string
  ) => {
    if (!currentCreator) return;

    const metadata = buildCurrentMetadata();
    const finalNotes = customNotes !== undefined ? customNotes : metadata.notes;

    // Check quota if OKE
    if (status === 'oke' && category && category !== 'UNASSIGNED') {
      const q = categoryQuota[category as 'A' | 'B' | 'C' | 'D'];
      if (q && q.isFull && !quotaConfirmCategory) {
        // Trigger quota confirmation
        setQuotaConfirmCategory(category as 'A' | 'B' | 'C' | 'D');
        return;
      }
    }

    // Save previous state for Undo
    const undoItem: UndoAction = {
      creatorId: currentCreator.id,
      creatorUsername: currentCreator.username,
      previousState: {
        curation_status: currentCreator.curation_status,
        category: currentCreator.category,
        pipeline_status: currentCreator.pipeline_status,
        notes: currentCreator.notes,
        tags: currentCreator.tags,
      },
      decisionLabel: status === 'oke' ? `OKE Kat ${category}` : (status === 'second_option' ? 'Second Option' : 'Reject'),
    };

    setUndoStack(prev => [undoItem, ...prev].slice(0, 30)); // retain up to 30 steps

    // Save last used tags & tier for quick reuse
    if (quickSelectedTags.length > 0) setLastUsedTags(quickSelectedTags);
    if (quickGmvTier) setLastUsedTier(quickGmvTier);

    // Optimistic Update
    updateCuration(
      currentCreator.id, 
      status, 
      category, 
      finalNotes, 
      metadata.tags
    );

    // Reset inputs for next creator
    setQuickFollowers('');
    setQuickNotes('');
    setQuickSelectedTags([]);
    setQuickGmvTier('');
    setQuotaConfirmCategory(null);
    setIsRejectModalOpen(false);

    // Toast notification with instant Undo action
    toast.success(
      `@${currentCreator.username} → ${undoItem.decisionLabel}`,
      {
        duration: 3500,
        action: {
          label: 'Undo (Z)',
          onClick: () => handleUndo(),
        },
      }
    );
  }, [currentCreator, buildCurrentMetadata, categoryQuota, quotaConfirmCategory, quickSelectedTags, quickGmvTier, updateCuration, handleUndo]);

  // 6. Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If typing in input or textarea, don't trigger single-letter hotkeys
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      // Allow Escape always
      if (e.key === 'Escape') {
        setIsRejectModalOpen(false);
        setIsHelpModalOpen(false);
        setQuotaConfirmCategory(null);
        return;
      }

      if (isInput) return;

      // When reject modal is open, 1-6 picks the reason
      if (isRejectModalOpen) {
        const foundReason = REJECT_REASONS.find(r => r.key === e.key);
        if (foundReason) {
          e.preventDefault();
          handleDecide('reject', undefined, foundReason.label);
          return;
        }
      }

      // Normal Fast Curation Hotkeys
      if (viewMode === 'fast') {
        if (e.key === '1') {
          e.preventDefault();
          handleDecide('oke', 'A');
        } else if (e.key === '2') {
          e.preventDefault();
          handleDecide('oke', 'B');
        } else if (e.key === '3') {
          e.preventDefault();
          handleDecide('oke', 'C');
        } else if (e.key === '4') {
          e.preventDefault();
          handleDecide('oke', 'D');
        } else if (e.key === '5' || e.code === 'Space') {
          e.preventDefault();
          handleDecide('second_option');
        } else if (e.key === 'x' || e.key === 'X') {
          e.preventDefault();
          setIsRejectModalOpen(prev => !prev);
        } else if (e.key === 'z' || e.key === 'Z') {
          e.preventDefault();
          handleUndo();
        } else if (e.key === 't' || e.key === 'T') {
          e.preventDefault();
          openTikTokProfile();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setCurrentIndex(prev => Math.max(0, prev - 1));
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          setCurrentIndex(prev => Math.min(pendingQueue.length - 1, prev + 1));
        } else if (e.key === '?') {
          e.preventDefault();
          setIsHelpModalOpen(prev => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, isRejectModalOpen, handleDecide, handleUndo, openTikTokProfile, pendingQueue.length]);

  // Touch Swipe handlers for HP/Mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    if (Math.abs(deltaX) > 60 && Math.abs(deltaY) < 50) {
      if (deltaX > 0) {
        // Swipe Right -> OKE (default Kat A or open selector)
        handleDecide('oke', 'A');
      } else {
        // Swipe Left -> Reject
        setIsRejectModalOpen(true);
      }
    } else if (deltaY < -60 && Math.abs(deltaX) < 50) {
      // Swipe Up -> Second Option
      handleDecide('second_option');
    }
  };

  // Quick toggle tag
  const toggleQuickTag = (tag: string) => {
    setQuickSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // Apply last used tags & tier
  const applyLastUsed = () => {
    if (lastUsedTags.length > 0) setQuickSelectedTags(lastUsedTags);
    if (lastUsedTier) setQuickGmvTier(lastUsedTier);
    toast.info('Nilai kurasi terakhir diterapkan');
  };

  // Split queue evenly
  const handleSplitQueue = () => {
    splitCurationQueue('Dinda', 'Surya');
  };

  // Review List Filtered
  const filteredReviewList = useMemo(() => {
    return creators.filter(c => {
      if (c.curation_status !== reviewTab) return false;
      if (reviewCategoryFilter !== 'ALL' && c.category !== reviewCategoryFilter) return false;
      if (reviewSearchQuery.trim()) {
        const q = reviewSearchQuery.toLowerCase();
        const mUser = c.username.toLowerCase().includes(q);
        const mNotes = c.notes?.toLowerCase().includes(q);
        const mPhone = c.phone_raw?.includes(q) || c.phone_e164?.includes(q);
        if (!mUser && !mNotes && !mPhone) return false;
      }
      return true;
    });
  }, [creators, reviewTab, reviewCategoryFilter, reviewSearchQuery]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 select-none">
      {/* Top Bar: Switcher, Queue stats, Daily count, & Shortcuts Help */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-black shadow-md shadow-teal-600/20">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Mode Kurasi Cepat
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                &lt; 5 Detik / Creator
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {viewMode === 'fast' 
                ? `Sisa ${pendingQueue.length} creator dalam antrean kurasi`
                : 'Tinjau ulang dan kelola hasil kurasi creator'}
            </p>
          </div>
        </div>

        {/* Action Controls & Daily stats */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Daily Tracker Badges */}
          <div className="flex items-center gap-2 text-xs bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-slate-500 font-medium">Hari ini:</span>
            <span className="font-bold text-teal-600 dark:text-teal-400">Dinda ({curationDailyProgress.Dinda})</span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">Surya ({curationDailyProgress.Surya})</span>
          </div>

          {/* Bagi Dua Antrean */}
          <button
            type="button"
            onClick={handleSplitQueue}
            title="Bagi rata antrean pending antara Dinda dan Surya"
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <FolderSync className="w-3.5 h-3.5 text-teal-600" />
            <span className="hidden sm:inline">Bagi 2 Antrean</span>
          </button>

          {/* Switch View Button */}
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl flex items-center">
            <button
              type="button"
              onClick={() => setViewMode('fast')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'fast'
                  ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Mode Cepat (1 Creator)
            </button>
            <button
              type="button"
              onClick={() => setViewMode('review')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'review'
                  ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Tab Tinjau Ulang ({tabCounts.oke + tabCounts.second_option})
            </button>
          </div>

          {/* Help Shortcuts Modal Trigger */}
          <button
            type="button"
            onClick={() => setIsHelpModalOpen(true)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm"
            title="Daftar Tombol Pintas Keyboard (?)"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: FAST KEYBOARD-FIRST CURATION */}
      {viewMode === 'fast' && (
        <>
          {/* Queue Filter Bar */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-500 flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filter Antrean:
              </span>

              {/* Source filter */}
              <select
                value={sourceFilter}
                onChange={e => { setSourceFilter(e.target.value); setCurrentIndex(0); }}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 font-medium text-slate-700 dark:text-slate-200 outline-none"
              >
                <option value="ALL">Semua Sumber ({creators.filter(c => c.curation_status === 'pending').length})</option>
                {uniqueSources.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              {/* Platform filter */}
              <select
                value={platformFilter}
                onChange={e => { setPlatformFilter(e.target.value); setCurrentIndex(0); }}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 font-medium text-slate-700 dark:text-slate-200 outline-none"
              >
                <option value="ALL">Semua Platform</option>
                <option value="TikTok">TikTok</option>
                <option value="Shopee">Shopee</option>
              </select>

              {/* Phone availability filter */}
              <select
                value={phoneFilter}
                onChange={e => { setPhoneFilter(e.target.value as any); setCurrentIndex(0); }}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 font-medium text-slate-700 dark:text-slate-200 outline-none"
              >
                <option value="ALL">Nomor WA: Semua</option>
                <option value="has_phone">✅ Hanya Ada WA</option>
                <option value="no_phone">⚠️ Tanpa Nomor</option>
              </select>

              {/* Assignee / Split queue filter */}
              <select
                value={assigneeFilter}
                onChange={e => { setAssigneeFilter(e.target.value); setCurrentIndex(0); }}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 font-medium text-slate-700 dark:text-slate-200 outline-none"
              >
                <option value="ALL">Antrean: Gabungan</option>
                <option value="Dinda">Bagian Dinda</option>
                <option value="Surya">Bagian Surya</option>
              </select>
            </div>

            {/* Undo status and Queue index counter */}
            <div className="flex items-center gap-3">
              {undoStack.length > 0 && (
                <button
                  type="button"
                  onClick={handleUndo}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
                  title="Undo keputusan terakhir (Z)"
                >
                  <Undo2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>Undo ({undoStack.length})</span>
                </button>
              )}

              <span className="text-slate-400 font-mono text-[11px]">
                {pendingQueue.length > 0 ? `${safeCurrentIndex + 1} dari ${pendingQueue.length}` : '0 dari 0'}
              </span>
            </div>
          </div>

          {/* TWO AREA MAIN LAYOUT: Left (Curation Card) + Right (Live Quota & Rules) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* AREA 1: KARTU KURASI SATU CREATOR (7 Cols) */}
            <div 
              className="lg:col-span-7 space-y-4"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {currentCreator ? (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-xl shadow-teal-900/5 relative overflow-hidden transition-all">
                  
                  {/* Lock Indicator */}
                  {currentCreator.locked_by && currentCreator.locked_by !== currentUser.name && (
                    <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-2xl flex items-center justify-between text-xs text-amber-800 dark:text-amber-200">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-amber-600" />
                        <span>Sedang dilihat oleh <strong>{currentCreator.locked_by}</strong></span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentIndex(prev => prev + 1)}
                        className="px-2.5 py-1 bg-amber-600 text-white rounded-lg font-bold text-[11px]"
                      >
                        Lompat Creator
                      </button>
                    </div>
                  )}

                  {/* Duplicate or Pipeline Warning Alerts */}
                  {duplicateWarning && (
                    <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl flex items-center gap-2 text-xs text-rose-800 dark:text-rose-300">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                      <span>{duplicateWarning}</span>
                    </div>
                  )}

                  {pipelineWarning && (
                    <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 rounded-2xl flex items-center gap-2 text-xs text-indigo-800 dark:text-indigo-300">
                      <Info className="w-4 h-4 flex-shrink-0 text-indigo-600" />
                      <span>{pipelineWarning}</span>
                    </div>
                  )}

                  {/* Creator Identity & TikTok Open Action */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                          @{cleanUsername(currentCreator.username)}
                        </h2>
                        <PlatformBadge platform={currentCreator.platform} />
                      </div>
                      {currentCreator.display_name && currentCreator.display_name !== currentCreator.username && (
                        <p className="text-xs text-slate-500 font-medium">
                          {currentCreator.display_name}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
                        <span>Sumber: <strong className="text-slate-600 dark:text-slate-300 font-semibold">{currentCreator.source || 'Pool'}</strong></span>
                        {currentCreator.assigned_to && (
                          <>
                            <span>•</span>
                            <span>Tugas: <strong className="text-teal-600 font-semibold">{currentCreator.assigned_to}</strong></span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Button Buka Profil TikTok (T) with Popup positioning */}
                    <button
                      type="button"
                      onClick={openTikTokProfile}
                      className="px-4 py-3 rounded-2xl bg-slate-900 hover:bg-black text-white dark:bg-teal-600 dark:hover:bg-teal-700 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 group"
                    >
                      <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      <span>Buka Profil TikTok</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-white/20 text-[10px] font-mono">T</kbd>
                    </button>
                  </div>

                  {/* WhatsApp Indicator & Missing Phone Alert */}
                  <div className="py-4 border-b border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-500">Nomor WhatsApp:</span>
                      <PhoneBadge 
                        status={currentCreator.phone_status} 
                        phone={currentCreator.phone_e164 || currentCreator.phone_raw} 
                      />
                    </div>

                    {currentCreator.phone_status !== 'valid' && (
                      <div className="p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 animate-in fade-in">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                          <span>Tidak bisa di-WA langsung. Tetap jadikan OKE?</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (!quickSelectedTags.includes('Perlu cari kontak lain')) {
                              setQuickSelectedTags(prev => [...prev, 'Perlu cari kontak lain']);
                              toast.info('Tag "Perlu cari kontak lain" ditambahkan');
                            }
                          }}
                          className="px-2 py-1 rounded-lg bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-100 font-semibold text-[11px] whitespace-nowrap hover:bg-amber-300 transition-colors"
                        >
                          + Tag: Perlu cari kontak lain
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Quick Input Fields (Optional - Not blocking decision) */}
                  <div className="py-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        Input Cepat Profil (Opsional)
                      </span>
                      {(lastUsedTags.length > 0 || lastUsedTier) && (
                        <button
                          type="button"
                          onClick={applyLastUsed}
                          className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Terapkan Tag Terakhir</span>
                        </button>
                      )}
                    </div>

                    {/* GMV Tier Selector */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-500 block">Estimasi GMV / Tier:</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {GMV_TIERS.map(t => (
                          <button
                            key={t.value}
                            type="button"
                            onClick={() => setQuickGmvTier(prev => prev === t.value ? '' : t.value)}
                            className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold text-center transition-all ${
                              quickGmvTier === t.value
                                ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Followers & Notes */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                      <div className="sm:col-span-1">
                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">Followers:</label>
                        <input
                          type="text"
                          placeholder="mis. 25k"
                          value={quickFollowers}
                          onChange={e => setQuickFollowers(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-1 focus:ring-teal-500"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">Catatan Kurasi:</label>
                        <input
                          type="text"
                          placeholder="mis. Bagus di GRWM, video konsisten"
                          value={quickNotes}
                          onChange={e => setQuickNotes(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-1 focus:ring-teal-500"
                        />
                      </div>
                    </div>

                    {/* Niche Tags Chips */}
                    <div className="space-y-1 pt-1">
                      <label className="text-[11px] font-semibold text-slate-500 block">Karakteristik & Niche:</label>
                      <div className="flex flex-wrap gap-1.5">
                        {NICHE_TAGS.map(tag => {
                          const isSelected = quickSelectedTags.includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => toggleQuickTag(tag)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                                isSelected
                                  ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-200 border border-teal-300 font-bold'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                              }`}
                            >
                              {isSelected ? `✓ ${tag}` : `+ ${tag}`}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* KEPUTUSAN UTAMA & SHORTCUT BUTTONS */}
                  <div className="pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                        Keputusan Kurasi
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                        Tekan angka 1-5 atau X
                      </span>
                    </div>

                    {/* Big Action Buttons */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {/* 1 - Kat A */}
                      <button
                        type="button"
                        onClick={() => handleDecide('oke', 'A')}
                        className={`p-3 rounded-2xl border text-left transition-all active:scale-95 shadow-sm relative overflow-hidden group ${
                          categoryQuota.A.isFull 
                            ? 'border-amber-400 bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200'
                            : 'border-teal-300 dark:border-teal-700 bg-teal-50/80 hover:bg-teal-100/90 dark:bg-teal-950/40 dark:hover:bg-teal-950/70 text-teal-950 dark:text-teal-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-black text-teal-700 dark:text-teal-300">Kat A</span>
                          <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-[10px] font-mono font-bold shadow-xs">1</kbd>
                        </div>
                        <p className="text-xs font-bold mt-1 line-clamp-1">Dew Bright Toner</p>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                          <span>{categoryQuota.A.current}/{categoryQuota.A.target}</span>
                          {categoryQuota.A.isFull && <span className="font-bold text-amber-600">Penuh!</span>}
                        </div>
                      </button>

                      {/* 2 - Kat B */}
                      <button
                        type="button"
                        onClick={() => handleDecide('oke', 'B')}
                        className={`p-3 rounded-2xl border text-left transition-all active:scale-95 shadow-sm relative overflow-hidden group ${
                          categoryQuota.B.isFull 
                            ? 'border-amber-400 bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200'
                            : 'border-indigo-300 dark:border-indigo-700 bg-indigo-50/80 hover:bg-indigo-100/90 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/70 text-indigo-950 dark:text-indigo-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-black text-indigo-700 dark:text-indigo-300">Kat B</span>
                          <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-[10px] font-mono font-bold shadow-xs">2</kbd>
                        </div>
                        <p className="text-xs font-bold mt-1 line-clamp-1">Bright Milky Lotion</p>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                          <span>{categoryQuota.B.current}/{categoryQuota.B.target}</span>
                          {categoryQuota.B.isFull && <span className="font-bold text-amber-600">Penuh!</span>}
                        </div>
                      </button>

                      {/* 3 - Kat C */}
                      <button
                        type="button"
                        onClick={() => handleDecide('oke', 'C')}
                        className={`p-3 rounded-2xl border text-left transition-all active:scale-95 shadow-sm relative overflow-hidden group ${
                          categoryQuota.C.isFull 
                            ? 'border-amber-400 bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200'
                            : 'border-amber-300 dark:border-amber-700 bg-amber-50/80 hover:bg-amber-100/90 dark:bg-amber-950/40 dark:hover:bg-amber-950/70 text-amber-950 dark:text-amber-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-black text-amber-700 dark:text-amber-300">Kat C</span>
                          <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-[10px] font-mono font-bold shadow-xs">3</kbd>
                        </div>
                        <p className="text-xs font-bold mt-1 line-clamp-1">Milky Dew Cleanser</p>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                          <span>{categoryQuota.C.current}/{categoryQuota.C.target}</span>
                          {categoryQuota.C.isFull && <span className="font-bold text-amber-600">Penuh!</span>}
                        </div>
                      </button>

                      {/* 4 - Kat D */}
                      <button
                        type="button"
                        onClick={() => handleDecide('oke', 'D')}
                        className={`p-3 rounded-2xl border text-left transition-all active:scale-95 shadow-sm relative overflow-hidden group ${
                          categoryQuota.D.isFull 
                            ? 'border-amber-400 bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200'
                            : 'border-rose-300 dark:border-rose-700 bg-rose-50/80 hover:bg-rose-100/90 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 text-rose-950 dark:text-rose-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-black text-rose-700 dark:text-rose-300">Kat D</span>
                          <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-[10px] font-mono font-bold shadow-xs">4</kbd>
                        </div>
                        <p className="text-xs font-bold mt-1 line-clamp-1">Toner + Lotion Duo</p>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                          <span>{categoryQuota.D.current}/{categoryQuota.D.target}</span>
                          {categoryQuota.D.isFull && <span className="font-bold text-amber-600">Penuh!</span>}
                        </div>
                      </button>
                    </div>

                    {/* Secondary Actions: Second Option & Reject */}
                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      {/* 5 / Space: Second Option */}
                      <button
                        type="button"
                        onClick={() => handleDecide('second_option')}
                        className="py-3 px-4 rounded-2xl border border-slate-300 dark:border-slate-700 hover:border-indigo-400 bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all flex items-center justify-between shadow-sm active:scale-95"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                          <span>Second Option (Cadangan)</span>
                        </div>
                        <div className="flex items-center gap-1 font-mono text-[10px]">
                          <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border">5</kbd>
                          <span>/</span>
                          <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border">Space</kbd>
                        </div>
                      </button>

                      {/* X: Reject */}
                      <button
                        type="button"
                        onClick={() => setIsRejectModalOpen(true)}
                        className="py-3 px-4 rounded-2xl border border-rose-200 dark:border-rose-900/60 hover:border-rose-400 bg-rose-50/40 dark:bg-rose-950/30 hover:bg-rose-50 text-rose-700 dark:text-rose-300 font-bold text-xs transition-all flex items-center justify-between shadow-sm active:scale-95"
                      >
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-rose-500" />
                          <span>Reject (Alasan...)</span>
                        </div>
                        <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border text-[10px] font-mono">X</kbd>
                      </button>
                    </div>

                    {/* Navigation buttons: Previous, Skip, Undo */}
                    <div className="flex items-center justify-between pt-2 text-xs">
                      <button
                        type="button"
                        disabled={safeCurrentIndex === 0}
                        onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors flex items-center gap-1.5"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Sebelumnya</span>
                        <kbd className="font-mono text-[10px]">←</kbd>
                      </button>

                      <div className="hidden sm:block text-[11px] text-slate-400 italic">
                        Di HP: Swipe Kanan = OKE • Swipe Kiri = Reject • Swipe Atas = Cadangan
                      </div>

                      <button
                        type="button"
                        disabled={safeCurrentIndex >= pendingQueue.length - 1}
                        onClick={() => setCurrentIndex(prev => Math.min(pendingQueue.length - 1, prev + 1))}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors flex items-center gap-1.5"
                      >
                        <span>Lewati</span>
                        <kbd className="font-mono text-[10px]">→</kbd>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Empty Queue State */
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-4 shadow-sm">
                  <div className="w-16 h-16 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto text-2xl font-black">
                    🎉
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">
                      Semua Antrean Kurasi Selesai!
                    </h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      Tidak ada lagi creator yang berstatus pending dengan filter saat ini. Anda bisa memeriksa tab tinjau ulang atau mengimpor data creator baru.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSourceFilter('ALL');
                        setPlatformFilter('ALL');
                        setPhoneFilter('ALL');
                        setAssigneeFilter('ALL');
                      }}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
                    >
                      Reset Filter Antrean
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('review')}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                    >
                      Buka Tab Tinjau Ulang
                    </button>
                  </div>
                </div>
              )}

              {/* Next in Queue Preview (Prefetch visualization) */}
              {nextPrefetched.length > 0 && (
                <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs space-y-2">
                  <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider block">
                    Antrean Berikutnya (Siap Diproses):
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {nextPrefetched.map((nc, idx) => (
                      <span 
                        key={nc.id}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-mono"
                      >
                        #{safeCurrentIndex + idx + 2} @{cleanUsername(nc.username)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* AREA 2: PANEL REFERENSI KRITERIA & KUOTA LIVE (5 Cols) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Live Quota Progress */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    <span>Kuota Kategori Real-Time</span>
                  </h3>
                  <span className="text-[11px] font-mono font-bold text-teal-600 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-lg">
                    Target {campaign.target_affiliates}
                  </span>
                </div>

                <div className="space-y-3.5">
                  {/* Kat A */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-teal-700 dark:text-teal-300">
                        Kat A: Dew Bright Toner
                      </span>
                      <span className={`font-mono font-bold ${categoryQuota.A.isFull ? 'text-rose-600' : (categoryQuota.A.isNearFull ? 'text-amber-600' : 'text-slate-600 dark:text-slate-300')}`}>
                        {categoryQuota.A.current} / {categoryQuota.A.target} ({categoryQuota.A.percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          categoryQuota.A.isFull ? 'bg-rose-500' : (categoryQuota.A.isNearFull ? 'bg-amber-500' : 'bg-teal-500')
                        }`}
                        style={{ width: `${Math.min(100, categoryQuota.A.percent)}%` }}
                      />
                    </div>
                  </div>

                  {/* Kat B */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-indigo-700 dark:text-indigo-300">
                        Kat B: Bright Milky Lotion
                      </span>
                      <span className={`font-mono font-bold ${categoryQuota.B.isFull ? 'text-rose-600' : (categoryQuota.B.isNearFull ? 'text-amber-600' : 'text-slate-600 dark:text-slate-300')}`}>
                        {categoryQuota.B.current} / {categoryQuota.B.target} ({categoryQuota.B.percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          categoryQuota.B.isFull ? 'bg-rose-500' : (categoryQuota.B.isNearFull ? 'bg-amber-500' : 'bg-indigo-500')
                        }`}
                        style={{ width: `${Math.min(100, categoryQuota.B.percent)}%` }}
                      />
                    </div>
                  </div>

                  {/* Kat C */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-700 dark:text-amber-300">
                        Kat C: Milky Dew Cleanser
                      </span>
                      <span className={`font-mono font-bold ${categoryQuota.C.isFull ? 'text-rose-600' : (categoryQuota.C.isNearFull ? 'text-amber-600' : 'text-slate-600 dark:text-slate-300')}`}>
                        {categoryQuota.C.current} / {categoryQuota.C.target} ({categoryQuota.C.percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          categoryQuota.C.isFull ? 'bg-rose-500' : (categoryQuota.C.isNearFull ? 'bg-amber-500' : 'bg-amber-500')
                        }`}
                        style={{ width: `${Math.min(100, categoryQuota.C.percent)}%` }}
                      />
                    </div>
                  </div>

                  {/* Kat D */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-rose-700 dark:text-rose-300">
                        Kat D: Toner + Lotion Duo
                      </span>
                      <span className={`font-mono font-bold ${categoryQuota.D.isFull ? 'text-rose-600' : (categoryQuota.D.isNearFull ? 'text-amber-600' : 'text-slate-600 dark:text-slate-300')}`}>
                        {categoryQuota.D.current} / {categoryQuota.D.target} ({categoryQuota.D.percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          categoryQuota.D.isFull ? 'bg-rose-500' : (categoryQuota.D.isNearFull ? 'bg-amber-500' : 'bg-rose-500')
                        }`}
                        style={{ width: `${Math.min(100, categoryQuota.D.percent)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Syarat Minimal & Profil Kategori Sesuai Brief */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Info className="w-4 h-4 text-teal-600" />
                  <span>Kriteria Profil Creator Ideal</span>
                </h3>

                {/* Important Requirement Note */}
                <div className="p-3.5 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900 text-xs text-teal-950 dark:text-teal-200 leading-relaxed">
                  <p className="font-bold">⚠️ Syarat Mutlak:</p>
                  <p className="text-[11px] mt-0.5 text-teal-800 dark:text-teal-300">
                    Prioritaskan creator dengan tier minimal <strong>Micro berdasarkan GMV (min. IDR 1.000.000)</strong>, bukan sekadar jumlah followers. Pastikan akun aktif posting video skincare.
                  </p>
                </div>

                {/* Profiles per category */}
                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                    <span className="font-bold text-teal-700 dark:text-teal-300 block mb-0.5">
                      Kat A — Dew Bright Toner (35 Kuota)
                    </span>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Skincare reviewer, creator dengan tipe kulit oily / dehydrated / dull-skin, atau ingredient/content-led KOC yang suka edukasi formula.
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                    <span className="font-bold text-indigo-700 dark:text-indigo-300 block mb-0.5">
                      Kat B — Bright Milky Lotion (25 Kuota)
                    </span>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Beauty & lifestyle creator, konten GRWM, makeup-prep, atau konten fokus ke hidrasi dan skin barrier glowing.
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                    <span className="font-bold text-amber-700 dark:text-amber-300 block mb-0.5">
                      Kat C — Milky Dew Cleanser (15 Kuota)
                    </span>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Oily / acne-prone skin, beginner skincare, atau konten male grooming & simple daily routine.
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                    <span className="font-bold text-rose-700 dark:text-rose-300 block mb-0.5">
                      Kat D — Toner + Lotion Duo (25 Kuota)
                    </span>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Affiliate / KOC terkuat dengan konversi terbukti (proven high GMV) dan mampu menjelaskan sinergi routine duo produk.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* VIEW MODE 2: REVIEW TABLE (TAB TINJAU ULANG) */}
      {viewMode === 'review' && (
        <div className="space-y-5">
          {/* Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => { setReviewTab('oke'); setReviewSelectedIds(new Set()); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  reviewTab === 'oke'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>OKE ({tabCounts.oke})</span>
              </button>

              <button
                type="button"
                onClick={() => { setReviewTab('second_option'); setReviewSelectedIds(new Set()); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  reviewTab === 'second_option'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Second Option ({tabCounts.second_option})</span>
              </button>

              <button
                type="button"
                onClick={() => { setReviewTab('reject'); setReviewSelectedIds(new Set()); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  reviewTab === 'reject'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject ({tabCounts.reject})</span>
              </button>

              <button
                type="button"
                onClick={() => { setReviewTab('pending'); setReviewSelectedIds(new Set()); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  reviewTab === 'pending'
                    ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                <span>Belum Dikurasi ({tabCounts.pending})</span>
              </button>
            </div>
          </div>

          {/* Smart Suggestion Alert if any category is deficit */}
          {reviewTab === 'second_option' && (
            <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 text-xs text-indigo-950 dark:text-indigo-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">💡</span>
                <div>
                  <p className="font-bold">Asisten Kuota Cepat:</p>
                  <p className="text-[11px] text-indigo-700 dark:text-indigo-300">
                    Sisa kebutuhan: Kat A ({categoryQuota.A.remaining}) • Kat B ({categoryQuota.B.remaining}) • Kat C ({categoryQuota.C.remaining}) • Kat D ({categoryQuota.D.remaining}).
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-semibold bg-white dark:bg-indigo-900/60 px-2.5 py-1 rounded-lg">
                Pilih creator lalu klik tombol &ldquo;Promosikan ke OKE&rdquo; di bawah
              </span>
            </div>
          )}

          {/* Search, Filter, and Bulk Actions Toolbar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={reviewCategoryFilter}
                onChange={e => setReviewCategoryFilter(e.target.value)}
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
                  placeholder="Cari username, catatan, no WA..."
                  value={reviewSearchQuery}
                  onChange={e => setReviewSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none"
                />
              </div>
            </div>

            {/* Bulk Action Controls */}
            {reviewSelectedIds.size > 0 && (
              <div className="flex flex-wrap items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 animate-in fade-in">
                <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                  {reviewSelectedIds.size} dipilih:
                </span>

                {/* Bulk Promote to OKE */}
                {reviewTab !== 'oke' && (
                  <button
                    type="button"
                    onClick={() => {
                      batchUpdateCuration(Array.from(reviewSelectedIds), 'oke');
                      setReviewSelectedIds(new Set());
                    }}
                    className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold text-[11px] transition-colors"
                  >
                    Jadikan OKE
                  </button>
                )}

                {/* Bulk Set Category */}
                <select
                  onChange={e => {
                    if (e.target.value) {
                      batchUpdateCuration(Array.from(reviewSelectedIds), reviewTab as CurationStatus, e.target.value as Category);
                      setReviewSelectedIds(new Set());
                    }
                  }}
                  defaultValue=""
                  className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 outline-none"
                >
                  <option value="" disabled>Set Kategori...</option>
                  <option value="A">Set Kat A</option>
                  <option value="B">Set Kat B</option>
                  <option value="C">Set Kat C</option>
                  <option value="D">Set Kat D</option>
                </select>

                {/* Bulk Second Option */}
                {reviewTab !== 'second_option' && (
                  <button
                    type="button"
                    onClick={() => {
                      batchUpdateCuration(Array.from(reviewSelectedIds), 'second_option');
                      setReviewSelectedIds(new Set());
                    }}
                    className="px-2.5 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 rounded-lg font-semibold text-[11px] border border-indigo-200 transition-colors"
                  >
                    Ke Second Option
                  </button>
                )}

                {/* Bulk Reject */}
                {reviewTab !== 'reject' && (
                  <button
                    type="button"
                    onClick={() => {
                      batchUpdateCuration(Array.from(reviewSelectedIds), 'reject');
                      setReviewSelectedIds(new Set());
                    }}
                    className="px-2 py-1 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 rounded-lg font-semibold text-[11px] border border-rose-200 transition-colors"
                  >
                    Reject
                  </button>
                )}

                {/* Bulk Return to Pending */}
                {reviewTab !== 'pending' && (
                  <button
                    type="button"
                    onClick={() => {
                      batchUpdateCuration(Array.from(reviewSelectedIds), 'pending');
                      setReviewSelectedIds(new Set());
                    }}
                    className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-700 dark:text-slate-200 rounded-lg font-semibold text-[11px] transition-colors"
                  >
                    Kembalikan ke Pending
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Virtualized Review Table */}
          <VirtualTable
            items={filteredReviewList}
            rowHeight={58}
            containerHeight={600}
            renderHeader={() => (
              <tr>
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={filteredReviewList.length > 0 && reviewSelectedIds.size === filteredReviewList.length}
                    onChange={() => {
                      if (reviewSelectedIds.size === filteredReviewList.length) {
                        setReviewSelectedIds(new Set());
                      } else {
                        setReviewSelectedIds(new Set(filteredReviewList.map(c => c.id)));
                      }
                    }}
                    className="rounded text-teal-600 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4">Creator</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">WhatsApp</th>
                <th className="py-3 px-4">Sumber</th>
                <th className="py-3 px-4">Catatan</th>
                <th className="py-3 px-4 text-right">Tindakan Cepat</th>
              </tr>
            )}
            renderRow={(c, idx) => {
              const isChecked = reviewSelectedIds.has(c.id);
              return (
                <tr 
                  key={c.id} 
                  className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                    isChecked ? 'bg-teal-50/40 dark:bg-teal-950/20' : ''
                  }`}
                >
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        setReviewSelectedIds(prev => {
                          const n = new Set(prev);
                          if (n.has(c.id)) n.delete(c.id); else n.add(c.id);
                          return n;
                        });
                      }}
                      className="rounded text-teal-600 cursor-pointer"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>@{cleanUsername(c.username)}</span>
                      <a
                        href={`https://www.tiktok.com/@${cleanUsername(c.username)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-teal-600"
                        title="Buka TikTok"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    {c.display_name && c.display_name !== c.username && (
                      <div className="text-[11px] text-slate-400">{c.display_name}</div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <CategoryBadge category={c.category} />
                  </td>
                  <td className="py-3 px-4">
                    <PhoneBadge status={c.phone_status} phone={c.phone_e164 || c.phone_raw} />
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                    {c.source || '-'}
                  </td>
                  <td className="py-3 px-4 text-slate-500 max-w-xs truncate text-[11px]">
                    {c.notes || '-'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {reviewTab !== 'oke' && (
                        <button
                          type="button"
                          onClick={() => updateCuration(c.id, 'oke', 'A')}
                          className="px-2 py-1 rounded bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 font-semibold text-[11px] hover:bg-teal-100 transition-colors"
                        >
                          → OKE (Kat A)
                        </button>
                      )}
                      {reviewTab !== 'second_option' && (
                        <button
                          type="button"
                          onClick={() => updateCuration(c.id, 'second_option')}
                          className="px-2 py-1 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold text-[11px] hover:bg-indigo-100 transition-colors"
                        >
                          → Cadangan
                        </button>
                      )}
                      {reviewTab !== 'reject' && (
                        <button
                          type="button"
                          onClick={() => updateCuration(c.id, 'reject')}
                          className="px-2 py-1 rounded bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-semibold text-[11px] hover:bg-rose-100 transition-colors"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            }}
          />
        </div>
      )}

      {/* REJECT MODAL (Quick Numeric Reason Selection 1-6) */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <XCircle className="w-5 h-5" />
                <h3 className="font-black text-sm text-slate-900 dark:text-white">
                  Tolak Creator: @{currentCreator ? cleanUsername(currentCreator.username) : ''}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Pilih alasan penolakan cepat dengan menekan angka <strong>1 - 6</strong> atau klik salah satu di bawah:
            </p>

            <div className="space-y-2">
              {REJECT_REASONS.map(r => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => handleDecide('reject', undefined, r.label)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-800 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 text-left text-xs font-medium text-slate-700 dark:text-slate-200 transition-all flex items-center justify-between group"
                >
                  <span>{r.label}</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px] font-bold text-slate-500 group-hover:text-rose-600">
                    {r.key}
                  </kbd>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-[11px] text-slate-400 font-mono">Escape untuk batal</span>
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUOTA FULL CONFIRMATION MODAL */}
      {quotaConfirmCategory && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-amber-200 dark:border-amber-800 p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-amber-600">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <h3 className="font-black text-sm text-slate-900 dark:text-white">
                Kuota Kategori {quotaConfirmCategory} Sudah Penuh
              </h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Target untuk Kategori {quotaConfirmCategory} ({categoryQuota[quotaConfirmCategory]?.target}) sudah tercapai ({categoryQuota[quotaConfirmCategory]?.current}).
              Apakah Anda tetap ingin menambahkan creator ini ke Kategori {quotaConfirmCategory}?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setQuotaConfirmCategory(null)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const cat = quotaConfirmCategory;
                  setQuotaConfirmCategory(null);
                  handleDecide('oke', cat);
                }}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md"
              >
                Tetap Jadikan Kategori {quotaConfirmCategory}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KEYBOARD SHORTCUTS HELP MODAL (?) */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-teal-600">
                <HelpCircle className="w-5 h-5" />
                <h3 className="font-black text-sm text-slate-900 dark:text-white">
                  Pintasan Keyboard Mode Kurasi
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span className="font-medium text-slate-700 dark:text-slate-300">OKE — Kategori A (Dew Bright Toner)</span>
                <kbd className="px-2 py-0.5 rounded bg-white dark:bg-slate-700 font-mono font-bold shadow-xs border">1</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span className="font-medium text-slate-700 dark:text-slate-300">OKE — Kategori B (Bright Milky Lotion)</span>
                <kbd className="px-2 py-0.5 rounded bg-white dark:bg-slate-700 font-mono font-bold shadow-xs border">2</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span className="font-medium text-slate-700 dark:text-slate-300">OKE — Kategori C (Milky Dew Cleanser)</span>
                <kbd className="px-2 py-0.5 rounded bg-white dark:bg-slate-700 font-mono font-bold shadow-xs border">3</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span className="font-medium text-slate-700 dark:text-slate-300">OKE — Kategori D (Toner + Lotion Duo)</span>
                <kbd className="px-2 py-0.5 rounded bg-white dark:bg-slate-700 font-mono font-bold shadow-xs border">4</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span className="font-medium text-slate-700 dark:text-slate-300">Second Option / Cadangan</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 font-mono font-bold shadow-xs border">5</kbd>
                  <span>/</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 font-mono font-bold shadow-xs border">Space</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span className="font-medium text-slate-700 dark:text-slate-300">Reject (Buka pilihan alasan 1-6)</span>
                <kbd className="px-2 py-0.5 rounded bg-white dark:bg-slate-700 font-mono font-bold shadow-xs border">X</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span className="font-medium text-slate-700 dark:text-slate-300">Undo keputusan terakhir</span>
                <kbd className="px-2 py-0.5 rounded bg-white dark:bg-slate-700 font-mono font-bold shadow-xs border">Z</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span className="font-medium text-slate-700 dark:text-slate-300">Buka profil TikTok di jendela kanan</span>
                <kbd className="px-2 py-0.5 rounded bg-white dark:bg-slate-700 font-mono font-bold shadow-xs border">T</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span className="font-medium text-slate-700 dark:text-slate-300">Navigasi tanpa memutuskan</span>
                <kbd className="px-2 py-0.5 rounded bg-white dark:bg-slate-700 font-mono font-bold shadow-xs border">← / →</kbd>
              </div>
            </div>

            <div className="text-right pt-2">
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(false)}
                className="px-4 py-2 bg-teal-600 text-white rounded-xl font-bold text-xs shadow-md"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
