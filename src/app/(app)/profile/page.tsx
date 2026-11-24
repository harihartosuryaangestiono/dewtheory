'use client';

import React, { useState, useEffect } from 'react';
import { useAffiliate } from '@/lib/store/useAffiliateStore';
import { supabase } from '@/lib/supabase/client';
import { User, Save, ShieldCheck, Mail, LogOut, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const { currentUser, setCurrentUser } = useAffiliate();

  const [displayName, setDisplayName] = useState(currentUser.name);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDisplayName(currentUser.name);
  }, [currentUser.name]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error('Nama tampilan tidak boleh kosong.');
      return;
    }

    setSaving(true);
    try {
      // 1. Update in Supabase if logged in
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({
            display_name: displayName.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (error) {
          console.error('Supabase profile update error:', error);
        }
      }

      // 2. Update in App Store
      setCurrentUser({
        ...currentUser,
        name: displayName.trim(),
      });

      toast.success('Profil berhasil disimpan! Nama pengirim WhatsApp otomatis diperbarui.');
    } catch (err: any) {
      toast.error('Gagal memperbarui profil: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.info('Anda telah keluar.');
      router.push('/login');
      router.refresh();
    } catch (err: any) {
      toast.error('Gagal logout: ' + err.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
          <User className="w-6 h-6 text-teal-600 dark:text-teal-400" />
          Profil Pengguna & Nama Pengirim WhatsApp
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Nama tampilan ini digunakan otomatis sebagai variabel <code>{'{{pengirim}}'}</code> di semua template pesan WhatsApp outreach dan follow-up.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm space-y-6">
        <form onSubmit={handleSaveProfile} className="space-y-5">
          {/* Avatar & Email */}
          <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-500 text-white font-extrabold text-2xl flex items-center justify-center shadow-md shadow-teal-500/20">
              {displayName[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                {displayName}
                <ShieldCheck className="w-4 h-4 text-teal-500" />
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {currentUser.email || 'user@dewtheory.com'}
              </p>
              <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200">
                KOL Specialist Dew Theory
              </span>
            </div>
          </div>

          {/* Display Name Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Nama Tampilan Pengirim (WhatsApp)
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Contoh: Dinda"
              className="w-full text-xs font-semibold px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
            />
            <span className="text-[11px] text-slate-400 block">
              Nama ini akan muncul di pesan WA: &ldquo;aku <strong>{displayName}</strong> dari tim Affiliate Dew Theory...&rdquo;
            </span>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Menyimpan...' : 'Simpan Nama Pengirim'}</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar (Logout)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
