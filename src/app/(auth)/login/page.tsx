'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { translateAuthError, getSafeRedirectUrl } from '@/lib/utils/auth-errors';
import { 
  Sparkles, 
  Lock, 
  Mail, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Loader2,
  CheckCircle2,
  ChevronLeft
} from 'lucide-react';
import { toast } from 'sonner';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get('redirect');
  const safeRedirect = getSafeRedirectUrl(rawRedirect);

  // Form states - completely empty upon load (no hardcoded credentials)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Forgot password mode
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  // If already authenticated, redirect immediately to dashboard or intended path
  useEffect(() => {
    let isMounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted && session?.user) {
        router.replace(safeRedirect);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [router, safeRedirect]);

  // Handle standard login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('Harap masukkan email dan kata sandi.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        const translated = translateAuthError(error);
        setErrorMsg(translated);
        toast.error(translated);
      } else if (data?.user) {
        toast.success('Berhasil masuk. Mengarahkan...');
        router.replace(safeRedirect);
        router.refresh();
      }
    } catch (err: any) {
      const translated = translateAuthError(err);
      setErrorMsg(translated);
    } finally {
      setLoading(false);
    }
  };

  // Handle forgot password request
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setErrorMsg('Harap masukkan email Anda.');
      return;
    }

    setForgotLoading(true);
    setErrorMsg('');

    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
        redirectTo: `${origin}/login`,
      });
      // Security: Always show success message without revealing whether the email exists
      setForgotSubmitted(true);
    } catch (err: any) {
      // Even on error, show the same notification unless network failure
      const translated = translateAuthError(err);
      if (translated.includes('internet')) {
        setErrorMsg(translated);
      } else {
        setForgotSubmitted(true);
      }
    } finally {
      setForgotLoading(false);
    }
  };

  // Ref untuk memindahkan fokus ke kolom kata sandi
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const dindaEmail = process.env.NEXT_PUBLIC_DINDA_EMAIL;

  // Pintasan Masuk sebagai Dinda: hanya mengisi email dan memindahkan fokus ke kata sandi
  const handleFillDindaEmail = () => {
    if (!dindaEmail) return;
    setEmail(dindaEmail);
    setErrorMsg('');
    setTimeout(() => {
      passwordInputRef.current?.focus();
    }, 0);
  };

  return (
    <div className="w-full bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-teal-900/5 dark:shadow-black/50 transition-all">
      {/* Brand Header */}
      <div className="text-center space-y-2.5 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 via-teal-400 to-cyan-400 text-white flex items-center justify-center mx-auto shadow-lg shadow-teal-500/25">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Dew Theory Affiliate Hub
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isForgotMode 
              ? 'Atur ulang kata sandi akun Anda' 
              : 'Masuk untuk mengelola alur kerja outreach affiliate TikTok'}
          </p>
        </div>
      </div>

      {/* Error alert banner */}
      {errorMsg && (
        <div 
          role="alert" 
          className="mb-5 p-3.5 rounded-2xl bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2.5 animate-in fade-in duration-150"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
          <span className="font-medium leading-relaxed">{errorMsg}</span>
        </div>
      )}

      {/* Forgot Password View */}
      {isForgotMode ? (
        forgotSubmitted ? (
          <div className="space-y-5 text-center py-2 animate-in fade-in">
            <div className="w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Periksa Email Anda
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                Jika email terdaftar, tautan pengaturan ulang kata sandi telah dikirim ke kotak masuk Anda.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsForgotMode(false);
                setForgotSubmitted(false);
                setForgotEmail('');
                setErrorMsg('');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline pt-2"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Kembali ke Halaman Masuk</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="forgot-email" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Email Terdaftar
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  id="forgot-email"
                  name="email"
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  placeholder="nama@dewtheory.com"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  disabled={forgotLoading}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={forgotLoading}
              className="w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white rounded-2xl text-xs font-bold shadow-lg shadow-teal-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {forgotLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengirim Tautan...</span>
                </>
              ) : (
                <span>Kirim Tautan Atur Ulang</span>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsForgotMode(false);
                  setErrorMsg('');
                }}
                className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                Batal dan kembali
              </button>
            </div>
          </form>
        )
      ) : (
        /* Standard Login Form */
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="login-email" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                id="login-email"
                name="email"
                type="email"
                required
                autoComplete="username"
                placeholder="nama@dewtheory.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all disabled:opacity-50 placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="login-password" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Kata Sandi
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsForgotMode(true);
                  setErrorMsg('');
                  setForgotSubmitted(false);
                }}
                className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:underline"
              >
                Lupa kata sandi?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                ref={passwordInputRef}
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="Masukkan kata sandi"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-11 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all disabled:opacity-50 placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white rounded-2xl text-xs font-bold shadow-lg shadow-teal-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memverifikasi...</span>
              </>
            ) : (
              <>
                <span>Masuk</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Tombol Pintasan Masuk sebagai Dinda (gaya sekunder outline, hanya jika NEXT_PUBLIC_DINDA_EMAIL disetel) */}
          {Boolean(dindaEmail) && (
            <button
              type="button"
              onClick={handleFillDindaEmail}
              className="w-full py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60 active:scale-[0.99] text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center text-[10px] font-black border border-teal-200 dark:border-teal-700">
                D
              </span>
              <span>Masuk sebagai Dinda</span>
            </button>
          )}
        </form>
      )}

      {/* Internal Team Notice */}
      <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 text-center text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 flex-shrink-0" />
        <span>Akses khusus internal tim Dew Theory</span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md p-8 bg-white/70 dark:bg-slate-900/70 rounded-3xl text-center text-xs text-slate-400">
        Memuat halaman...
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  );
}
