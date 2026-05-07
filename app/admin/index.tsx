// app/admin/index.tsx
// Redirect para /admin/users

import { useRouter } from 'expo-router';
import { useRequireAuth } from '@/hooks/useRequireAuth';

export default function Page() {
  const { isAuthorized } = useRequireAuth('admin');
  const router = useRouter();

  if (!isAuthorized) {
    // The hook will redirect, but we return null to prevent rendering while redirecting
    return null;
  }

  // Redirect to users page
  useEffect(() => {
    router.replace('/admin/users');
  }, [router]);

  return null;
}