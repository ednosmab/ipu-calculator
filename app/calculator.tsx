import { useRouter } from 'expo-router';
import { CalculatorScreen } from '../src/screens/CalculatorScreen';

export default function CalculatorPage() {
  const router = useRouter();

  return (
    <CalculatorScreen 
      goBack={() => router.push('/')}
      goToCalibration={() => router.push('/calibration')}
    />
  );
}
