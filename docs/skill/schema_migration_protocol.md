# SKILL: Schema Migration & Data Evolution Protocol

Este protocolo define como lidar com mudanças na estrutura dos dados (Models) sem quebrar a aplicação para usuários que já possuem dados salvos localmente.

---

## 🛠️ O Gatilho da Migração

Toda mudança na interface de um `Model` ou na estrutura do cache deve ser acompanhada por um incremento na constante `CACHE_VERSION.SCHEMA` (localizada em `@/core/versioning/cacheVersion`).

- **Minor Change**: Adição de campos opcionais.
- **Major Change**: Mudança de tipos, remoção de campos obrigatórios ou mudança na chave do storage.

---

## 🔄 Fluxo de Execução

A migração deve ocorrer no ponto mais cedo possível do ciclo de vida do app (geralmente no `useSyncEngine` durante o boot).

1.  **Check**: Compara a versão salva no `AsyncStorage` com a versão atual no código.
2.  **Transformation**: Se houver disparidade, percorre os dados locais e aplica as transformações necessárias (ex: adicionar valor default para um campo novo).
3.  **Invalidation/Re-sync**: Em caso de mudanças estruturais profundas, marque os itens locais como `syncStatus: 'pending'` para forçar o app a tentar baixar a versão mais recente do servidor ou re-enviar os locais.
4.  **Finalization**: Salva a nova versão do schema no storage para evitar que a migração rode novamente no próximo boot.

---

## 📝 Como Adicionar uma Nova Migração

Ao mudar o `CalculationModel`:

1.  Aumente `CACHE_VERSION.SCHEMA`.
2.  No `schemaMigrationService`, adicione a lógica de transformação no método `migrateIfNeeded`.
3.  **Teste de Regressão**: Tente abrir o app com dados mockados da versão anterior para garantir que a migração não falha.

---

## ⚠️ Regras de Ouro
1. **Idempotência**: O processo de migração deve poder rodar múltiplas vezes sem corromper os dados.
2. **Fail-Safe**: Se a migração falhar criticamente, o app deve preferir limpar o cache local e baixar do servidor (se houver internet) a fechar com erro.
3. **Logs**: Sempre logue o início e o fim de uma migração, incluindo quantos itens foram afetados.
