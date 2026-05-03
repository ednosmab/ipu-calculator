# SKILL: Testing Protocol

Este projeto possui quatro níveis de teste. Cada nível tem seu escopo e ferramentas. Nunca pule um nível ao validar uma feature nova ou uma correção de bug.

---

## 🔢 Níveis de Teste

### Nível 1 — Unitário (Jest)

Valida funções puras de domínio e serviços isolados.

**Onde:** `src/features/*/domain/__tests__/` e `src/features/*/application/__tests__/`

**Foco:**
- Funções de cálculo (`calculateIPU`, `calculateCalibration`)
- Schemas Zod (casos válidos e inválidos)
- `schemaMigrationService` (migração de formato legado)
- `modelRepository` isolado com AsyncStorage mockado

**Rodar:**
```bash
npm test -- --testPathPattern="domain|application"
```

---

### Nível 2 — Integração (Jest + RNTL)

Valida telas e hooks com mocks de infraestrutura.

**Onde:** `src/features/*/screens/*.test.tsx`, `src/hooks/__tests__/`

**Foco:**
- `IPUScreen`, `CalibrationScreen`: inputs, submit, exibição de resultado
- `useCalculatorLogic`: validação, reset, estados de erro
- `useRealtimeModels`: subscribe/unsubscribe, atualização de lista

**Rodar:**
```bash
npm run test:integration
```

**Regras de mock:**
- AsyncStorage → mock via `jest.setup.js`
- Supabase → mock manual em `__mocks__/`
- NetInfo → mock via `jest.setup.js`
- Nunca mockar funções de domínio (elas devem ser testadas reais)

---

### Nível 3 — Fumaça (Manual)

Executar antes de qualquer merge para `develop` ou `main`. Ver `docs/smoke-tests.md` para checklist completo.

**Fluxo mínimo obrigatório:**
1. Abrir app → sem crash na tela inicial
2. Calcular IPU com dados padrão → resultado `1.6264`
3. Calibrar vazão com dados padrão → resultado `1.162`
4. Criar modelo → aparece na lista
5. Trocar idioma PT/EN → todos os textos mudam
6. Criar modelo offline → badge `pending` aparece → reconectar → badge some

---

### Nível 4 — E2E (Playwright)

Valida fluxos críticos no PWA em ambiente real.

**Arquivo:** `e2e/realtime-sync.spec.ts`

**Rodar:**
```bash
npm run test:e2e
```

**Cenários cobertos:**
- Sync em tempo real entre abas (INSERT, UPDATE, DELETE via Supabase)
- Comportamento offline + reconexão

**Nota:** os testes E2E requerem variáveis de ambiente do Supabase configuradas. Em CI, verificar `ci.yml` para a injeção de secrets.

---

## 📋 Scripts disponíveis

```bash
npm test                    # todos os 85 testes
npm test -- --watch         # watch mode
npm test -- --coverage      # com relatório de cobertura
npm run test:lint           # design system (Button, Input, Card, Text)
npm run test:core           # core (formatters, parsers)
npm run test:features       # lógica de domínio
npm run test:integration    # screens + hooks
npm run test:e2e            # Playwright
```

---

## 🧱 Estrutura de um Teste de Domínio

```ts
// src/features/ipu/domain/__tests__/calculateIPU.test.ts
import { calculateIPU } from '../calculateIPU';

describe('calculateIPU', () => {
  it('retorna valor correto para inputs padrão', () => {
    const result = calculateIPU({ isocyanate: 0.0771, polyol: 0.1506 });
    expect(result).toBeCloseTo(1.6264, 4);
  });

  it('lança erro para isocianato zero', () => {
    expect(() => calculateIPU({ isocyanate: 0, polyol: 0.15 }))
      .toThrow();
  });
});
```

---

## 🧱 Estrutura de um Teste de Tela

```tsx
// src/features/ipu/screens/IPUScreen.test.tsx
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { IPUScreen } from '../IPUScreen';
import { TranslationProvider } from '@/i18n/TranslationContext';

const renderScreen = () =>
  render(
    <TranslationProvider>
      <IPUScreen />
    </TranslationProvider>
  );

it('exibe resultado ao calcular com inputs válidos', async () => {
  const { getByPlaceholderText, getByText } = renderScreen();
  fireEvent.changeText(getByPlaceholderText('Isocianato'), '0.0771');
  fireEvent.changeText(getByPlaceholderText('Poliol'), '0.1506');
  fireEvent.press(getByText('Calcular'));
  await waitFor(() => expect(getByText('1.6264')).toBeTruthy());
});
```

---

## ⚠️ Regras inegociáveis

- **Nunca avançar** para a próxima fase com um teste falhando
- **Nunca skipar** testes sem registrar o motivo (ver teste skipped em `useRealtimeModels`)
- **Dados de teste** são documentados em `docs/smoke-tests.md` — não inventar valores ad hoc
- **Mocks de AsyncStorage** são configurados globalmente em `jest.setup.js` — não reconfigurar por arquivo
