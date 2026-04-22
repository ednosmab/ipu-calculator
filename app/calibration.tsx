import { useRouter } from 'expo-router';
import { CalibrationScreen } from '@/features/calibration/screens/CalibrationScreen';

export default function CalibrationPage() {
  const router = useRouter();

  return (
    <CalibrationScreen 
      goBack={() => router.push('/')}
      goToCalculator={() => router.push('/calculator')}
    />
  );
}
