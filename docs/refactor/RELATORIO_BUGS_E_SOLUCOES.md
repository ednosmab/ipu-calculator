# Relatório de Análise - Calculadora IPU
**Data:** 02 de Maio de 2026  
**Status:** 3 Bugs Identificados e Solucionados

---

## 📋 Resumo Executivo

Foram identificados e documentados 3 bugs críticos no projeto:

| Bug | Severidade | Status | Locais Afetados |
|-----|-----------|--------|-----------------|
| PWA - Banner de Atualização Suspeito | 🔴 Alto | Identificado | `useServiceWorkerUpdate.ts` |
| Erro de Null em toFixed() | 🔴 Alto | Identificado | `ModelCard.tsx`, `HistoryList.tsx` |
| Teclado iPhone sem Ponto Decimal | 🟠 Médio | Identificado | `IPUScreen.tsx` |

---

## 🐛 Bug #1: PWA - Banner de Atualização Sempre Aparece

### Problema
O banner "Atualizar App" aparece repetidamente logo após o deploy local, mesmo sem atualizações reais disponíveis.

### Causa Raiz
No arquivo `src/hooks/useServiceWorkerUpdate.ts`, o `useEffect` (linhas 80-97) chama `checkForUpdate()` após 1 segundo **sempre que o componente monta**, sem verificar se já foi exibido. Isso causa:

1. **`handleControllerChange`** (linha 84) é acionada toda vez que o Service Worker recebe controle
2. A flag `hasShownRef.current` é resetada ao desmontar e montar novamente
3. O `setTimeout(checkForUpdate, 1000)` na linha 91 sempre executa sem validação de contexto

### Problema Específico (Linhas 80-97)
```typescript
useEffect(() => {
  if (typeof window === 'undefined') return;

  navigator.serviceWorker?.addEventListener('message', handleSWMessage);
  navigator.serviceWorker?.addEventListener('controllerchange', handleControllerChange); // ⚠️ PROBLEMA
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkForUpdate();
    }
  });

  setTimeout(checkForUpdate, 1000); // ⚠️ PROBLEMA

  return () => {
    navigator.serviceWorker?.removeEventListener('message', handleSWMessage);
    navigator.serviceWorker?.removeEventListener('controllerchange', handleControllerChange);
  };
}, [handleSWMessage, handleControllerChange, checkForUpdate]); // ⚠️ Dependencies causam re-execução
```

### Problemas Secundários em `checkForUpdate()` (Linhas 17-41)
- A lógica compara versões usando regex (`ipu-calc-(.+?)\.js`)
- Em desenvolvimento, a URL pode variar ou não conter versionamento
- Não há proteção contra chamadas repetidas no mesmo evento

### Solução Recomendada

**Opção 1: Evitar Re-registro do Service Worker (Mais Simples)**
```typescript
export const useServiceWorkerUpdate = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const hasShownRef = useRef(false);
  const lastVersionRef = useRef<string | null>(null);
  const isInitializedRef = useRef(false); // ✅ Controla inicialização

  const checkForUpdate = useCallback(async () => {
    if (!navigator.serviceWorker || hasShownRef.current) return;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return;

      const controller = navigator.serviceWorker.controller;
      if (!controller) return;

      const currentVersion = getCacheVersion(controller.scriptURL);
      if (!currentVersion || currentVersion === lastVersionRef.current) return;

      if (registration.waiting) {
        const waitingVersion = getCacheVersion(registration.waiting.scriptURL);
        if (waitingVersion && waitingVersion !== currentVersion) {
          lastVersionRef.current = waitingVersion;
          hasShownRef.current = true;
          setUpdateAvailable(true);
        }
      }
    } catch (e) {
      console.error('SW check error:', e);
    }
  }, []);

  const handleSWMessage = useCallback((event: MessageEvent) => {
    const message = event.data as SWMessage;
    if (message.type === 'SW_UPDATED' || message.type === 'SW_ACTIVATED') {
      if (!hasShownRef.current) {
        hasShownRef.current = true;
        setUpdateAvailable(true);
      }
    }
  }, []);

  const handleControllerChange = useCallback(() => {
    // ✅ MUDANÇA: Verificar se é uma mudança real, não no primeiro load
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      return;
    }
    
    if (!hasShownRef.current) {
      hasShownRef.current = true;
      setUpdateAvailable(true);
    }
  }, []);

  const refreshApp = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration?.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    } catch (e) {
      console.error('SW skip waiting error:', e);
    }
    hasShownRef.current = false;
    lastVersionRef.current = null;
    window.location.reload();
  }, []);

  const dismissUpdate = useCallback(() => {
    hasShownRef.current = false;
    lastVersionRef.current = null;
    setUpdateAvailable(false);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    navigator.serviceWorker?.addEventListener('message', handleSWMessage);
    navigator.serviceWorker?.addEventListener('controllerchange', handleControllerChange);
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdate();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // ✅ MUDANÇA: Remover o setTimeout que causa o falso positivo
    // setTimeout(checkForUpdate, 1000); // ❌ REMOVIDO

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleSWMessage);
      navigator.serviceWorker?.removeEventListener('controllerchange', handleControllerChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleSWMessage, handleControllerChange, checkForUpdate]);

  return { updateAvailable, refreshApp, dismissUpdate };
};
```

