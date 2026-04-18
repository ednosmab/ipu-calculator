import { useState } from 'react';
import { CalculatorScreen } from '../src/screens/CalculatorScreen';
import { CalibrationScreen } from '../src/screens/CalibrationScreen';
import { HomeScreen } from '../src/screens/HomeScreen';

export default function Page() {
  const [screen, setScreen] = useState<'home' | 'calculator' | 'calibration'>('home');

  if (screen === 'calculator') {
    return (
      <CalculatorScreen 
        goBack={() => setScreen('home')} 
        goToCalibration={() => setScreen('calibration')} 
      />
    );
  }

  if (screen === 'calibration') {
    return (
      <CalibrationScreen 
        goBack={() => setScreen('home')} 
        goToCalculator={() => setScreen('calculator')} 
      />
    );
  }

  return (
    <HomeScreen
      onGoToCalculator={() => setScreen('calculator')}
      onGoToCalibration={() => setScreen('calibration')}
    />
  );
}