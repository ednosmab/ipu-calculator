import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Modal as RNModal, TouchableOpacity, Alert } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Button, Text, Card, theme } from '@/design-system';
import { Input, InputRef } from '@/design-system/components/Input';
import { ScreenLayout } from '@/components/ScreenLayout';
import { useTranslation } from '@/i18n/TranslationContext';
import { CalculationModel, ModelType } from '@/features/models/domain/calculationModel';
import { getModelsByTypeUseCase, deleteModelUseCase, updateModelUseCase, createModelUseCase } from '@/features/models/application/modelUseCases';
import { modelRepository } from '@/features/models/infra/modelRepository';
import { parseNumber } from '@/core/parsers/numberParser';

type Props = {
  onGoBack: () => void;
  onSelectModel: (model: CalculationModel) => void;
};

export const ModelsScreen = ({ onGoBack, onSelectModel }: Props) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [ipuModels, setIpuModels] = useState<CalculationModel[]>([]);
  const [calibrationModels, setCalibrationModels] = useState<CalculationModel[]>([]);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [isTimeOnly, setIsTimeOnly] = useState(false);
  const [deleteModel, setDeleteModel] = useState<CalculationModel | null>(null);
  const lastDeleteTime = useRef(0);
  const [editingModel, setEditingModel] = useState<CalculationModel | null>(null);
  const [modelName, setModelName] = useState('');
  const [injectionTime, setInjectionTime] = useState('');
  const [timeError, setTimeError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const timeInputRef = useRef<InputRef>({ focus: () => {}, current: null });

  const loadModels = async () => {
    const ipu = await getModelsByTypeUseCase('ipu');
    const calibration = await getModelsByTypeUseCase('calibration');
    setIpuModels(ipu);
    setCalibrationModels(calibration);
  };

  useEffect(() => {
    loadModels();

    // Se inscreve para atualizações (ex: quando o sync de background termina)
    const unsubscribe = modelRepository.subscribe(() => {
      loadModels();
    });

    return () => unsubscribe();
  }, []);

  const openCreate = () => {
    setEditingModel(null);
    setModelName('');
    setInjectionTime('');
    setModalVisible(true);
  };

  const openEdit = (model: CalculationModel) => {
    setEditingModel(model);
    setModelName(model.name);
    setInjectionTime(String(model.inputs.injectionTime || ''));
    setIsTimeOnly(false);
    setModalVisible(true);
  };

  const openEditTime = (model: CalculationModel) => {
    setEditingModel(model);
    setModelName('');
    setInjectionTime(String(model.inputs.injectionTime || ''));
    setIsTimeOnly(true);
    setModalVisible(true);
  };

const openDeleteConfirm = (model: CalculationModel) => {
    const now = Date.now();
    if (now - lastDeleteTime.current < 500) return;
    lastDeleteTime.current = now;
    setDeleteModel(model);
  };

  const handleCancelDelete = () => {
    setDeleteModel(null);
    lastDeleteTime.current = 0;
  };

  const handleConfirmDelete = async () => {
    if (deleteModel) {
      await deleteModelUseCase(deleteModel.id);
      await loadModels();
      setDeleteModel(null);
      lastDeleteTime.current = 0;
    }
  };

  const handleSave = async () => {
    const nameUpper = modelName.trim().toUpperCase();
    if (!nameUpper) {
      Alert.alert('Erro', 'Nome é obrigatório');
      return;
    }
    
    const timeNum = parseNumber(injectionTime);
    if (isNaN(timeNum) || timeNum <= 0) {
      setTimeError('Tempo deve ser maior que zero');
      timeInputRef.current?.focus();
      return;
    }
    
    setTimeError('');
    
    setIsSaving(true);
    try {
      if (editingModel) {
        await updateModelUseCase({
          ...editingModel,
          name: nameUpper,
          inputs: { injectionTime: timeNum },
          updatedAt: Date.now(),
        });
      } else {
        await createModelUseCase({
          name: nameUpper,
          type: 'ipu',
          inputs: { injectionTime: timeNum },
        });
      }
      
      setModalVisible(false);
      await loadModels();
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar o modelo');
    } finally {
      setIsSaving(false);
    }
  };

  const handleModalClose = () => {
    setModalVisible(false);
  };

  const filterBySearch = (models: CalculationModel[]) => {
    const sorted = [...models].sort((a, b) => a.name.localeCompare(b.name));
    if (!search.trim()) return sorted;
    const term = search.toUpperCase();
    return sorted.filter(m => m.name.startsWith(term));
  };

  const renderList = (models: CalculationModel[], type: ModelType) => {
    const filtered = filterBySearch(models);
    if (filtered.length === 0) return null;
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {type === 'ipu' ? 'Injeção' : 'Calibração'}
        </Text>
        {filtered.map((model) => (
<Card key={model.id} style={styles.modelCard}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <TouchableOpacity 
                  onPress={() => onSelectModel(model)} 
                  activeOpacity={0.7}
                  style={styles.nameContainer}
                >
                  <Text style={styles.modelName}>{model.name}</Text>
                  <FontAwesome5 
                    name={model.syncStatus === 'synced' ? "check-circle" : "cloud-upload-alt"} 
                    size={14} 
                    color={model.syncStatus === 'synced' ? theme.colors.success : theme.colors.textSecondary} 
                    style={styles.syncIcon}
                  />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={(e) => {
                    e.stopPropagation();
                    openEditTime(model);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.timeRow}>
                    <Text style={styles.timeLabel}>Tempo:</Text>
                    <Text style={styles.timeValue}>{model.inputs.injectionTime.toFixed(2).replace('.', ',')}s</Text>
                  </View>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  openEdit(model);
                }}
                style={styles.iconBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <FontAwesome5 name="pen" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={(e) => {
                  e.stopPropagation();
                  openDeleteConfirm(model);
                }}
                style={styles.iconBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <FontAwesome5 name="trash-alt" size={20} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          </Card>
        ))}
      </View>
    );
  };

  const totalModels = ipuModels.length + calibrationModels.length;

  const fab = (
    <View style={styles.fabWrapper}>
      <Button title={t('createModel')} onPress={openCreate} style={styles.fabButton} icon={<FontAwesome5 name="plus" size={20} color={theme.colors.bg} />} />
    </View>
  );

  return (
    <ScreenLayout title="Modelos" onBack={onGoBack} footer={fab}>
      <View style={styles.content}>
        {totalModels > 0 && (
          <Input
            value={search}
            onChange={setSearch}
            placeholder="Buscar modelo..."
            keyboardType="default"
            autoCapitalize="characters"
          />
        )}

        {renderList(ipuModels, 'ipu')}
        {renderList(calibrationModels, 'calibration')}

        {totalModels === 0 && (
          <Text style={styles.empty}>Nenhum modelo salvo</Text>
        )}

        {totalModels > 0 && search.trim() && filterBySearch(ipuModels).length === 0 && filterBySearch(calibrationModels).length === 0 && (
          <Text style={styles.empty}>Nenhum resultado encontrado</Text>
        )}
      </View>

      <RNModal visible={modalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingModel ? (isTimeOnly ? `${editingModel.name} - Editar Tempo` : 'Editar Modelo') : 'Novo Modelo'}
            </Text>
            
            <View>
              {!isTimeOnly && (
                <Input
                  label="Nome"
                  value={modelName}
                  onChange={setModelName}
                  placeholder="Nome do modelo"
                  keyboardType="default"
                  autoCapitalize="characters"
                />
              )}
              <Input
                ref={timeInputRef}
                label="Tempo de Injeção (segundos)"
                value={injectionTime}
                onChange={(val) => {
                  setInjectionTime(val);
                  setTimeError('');
                }}
                placeholder="0.00"
                keyboardType="decimal-pad"
                error={timeError}
              />
              
              <View style={styles.modalButtons}>
                <Button
                  title="Cancelar"
                  variant="secondary"
                  onPress={handleModalClose}
                  disabled={isSaving}
                  icon={<FontAwesome5 name="times" size={20} color={theme.colors.textSecondary} />}
                />
                <Button title="Salvar" onPress={handleSave} loading={isSaving} icon={<FontAwesome5 name="check" size={20} color={theme.colors.bg} />} />
              </View>
            </View>
          </View>
        </View>
      </RNModal>

      <RNModal visible={!!deleteModel} transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Excluir Modelo</Text>
<Text style={styles.modalText}>
                Deseja excluir o modelo &quot;{deleteModel?.name}&quot;?
              </Text>
            <View style={styles.modalButtons}>
              <Button title="Cancelar" variant="secondary" onPress={handleCancelDelete} icon={<FontAwesome5 name="times" size={20} color={theme.colors.textSecondary} />} />
              <Button title="Excluir" onPress={handleConfirmDelete} icon={<FontAwesome5 name="trash" size={20} color={theme.colors.bg} />} />
            </View>
          </View>
        </View>
      </RNModal>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  section: {
    marginTop: theme.spacing.md,
  },
  sectionTitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.sm,
  },
  modelCard: {
    marginBottom: theme.spacing.xs,
  },
  modelInfo: {
    flex: 1,
  },
  modelName: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncIcon: {
    marginLeft: theme.spacing.sm,
    opacity: 0.8,
  },
  modelInputs: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.sm,
    marginTop: theme.spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    padding: theme.spacing.sm,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  timeLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.sm,
    marginRight: theme.spacing.xs,
  },
  timeValue: {
    color: theme.colors.primary,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
  },
  empty: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
  },
  fabWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: theme.spacing.lg,
  },
  fabButton: {
    minWidth: 120,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.lg,
    padding: theme.spacing.lg,
    width: '100%',
    maxWidth: 320,
  },
  modalTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  modalText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.md,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
});