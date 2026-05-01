# SKILL: Cache Versioning Protocol

Execute esta skill automaticamente antes de qualquer PR ou merge. Ela verifica se suas mudanças afetam o cache e orienta as ações necessárias.

---

## Quando Executar

Execute esta skill quando modificar:

- `src/features/models/domain/calculationModel.ts`
- `src/features/models/infra/modelRepository.ts`
- Qualquer arquivo que altere o formato salvo no AsyncStorage

---

## Como Executar

**Passo 1:** Analise suas mudanças

Responda:
1. A mudança adiciona, remove ou altera o tipo de algum campo?
2. O dado é persistido no AsyncStorage?

**Passo 2:** Se sim, a mudança afeta o cache

- **Incrementar `SCHEMA`** em `src/core/versioning/cacheVersion.ts`
- Formato: `'2.0.0' → '2.1.0'` (semver: major.minor.patch)

```ts
// Antes
SCHEMA: '2.0.0',

// Depois
SCHEMA: '2.1.0',
```

**Passo 3:** Verificar se há migração necessária

Se a mudança for complexa (ex: renomear campo ou converter tipo), considere adicionar migração no `schemaMigrationService`.

---

## Checklist Pré-Merge

- [ ] Analisei mudanças que afetam persistência
- [ ] Se sim, incrementei `CACHE_VERSION.SCHEMA`
- [ ] Testei que o app abre com cache velho (invalidado corretamente)

---

## Referência

Ver `src/core/versioning/cacheVersion.ts` para versão atual.