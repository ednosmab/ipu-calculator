# 🧠 Skill: Design System & Product Refinement

## 🎯 Objetivo

Manter consistência visual e escalabilidade do Design System.

## ✅ Status Atual (Abril 2026)

### Componentes Implementados

| Componente | Arquivo | Status |
|-----------|--------|--------|
| Button | `components/Button.tsx` | ✅ |
| Input | `components/Input.tsx` | ✅ error + helperText |
| Card | `components/Card.tsx` | ✅ |
| Text | `components/Text.tsx` | ✅ |
| Title | `components/Title.tsx` | ✅ |
| HStack | `components/HStack.tsx` | ✅ |
| VStack | `components/VStack.tsx` | ✅ |
| Toggle | `components/Toggle.tsx` | ✅ |
| ScreenLayout | `components/ScreenLayout.tsx` | ✅ |
| ResultCard | `components/ResultCard.tsx` | ✅ |

### Tokens do Theme

```typescript
// theme.ts
colors: { primary, secondary, background, text, input, border, error, success... }
spacing: { xs, sm, md, lg, xl }
typography: { sizes, weights }
borderWidth: { thin, medium, thick }
roundness: { sm, md, lg }
```

---

## 🏗️ Regras de Implementação

### 1. Estilos

- ✅ Usar `theme` para todas as definições de estilo
- ❌ Sem valores hardcoded
- ❌ Sem inline styles em telas

### 2. Tipagem

- ✅ Tipos explícitos
- ❌ Evitar `as any`

### 3. Layout

- ✅ Usar HStack/VStack para agrupamento
- ✅ Inputs dentro de Card

### 4. Imports

- ✅ Usar path alias `@/`

---

## 📋 Checklist de Qualidade

- [x] Nenhum inline style
- [x] Nenhum hardcode de cor
- [x] Nenhum `as any`
- [x] Inputs com suporte a error
- [x] Layouts usando Stack
- [x] Nomenclatura consistente
- [x] Theme como única fonte de verdade

---

## 🚀 Padrões por Tipo de Tela

### Tela de Cálculo

```tsx
<ScreenLayout title="Injeção">
  <Card>
    <VStack>
      <Input label="Isocianato" value={...} onChange={...} error={...} />
      <Input label="Poliol" value={...} onChange={...} error={...} />
    </VStack>
  </Card>
  <Button title="Calcular" onPress={calculate} />
  <ResultCard result={result} />
</ScreenLayout>
```

---

## 📌 Nomenclatura

| Antes | Depois |
|-------|--------|
| Calcular IPU | Calcular Injeção |
| Calibragem | Calibrar Vazão |
| Iso | Isocianato |