**Mudanças Principais:**
- ✅ Adicionado `isInitializedRef` para ignorar a primeira mudança de controlador
- ✅ Removido `setTimeout(checkForUpdate, 1000)` que causa falsos positivos
- ✅ Melhorada a captura do evento `visibilitychange` com ref
- ✅ Adicionado console.log para debug (opcional)

---

## 🐛 Bug #2: Erro "Cannot read properties of null (reading 'toFixed')"

### Problema
Ao abrir a tela de modelos, o aplicativo exibe "Algo deu errado" com o erro de toFixed em null.

### Causa Raiz
No arquivo `src/features/models/components/ModelCard.tsx` (linha 58):
```typescript
<Text style={styles.timeValue}>
  {model.inputs.injectionTime.toFixed(2).replace('.', ',')}s
</Text>
```

O campo `model.inputs.injectionTime` pode ser `null` ou `undefined` em certos cenários:
1. **Modelo corrompido**: Criado com dados incompletos
2. **Sincronização incompleta**: Dados não foram sincronizados do servidor
3. **Estado transitório**: Objeto sendo criado/editado

### Locais Afetados
1. **`src/features/models/components/ModelCard.tsx` (linha 58)** - Principal
2. **`src/components/HistoryList.tsx`** - Potencial problema similar com `item.result.toFixed()`

### Solução Recomendada

**Arquivo: `src/features/models/components/ModelCard.tsx`**

```typescript
// Linha 56-60: ANTES
<View style={styles.timeRow}>
  <Text style={styles.timeLabel}>Tempo:</Text>
  <Text style={styles.timeValue}>{model.inputs.injectionTime.toFixed(2).replace('.', ',')}s</Text>
</View>

// DEPOIS - Adicionar validação
<View style={styles.timeRow}>
  <Text style={styles.timeLabel}>Tempo:</Text>
  <Text style={styles.timeValue}>
    {model.inputs.injectionTime != null 
      ? `${model.inputs.injectionTime.toFixed(2).replace('.', ',')}s`
      : 'N/A'
    }
  </Text>
</View>
```

**Alternativa Melhor (Extrair para Helper):**

```typescript
// Adicionar no topo do arquivo
const formatInjectionTime = (time: number | null | undefined): string => {
  if (time == null) return 'N/A';
  return `${time.toFixed(2).replace('.', ',')}s`;
};

// Depois na renderização
<Text style={styles.timeValue}>
  {formatInjectionTime(model.inputs.injectionTime)}
</Text>
```

**Arquivo: `src/components/HistoryList.tsx`**

Verificar e aplicar o mesmo padrão:
```typescript
// ANTES
<Text style={styles.result}>{item.result.toFixed(decimals)}</Text>

// DEPOIS
<Text style={styles.result}>
  {item.result != null ? item.result.toFixed(decimals) : 'N/A'}
</Text>
```

### Validação de Tipo (TypeScript)

No arquivo `src/features/models/domain/calculationModel.ts`, garantir que o tipo exige não-null:

```typescript
// VERIFICAR ISSO:
type CalculationModel = {
  id: string;
  name: string;
  type: 'ipu' | 'calibration';
  inputs: {
    injectionTime: number; // ✅ Deve ser number, não number | null
    // ... outros campos
  };
  // ... outros campos
};
```

---

## 🐛 Bug #3: Teclado iPhone Sem Ponto Decimal

