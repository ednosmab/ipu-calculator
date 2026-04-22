import { useRouter } from 'expo-router';
import { HomeScreen } from '@/screens/HomeScreen';

export default function Page() {
  const router = useRouter();

  return (
    <HomeScreen
      onGoToCalculator={() => router.push('/calculator')}
      onGoToCalibration={() => router.push('/calibration')}
    />
  );
}