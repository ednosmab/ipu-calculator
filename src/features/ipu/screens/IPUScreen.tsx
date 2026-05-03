import { useRef, useState } from 'react';
import { Modal as RNModal, View } from 'react-native';
import { logService } from '@/core/logging/LogService';
import { createModelUseCase } from '@/features/models/application/modelUseCases';
import { Button, Input, Card, theme, HStack, VStack, Text } from '@/design-system';
import { InputRef } from '@/design-system/components/Input';
import { ResultCard } from '@/components/ResultCard';
import { HistoryList } from '@/components/HistoryList';
import { ScreenLayout, ScreenLayoutRef } from '@/components/ScreenLayout';
import { Toast } from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import { FontAwesome5 } from '@expo/vector-icons';
import { useIPUCalculator } from '../hooks/useIPUCalculator';
import { useTranslation } from '@/i18n/TranslationContext';
import { parseNumber } from '@/core/parsers/numberParser';
import { styles } from './IPUScreen.styles';

type Props = {
  goBack: () => void;
  goToCalibration: () => void;
};

export const IPUScreen = ({ goBack, goToCalibration }: Props) => {
  const { t } = useTranslation();
  const { toast, success, error: showError } = useToast();
  const screenRef = useRef<ScreenLayoutRef>(null);
  const isoRef = useRef<InputRef>(null);
  const polyolRef = useRef<InputRef>(null);
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

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [modelName, setModelName] = useState('');
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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
    setSaveError('');
    setShowSaveModal(true);
  };

  const handleSaveModel = async () => {
    if (!modelName.trim()) return;
    setIsSaving(true);
    setSaveError('');
    try {
      const nameUpper = modelName.trim().toUpperCase();
      const timeNum = parseNumber(result ?? '');
      await createModelUseCase({
        name: nameUpper,
        type: 'ipu',
        inputs: { injectionTime: timeNum },
      });
      success('Modelo salvo com sucesso');
      setShowSaveModal(false);
      setModelName('');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erro ao salvar modelo';
      if (message.includes('Já existe um modelo com este nome')) {
        setSaveError(message);
      } else {
        showError('Erro ao salvar modelo');
        logService.error('Failed to save model', e instanceof Error ? e : undefined);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseSaveModal = () => {
    setShowSaveModal(false);
    setModelName('');
    setSaveError('');
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} />}
      <ScreenLayout
        ref={screenRef}
        title={t('calculateInjection')}
        footer={
          <HStack gap="sm" style={{ width: '100%' }}>
            <Button
              title={t('back')}
              variant="secondary"
              onPress={goBack}
              style={{ flex: 1 }}
              icon={<FontAwesome5 name="arrow-left" size={20} color={theme.colors.textSecondary} />}
            />
            <Button
              title={t('goToCalibration')}
              onPress={goToCalibration}
              style={{ flex: 1 }}
              icon={<FontAwesome5 name="tint" size={20} color={theme.colors.primaryText} />}
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
            icon={<FontAwesome5 name="save" size={18} color={theme.colors.textSecondary} />}
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
              keyboardType="decimal-pad"
            />
            <Input
              ref={polyolRef}
              label={t('polyol')}
              value={polyol}
              onChange={setPolyol}
              error={fieldErrors.polyol ?? undefined}
              keyboardType="decimal-pad"
            />
          </VStack>
        </Card>

        {error && <Text variant="error" style={styles.error}>{error}</Text>}

        <VStack gap="sm">
          <Button title={t('calculateInjection')} onPress={handleCalculate} icon={<FontAwesome5 name="calculator" size={20} color={theme.colors.primaryText} />} />
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
                onChange={(val) => {
                  setModelName(val);
                  setSaveError('');
                }}
                placeholder={t('modelNamePlaceholder')}
                keyboardType="default"
                autoCapitalize="characters"
                error={saveError}
              />
              <Text style={styles.modalText}>Tempo: {result}s</Text>
              <HStack>
                <Button title={t('cancel')} variant="secondary" onPress={handleCloseSaveModal} style={{ flex: 1 }} disabled={isSaving} icon={<FontAwesome5 name="times" size={20} color={theme.colors.textSecondary} />} />
                <Button title={t('save')} onPress={handleSaveModel} style={{ flex: 1 }} loading={isSaving} icon={<FontAwesome5 name="check" size={20} color={theme.colors.primaryText} />} />
              </HStack>
            </View>
          </View>
        </RNModal>
    </ScreenLayout>
    </>
  );
};