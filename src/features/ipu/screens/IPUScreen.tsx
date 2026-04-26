import { useRef, useState } from 'react';
import { Modal as RNModal, View } from 'react-native';
import { logService } from '@/core/logging/LogService';
import { CalculationModel } from '@/features/models/domain/calculationModel';
import { createModelUseCase, getModelsByTypeUseCase, updateModelUseCase } from '@/features/models/application/modelUseCases';
import { Button, Input, Card, theme, HStack, VStack, Text } from '@/design-system';
import { InputRef } from '@/design-system/components/Input';
import { ResultCard } from '@/components/ResultCard';
import { HistoryList } from '@/components/HistoryList';
import { ScreenLayout, ScreenLayoutRef } from '@/components/ScreenLayout';
import { FontAwesome5 } from '@expo/vector-icons';
import { useIPUCalculator } from '../hooks/useIPUCalculator';
import { useTranslation } from '@/i18n/TranslationContext';
import { styles } from './IPUScreen.styles';

type Props = {
  goBack: () => void;
  goToCalibration: () => void;
};

export const IPUScreen = ({ goBack, goToCalibration }: Props) => {
  const screenRef = useRef<ScreenLayoutRef>(null);
  const isoRef = useRef<InputRef>({ focus: () => {}, current: null });
  const polyolRef = useRef<InputRef>({ focus: () => {}, current: null });
  const { t } = useTranslation();
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [modelName, setModelName] = useState('');
  const [existingModel, setExistingModel] = useState<CalculationModel | null>(null);
  
  const { 
    isocyanate, 
    polyol, 
    setIsocyanate, 
    setPolyol, 
    result, 
    error, 
    fieldErrors,
    calculate, 
    clear,
    history,
    clearHistory,
    fillFromHistory 
  } = useIPUCalculator();

  const handleCalculate = () => {
    logService.info('IPU calculation started', { isocyanate, polyol });
    
    const calcResult = calculate();
    
    if (calcResult.hasErrors) {
      logService.warn('Validation failed', { fieldErrors: calcResult.fieldErrors });
      if (calcResult.fieldErrors.isocyanate) {
        isoRef.current?.focus();
      } else if (calcResult.fieldErrors.polyol) {
        polyolRef.current?.focus();
      }
    } else {
      setTimeout(() => screenRef.current?.scrollToTop(), 150);
    }
  };

  const handleOpenSaveModal = async () => {
    setModelName('');
    const nameUpper = (result || '').toUpperCase();
    const models = await getModelsByTypeUseCase('ipu');
    const found = models.find(m => m.name.toUpperCase() === nameUpper);
    setExistingModel(found || null);
    setShowSaveModal(true);
  };

  const handleSaveModel = async () => {
    if (!modelName.trim()) return;
    const nameUpper = modelName.trim().toUpperCase();
    const timeNum = parseFloat(result ?? '') || 0;
    const models = await getModelsByTypeUseCase('ipu');
    const existing = models.find(m => m.name.toUpperCase() === nameUpper);
    
    if (existing) {
      await updateModelUseCase({
        ...existing,
        name: nameUpper,
        inputs: { injectionTime: timeNum },
      });
    } else {
      await createModelUseCase({
        name: nameUpper,
        type: 'ipu',
        inputs: { injectionTime: timeNum },
      });
    }
    setShowSaveModal(false);
    setModelName('');
    setExistingModel(null);
  };

  const handleCloseSaveModal = () => {
    setShowSaveModal(false);
    setModelName('');
    setExistingModel(null);
  };

  return (
    <ScreenLayout
      ref={screenRef}
      title={t('calculateInjection')}
      footer={
        <HStack gap="sm">
          <Button
            title={t('back')}
            variant="secondary"
            onPress={goBack}
            icon={<FontAwesome5 name="arrow-left" size={20} color={theme.colors.text} />}
          />
          <Button
            title={t('goToCalibration')}
            onPress={goToCalibration}
            icon={<FontAwesome5 name="tint" size={20} color={theme.colors.bg} />}
          />
        </HStack>
      }
    >
      <VStack gap="lg">
        <ResultCard result={result} />

        {result && (
          <Button 
            title={t('saveAsModel')} 
            variant="secondary"
            onPress={handleOpenSaveModal}
            icon={<FontAwesome5 name="save" size={20} color={theme.colors.textSecondary} />}
          />
        )}

        <Card>
          <VStack>
            <Input
              ref={isoRef}
              label={t('isocyanate')}
              value={isocyanate}
              onChange={setIsocyanate}
              error={fieldErrors.isocyanate ?? undefined}
              keyboardType="numeric"
            />
            <Input
              ref={polyolRef}
              label={t('polyol')}
              value={polyol}
              onChange={setPolyol}
              error={fieldErrors.polyol ?? undefined}
              keyboardType="numeric"
            />
          </VStack>
        </Card>

        {error && <Text variant="error" style={styles.error}>{error}</Text>}

        <VStack gap="sm">
          <Button title={t('calculateInjection')} onPress={handleCalculate} icon={<FontAwesome5 name="calculator" size={20} color={theme.colors.bg} />} />
          <Button title={t('clear')} variant="secondary" onPress={clear} icon={<FontAwesome5 name="eraser" size={20} color={theme.colors.textSecondary} />} />
        </VStack>

        <HistoryList history={history} onItemPress={fillFromHistory} onClear={clearHistory} />
      </VStack>

      <RNModal visible={showSaveModal} transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('saveAsModel')}</Text>
            <Input
              label={t('modelName')}
              value={modelName}
              onChange={setModelName}
              placeholder={t('modelNamePlaceholder')}
            />
            <Text style={styles.modalText}>Tempo: {result}s</Text>
            {existingModel && (
              <Text style={styles.modalText}>
                {t('existingModel')}: {existingModel.inputs.injectionTime}s ({t('willBeOverwritten')})
              </Text>
            )}
            <HStack>
              <Button title={t('cancel')} variant="secondary" onPress={handleCloseSaveModal} style={{ flex: 1 }} icon={<FontAwesome5 name="times" size={20} color={theme.colors.textSecondary} />} />
              <Button title={existingModel ? t('overwrite') : t('save')} onPress={handleSaveModel} style={{ flex: 1 }} icon={<FontAwesome5 name="check" size={20} color={theme.colors.bg} />} />
            </HStack>
          </View>
        </View>
      </RNModal>
    </ScreenLayout>
  );
};