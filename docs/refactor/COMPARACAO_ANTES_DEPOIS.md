# Comparação Antes vs Depois - Correções de Bugs

## Bug #1: PWA Update Detection

### ANTES (Problemático)
```typescript
// src/hooks/useServiceWorkerUpdate.ts
const handleControllerChange = useCallback(() => {
  if (!hasShownRef.current) {
    hasShownRef.current = true;
    setUpdateAvailable(true);  // ❌ SEMPRE mostra update na primeira mudança
  }
}, []);

useEffect(() => {
  if (typeof window === 'undefined') return;

  navigator.serviceWorker?.addEventListener('message', handleSWMessage);
  navigator.serviceWorker?.addEventListener('controllerchange', handleControllerChange);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkForUpdate();
    }
  });

  setTimeout(checkForUpdate, 1000);  // ❌ Checa sempre após 1s no mount
  
  return () => {
    navigator.serviceWorker?.removeEventListener('message', handleSWMessage);
    navigator.serviceWorker?.removeEventListener('controllerchange', handleControllerChange);
  };
}, [handleSWMessage, handleControllerChange, checkForUpdate]);
```

**Problema:** 
- O evento `controllerchange` dispara na primeira carga
- `setTimeout` checa sempre sem contexto
- Usuário vê banner mesmo sem atualização real

---

### DEPOIS (Corrigido)
```typescript
// src/hooks/useServiceWorkerUpdate.ts
const isInitializedRef = useRef(false);  // ✅ NOVO

const handleControllerChange = useCallback(() => {
  // ✅ NOVO: Ignorar primeira mudança (é normal no load)
  if (!isInitializedRef.current) {
    isInitializedRef.current = true;
    return;
  }
  
  if (!hasShownRef.current) {
    hasShownRef.current = true;
    setUpdateAvailable(true);  // Apenas se realmente atualizou
  }
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

  // ❌ REMOVIDO: setTimeout(checkForUpdate, 1000);
  
  return () => {
    navigator.serviceWorker?.removeEventListener('message', handleSWMessage);
    navigator.serviceWorker?.removeEventListener('controllerchange', handleControllerChange);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}, [handleSWMessage, handleControllerChange, checkForUpdate]);
```

**Benefícios:**
- ✅ Ignora primeira mudança (esperada no load)
- ✅ Sem setTimeout falso positivo
- ✅ Apenas dispara para atualizações reais
- ✅ Verifica quando aba fica visível novamente

---

## Bug #2: Null Pointer em toFixed()

### ANTES (Crash)
```typescript
// src/features/models/components/ModelCard.tsx (linha 58)
<View style={styles.timeRow}>
  <Text style={styles.timeLabel}>Tempo:</Text>
  <Text style={styles.timeValue}>
    {model.inputs.injectionTime.toFixed(2).replace('.', ',')}s
    {/* ❌ CRASH se injectionTime for null/undefined */}
  </Text>
</View>
```

**Erro no console:**
```
TypeError: Cannot read properties of null (reading 'toFixed')
  at ModelCard.tsx:58
  at renderWithHooks
  ...
ErrorBoundary fallback: "Algo deu errado"
```

---

### DEPOIS (Seguro)
```typescript
// src/features/models/components/ModelCard.tsx

// ✅ NOVO: Helper com validação
const formatInjectionTime = (time: number | null | undefined): string => {
  if (time == null) return 'N/A';
  return `${time.toFixed(2).replace('.', ',')}s`;
};

// Então usar:
<View style={styles.timeRow}>
  <Text style={styles.timeLabel}>Tempo:</Text>
  <Text style={styles.timeValue}>
    {formatInjectionTime(model.inputs.injectionTime)}
    {/* ✅ Retorna "N/A" se nulo, "123,45s" se válido */}
  </Text>
</View>
```

**Benefícios:**
- ✅ Sem crash mesmo com dados nulos
- ✅ UX clara com "N/A" em vez de erro
- ✅ Reutilizável em outros componentes
- ✅ Fácil de testar

---

## Bug #3: Teclado iPhone Sem Ponto

