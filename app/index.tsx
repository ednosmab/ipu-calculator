import { useRouter } from 'expo-router';
import { HomeScreen } from '@/screens/HomeScreen';

export default function Page() {
  const router = useRouter();

  const handleGoToCalculator = () => router.push('/calculator');
  const handleGoToCalibration = () => router.push('/calibration');

  return (
    <HomeScreen
      onGoToCalculator={handleGoToCalculator}
      onGoToCalibration={handleGoToCalibration}
      onGoToModels={() => router.push('/models')}
    />
  );
}