import { useState, useRef } from 'react';
import { CalculationModel } from '../domain/calculationModel';
import { InputRef } from '@/design-system/components/Input';
import { parseNumber } from '@/core/parsers/numberParser';
import { createModelUseCase, updateModelUseCase } from '../application/modelUseCases';
import { useToast } from '@/hooks/useToast';

type UseModelFormProps = {
  models: CalculationModel[];
};

export const useModelForm = ({ models }: UseModelFormProps) => {
  const { success, error } = useToast();
  const timeInputRef = useRef<InputRef>({ focus: () => {}, current: null });

  const [modalVisible, setModalVisible] = useState(false);
  const [isTimeOnly, setIsTimeOnly] = useState(false);
  const [editingModel, setEditingModel] = useState<CalculationModel | null>(null);
  const [modelName, setModelName] = useState('');
  const [nameError, setNameError] = useState('');
  const [injectionTime, setInjectionTime] = useState('');
  const [timeError, setTimeError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const openCreate = () => {
    setEditingModel(null);
    setModelName('');
    setInjectionTime('');
    setNameError('');
    setModalVisible(true);
  };

  const openEdit = (model: CalculationModel) => {
    setEditingModel(model);
    setModelName(model.name);
    setInjectionTime(String(model.inputs.injectionTime || ''));
    setIsTimeOnly(false);
    setNameError('');
    setModalVisible(true);
  };

  const openEditTime = (model: CalculationModel) => {
    setEditingModel(model);
    setModelName('');
    setInjectionTime(String(model.inputs.injectionTime || ''));
    setIsTimeOnly(true);
    setModalVisible(true);
  };

  const handleSave = async () => {
    const nameUpper = modelName.trim().toUpperCase();
    if (!nameUpper) {
      setNameError('Nome é obrigatório');
      return;
    }
    
    const timeNum = parseNumber(injectionTime);
    if (isNaN(timeNum) || timeNum <= 0) {
      setTimeError('Tempo deve ser maior que zero');
      timeInputRef.current?.focus();
      return;
    }

    const isDuplicate = models.some(
      m => m.name.toUpperCase() === nameUpper && m.id !== editingModel?.id
    );
    if (isDuplicate) {
      setNameError('Já existe um modelo com este nome');
      return;
    }
    
    setTimeError('');
    setNameError('');
    
    setIsSaving(true);
    try {
      if (editingModel) {
        await updateModelUseCase({
          ...editingModel,
          name: nameUpper,
          inputs: { injectionTime: timeNum },
          updatedAt: Date.now(),
        });
        success('Modelo editado com sucesso');
      } else {
        await createModelUseCase({
          name: nameUpper,
          type: 'ipu',
          inputs: { injectionTime: timeNum },
        });
        success('Modelo salvo com sucesso');
      }
      
      setModalVisible(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Não foi possível salvar o modelo';
      if (message.includes('Já existe um modelo com este nome')) {
        setNameError(message);
      } else {
        error(message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setNameError('');
  };

  return {
    modalVisible,
    isTimeOnly,
    editingModel,
    modelName,
    nameError,
    injectionTime,
    timeError,
    isSaving,
    timeInputRef,
    openCreate,
    openEdit,
    openEditTime,
    handleSave,
    handleModalClose,
    setModelName,
    setInjectionTime,
  };
};