### ANTES (Não funciona no iOS)
```typescript
// src/features/ipu/screens/IPUScreen.tsx (linhas 150, 158)

<Input
  ref={isoRef}
  label={t('isocyanate')}
  value={isocyanate}
  onChange={setIsocyanate}
  error={fieldErrors.isocyanate ?? undefined}
  keyboardType="numeric"  {/* ❌ iOS NÃO mostra ponto com "numeric" */}
/>

<Input
  ref={polyolRef}
  label={t('polyol')}
  value={polyol}
  onChange={setPolyol}
  error={fieldErrors.polyol ?? undefined}
  keyboardType="numeric"  {/* ❌ iOS NÃO mostra ponto com "numeric" */}
/>
```

**Resultado no iOS:**
```
Teclado exibido: [1] [2] [3]
                [4] [5] [6]
                [7] [8] [9]
                [0]
❌ Sem ponto decimal!
```

**Resultado no Android:**
```
Teclado exibido: [1] [2] [3]
                [4] [5] [6]
                [7] [8] [9]
                [0] [.] ← Funciona
✅ Com ponto!
```

---

### DEPOIS - Opção 1 (Rápida)
```typescript
// src/features/ipu/screens/IPUScreen.tsx

<Input
  ref={isoRef}
  label={t('isocyanate')}
  value={isocyanate}
  onChange={setIsocyanate}
  error={fieldErrors.isocyanate ?? undefined}
  keyboardType="decimal-pad"  {/* ✅ Funciona em iOS e Android */}
/>

<Input
  ref={polyolRef}
  label={t('polyol')}
  value={polyol}
  onChange={setPolyol}
  error={fieldErrors.polyol ?? undefined}
  keyboardType="decimal-pad"  {/* ✅ Funciona em iOS e Android */}
/>
```

**Resultado em ambas plataformas:**
```
Teclado exibido: [1] [2] [3]
                [4] [5] [6]
                [7] [8] [9]
                [0] [.] ← Agora funciona em iOS!
✅ Ponto decimal visível e funcional
```

---

### DEPOIS - Opção 2 (Centralizada - Recomendada)
```typescript
// src/design-system/components/Input.tsx
import { Platform } from 'react-native';

const normalizedKeyboardType: KeyboardTypeOptions = (() => {
  // ✅ NOVO: Corrigir type quando "numeric" é usado no iOS
  if (keyboardType === 'numeric' && Platform.OS === 'ios') {
    return 'decimal-pad';
  }
  return keyboardType;
})();

<TextInput
  // ... outras props
  keyboardType={normalizedKeyboardType}  {/* ✅ Automático */}
/>
```

**Vantagem:** 
- Uma mudança fixa todos os inputs numéricos em todo o app
- Não precisa mudar `IPUScreen.tsx` (mas é bom documentar)
- Behavior consistente em todas as telas

---

## 📊 Comparação de Impacto

### Bug #1: PWA Updates
```
ANTES:  Abertura → Controller muda → Banner mostra → Confuso
DEPOIS: Abertura → Controller muda → Ignorado → Sem banner falso
        (Update real) → Banner mostra → Usuário atualiza
```

### Bug #2: Null Crash
```
ANTES:  Abrir modelos → Render ModelCard → Crash em toFixed()
DEPOIS: Abrir modelos → Render ModelCard → Mostra "N/A" → Tudo OK
```

### Bug #3: Keyboard
```
ANTES (iOS):  Clicar no input → "numeric" keyboard sem ponto → Impossível digitar decimal
DEPOIS (iOS): Clicar no input → "decimal-pad" keyboard com ponto → Funciona!

ANTES (Android): Funciona
DEPOIS (Android): Continua funcionando + agora melhor documentado
```

---

## 🔍 Arquivos Alterados - Resumo

| Arquivo | Bug | Mudança | Tipo |
|---------|-----|---------|------|
| `useServiceWorkerUpdate.ts` | #1 | +1 ref, -1 setTimeout, +guard | Lógica |
| `ModelCard.tsx` | #2 | +helper fn, +null check | Renderização |
| `IPUScreen.tsx` | #3 | 2x keyboardType change | Props |
| `Input.tsx` | #3 | +Platform check | Normalização |

