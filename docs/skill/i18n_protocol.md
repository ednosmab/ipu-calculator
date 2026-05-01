# SKILL: i18n Protocol (Internacionalização)

O app suporta dois idiomas: **Português Brasil (pt)** e **Inglês (en)**. Todo texto exibido ao usuário deve passar pelo sistema de traduções — nunca string hardcoded em JSX.

---

## 🏗️ Arquitetura

```
src/i18n/
  translations.ts         ← fonte única de todas as strings
  TranslationContext.tsx  ← Context + hook useTranslation
```

### Uso em tela

```tsx
import { useTranslation } from '@/i18n/TranslationContext';

const MyScreen = () => {
  const { t } = useTranslation();
  return <Text>{t('calculate')}</Text>; // nunca 'Calcular' hardcoded
};
```

---

## 📋 Regra de Ouro: Onde vai cada idioma

| O quê | Idioma | Exemplo |
|-------|--------|---------|
| Código (variáveis, funções, comentários) | **Inglês** | `const totalValue`, `// calculates ratio` |
| Textos exibidos ao usuário (labels, botões, mensagens) | **Português** (default) via `translations.ts` | `calculate: 'Calcular'` |
| Mensagens de erro Zod | **Português** (mensagem para usuário) | `z.number({ message: 'Informe um número válido' })` |
| Commit messages e docs técnicos | **Inglês** | `feat(i18n): add new translation key` |

---

## ➕ Adicionando uma nova string

**Passo 1:** Adicionar a chave em ambos os idiomas em `translations.ts`

```ts
// translations.ts
pt: {
  // ... existentes ...
  newFeatureLabel: 'Novo Recurso',
},
en: {
  // ... existentes ...
  newFeatureLabel: 'New Feature',
},
```

**Passo 2:** Usar via hook na tela

```tsx
<Button title={t('newFeatureLabel')} onPress={...} />
```

**Nunca** adicionar a chave em apenas um idioma — o TypeScript vai reclamar (o tipo é derivado das chaves de `pt`).

---

## 🔍 Checklist i18n

- [ ] Nenhuma string de UI hardcoded em JSX
- [ ] Chave nova adicionada em `pt` **e** `en`
- [ ] Mensagens de erro do Zod em Português
- [ ] Comentários de código em Inglês
- [ ] Teste de troca de idioma executado manualmente (ver smoke-tests)

---

## 📌 Nomenclatura padrão dos termos industriais

| Termo em PT | Chave | Versão EN |
|-------------|-------|-----------|
| Calcular Injeção | `calculateInjection` | Calculate Injection |
| Calibrar Vazão | `calibrateFlow` | Calibrate Flow |
| Isocianato | `isocyanate` | Isocyanate |
| Poliol | `polyol` | Polyol |
| Peso extraído | `extractedWeight` | Extracted Weight |
| Peso desejado | `targetWeight` | Target Weight |
| Valor da máquina | `machineValue` | Machine Value |
| Peso real | `actualWeight` | Actual Weight |

Estes termos são os oficiais do domínio Astra. Não usar sinônimos ou abreviações.

---

## 🚀 Evolução planejada

- Migração para plataforma externa (Transifex / Lokalise) quando o app expandir para mais idiomas
- Enquanto isso, manter `translations.ts` como fonte única — sem duplicar strings fora desse arquivo
