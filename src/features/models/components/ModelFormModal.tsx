import React from 'react';
import { View, Modal as RNModal, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Button, Text, Input, theme } from '@/design-system';
import { CalculationModel } from '../domain/calculationModel';
import { InputRef } from '@/design-system/components/Input';
import { useTranslation } from '@/i18n/TranslationContext';

type Props = {
  visible: boolean;
  isTimeOnly: boolean;
  editingModel: CalculationModel | null;
  modelName: string;
  nameError: string;
  injectionTime: string;
  timeError: string;
  isSaving: boolean;
  timeInputRef: React.RefObject<InputRef>;
  onChangeName: (value: string) => void;
  onChangeTime: (value: string) => void;
  onSave: () => void;
  onClose: () => void;
};

export const ModelFormModal = ({
  visible,
  isTimeOnly,
  editingModel,
  modelName,
  nameError,
  injectionTime,
  timeError,
  isSaving,
  timeInputRef,
  onChangeName,
  onChangeTime,
  onSave,
  onClose,
}: Props) => {
  const { t } = useTranslation();

  return (
    <RNModal visible={visible} animationType="fade" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {editingModel ? (isTimeOnly ? `${editingModel.name} - ${t('editTime')}` : t('editModel')) : t('newModel')}
          </Text>
          
          <View>
            {!isTimeOnly && (
              <Input
                label={t('modelName')}
                value={modelName}
                onChange={(val) => {
                  onChangeName(val);
                }}
                placeholder={t('modelNamePlaceholder')}
                keyboardType="default"
                autoCapitalize="characters"
                error={nameError}
              />
            )}
            <Input
              ref={timeInputRef}
              label={t('injectionTime')}
              value={injectionTime}
              onChange={(val) => {
                onChangeTime(val);
              }}
              placeholder="0.00"
              keyboardType="decimal-pad"
              error={timeError}
            />
            
            <View style={styles.modalButtons}>
              <Button
                title={t('cancel')}
                variant="secondary"
                onPress={onClose}
                disabled={isSaving}
                icon={<FontAwesome5 name="times" size={20} color={theme.colors.textSecondary} />}
              />
              <Button title={t('save')} onPress={onSave} loading={isSaving} icon={<FontAwesome5 name="check" size={20} color={theme.colors.bg} />} />
            </View>
          </View>
        </View>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.md,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.xl,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
});