import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'Dew Theory Affiliate Hub',
  description: 'Web App Kerja Outreach Affiliate TikTok Dew Theory - Cepat, Rapi, Realtime',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans antialiased text-slate-900 dark:text-slate-100">
        {children}
        <Toaster 
          position="top-right" 
          richColors 
          closeButton 
          toastOptions={{
            className: 'font-sans text-xs',
          }}
        />
      </body>
    </html>
  );
}
