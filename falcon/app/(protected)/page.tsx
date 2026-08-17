'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';

export default function ProtectedRedirect() {
  const router = useRouter();
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user || !role) {
      router.replace('/login');
      return;
    }

    if (role === 'admin') {
      router.replace('/admin/dashboard');
    } else {
      router.replace('/employee/dashboard');
    }
  }, [user, role, loading, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
