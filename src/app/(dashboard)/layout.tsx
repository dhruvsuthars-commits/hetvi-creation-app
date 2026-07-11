'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Shell from '@/components/layout/Shell';
import { localDb } from '@/lib/supabase';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if user session exists in local storage
    if (typeof window !== 'undefined') {
      const session = localStorage.getItem('hetvi_db_session');
      if (!session) {
        setIsAuthenticated(false);
        router.push('/login');
      } else {
        // Fetch latest data from cloud in background to keep data live
        localDb.syncFromCloud().finally(() => {
          setIsAuthenticated(true);
        });
      }
    }
  }, [router]);

  if (isAuthenticated === null) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-brand-cream">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
          <span className="font-serif text-primary text-sm">Loading Hetvi's Creation...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <Shell>{children}</Shell>;
}
