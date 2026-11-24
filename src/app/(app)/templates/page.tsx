'use client';

import React, { useState } from 'react';
import { useAffiliate } from '@/lib/store/useAffiliateStore';
import { WhatsAppTemplate } from '@/types';
import { renderTemplate, getCreatorTemplateVariables } from '@/lib/utils/template';
import { CategoryBadge, PlatformBadge } from '@/components/common/Badge';
import { 
  MessageSquare, 
  Save, 
  Copy, 
  RotateCcw, 
  Eye, 
  Sparkles, 
  Variable,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

export default function TemplatesPage() {
  const { templates, updateTemplate, currentUser, config, creators } = useAffiliate();

  const [activeTemplateId, setActiveTemplateId] = useState<string>(templates[0]?.id || 'tiktok_a');
  const activeTemplate = templates.find(t => t.id === activeTemplateId) || templates[0];
  const [content, setContent] = useState<string>(activeTemplate?.content || '');

  // When switching active template
  const handleSelectTemplate = (t: WhatsAppTemplate) => {
    setActiveTemplateId(t.id);
    setContent(t.content);
  };

  // Sample creator for live preview
  const sampleCreator = creators[0] || {
    id: 'sample',
    campaign_id: 'desember-2026',
    username: 'nama_creator',
    display_name: 'Nama Creator',
    phone_raw: '08123456789',
    phone_e164: '628123456789',
    phone_status: 'valid',
    platform: 'TikTok',
    source: 'Outreach',
    category: (activeTemplate?.category as any) || 'A',
    curation_status: 'oke',
    pipeline_status: 'curated',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const previewVars = getCreatorTemplateVariables(sampleCreator, currentUser.name, config);
  const livePreview = renderTemplate(content, previewVars);

  const handleSave = () => {
    updateTemplate(activeTemplate.id, content);
  };

  const insertVariable = (varName: string) => {
    setContent(prev => prev + ` {{${varName}}}`);
    toast.info(`Variabel {{${varName}}} ditambahkan`);
  };

  const AVAILABLE_VARS = [
    { label: '{{nama}}', desc: 'Nama / Username Creator', key: 'nama' },
    { label: '{{pengirim}}', desc: 'Nama User Login (Dinda/Surya)', key: 'pengirim' },
    { label: '{{link_toko}}', desc: 'Link Toko TikTok / Shopee', key: 'link_toko' },
    { label: '{{deadline_posting}}', desc: 'Batas Posting (15 Desember)', key: 'deadline_posting' },
    { label: '{{komisi}}', desc: 'Persentase Komisi (8.5%)', key: 'komisi' },
    { label: '{{link_produk}}', desc: 'Link Produk Free Sample per Kategori', key: 'link_produk' },
    { label: '{{link_form}}', desc: 'Link Google Form Registrasi', key: 'link_form' },
    { label: '{{produk_sample}}', desc: 'Nama Produk Sample yang dikirim', key: 'produk_sample' },
    { label: '{{kurir}}', desc: 'Nama Ekspedisi (J&T)', key: 'kurir' },
    { label: '{{resi}}', desc: 'Nomor Resi Pengiriman', key: 'resi' },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
          <MessageSquare className="w-6 h-6 text-teal-600 dark:text-teal-400" />
          Template WhatsApp & Pesan
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Kelola pesan outreach, follow-up, resi pengiriman, dan reminder SOW. Variabel akan terisi otomatis saat membuka WhatsApp.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Template List Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-2">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block px-1">
            Daftar Template
          </span>

          <div className="space-y-1.5">
            {templates.map(t => {
              const isActive = t.id === activeTemplateId;
              return (
                <button
                  key={t.id}
                  onClick={() => handleSelectTemplate(t)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all flex flex-col gap-1 ${
                    isActive
                      ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-300 dark:border-teal-800 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${isActive ? 'text-teal-900 dark:text-teal-200' : 'text-slate-800 dark:text-slate-200'}`}>
                      {t.title}
                    </span>
                    <PlatformBadge platform={t.platform} />
                  </div>

                  <div className="flex items-center gap-1.5 mt-1">
                    {t.category && <CategoryBadge category={t.category} />}
                    <span className="text-[10px] text-slate-400 truncate">
                      {t.content.slice(0, 45)}...
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Template Editor & Preview (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Edit Template: {activeTemplate?.title}
                </h3>
                <span className="text-xs text-slate-400">
                  Semua perubahan akan otomatis digunakan di Focus Mode WhatsApp.
                </span>
              </div>

              <button
                onClick={handleSave}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-500/20 transition-all flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Template</span>
              </button>
            </div>

            {/* Variable Pills */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Variable className="w-3.5 h-3.5 text-teal-600" />
                Klik untuk menyisipkan variabel:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_VARS.map(v => (
                  <button
                    key={v.key}
                    onClick={() => insertVariable(v.key)}
                    className="px-2 py-1 bg-slate-100 hover:bg-teal-50 dark:bg-slate-800 dark:hover:bg-teal-950/40 text-slate-700 hover:text-teal-700 dark:text-slate-300 dark:hover:text-teal-300 rounded-lg text-[11px] font-mono border border-slate-200 dark:border-slate-700 transition-colors"
                    title={v.desc}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Isi Konten Pesan:
              </label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={12}
                className="w-full text-xs font-mono p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-teal-500 leading-relaxed"
              />
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-teal-600" />
                Live WhatsApp Preview (Contoh: @{sampleCreator.username}):
              </h4>
              <span className="text-[11px] text-slate-400">
                Pengirim: <strong>{currentUser.name}</strong>
              </span>
            </div>

            <div className="bg-[#efeae2] dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-end">
              <div className="bg-[#dcf8c6] dark:bg-teal-950/80 border border-teal-200 dark:border-teal-800/60 text-slate-800 dark:text-slate-100 p-4 rounded-2xl rounded-tr-none shadow-sm text-xs leading-relaxed whitespace-pre-line max-w-[90%]">
                {livePreview}
                <div className="text-[10px] text-slate-400 text-right mt-1.5 font-sans">
                  {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • Terkirim
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
