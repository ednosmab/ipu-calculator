# Roadmap - Implementação Industrial (Alinhado ao Projeto)

## 🎯 Objetivo

Aplicar identidade visual industrial mantendo os padrões existentes:
- Fundo profundo: `#0B0C0F`
- Destaque neon: `#00F5D4`

---

## Fase 1: Design System & Tokens

### Estrutura

```
src/design-system/theme.ts
```

###STATUS: ✅ Parcial (precisa ajuste de cores)

### Tarefas

- [ ] Atualizar `theme.colors` para padrão industrial
- [ ] Manter estrutura existente (spacing, roundness, typography)

### Tokens Propostos

```typescript
colors: {
  bg: '#0B0C0F',           // Fundo profundo (atual: #0F1115)
  surface: '#121418',        // Cards (atual: #1C1F26)
  primary: '#00F5D4',     // Verde Neon (atual: #649991)
  primaryDim: 'rgba(0, 245, 212, 0.1)',
  primaryDark: '#00B89C',  // Versão escura do primary
  text: '#FFFFFF',          // (atual: #C5C9D1)
  textSecondary: '#9BA1A6', // (atual: #717984)
  border: '#2C3036',       // (atual: #313943)
  error: '#FF3B30',       // (atual: #E57373)
}
```

---

## Fase 2: Hook de Lógica

### Estrutura

```
src/hooks/useCalculatorLogic.ts
src/features/ipu/hooks/useIPUCalculator.ts
```

###STATUS: ✅ Ja existe (manter padrão)

### Tarefas

- [ ] Nenhum ajuste necessário no hook
- [ ] O pattern atual suporta resultado null → "—"

### Resultado Null

O resultado já pode ser null. A tela exibe "—" quando:

```tsx
{result !== null && <ResultCard result={result} />}
```

---

## Fase 3: Interface de Injeção

### Estrutura

```
src/features/ipu/screens/IPUScreen.tsx
src/components/ResultCard.tsx
```

###STATUS: ✅ Parcial (precisa ajuste visual)

### Tarefas

- [ ] Exibir "—" quando result for null (inverter condição)
- [ ] Aplicar theme industrial nos componentes
- [ ] Labels já estão em português via i18n (manter)

### Ajuste na Screen

```tsx
// Atual (exibe só se !== null)
{result !== null && <ResultCard result={result} />}

// Novo (exibe sempre, com "—" se null)
<ResultCard result={result ?? '—'} />
```

---

## Fase 4: Internacionalização

### Estrutura

```
src/i18n/translations.ts
```

###STATUS: ✅ Já existe (PT/EN implementado)

### Tarefas

- [ ] Adicionar novos labels se necessário

### Nenhum ajuste necessário

O i18n já suportaPT/EN. Labels existentes:
- `isocyanate`: "Isocianato" / "Isocyanate"
- `polyol`: "Poliol" / "Polyol"
- `result`: "Valor Calculado" / "Calculated Value"

---

## 🔄 Ordem de Execução

1. **Fase 1** - theme.ts (cores)
2. **Fase 3** - IPUScreen + ResultCard (exibir "—")
3. **Fase 2** - Hook (nenhuma mudança)
4. **Fase 4** - i18n (verificar labels)

---

## ✅ Critérios de Aceitação

- [ ] Fundo `#0B0C0F` (ou similar dark)
- [ ] primary `#00F5D4` em CTAs
- [ ] Resultado exibe "—" quando null
- [ ] Labels via i18n (PT/EN)
- [ ] Estrutura Hook Genérico + Específico mantida

---

## 📋 Referência: Estrutura Atual

```
src/
├── components/              # Globais (ResultCard, ScreenLayout)
├── design-system/
│   ├── components/        # Button, Input, Card, Text, HStack, VStack
│   └── theme.ts          # Tokens (cores, spacing, typography)
├── features/
│   └── ipu/
│       ├── domain/       # calculateIPU.ts, ipuSchema.ts
│       ├── hooks/       # useIPUCalculator.ts
│       └── screens/     # IPUScreen.tsx
├── hooks/
│   └── useCalculatorLogic.ts  # Hook genérico
└── i18n/
    └── translations.ts    # PT/EN
```

---

## ⚠️ O que NÃO alterar

- Estrutura de pastas (features/ipu/domain...)
- Padrão Hook Genérico + Específico
- Nomenclatura em inglês (isocyanate, polyol)
- Componentes existentes (Button, Input, Card...)
- i18n (manter estrutura atual)