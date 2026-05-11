import { ModelsScreen } from '@/features/models/screens/ModelsScreen';
import { useRequireAuth } from '@/hooks/useRequireAuth';

export default function Page() {
  const { isAuthorized, isOffline, hasLocalCache } = useRequireAuth('viewer', true);

  if (!isAuthorized) {
    return null;
  }

  return (
    <ModelsScreen
      isOffline={isOffline}
      hasLocalCache={hasLocalCache}
    />
  );
}