'use client';

import React from 'react';
import { Creator } from '@/types';
import { useAffiliate } from '@/lib/store/useAffiliateStore';
import { CategoryBadge, PhoneBadge, PlatformBadge, StatusBadge } from '../common/Badge';
import { VirtualTable } from '../common/VirtualTable';
import { 
  Send, 
  ExternalLink, 
  Lock
} from 'lucide-react';
import { buildWhatsAppLink, getCreatorTemplateVariables, renderTemplate } from '@/lib/utils/template';
import { toast } from 'sonner';

interface OutreachQueueTableProps {
  creators: Creator[];
  onSelectCreator: (id: string) => void;
}

export function OutreachQueueTable({ creators, onSelectCreator }: OutreachQueueTableProps) {
  const { currentUser, config, templates, markContacted } = useAffiliate();

  const handleQuickSend = (creator: Creator) => {
    if (creator.phone_status !== 'valid' || !creator.phone_e164) {
      toast.error('Nomor telepon tidak valid');
      return;
    }

    const cat = creator.category?.toLowerCase() || 'a';
    const tpl = templates.find(t => t.id === `tiktok_${cat}`) || templates[0];
    const vars = getCreatorTemplateVariables(creator, currentUser.name, config);
    const message = renderTemplate(tpl.content, vars);
    const link = buildWhatsAppLink(creator.phone_e164, message);

    window.open(link, '_blank', 'noopener,noreferrer');
    markContacted(creator.id, tpl.title, message);
    toast.success(`Pesan terkirim ke @${creator.username}`);
  };

  const renderHeader = () => (
    <tr>
      <th className="py-3.5 px-4">Creator / TikTok</th>
      <th className="py-3.5 px-4">Kategori & Produk</th>
      <th className="py-3.5 px-4">Platform</th>
      <th className="py-3.5 px-4">WhatsApp</th>
      <th className="py-3.5 px-4">Sumber</th>
      <th className="py-3.5 px-4">Penugasan</th>
      <th className="py-3.5 px-4">Status</th>
      <th className="py-3.5 px-4 text-right">Aksi</th>
    </tr>
  );

  const renderRow = (c: Creator) => {
    const isLocked = Boolean(
      c.locked_by && 
      c.locked_by !== currentUser.name && 
      c.locked_until && 
      new Date(c.locked_until) > new Date()
    );

    return (
      <tr 
        key={c.id} 
        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer h-[54px]"
        onClick={() => onSelectCreator(c.id)}
      >
        <td className="py-3 px-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 font-bold flex items-center justify-center text-xs">
              {c.username[0]?.toUpperCase()}
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                @{c.username}
                {isLocked && (
                  <span title={`Sedang dibuka oleh ${c.locked_by}`}>
                    <Lock className="w-3 h-3 text-rose-500" />
                  </span>
                )}
              </div>
              {c.display_name && c.display_name !== c.username && (
                <span className="text-[11px] text-slate-400 block -mt-0.5">
                  {c.display_name}
                </span>
              )}
            </div>
          </div>
        </td>

        <td className="py-3 px-4">
          <CategoryBadge category={c.category} showDesc />
        </td>

        <td className="py-3 px-4">
          <PlatformBadge platform={c.platform} />
        </td>

        <td className="py-3 px-4">
          <PhoneBadge 
            status={c.phone_status} 
            phone={c.phone_e164 ? `+${c.phone_e164}` : undefined} 
          />
        </td>

        <td className="py-3 px-4 font-medium text-slate-600 dark:text-slate-400">
          {c.source || '-'}
        </td>

        <td className="py-3 px-4">
          {c.assigned_to ? (
            <span className="px-2 py-0.5 rounded text-[11px] bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
              {c.assigned_to}
            </span>
          ) : (
            <span className="text-slate-300 dark:text-slate-600 italic">Belum dibagi</span>
          )}
        </td>

        <td className="py-3 px-4">
          <StatusBadge status={c.pipeline_status} />
        </td>

        <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-end gap-1.5">
            <a
              href={`https://www.tiktok.com/@${c.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Buka TikTok"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={() => handleQuickSend(c)}
              disabled={c.phone_status !== 'valid'}
              className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold inline-flex items-center gap-1.5 disabled:opacity-40 shadow-sm"
              title="Kirim WA & Jadikan Contacted"
            >
              <Send className="w-3 h-3" />
              <span>Kirim</span>
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <VirtualTable<Creator>
      items={creators}
      rowHeight={54}
      containerHeight={640}
      renderHeader={renderHeader}
      renderRow={renderRow}
      emptyMessage="Tidak ada creator dalam antrean dengan filter saat ini."
    />
  );
}
