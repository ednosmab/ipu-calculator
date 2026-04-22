# 🧠 Antigravity Master Skill — Design System & Product Refinement

## 🎯 Objetivo

Transformar o projeto em um **Design System de nível produto**, garantindo:

* consistência visual absoluta
* arquitetura escalável
* UX clara e comercial
* componentes reutilizáveis completos
* eliminação total de inconsistências

---

## 🧩 Contexto

O projeto já possui:

* Design System funcional (`theme`, `Button`, `Input`, `Card`)
* Arquitetura por features
* Uso consistente dos tokens

Esta skill foca em **maturidade e escala**, não em estrutura inicial.

---

# 🏗️ FASE 1 — Consolidação Final do Design System

## 🔹 1.1 Garantir fonte única de verdade

* todos os estilos devem usar `theme`
* remover qualquer valor hardcoded restante

---

## 🔹 1.2 Corrigir tipagem

Substituir:

```ts
as any
```

Por tipagem segura:

```ts
type FontWeight = '400' | '500' | '600' | '700';
```

---

## 🔹 1.3 Padronizar espaçamentos especiais

Adicionar no `theme`:

```ts
spacing: {
  buttonSm: 10,
  buttonMd: 14,
  buttonLg: 18
}
```

---

---

# 🏗️ FASE 2 — Componentização Completa

## 🔹 2.1 Criar HStack (layout horizontal)

📄 `design-system/components/HStack.tsx`

```tsx
export const HStack = ({ children }) => (
  <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
    {children}
  </View>
);
```

---

## 🔹 2.2 Criar VStack

```tsx
export const VStack = ({ children }) => (
  <View style={{ flexDirection: 'column', gap: theme.spacing.md }}>
    {children}
  </View>
);
```

---

## 🔹 2.3 Criar Toggle (abstração do Switch)

```tsx
export const Toggle = ({ value, onChange }) => (
  <Switch
    value={value}
    onValueChange={onChange}
    trackColor={{
      false: theme.colors.border,
      true: theme.colors.primary,
    }}
    thumbColor={theme.colors.white}
  />
);
```

---

## 🔹 2.4 Evoluir Input

Adicionar suporte:

```ts
error?: string;
helperText?: string;
```

Render:

```tsx
{error && <Text style={styles.error}>{error}</Text>}
```

---

---

# 🏗️ FASE 3 — Padronização de Layout

## 🔹 3.1 Remover inline styles

Substituir:

```tsx
style={{ flex: 1, marginLeft: theme.spacing.sm }}
```

Por:

```tsx
<HStack>
```

---

## 🔹 3.2 Padronizar agrupamentos

* Inputs → sempre dentro de `Card`
* Ações → sempre agrupadas

---

---

# 🏗️ FASE 4 — Refinamento de UX (Produto)

## 🔹 4.1 Atualizar nomenclatura

```diff
Calculadora IPU → Injeção
Calibragem → Calibrar Vazão
Calibragem de Vazão → Ajuste de Vazão
```

---

## 🔹 4.2 Padronizar CTAs

```diff
Calcular IPU → Calcular Injeção
```

---

## 🔹 4.3 Melhorar labels técnicos (avaliar contexto)

```diff
Iso → Isocianato
Poliol → Poliol (manter ou expandir se necessário)
```

---

---

# 🏗️ FASE 5 — Evolução do ScreenLayout

Adicionar suporte:

```ts
centered?: boolean;
scrollable?: boolean;
```

---

Aplicar:

```ts
justifyContent: centered ? 'center' : 'flex-start'
```

---

---

# 🏗️ FASE 6 — Padronização de Imports

Substituir TODOS:

```ts
../../../
```

Por:

```ts
@/
```

---

---

# 🏗️ FASE 7 — Limpeza e Consistência

## Checklist obrigatório:

* [ ] nenhum inline style
* [ ] nenhum hardcode de cor
* [ ] nenhum `as any`
* [ ] nenhum componente nativo direto (Switch)
* [ ] todos inputs com suporte a erro
* [ ] todos layouts usando Stack
* [ ] nomenclatura consistente

---

---

# 🚀 Resultado Esperado

* Design System completo e reutilizável
* UX mais clara e comercial
* código pronto para escalar features futuras
* padrão consistente em todo o app

---

---

# 🎯 Critério de sucesso

* nenhuma inconsistência visual
* nenhum padrão duplicado
* componentes reutilizáveis para todos os casos
* arquitetura limpa e previsível

---

---

# ⚠️ Restrições

* não alterar regras de negócio
* não modificar cálculos
* não alterar fluxo de navegação

---

---

# 📌 Prioridade de execução

1. Fase 1 (crítica)
2. Fase 2 (estrutura DS)
3. Fase 3 (consistência)
4. Fase 4 (UX)
5. Fase 5 (layout)
6. Fase 6 (imports)
7. Fase 7 (finalização)

---

---

# 🧠 Instrução de execução

Execute todas as fases garantindo compatibilidade com o código existente e mantendo o Design System como única fonte de verdade.
