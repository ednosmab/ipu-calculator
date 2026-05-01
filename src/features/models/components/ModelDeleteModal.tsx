import React from 'react';
import { View, Modal as RNModal, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Button, Text, theme } from '@/design-system';
import { CalculationModel } from '../domain/calculationModel';

type Props = {
  model: CalculationModel | null;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export const ModelDeleteModal = ({ model, isDeleting, onConfirm, onCancel }: Props) => {
  return (
    <RNModal visible={!!model} transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Excluir Modelo</Text>
          <Text style={styles.modalText}>
            Deseja excluir o modelo &quot;{model?.name}&quot;?
          </Text>
          <View style={styles.modalButtons}>
            <Button title="Cancelar" variant="secondary" onPress={onCancel} disabled={isDeleting} icon={<FontAwesome5 name="times" size={20} color={theme.colors.textSecondary} />} />
            <Button title="Excluir" onPress={onConfirm} loading={isDeleting} icon={<FontAwesome5 name="trash" size={20} color={theme.colors.bg} />} />
          </View>
        </View>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
    marginBottom: 16,
    textAlign: 'center',
  },
  modalText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.md,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
});