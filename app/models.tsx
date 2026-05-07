import { useRouter } from 'expo-router';
import { ModelsScreen } from '@/features/models/screens/ModelsScreen';
import { CalculationModel } from '@/features/models/domain/calculationModel';
import { useRequireAuth } from '@/hooks/useRequireAuth';

export default function Page() {
  const { isAuthorized } = useRequireAuth('viewer');
  const router = useRouter();

  if (!isAuthorized) {
    // The hook will redirect, but we return null to prevent rendering while redirecting
    return null;
  }

  const handleGoBack = () => router.push('/');

  const handleSelectModel = (model: CalculationModel) => {
    if (model.type === 'ipu') {
      router.push('/calculator');
    } else {
      router.push('/calibration');
    }
  };

  return <ModelsScreen onGoBack={handleGoBack} onSelectModel={handleSelectModel} />;
}