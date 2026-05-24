import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator, Animated } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Button, Text, Input, theme, HStack } from '@/design-system';
import { ScreenLayout } from '@/components/ScreenLayout';
import { Toast } from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import { useTranslation } from '@/i18n/TranslationContext';
import { CalculationModel } from '@/features/models/domain/calculationModel';
import { deleteModelUseCase } from '@/features/models/application/modelUseCases';
import { useRealtimeModels } from '@/features/models/hooks/useRealtimeModels';
import { useModelForm } from '@/features/models/hooks/useModelForm';
import { ModelList, ModelFormModal, ModelDeleteModal } from '@/features/models/components';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';

interface Props {
  isOffline?: boolean;
  hasLocalCache?: boolean;
}

export const ModelsScreen = ({ isOffline, hasLocalCache }: Props) => {
  const { t } = useTranslation();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();
  const lastDeleteTime = useRef(0);

  const { models, isLoading } = useRealtimeModels();
  const ipuModels = models.filter(m => m.type === 'ipu');
  const calibrationModels = models.filter(m => m.type === 'calibration');

  const [deleteModel, setDeleteModel] = useState<CalculationModel | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (!isLoading && models.length > 0) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [isLoading, models.length, fadeAnim]);

  const form = useModelForm({ models });

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
    console.log('[ModelsScreen] handleConfirmDelete clicked');
    if (deleteModel) {
      setIsDeleting(true);
      try {
        await deleteModelUseCase(deleteModel.id);
        setDeleteModel(null);
        lastDeleteTime.current = 0;
      } catch (e) {
        // Error handled
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const totalModels = ipuModels.length + calibrationModels.length;

  const showOfflineBanner = isOffline && totalModels > 0;

  const footer = (
    <View style={styles.fabWrapper}>
      <Button title={t('createModel')} onPress={form.openCreate} style={styles.fabButton} icon={<FontAwesome5 name="plus" size={20} color={theme.colors.bg} />} />
    </View>
  );

  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.skeletonCard} />
      ))}
    </View>
  );

  if (isLoading) {
    return (
      <ScreenLayout title="Modelos" footer={footer}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Carregando modelos, aguarde...</Text>
          {renderSkeleton()}
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout title="Modelos" footer={footer}>
      {toast && <Toast message={toast.message} type={toast.type} />}
      {showOfflineBanner && (
        <View style={styles.offlineBanner}>
          <FontAwesome5 name="wifi" size={16} color={theme.colors.warning} />
          <Text style={styles.offlineBannerText}>
            {user
              ? 'Conecte-se à internet para atualizar a lista de modelos'
              : 'Conecte-se à internet e faça login para atualizar a lista de modelos'}
          </Text>
        </View>
      )}
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

        <ModelList
          models={ipuModels}
          type="ipu"
          search={search}
          onEdit={form.openEdit}
          onEditTime={form.openEditTime}
          onDelete={openDeleteConfirm}
          onSelect={(m) => router.push('/calculator')}
        />
        <ModelList
          models={calibrationModels}
          type="calibration"
          search={search}
          onEdit={form.openEdit}
          onEditTime={form.openEditTime}
          onDelete={openDeleteConfirm}
          onSelect={(m) => router.push('/calibration')}
        />

        {totalModels === 0 && (
          <Text style={styles.empty}>Nenhum modelo salvo</Text>
        )}

        {totalModels > 0 && search.trim() && (
          <Text style={styles.empty}>Nenhum resultado encontrado</Text>
        )}
      </View>

      <ModelFormModal
        visible={form.modalVisible}
        isTimeOnly={form.isTimeOnly}
        editingModel={form.editingModel}
        modelName={form.modelName}
        nameError={form.nameError}
        injectionTime={form.injectionTime}
        timeError={form.timeError}
        isSaving={form.isSaving}
        timeInputRef={form.timeInputRef}
        onChangeName={form.setModelName}
        onChangeTime={form.setInjectionTime}
        onSave={form.handleSave}
        onClose={form.handleModalClose}
      />

      <ModelDeleteModal
        model={deleteModel}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  empty: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.md,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  skeletonContainer: {
    width: '100%',
    gap: theme.spacing.sm,
  },
  skeletonCard: {
    height: 98,
    backgroundColor: theme.colors.input,
    borderRadius: theme.roundness.md,
    opacity: 0.3,
  },
  fabWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: theme.spacing.lg,
  },
  fabButton: {
    minWidth: 120,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.warning + '20',
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.sm,
    borderRadius: theme.roundness.sm,
    gap: theme.spacing.sm,
  },
  offlineBannerText: {
    flex: 1,
    color: theme.colors.warning,
    fontSize: theme.typography.sizes.sm,
  },
});