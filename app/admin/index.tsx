// app/admin/index.tsx
// Redirect para /admin/users

import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useRequireAuth } from '@/hooks/useRequireAuth';

export default function Page() {
  const { isAuthorized } = useRequireAuth('admin');
  const router = useRouter();

  useEffect(() => {
    if (isAuthorized) {
      router.replace('/admin/users');
    }
  }, [isAuthorized, router]);

  return null;
}