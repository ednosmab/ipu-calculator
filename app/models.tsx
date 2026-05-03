import { useRouter } from 'expo-router';
import { ModelsScreen } from '@/screens/ModelsScreen';
import { CalculationModel } from '@/features/models/domain/calculationModel';

export default function Page() {
  const router = useRouter();

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