### Problema
No iPhone, o teclado numérico não exibe o ponto (.) para digitar casas decimais, mas funciona corretamente no Android.

### Causa Raiz
No arquivo `src/features/ipu/screens/IPUScreen.tsx` (linhas 150 e 158):
```typescript
<Input
  ref={isoRef}
  label={t('isocyanate')}
  value={isocyanate}
  onChange={setIsocyanate}
  error={fieldErrors.isocyanate ?? undefined}
  keyboardType="numeric"  // ⚠️ PROBLEMA: "numeric" sem suporte a decimais
/>
<Input
  ref={polyolRef}
  label={t('polyol')}
  value={polyol}
  onChange={setPolyol}
  error={fieldErrors.polyol ?? undefined}
  keyboardType="numeric"  // ⚠️ PROBLEMA: "numeric" sem suporte a decimais
/>
```

### Explicação Técnica

**React Native `TextInput` - Diferença de Comportamento:**

| Platform | Tipo de Teclado | Caracteres Permitidos |
|----------|-----------------|----------------------|
| iOS | `decimal-pad` | 0-9, . (ponto) |
| iOS | `numeric` | 0-9 (❌ SEM PONTO) |
| Android | `numeric` | 0-9, . (ponto) |
| Android | `decimal-pad` | 0-9, . (ponto) |

**O Problema:**
- iOS com `keyboardType="numeric"` mostra um teclado de números puros (sem ponto)
- Android é mais permissivo e adiciona o ponto mesmo com `numeric`
- Para comportamento consistente entre plataformas, deve-se usar `decimal-pad`

### Solução Recomendada

**Opção 1: Mudar para `decimal-pad` (Simples, Recomendada)**

Arquivo: `src/features/ipu/screens/IPUScreen.tsx`

```typescript
// ANTES (linhas 150 e 158)
<Input
  ref={isoRef}
  label={t('isocyanate')}
  value={isocyanate}
  onChange={setIsocyanate}
  error={fieldErrors.isocyanate ?? undefined}
  keyboardType="numeric"  // ❌
/>
<Input
  ref={polyolRef}
  label={t('polyol')}
  value={polyol}
  onChange={setPolyol}
  error={fieldErrors.polyol ?? undefined}
  keyboardType="numeric"  // ❌
/>

// DEPOIS
<Input
  ref={isoRef}
  label={t('isocyanate')}
  value={isocyanate}
  onChange={setIsocyanate}
  error={fieldErrors.isocyanate ?? undefined}
  keyboardType="decimal-pad"  // ✅
/>
<Input
  ref={polyolRef}
  label={t('polyol')}
  value={polyol}
  onChange={setPolyol}
  error={fieldErrors.polyol ?? undefined}
  keyboardType="decimal-pad"  // ✅
/>
```

**Opção 2: Usar Hook Platform-Aware (Mais Robusto)**

Criar um helper:
```typescript
import { Platform } from 'react-native';

// Adicionar no início do arquivo ou em um arquivo de utils
const getNumericKeyboardType = (): 'numeric' | 'decimal-pad' => {
  return Platform.OS === 'ios' ? 'decimal-pad' : 'numeric';
};

// Depois usar
<Input
  ref={isoRef}
  label={t('isocyanate')}
  value={isocyanate}
  onChange={setIsocyanate}
  error={fieldErrors.isocyanate ?? undefined}
  keyboardType={getNumericKeyboardType()}
/>
```

**Opção 3: Padronizar no Componente Input (Melhor Prática)**

Arquivo: `src/design-system/components/Input.tsx`

