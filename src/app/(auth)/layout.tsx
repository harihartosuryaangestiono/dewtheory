import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-8 bg-gradient-to-tr from-[#f4faf9] via-[#edf6f4] to-[#e6f2ef] dark:from-slate-950 dark:via-slate-900 dark:to-teal-950/40 relative overflow-hidden">
      {/* Subtle organic dewy background decorations */}
      <div 
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-teal-200/30 dark:bg-teal-900/10 blur-3xl pointer-events-none" 
        aria-hidden="true" 
      />
      <div 
        className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-cyan-200/30 dark:bg-cyan-900/10 blur-3xl pointer-events-none" 
        aria-hidden="true" 
      />
      
      <div className="w-full max-w-md relative z-10">
        {children}
      </div>
    </div>
  );
}
