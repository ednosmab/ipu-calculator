// @ts-ignore - Mock for Expo 54 winter runtime bug in Jest
global.__ExpoImportMetaRegistry = global.__ExpoImportMetaRegistry || {};
// @ts-ignore - Mock for structuredClone missing in some node environments
global.structuredClone = global.structuredClone || ((val: any) => JSON.parse(JSON.stringify(val)));

import { renderHook, act } from '@testing-library/react-native';
import { useCalculatorLogic, CalculatorConfig } from '../useCalculatorLogic';

describe('useCalculatorLogic Integration Test', () => {
  const mockConfig: CalculatorConfig<'val1' | 'val2'> = {
    inputs: ['val1', 'val2'],
    calculateFn: (a: number, b: number) => a + b,
  };

  it('should manage input states correctly', () => {
    const { result } = renderHook(() => useCalculatorLogic(mockConfig));

    act(() => {
      result.current.setInputValue('val1', '10');
    });

    expect(result.current.inputs.val1).toBe('10');
  });

  it('should perform full calculation flow', () => {
    const { result } = renderHook(() => useCalculatorLogic(mockConfig));

    act(() => {
      result.current.setInputValue('val1', '10');
      result.current.setInputValue('val2', '5');
    });

    act(() => {
      result.current.calculate();
    });

    expect(result.current.result).not.toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should trigger error state for invalid number inputs', () => {
    const { result } = renderHook(() => useCalculatorLogic(mockConfig));

    act(() => {
      result.current.setInputValue('val1', 'abc');
    });

    act(() => {
      result.current.calculate();
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.result).toBeNull();
  });

  it('should reset all states when clear is called', () => {
    const { result } = renderHook(() => useCalculatorLogic(mockConfig));

    act(() => {
      result.current.setInputValue('val1', '10');
      result.current.setInputValue('val2', '10');
    });

    act(() => {
      result.current.calculate();
    });

    expect(result.current.result).not.toBeNull();

    act(() => {
      result.current.clear();
    });

    expect(result.current.inputs.val1).toBe('');
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
