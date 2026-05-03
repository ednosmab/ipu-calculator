import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Text, Card, theme } from '@/design-system';
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
  return (
    <Card style={styles.modelCard} testID={`model-card-${model.name}`}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <TouchableOpacity 
            onPress={() => onSelect(model)} 
            activeOpacity={0.7}
            style={styles.nameContainer}
          >
            <Text style={styles.modelName}>{model.name}</Text>
            {model.localAction && (
              <View style={[
                styles.badge,
                model.localAction === 'created' && styles.badgeCreated,
                model.localAction === 'edited' && styles.badgeEdited,
              ]}>
                <Text style={styles.badgeText}>
                  {model.localAction === 'created' ? 'Novo' : 'Editado'}
                </Text>
              </View>
            )}
            <View style={styles.syncStatusRow}>
              <FontAwesome5 
                name={model.syncStatus === 'synced' ? "check-circle" : "cloud-upload-alt"} 
                size={14} 
                color={model.syncStatus === 'synced' ? theme.colors.success : theme.colors.primary} 
                style={styles.syncIcon}
              />
              {model.syncStatus !== 'synced' && (
                <Text style={styles.pendingText}>Aguardando rede</Text>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={(e) => {
              e.stopPropagation();
              onEditTime(model);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>Tempo:</Text>
              <Text style={styles.timeValue}>{formatInjectionTime(model.inputs.injectionTime)}</Text>
            </View>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onEdit(model);
          }}
          style={styles.iconBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <FontAwesome5 name="pen" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={(e) => {
            e.stopPropagation();
            onDelete(model);
          }}
          style={styles.iconBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <FontAwesome5 name="trash-alt" size={20} color={theme.colors.error} />
        </TouchableOpacity>
      </View>
    </Card>
  );
};

const styles = {
  modelCard: {
    marginBottom: theme.spacing.sm,
    borderColor: theme.colors.border,
    minHeight: 98,
    justifyContent: 'center' as const,
  },
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  nameContainer: {
    flex: 1,
  },
  modelName: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.lg,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  badge: {
    alignSelf: 'flex-start' as const,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  badgeCreated: {
    backgroundColor: theme.colors.badgeCreated,
  },
  badgeEdited: {
    backgroundColor: theme.colors.badgeEdited,
  },
  badgeText: {
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: '600' as const,
  },
  syncStatusRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginTop: 4,
  },
  syncIcon: {
    marginRight: 4,
  },
  pendingText: {
    color: theme.colors.primary,
    fontSize: 10,
  },
  timeRow: {
    flexDirection: 'row' as const,
    marginTop: 4,
  },
  timeLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.sm,
    marginRight: 4,
  },
  timeValue: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.sm,
  },
  iconBtn: {
    padding: 8,
    marginLeft: 4,
  },
};