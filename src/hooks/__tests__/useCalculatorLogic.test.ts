import { renderHook, act } from '@testing-library/react-native';
import { z } from 'zod';
import { useCalculatorLogic, CalculatorConfig } from '../useCalculatorLogic';

(global as any).__ExpoImportMetaRegistry = (global as any).__ExpoImportMetaRegistry || {};
// @ts-ignore - Mock for structuredClone missing in some node environments
(global as any).structuredClone = (global as any).structuredClone || ((val: any) => JSON.parse(JSON.stringify(val)));

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

  it('should handle NaN values without schema validation', () => {
    const { result } = renderHook(() => useCalculatorLogic(mockConfig));

    act(() => {
      result.current.setInputValue('val1', 'not-a-number');
      result.current.setInputValue('val2', '5');
    });

    act(() => {
      result.current.calculate();
    });

    expect(result.current.error).toBe('Valores inválidos');
    expect(result.current.result).toBeNull();
  });

  it('should handle empty string as zero value', () => {
    const { result } = renderHook(() => useCalculatorLogic(mockConfig));

    act(() => {
      result.current.setInputValue('val1', '');
      result.current.setInputValue('val2', '5');
    });

    act(() => {
      result.current.calculate();
    });

    expect(result.current.result).not.toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should handle both values as NaN', () => {
    const { result } = renderHook(() => useCalculatorLogic(mockConfig));

    act(() => {
      result.current.setInputValue('val1', 'abc');
      result.current.setInputValue('val2', 'xyz');
    });

    act(() => {
      result.current.calculate();
    });

    expect(result.current.error).toBe('Valores inválidos');
    expect(result.current.result).toBeNull();
  });

  describe('with Zod schema validation', () => {
    const schemaConfig: CalculatorConfig<'a' | 'b'> = {
      inputs: ['a', 'b'],
      calculateFn: (a: number, b: number) => a + b,
      validationSchema: z.object({
        a: z.number().positive({ message: 'A must be positive' }),
        b: z.number().positive({ message: 'B must be positive' }),
      }),
    };

    it('should validate with Zod schema and show field errors', () => {
      const { result } = renderHook(() => useCalculatorLogic(schemaConfig));

      act(() => {
        result.current.setInputValue('a', '-5');
        result.current.setInputValue('b', '10');
      });

      act(() => {
        result.current.calculate();
      });

      expect(result.current.error).toBe('A must be positive');
      expect(result.current.fieldErrors.a).toBe('A must be positive');
      expect(result.current.result).toBeNull();
    });

    it('should show error for invalid number with schema', () => {
      const { result } = renderHook(() => useCalculatorLogic(schemaConfig));

      act(() => {
        result.current.setInputValue('a', 'invalid');
        result.current.setInputValue('b', '10');
      });

      act(() => {
        result.current.calculate();
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.result).toBeNull();
    });

    it('should pass validation with valid positive numbers', () => {
      const { result } = renderHook(() => useCalculatorLogic(schemaConfig));

      act(() => {
        result.current.setInputValue('a', '5');
        result.current.setInputValue('b', '10');
      });

      act(() => {
        result.current.calculate();
      });

      expect(result.current.result).not.toBeNull();
      expect(result.current.error).toBeNull();
    });
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
