import React from 'react';
import { AffiliateProvider } from '@/lib/store/useAffiliateStore';
import { AppShell } from '@/components/layout/AppShell';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AffiliateProvider>
      <AppShell>
        {children}
      </AppShell>
    </AffiliateProvider>
  );
}
