import { useRouter } from 'expo-router';
import { IPUScreen } from '@/features/ipu/screens/IPUScreen';

export default function CalculatorPage() {
  const router = useRouter();

  return (
    <IPUScreen 
      goBack={() => router.push('/')}
      goToCalibration={() => router.push('/calibration')}
    />
  );
}
