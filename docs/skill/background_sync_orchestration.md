# Background Sync Orchestration Protocol

Este protocolo define como o sistema deve lidar com operações de escrita que exigem sincronização remota sem bloquear a interface do usuário (Optimistic UI).

## 🔄 O Padrão de Orquestração
Toda operação de criação ou atualização deve seguir este fluxo triplo:
1. **Escrita Local Atômica:** O item é salvo imediatamente no cache local com `syncStatus: 'pending'` e `localAction: 'created'|'edited'`. A interface é notificada e reage instantaneamente.
2. **Sincronização em Background:** Uma chamada assíncrona (não-bloqueante) é feita para o serviço remoto.
3. **Atualização de Status Pós-Sync:** Após o retorno do serviço remoto, o estado local é atualizado para `synced` via um novo bloqueio atômico.

## 🛠️ Implementação via Helper Interno
Para evitar duplicação de lógica (DRY), use um helper interno no repositório:
```typescript
const _handleBackgroundSync = (model: CalculationModel) => {
  modelSyncService.syncToRemote(model).then(async (isSynced) => {
    if (isSynced) {
      await withWriteLock(async () => {
        // Atualiza para 'synced' e remove localAction
      }, 'sync-update');
    }
  });
};
```

## 🛡️ Garantias de Integridade
- **Atomicidade (Mutex):** Toda atualização do cache local (seja inicial ou pós-sync) deve ser envelopada pelo `withWriteLock` para evitar condições de corrida (Race Conditions).
- **Persistência de Falha:** Se a sincronização falhar, o item **deve permanecer** como `pending`. O sistema não deve tentar reverter a escrita local automaticamente, permitindo que processos de retry (ou o Service Worker) tentem novamente mais tarde.
- **Feedback Visual:** O status `pending` deve ser usado pela UI para exibir indicadores de "Sincronizando..." ou badges de estado, mantendo o usuário informado sem impedir o uso do app.
