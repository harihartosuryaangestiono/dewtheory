'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useAffiliate } from '@/lib/store/useAffiliateStore';
import { CategoryBadge, StatusBadge } from '@/components/common/Badge';
import { 
  Users, 
  Send, 
  Package, 
  Video, 
  Calendar, 
  Clock, 
  Flame, 
  AlertTriangle, 
  Sparkles, 
  ArrowUpRight, 
  TrendingUp,
  CheckCircle2,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export default function DashboardPage() {
  const { campaign, creators, shipments, sows, currentUser } = useAffiliate();

  // 1. Quota progress per category
  const quotaStats = useMemo(() => {
    const compute = (cat: 'A' | 'B' | 'C' | 'D', target: number) => {
      const catCreators = creators.filter(c => c.category === cat);
      const joined = catCreators.filter(c => ['join', 'form_filled', 'sample_sent', 'sow_1', 'sow_2', 'completed'].includes(c.pipeline_status)).length;
      const contacted = catCreators.filter(c => ['contacted', 'replied'].includes(c.pipeline_status)).length;
      const percent = Math.min(100, Math.round((joined / target) * 100));
      return { joined, contacted, target, percent };
    };

    return {
      A: compute('A', campaign.quota_a),
      B: compute('B', campaign.quota_b),
      C: compute('C', campaign.quota_c),
      D: compute('D', campaign.quota_d),
    };
  }, [creators, campaign]);

  const totalJoined = quotaStats.A.joined + quotaStats.B.joined + quotaStats.C.joined + quotaStats.D.joined;
  const overallTargetPercent = Math.min(100, Math.round((totalJoined / campaign.target_affiliates) * 100));

  // 2. Conversion Funnel stats
  const funnel = useMemo(() => {
    const totalPool = creators.length;
    const totalOke = creators.filter(c => c.curation_status === 'oke').length;
    const totalContacted = creators.filter(c => ['contacted', 'replied', 'join', 'form_filled', 'sample_sent', 'sow_1', 'sow_2', 'completed'].includes(c.pipeline_status)).length;
    const totalReplied = creators.filter(c => ['replied', 'join', 'form_filled', 'sample_sent', 'sow_1', 'sow_2', 'completed'].includes(c.pipeline_status)).length;
    const totalJoin = creators.filter(c => ['join', 'form_filled', 'sample_sent', 'sow_1', 'sow_2', 'completed'].includes(c.pipeline_status)).length;
    const totalSampleSent = shipments.filter(s => s.status === 'sent' || s.status === 'delivered').length;
    const totalPosted = sows.filter(s => s.status === 'verified').length;

    return [
      { label: '1. Pool Creator', count: totalPool, percent: totalPool > 0 ? 100 : 0 },
      { label: '2. Terkurasi OKE', count: totalOke, percent: totalPool ? Math.round((totalOke / totalPool) * 100) : 0 },
      { label: '3. Contacted WA', count: totalContacted, percent: totalOke ? Math.round((totalContacted / totalOke) * 100) : 0 },
      { label: '4. Replied / Balas', count: totalReplied, percent: totalContacted ? Math.round((totalReplied / totalContacted) * 100) : 0 },
      { label: '5. Join & Form', count: totalJoin, percent: totalReplied ? Math.round((totalJoin / totalReplied) * 100) : 0 },
      { label: '6. Sample Terkirim', count: totalSampleSent, percent: totalJoin ? Math.round((totalSampleSent / totalJoin) * 100) : 0 },
      { label: '7. Video Posted', count: totalPosted, percent: totalSampleSent ? Math.round((totalPosted / totalSampleSent) * 100) : 0 },
    ];
  }, [creators, shipments, sows]);

  // 3. User performance stats (Dinda vs Surya)
  const userStats = useMemo(() => {
    const dindaSent = creators.filter(c => c.contacted_by === 'Dinda').length;
    const dindaJoin = creators.filter(c => c.contacted_by === 'Dinda' && ['join', 'form_filled', 'sample_sent', 'sow_1', 'sow_2'].includes(c.pipeline_status)).length;

    const suryaSent = creators.filter(c => c.contacted_by === 'Surya').length;
    const suryaJoin = creators.filter(c => c.contacted_by === 'Surya' && ['join', 'form_filled', 'sample_sent', 'sow_1', 'sow_2'].includes(c.pipeline_status)).length;

    return {
      Dinda: { sent: dindaSent, join: dindaJoin, convRate: dindaSent ? Math.round((dindaJoin / dindaSent) * 100) : 0 },
      Surya: { sent: suryaSent, join: suryaJoin, convRate: suryaSent ? Math.round((suryaJoin / suryaSent) * 100) : 0 },
    };
  }, [creators]);

  // 4. Smart Alerts
  const smartAlerts = useMemo(() => {
    const alerts: { type: 'warning' | 'info' | 'danger'; title: string; desc: string; link: string; action: string }[] = [];

    // Check quota alert
    if (quotaStats.C.joined < campaign.quota_c * 0.4) {
      alerts.push({
        type: 'warning',
        title: 'Kuota Kategori C (Cleanser) Masih Rendah',
        desc: `Baru ${quotaStats.C.joined} dari ${campaign.quota_c} creator Join. Promosikan second option cadangan untuk Kategori C.`,
        link: '/curation',
        action: 'Buka Kurasi Cadangan',
      });
    }

    // Check pending samples
    const pendingSamples = shipments.filter(s => s.status === 'pending');
    if (pendingSamples.length > 0) {
      alerts.push({
        type: 'info',
        title: `${pendingSamples.length} Sample Menunggu Dikirim`,
        desc: 'Creator sudah mengisi form registrasi dan menunggu nomor resi pengiriman.',
        link: '/samples',
        action: 'Kirim Resi Sample',
      });
    }

    // Uncontacted OKE creators
    const uncontacted = creators.filter(c => c.curation_status === 'oke' && c.pipeline_status === 'curated' && c.phone_status === 'valid');
    if (uncontacted.length > 0) {
      alerts.push({
        type: 'info',
        title: `${uncontacted.length} Creator OKE Siap Dikontak Hari Ini`,
        desc: 'Buka Focus Mode untuk mengirim pesan WhatsApp dengan target < 10 detik per creator.',
        link: '/outreach',
        action: 'Mulai Outreach WA',
      });
    }

    return alerts;
  }, [quotaStats, campaign, shipments, creators]);

  // 5. Timeline countdown
  const postingDeadlineDate = new Date('2026-12-15');
  const now = new Date();
  const daysUntilDeadline = Math.ceil((postingDeadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Welcome Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-gradient-to-r from-teal-800 to-teal-900 text-white p-7 rounded-3xl shadow-xl shadow-teal-950/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-teal-500/20 to-transparent pointer-events-none" />
        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-700/60 text-teal-200 text-xs font-semibold backdrop-blur-sm mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Dew Theory Skincare • Kampanye Desember 2026</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Semangat Pagi, {currentUser.name}! ✨
          </h1>
          <p className="text-xs text-teal-200 max-w-xl">
            Target periode ini adalah <strong>100 affiliate</strong> & <strong>100 sample</strong> dengan alokasi kuota 35 Toner / 25 Lotion / 15 Cleanser / 25 Duo.
          </p>
        </div>

        {/* Big Countdown Widget */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center gap-4 relative z-10">
          <div className="text-center">
            <span className="text-[10px] uppercase font-bold text-teal-200 block">Batas Posting SOW</span>
            <span className="text-2xl font-black text-white">{daysUntilDeadline > 0 ? `${daysUntilDeadline} Hari` : 'Hari Ini'}</span>
            <span className="text-[10px] text-teal-300 block">15 Desember 2026</span>
          </div>
          <Link
            href="/outreach"
            className="px-4 py-2.5 bg-white text-teal-900 hover:bg-teal-50 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
          >
            Mulai Outreach
          </Link>
        </div>
      </div>

      {/* Quota Cards (35 / 25 / 15 / 25) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-600" />
              Progres Kuota per Kategori Produk
            </h2>
            <span className="text-xs text-slate-400">Total Join: {totalJoined} dari target {campaign.target_affiliates} affiliate ({overallTargetPercent}%)</span>
          </div>

          <div className="w-48 bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden hidden sm:block">
            <div
              className="bg-teal-600 h-full rounded-full transition-all duration-700"
              style={{ width: `${overallTargetPercent}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Kat A */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200">
                Kat A (35 Kuota)
              </span>
              <span className="text-xs font-bold text-teal-600">{quotaStats.A.percent}%</span>
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Dew Bright Toner</h3>
              <p className="text-[11px] text-slate-400">Reviewer kulit oily / dehidrasi / KOC</p>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-2xl font-black text-slate-900 dark:text-white">{quotaStats.A.joined}</span>
              <span className="text-xs text-slate-400">dari kuota {campaign.quota_a}</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-teal-500 h-full rounded-full" style={{ width: `${quotaStats.A.percent}%` }} />
            </div>
          </div>

          {/* Kat B */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200">
                Kat B (25 Kuota)
              </span>
              <span className="text-xs font-bold text-indigo-600">{quotaStats.B.percent}%</span>
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Bright Milky Lotion</h3>
              <p className="text-[11px] text-slate-400">GRWM, makeup-prep, hydration beauty</p>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-2xl font-black text-slate-900 dark:text-white">{quotaStats.B.joined}</span>
              <span className="text-xs text-slate-400">dari kuota {campaign.quota_b}</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${quotaStats.B.percent}%` }} />
            </div>
          </div>

          {/* Kat C */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200">
                Kat C (15 Kuota)
              </span>
              <span className="text-xs font-bold text-amber-600">{quotaStats.C.percent}%</span>
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Milky Dew Cleanser</h3>
              <p className="text-[11px] text-slate-400">Oily/acne, male grooming & lifestyle</p>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-2xl font-black text-slate-900 dark:text-white">{quotaStats.C.joined}</span>
              <span className="text-xs text-slate-400">dari kuota {campaign.quota_c}</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: `${quotaStats.C.percent}%` }} />
            </div>
          </div>

          {/* Kat D */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200">
                Kat D (25 Kuota)
              </span>
              <span className="text-xs font-bold text-rose-600">{quotaStats.D.percent}%</span>
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Toner + Lotion Duo</h3>
              <p className="text-[11px] text-slate-400">Affiliate terkuat, konversi terbukti</p>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-2xl font-black text-slate-900 dark:text-white">{quotaStats.D.joined}</span>
              <span className="text-xs text-slate-400">dari kuota {campaign.quota_d}</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-rose-500 h-full rounded-full" style={{ width: `${quotaStats.D.percent}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Conversion Funnel & User Stats Grid */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Funnel (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Funnel Konversi Affiliate</h3>
              <p className="text-xs text-slate-400">Alur progres dari database mentah hingga posting video SOW</p>
            </div>
            <span className="text-xs font-semibold text-teal-600 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 rounded-lg">
              Live Realtime
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {funnel.map((stage, idx) => (
              <div key={stage.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>{stage.label}</span>
                  <span>{stage.count} ({stage.percent}%)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-teal-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${stage.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Performance & Campaign Timeline (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* User Performance */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-600" />
              Performa Tim (Outreach & Konversi)
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-teal-900 dark:text-teal-200">Dinda</span>
                  <span className="text-[10px] bg-teal-200 dark:bg-teal-900 text-teal-800 dark:text-teal-300 font-bold px-1.5 py-0.5 rounded">
                    {userStats.Dinda.convRate}% Join
                  </span>
                </div>
                <p className="text-xl font-black text-slate-900 dark:text-white">{userStats.Dinda.sent} <span className="text-xs font-normal text-slate-400">WA</span></p>
                <p className="text-[11px] text-slate-500">{userStats.Dinda.join} creator setuju Join</p>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-indigo-900 dark:text-indigo-200">Surya</span>
                  <span className="text-[10px] bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-300 font-bold px-1.5 py-0.5 rounded">
                    {userStats.Surya.convRate}% Join
                  </span>
                </div>
                <p className="text-xl font-black text-slate-900 dark:text-white">{userStats.Surya.sent} <span className="text-xs font-normal text-slate-400">WA</span></p>
                <p className="text-[11px] text-slate-500">{userStats.Surya.join} creator setuju Join</p>
              </div>
            </div>
          </div>

          {/* Project Timeline & Milestones */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-600" />
              Timeline & Tahapan Kerja
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span className="font-medium text-slate-700 dark:text-slate-300">Listing & Kontak</span>
                <span className="text-[11px] font-mono text-slate-400">16 Nov – 22 Nov</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span className="font-medium text-slate-700 dark:text-slate-300">Seeding Sample</span>
                <span className="text-[11px] font-mono text-slate-400">16 Nov – 30 Nov</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900">
                <span className="font-bold text-teal-900 dark:text-teal-200">Collect SOW & Report</span>
                <span className="text-[11px] font-mono text-teal-700 dark:text-teal-300 font-bold">25 Nov – 25 Des (Aktif)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Smart Alerts */}
      {smartAlerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Alert & Tindakan Prioritas
          </h3>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {smartAlerts.map((a, i) => (
              <div
                key={i}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3 flex flex-col justify-between"
              >
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                    {a.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {a.desc}
                  </p>
                </div>

                <Link
                  href={a.link}
                  className="inline-flex items-center justify-between text-xs font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 pt-2 border-t border-slate-100 dark:border-slate-800"
                >
                  <span>{a.action}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
