# SKILL: Model Persistence & Atomic Write Protocol

Este protocolo define como os dados do domínio (Models) devem ser persistidos localmente para garantir integridade, performance offline e sincronização sem conflitos.

---

## 🔒 Atomicidade e Mutex (Write Lock)

Nunca realize operações de escrita (Set/Remove) no storage local de forma concorrente sem proteção. Use o padrão `withWriteLock`.

- **Por que?** O `AsyncStorage` (ou similares) pode sofrer condições de corrida se duas funções tentarem ler, modificar e salvar o mesmo array de dados simultaneamente.
- **Implementação**: Uma fila de promessas (`writeQueue`) que garante que apenas uma operação de escrita ocorra por vez.

```typescript
let writeQueue = Promise.resolve();
const withWriteLock = async (fn) => {
  const next = writeQueue.then(fn);
  writeQueue = next;
  return next;
};
```

---

## 📦 Estrutura do Cache (Metadata)

Os dados não devem ser salvos "puros". Eles devem ser envelopados em um objeto de metadados:

```typescript
interface CacheMetadata<T> {
  data: T;           // O dado real
  expiresAt: number; // Timestamp para invalidação (TTL)
  schemaVersion: string; // Versão do schema (para migrações automáticas)
}
```

---

## 🔄 Fluxo de Atualização Otimista

Sempre siga a ordem: **Local Primeiro, Remoto Depois**.

1.  **Escrita Local**:
    - Entre no `withWriteLock`.
    - Leia o cache atual.
    - Aplique a alteração no array.
    - Salve com novo `expiresAt` e `schemaVersion`.
    - Notifique os listeners.
    - Saia do Lock.
2.  **Sincronização em Background**:
    - Tente enviar para o servidor.
    - Se falhar: Adicione a uma fila de `pendingOperations`.
    - Se sucesso: Atualize o `syncStatus` do item local (novamente via `withWriteLock`).

---

## 📡 Reatividade (Listener Pattern)

O repositório deve implementar um sistema de subscrição simples para que a UI (ou outros hooks) possa reagir a mudanças sem precisar de polling ou Contextos complexos.

- Use um `Set<Listener>` para evitar duplicidade.
- Dispare as notificações via `setTimeout(notify, 0)` para não bloquear o ciclo de renderização atual.

---

## ⚠️ Regras de Ouro
1. **TTL (Time to Live)**: Sempre defina um tempo de expiração. Se o dado estiver expirado ao ler, retorne o dado atual mas dispare um refresh em background.
2. **Schema Invalidation**: Se o `schemaVersion` do cache for diferente do definido no código, remova o cache imediatamente e force um fetch novo para evitar crashes por campos inexistentes.
3. **Optimistic UI**: A UI deve refletir a mudança local instantaneamente, confiando no `syncStatus` para mostrar indicadores de "pendente" se necessário.
