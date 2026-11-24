'use client';

import React, { useState } from 'react';
import { useAffiliate } from '@/lib/store/useAffiliateStore';
import { Category } from '@/types';
import { 
  Settings, 
  Save, 
  Calendar, 
  ShoppingBag, 
  Truck, 
  Clock, 
  Code,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { config, updateConfig, campaign, updateCampaign } = useAffiliate();

  // Local state for app config
  const [shopUrl, setShopUrl] = useState(config.shop_url);
  const [formUrl, setFormUrl] = useState(config.form_url);
  const [commissionRate, setCommissionRate] = useState(config.commission_rate);
  const [postingDeadline, setPostingDeadline] = useState(config.posting_deadline);
  const [productLinks, setProductLinks] = useState(config.product_links);
  const [defaultCourier, setDefaultCourier] = useState(config.default_courier || '');
  const [enableSafetyDelay, setEnableSafetyDelay] = useState(config.enable_safety_delay !== false);
  const [safetyDelaySeconds, setSafetyDelaySeconds] = useState(config.safety_delay_seconds || 3);

  // Local state for campaign targets
  const [campaignName, setCampaignName] = useState(campaign.name);
  const [targetAffiliates, setTargetAffiliates] = useState(campaign.target_affiliates);
  const [targetSamples, setTargetSamples] = useState(campaign.target_samples);
  const [quotaA, setQuotaA] = useState(campaign.quota_a);
  const [quotaB, setQuotaB] = useState(campaign.quota_b);
  const [quotaC, setQuotaC] = useState(campaign.quota_c);
  const [quotaD, setQuotaD] = useState(campaign.quota_d);

  const handleSaveAll = () => {
    updateConfig({
      shop_url: shopUrl,
      form_url: formUrl,
      commission_rate: commissionRate,
      posting_deadline: postingDeadline,
      product_links: productLinks,
      default_courier: defaultCourier,
      enable_safety_delay: enableSafetyDelay,
      safety_delay_seconds: Number(safetyDelaySeconds),
    });

    updateCampaign({
      name: campaignName,
      target_affiliates: Number(targetAffiliates),
      target_samples: Number(targetSamples),
      quota_a: Number(quotaA),
      quota_b: Number(quotaB),
      quota_c: Number(quotaC),
      quota_d: Number(quotaD),
    });

    toast.success('Semua konfigurasi berhasil disimpan!');
  };

  const totalQuota = Number(quotaA) + Number(quotaB) + Number(quotaC) + Number(quotaD);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            Pengaturan & Target Kampanye
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Semua parameter, link produk per kategori, kuota, kurir default, countdown jeda aman, dan deadline dapat disesuaikan di sini.
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-500/20 transition-all flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>Simpan Perubahan</span>
        </button>
      </div>

      {/* Target & Kuota Kampanye */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-600" />
              Target & Alokasi Kuota Affiliate
            </h3>
            <span className="text-xs text-slate-400">Total target dan pembagian kuota per kategori produk</span>
          </div>

          <span className={`text-xs font-bold px-3 py-1 rounded-full ${totalQuota === 100 ? 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300' : 'bg-amber-100 text-amber-800'}`}>
            Total Kuota: {totalQuota} / 100
          </span>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
              Nama Periode / Campaign
            </label>
            <input
              type="text"
              value={campaignName}
              onChange={e => setCampaignName(e.target.value)}
              className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
              Target Affiliate Selesai
            </label>
            <input
              type="number"
              value={targetAffiliates}
              onChange={e => setTargetAffiliates(Number(e.target.value))}
              className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
              Target Sample Dikirim
            </label>
            <input
              type="number"
              value={targetSamples}
              onChange={e => setTargetSamples(Number(e.target.value))}
              className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
            />
          </div>
        </div>

        {/* Quota inputs per category */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900/60">
            <span className="text-[11px] font-bold text-teal-800 dark:text-teal-300 block">Kategori A (Toner)</span>
            <input
              type="number"
              value={quotaA}
              onChange={e => setQuotaA(Number(e.target.value))}
              className="w-full mt-1.5 text-lg font-black bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-teal-300 dark:border-teal-700 text-slate-800 dark:text-slate-100 outline-none"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60">
            <span className="text-[11px] font-bold text-indigo-800 dark:text-indigo-300 block">Kategori B (Lotion)</span>
            <input
              type="number"
              value={quotaB}
              onChange={e => setQuotaB(Number(e.target.value))}
              className="w-full mt-1.5 text-lg font-black bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-indigo-300 dark:border-indigo-700 text-slate-800 dark:text-slate-100 outline-none"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60">
            <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 block">Kategori C (Cleanser)</span>
            <input
              type="number"
              value={quotaC}
              onChange={e => setQuotaC(Number(e.target.value))}
              className="w-full mt-1.5 text-lg font-black bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-700 text-slate-800 dark:text-slate-100 outline-none"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60">
            <span className="text-[11px] font-bold text-rose-800 dark:text-rose-300 block">Kategori D (Duo)</span>
            <input
              type="number"
              value={quotaD}
              onChange={e => setQuotaD(Number(e.target.value))}
              className="w-full mt-1.5 text-lg font-black bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-rose-300 dark:border-rose-700 text-slate-800 dark:text-slate-100 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Operasional: Kurir & Jeda Aman Anti-Banned */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Truck className="w-4 h-4 text-teal-600" />
            Pengaturan Ekspedisi & Jeda Aman WhatsApp
          </h3>
          <span className="text-xs text-slate-400">Pilihan kurir default pengiriman sample dan opsi jeda countdown antar pesan</span>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {/* Kurir default */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Kurir Ekspedisi Default untuk Resi
            </label>
            <select
              value={defaultCourier}
              onChange={e => setDefaultCourier(e.target.value)}
              className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
            >
              <option value="">(Kosongkan / Isi Manual per Pengiriman)</option>
              <option value="J&T">J&T</option>
              <option value="JNE">JNE</option>
              <option value="SiCepat">SiCepat</option>
              <option value="Shopee Express">Shopee Express</option>
              <option value="Lainnya">Lainnya</option>
            </select>
            <span className="text-[11px] text-slate-400 block">
              Nilai ini mengisi variabel <code>{'{{kurir}}'}</code> pada template konfirmasi resi WhatsApp.
            </span>
          </div>

          {/* Jeda countdown aman */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Countdown Jeda Aman (Anti-Banned WA)
            </label>
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableSafetyDelay}
                  onChange={e => setEnableSafetyDelay(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
              </label>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {enableSafetyDelay ? 'Jeda Aktif' : 'Jeda Dimatikan'}
              </span>
            </div>

            {enableSafetyDelay && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-slate-500">Durasi:</span>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={safetyDelaySeconds}
                  onChange={e => setSafetyDelaySeconds(Number(e.target.value))}
                  className="w-16 px-2.5 py-1 text-xs font-bold text-center border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800"
                />
                <span className="text-xs text-slate-500">detik antar pesan</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* WhatsApp Template Parameters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-teal-600" />
            Parameter Variabel Pesan WhatsApp
          </h3>
          <span className="text-xs text-slate-400">Link toko, link registrasi sample, batas tanggal posting, dan komisi</span>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
              Link Toko TikTok (vt.tiktok.com)
            </label>
            <input
              type="text"
              value={shopUrl}
              onChange={e => setShopUrl(e.target.value)}
              className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
              Link Form Registrasi Google Forms
            </label>
            <input
              type="text"
              value={formUrl}
              onChange={e => setFormUrl(e.target.value)}
              className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
              Deadline Posting Creator
            </label>
            <input
              type="text"
              value={postingDeadline}
              onChange={e => setPostingDeadline(e.target.value)}
              className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
              Tingkat Komisi
            </label>
            <input
              type="text"
              value={commissionRate}
              onChange={e => setCommissionRate(e.target.value)}
              className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
            />
          </div>
        </div>

        {/* Product links per category */}
        <div className="space-y-3 pt-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
            Link Produk Free Sample per Kategori:
          </label>
          <div className="space-y-2">
            {(['A', 'B', 'C', 'D'] as Category[]).map(cat => (
              <div key={cat} className="flex items-center gap-3">
                <span className="w-24 text-xs font-bold text-slate-500">Kategori {cat}:</span>
                <input
                  type="text"
                  value={productLinks[cat] || ''}
                  onChange={e => setProductLinks(prev => ({ ...prev, [cat]: e.target.value }))}
                  className="flex-1 text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none font-mono"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chrome Extension API Key Documentation */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Code className="w-4 h-4 text-teal-600" />
              Integrasi Chrome Extension Kurasi
            </h3>
            <span className="text-xs text-slate-400">Endpoint REST API untuk mengirim hasil kurasi langsung dari extension</span>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck className="w-3.5 h-3.5" />
            Amankan via CURATION_API_KEY (.env)
          </span>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Kunci API kurasi dikonfigurasi secara aman di server melalui environment variable <code>CURATION_API_KEY</code> di file <code>.env.local</code> / Vercel dashboard. Tidak ada API key yang di-hardcode di sisi browser demi keamanan.
        </p>

        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-mono space-y-2">
          <div className="text-teal-600 dark:text-teal-400 font-bold">POST /api/curation</div>
          <div className="text-slate-600 dark:text-slate-300 whitespace-pre">
{`// Header:
x-api-key: <KUNCI_API_ANDA_DARI_ENV>
Content-Type: application/json

// Payload contoh:
{
  "username": "skincarebyrani",
  "decision": "oke",             // "oke" | "second_option" | "reject"
  "category": "A",               // "A" | "B" | "C" | "D"
  "source": "Extension",
  "platform": "TikTok",
  "notes": "Engagement tinggi, cocok untuk Dew Bright Toner"
}`}
          </div>
        </div>
      </div>
    </div>
  );
}
