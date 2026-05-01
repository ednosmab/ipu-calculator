# SKILL: Error Handling & Observability

Toda falha silenciosa é um bug em produção que nunca será corrigido. Este projeto usa três camadas de observabilidade: logger estruturado, ErrorBoundary e Sentry.

---

## 🪵 Logger Estruturado

**Arquivo:** `src/core/logging/logger.ts`

Usar sempre o `logger`, nunca `console.log` direto em código de produção.

```ts
import { logger } from '@/core/logging/logger';

// ✅ CORRETO
logger.info('[modelRepository] Cache expirado — iniciando refresh');
logger.warn('[PendingEdits] Modelo excedeu tentativas, removendo da fila');
logger.error('[SyncEngine] Erro na sincronização:', error);

// ❌ ERRADO
console.log('cache expirado');
console.error(error);
```

### Prefixos padronizados por módulo

| Módulo | Prefixo |
|--------|---------|
| modelRepository | `[modelRepository]` |
| SyncEngine | `[SyncEngine]` |
| Migration | `[Migration]` |
| PendingDeletes | `[PendingDeletes]` |
| PendingEdits | `[PendingEdits]` |
| Sync (use case) | `[Sync]` |
| CacheVersion | `[CacheVersion]` |
| Service Worker | `[SW]` |

Ao criar novo módulo, definir o prefixo no início do arquivo e usá-lo consistentemente.

---

## 🛡️ ErrorBoundary

O app possui `ErrorBoundary` na raiz (integrado com Sentry via `sentry-expo`).

**Regra:** não usar `try/catch` para engolir erros silenciosamente em hooks ou telas. Deixar propagar para o ErrorBoundary exibir feedback ao usuário.

```ts
// ✅ CORRETO — erros de sync são logados e não relançados (sync é não-crítico)
try {
  await runSync();
} catch (error) {
  logger.error('[SyncEngine] Erro na inicialização:', error);
}

// ❌ ERRADO — engole o erro sem log
try {
  await runSync();
} catch {}
```

---

## 📡 Sentry

**Status:** código implementado, DSN pendente de configuração na Vercel.

Quando o DSN for configurado:
1. Adicionar `EXPO_PUBLIC_SENTRY_DSN` nas variáveis de ambiente da Vercel (Production + Preview)
2. Verificar que o `ErrorBoundary` está capturando erros corretamente
3. Configurar alertas para: erros de sync com Supabase, crashes no Service Worker, falhas de migração de schema

---

## 🔍 Pontos de observabilidade obrigatórios

Toda operação de sync deve logar início e fim:

```ts
logger.info('[SyncEngine] Iniciando sincronização...');
// ... operação ...
logger.info('[SyncEngine] Sincronização concluída');
```

Toda migração de schema deve logar versão de origem e destino:

```ts
logger.info(`[Migration] Migrando de ${savedVersion ?? 'null'} para ${CACHE_VERSION.SCHEMA}`);
logger.info(`[Migration] ${migration.count} modelos pendentes marcados para re-sync`);
```

---

## ⚠️ Checklist de observabilidade

- [ ] Novo módulo de sync usa `logger` com prefixo definido?
- [ ] Erros não-críticos são logados com `logger.warn` ou `logger.error` antes de serem descartados?
- [ ] Nenhum `catch {}` vazio sem log?
- [ ] Novo fluxo crítico tem log de início e conclusão?