---

## ✅ Validação Pós-Implementação

### Teste Bug #1
```typescript
// Deve passar após correção
describe('useServiceWorkerUpdate - no false positives', () => {
  it('should not show update banner on first controller change', () => {
    // Mock initial registration
    const { result } = renderHook(() => useServiceWorkerUpdate());
    
    // Simular primeira mudança de controlador
    dispatchControllerChange();
    
    expect(result.current.updateAvailable).toBe(false);
  });
});
```

### Teste Bug #2
```typescript
// Deve passar após correção
describe('ModelCard - null safety', () => {
  it('should display N/A instead of crashing', () => {
    const model = { inputs: { injectionTime: null } };
    expect(() => render(<ModelCard model={model} {...props} />)).not.toThrow();
  });
});
```

### Teste Bug #3
```typescript
// Deve passar após correção
describe('numeric keyboard type - iOS compatibility', () => {
  it('should use decimal-pad on iOS', () => {
    Platform.OS = 'ios';
    const { getByTestId } = render(<IPUScreen {...props} />);
    expect(getByTestId('iso-input').props.keyboardType).toBe('decimal-pad');
  });
});
```

---

## 🎯 Checklist de Implementação

### Bug #1 (PWA)
- [ ] Backup de `useServiceWorkerUpdate.ts`
- [ ] Copiar código fixo
- [ ] Adicionar `isInitializedRef`
- [ ] Remover `setTimeout`
- [ ] Testar com deploy local
- [ ] Verificar se updates reais ainda funcionam

### Bug #2 (Null)
- [ ] Backup de `ModelCard.tsx`
- [ ] Adicionar `formatInjectionTime` helper
- [ ] Atualizar linha 58
- [ ] Verificar `HistoryList.tsx` para pattern similar
- [ ] Testar abertura de modelos
- [ ] Testar com dados nulos (forçar no DB)

### Bug #3 (Keyboard)
- [ ] Testar em iPhone/iPad
- [ ] Verificar se teclado mostra ponto
- [ ] Testar digitação de decimal
- [ ] Verificar em Android (deve continuar funcionando)
- [ ] Testar em outras telas com inputs numéricos

---

## 📝 Notas de Merging

Se usar git:

```bash
# Bug #2 - Prioridade 1 (Fix crash)
git checkout -b fix/model-card-null
# Copiar ModelCard.tsx.fixed
git add src/features/models/components/ModelCard.tsx
git commit -m "fix: prevent null pointer in ModelCard.toFixed()"
git push origin fix/model-card-null
# PR review → merge

# Bug #3 - Prioridade 2 (Fix iOS keyboard)
git checkout -b fix/ios-decimal-keyboard
# Copiar IPUScreen.tsx.fixed
git add src/features/ipu/screens/IPUScreen.tsx
git commit -m "fix: add decimal support for iOS numeric keyboard"
git push origin fix/ios-decimal-keyboard
# PR review → merge

# Bug #1 - Prioridade 3 (Improve PWA UX)
git checkout -b refactor/pwa-update-detection
# Copiar useServiceWorkerUpdate.ts.fixed
git add src/hooks/useServiceWorkerUpdate.ts
git commit -m "refactor: prevent false positive updates in PWA"
git push origin refactor/pwa-update-detection
# PR review → merge
```

---

## 🚀 Resumo Final

**3 bugs encontrados:**
- ✅ PWA - Banner de atualização falso positivo
- ✅ ModelCard - Crash por null em toFixed()
- ✅ Keyboard iOS - Sem ponto decimal

**Todos documentados com:**
- 📄 Causa raiz explicada
- 🔧 Código antes/depois
- ✅ Solução pronta para copiar
- 🧪 Testes recomendados
- ⏱️ Tempo estimado de implementação

**Total:** ~20 minutos para implementar todas as correções.

Sucesso! 🎉