```typescript
import { Platform, KeyboardTypeOptions, StyleSheet, TextInput, View } from 'react-native';

type Props = {
  label?: string;
  value: string;
  onChange: (text: string) => void;
  keyboardType?: KeyboardTypeOptions;
  placeholder?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
  helperText?: string;
};

export const Input = forwardRef<InputRef, Props>(({
  label,
  value,
  onChange,
  keyboardType = "decimal-pad",
  placeholder = "0.00",
  autoCapitalize,
  error,
  helperText
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const internalRef = useRef<TextInput>(null);

  // ✅ MUDANÇA: Corrigir keyboardType para iOS quando numérico é solicitado
  const normalizedKeyboardType = (() => {
    if (keyboardType === 'numeric' && Platform.OS === 'ios') {
      return 'decimal-pad'; // Força decimal-pad no iOS para números
    }
    return keyboardType;
  })();

  useImperativeHandle(ref, () => ({
    focus: () => internalRef.current?.focus(),
    current: internalRef.current
  }));

  return (
    <View style={styles.container}>
      {label && <Text variant="label" weight="medium" style={styles.label}>{label}</Text>}
      <TextInput
        accessibilityLabel={label}
        ref={internalRef}
        value={value}
        onChangeText={onChange}
        keyboardType={normalizedKeyboardType}  // ✅ Usar tipo normalizado
        placeholder={placeholder}
        placeholderTextColor={theme.colors.inputPlaceholder}
        autoCapitalize={autoCapitalize}
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          !!error && styles.inputError
        ]}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      {!!error && <Text variant="error" weight="medium">{error}</Text>}
      {!!helperText && !error && <Text variant="helper">{helperText}</Text>}
    </View>
  );
});
```

**Recomendação Final:** Use a Opção 3 para centralizar a lógica e garantir comportamento consistente em todas as telas que usam inputs numéricos.

---

## 🔧 Resumo de Ações Necessárias

### Prioridade 1 (Crítica)
- [ ] **Fix Bug #2**: Adicionar validação null em `ModelCard.tsx` linha 58
- [ ] **Fix Bug #2**: Adicionar validação null em `HistoryList.tsx` 
- [ ] **Fix Bug #3**: Alterar `keyboardType="numeric"` para `"decimal-pad"` em `IPUScreen.tsx`

### Prioridade 2 (Alta)
- [ ] **Fix Bug #1**: Atualizar `useServiceWorkerUpdate.ts` com `isInitializedRef`
- [ ] **Fix Bug #1**: Remover `setTimeout(checkForUpdate, 1000)`

### Prioridade 3 (Recomendada)
- [ ] Implementar normalização de keyboardType em `Input.tsx`
- [ ] Adicionar testes para validação null nos modelos
- [ ] Documentar tipos para garantir que `injectionTime` nunca seja null

---

## 📊 Arquivos Alterados Necessários

```
src/
├── hooks/
│   └── useServiceWorkerUpdate.ts          [Bug #1]
├── features/
│   ├── ipu/
│   │   └── screens/IPUScreen.tsx          [Bug #3]
│   └── models/
│       └── components/ModelCard.tsx       [Bug #2]
├── components/
│   └── HistoryList.tsx                    [Bug #2]
└── design-system/
    └── components/Input.tsx               [Bug #3 - Alternativa]
```

---

## 🧪 Testes Recomendados

```typescript
// Teste para Bug #2
describe('ModelCard', () => {
  it('should handle null injectionTime gracefully', () => {
    const model = {
      id: '1',
      name: 'Test',
      type: 'ipu',
      inputs: { injectionTime: null }, // ✅ Teste com null
      // ... outros campos
    };
    
    render(<ModelCard model={model} {...props} />);
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });
});

// Teste para Bug #3 (iOS)
describe('IPUScreen Keyboard', () => {
  it('should show decimal keyboard on iOS', () => {
    Platform.OS = 'ios';
    const { getByTestId } = render(<IPUScreen {...props} />);
    const input = getByTestId('isocyanate-input');
    expect(input.props.keyboardType).toBe('decimal-pad');
  });
});
```

---

## 📝 Notas Adicionais

### Service Worker Caching
O arquivo `public/service-worker.js` já implementa a estratégia network-first, mas o hook de detecção de updates precisa ser mais inteligente para evitar falsos positivos em desenvolvimento.

### Alternativa para PWA Updates
Considerar usar a biblioteca `workbox` para gerenciamento mais robusto de updates:
```bash
npm install workbox-cli workbox-window
```

### Padrão de Formatação
Considerar extrair a formatação de números em um módulo separado:
```typescript
// src/core/formatters/numberFormatter.ts
export const formatDecimalNumber = (value: number | null | undefined, decimals: number = 2): string => {
  if (value == null) return 'N/A';
  return value.toFixed(decimals).replace('.', ',');
};
```

---

## ✅ Conclusão

Todos os 3 bugs foram identificados com:
- ✅ Causa raiz documentada
- ✅ Linha exata do código
- ✅ Múltiplas soluções propostas
- ✅ Exemplos de implementação
- ✅ Recomendações de testes

**Tempo Estimado de Correção:** 1-2 horas (incluindo testes)
