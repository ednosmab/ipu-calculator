import { Card, Text, theme } from '@/design-system';
import { FontAwesome5 } from '@expo/vector-icons';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { CalculationModel } from '../domain/calculationModel';

type Props = {
  model: CalculationModel;
  onEdit: (model: CalculationModel) => void;
  onEditTime: (model: CalculationModel) => void;
  onDelete: (model: CalculationModel) => void;
  onSelect: (model: CalculationModel) => void;
};

const formatInjectionTime = (time: number | null | undefined): string => {
  if (time == null) return 'N/A';
  return `${time.toFixed(2).replace('.', ',')}s`;
};

export const ModelCard = ({ model, onEdit, onEditTime, onDelete, onSelect }: Props) => {
  const isSyncing = model.syncStatus !== 'synced';

  return (
    <Card style={styles.modelCard} testID={`model-card-${model.name}`}>
      <View style={styles.mainContainer}>
        <View style={styles.header}>
          <Text style={styles.modelName} numberOfLines={1}>{model.name}</Text>
          <View style={styles.statusContainer}>
            {isSyncing && <Text style={styles.pendingText}>Aguardando rede</Text>}
            <FontAwesome5
              name={isSyncing ? "cloud-upload-alt" : "check-circle"}
              size={14}
              color={isSyncing ? theme.colors.primary : theme.colors.success}
              style={styles.syncIcon}
            />
          </View>
        </View>

        {model.localAction && (
          <View style={[
            styles.badge,
            model.localAction === 'created' && styles.badgeCreated,
            model.localAction === 'edited' && styles.badgeEdited,
            model.localAction === 'deleted' && styles.badgeDeleted,
          ]}>
            <Text style={model.localAction === 'edited' ? styles.badgeTextDark : styles.badgeText}>
              {model.localAction === 'created' ? 'Novo' :
                model.localAction === 'edited' ? 'Editado' : 'Excluir'}
            </Text>
          </View>
        )}

        <View style={styles.contentRow}>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onEditTime(model);
            }}
            activeOpacity={0.7}
            style={styles.valueContainer}
          >
            <Text style={styles.timeValue}>{formatInjectionTime(model.inputs.injectionTime)}</Text>
            <Text style={styles.timeLabel}>Tempo de Injeção</Text>
          </TouchableOpacity>

          <View style={styles.actions}>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onEdit(model);
              }}
              style={styles.iconBtn}
            >
              <FontAwesome5 name="pen" size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onDelete(model);
              }}
              style={styles.iconBtn}
            >
              <FontAwesome5 name="trash-alt" size={18} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Card >
  );
};

const styles = {
  modelCard: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    borderColor: theme.colors.border,
  },
  mainContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: theme.spacing.xs,
  },
modelName: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  statusContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  syncIcon: {
    marginLeft: 6,
  },
  pendingText: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: theme.typography.weights.medium,
  },
  badge: {
    alignSelf: 'flex-start' as const,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: theme.spacing.sm,
  },
  badgeCreated: {
    backgroundColor: theme.colors.success,
  },
  badgeEdited: {
    backgroundColor: theme.colors.warning,
  },
  badgeDeleted: {
    backgroundColor: theme.colors.error,
  },
  badgeText: {
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: theme.typography.weights.bold,
    textTransform: 'uppercase' as const,
  },
  badgeTextDark: {
    color: theme.colors.background,
    fontSize: 10,
    fontWeight: theme.typography.weights.bold,
    textTransform: 'uppercase' as const,
  },
  contentRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-end' as const,
  },
  valueContainer: {
    flex: 1,
  },
  timeValue: {
    color: theme.colors.primary,
    fontSize: 28,
    fontWeight: theme.typography.weights.bold,
    lineHeight: 32,
  },
  timeLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row' as const,
    gap: theme.spacing.sm,
  },
  iconBtn: {
    padding: 8,
    backgroundColor: theme.colors.input,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
};