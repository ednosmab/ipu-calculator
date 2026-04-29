# 🚀 Fluxo de Trabalho e Deploy (Workflow)

Este guia descreve como organizar as branches e realizar o deploy nos ambientes de Teste (Staging) e Produção.

## 🌿 Estrutura de Branches

| Branch | Ambiente | URL | Finalidade |
| :--- | :--- | :--- | :--- |
| `main` | **Produção** | [Link Oficial](https://ipu-calculator.vercel.app) | Versão estável usada pelos usuários finais. |
| `develop` | **Staging** | [Link de Teste](https://ipu-calculator-staging.vercel.app) | Ambiente de homologação para testes reais antes da main. |
| `refactor` | **Local** | - | Desenvolvimento, refatoração e novas funcionalidades. |

---

## 🛠️ Ciclo de Desenvolvimento (Passo a Passo)

### 1. Trabalhando na Refatoração/Feature
Faça suas alterações sempre na branch `refactor` (ou em branches de feature específicas).
```bash
git checkout refactor
# ... faz o código ...
git add .
git commit -m "feat: minha nova funcionalidade"
git push origin refactor
```

### 2. Enviando para Testes (Staging)
Quando o código estiver pronto para ser testado na Web:
```bash
git checkout develop
git merge refactor
git push origin develop
```
> **Ação**: Acesse o [Link de Teste](https://ipu-calculator-staging.vercel.app) e verifique se tudo funciona.

### 3. Publicando para Produção (Main)
Após validar que tudo está perfeito no Staging:
```bash
git checkout main
git merge develop
git push origin main
```
> **Ação**: O [Link Oficial](https://ipu-calculator.vercel.app) será atualizado automaticamente.

---

## ⚠️ Lembretes Importantes
- **Nunca faça commit direto na `main`**: Use sempre o fluxo de merge para evitar quebrar o app oficial.
- **Variáveis de Ambiente**: Se adicionar uma nova chave no `.env` local, lembre-se de adicioná-la também no painel da Vercel (*Settings > Environment Variables*).
- **Conflitos**: Se houver conflito no merge, o VS Code avisará. Resolva os conflitos, salve os arquivos e complete o commit.
- **Lint + Testes antes do Push**: Execute `npm run lint` e `npm test` localmente antes de fazer push para evitar falhas no CI.

## 🔄 Migração de Schema e Sincronização

O app possui sistema automático de migração para preservar dados locais:

- **Como funciona**: Ao abrir o app, `useSyncEngine` executa `schemaMigrationService.migrateIfNeeded()`
- **Quando limpa cache**: **NÃO limpa** - apenas marca modelos `pending` com novo `updatedAt` para re-sync
- **Quando migra**: Só quando o schema do Supabase muda (ex: adiciona/removendo campo)
- **Limpar Cache**: Apenas manualmente ou ao trocar de ambiente (dev → staging → prod)

**Para resetar manualmente** (dev local):
```typescript
// No console do app ou em código
await AsyncStorage.clear();
await AsyncStorage.removeItem('schema_version');
```

## 🧪 Testes

Execute os testes com Jest:
```bash
npm test              # roda todos os testes (85 testes)
npm test -- --watch  # modo watch (reativa ao salvar)
npm test -- --coverage  # com coverage report

# testes por módulo
npm run test:lint        # design-system (Button, Input, Card, Text)
npm run test:core        # core (formatters, parsers)
npm run test:features    # domain logic (calculation, validation)
npm run test:integration # screens + hooks (UI/logic integration)
npm run test:e2e         # Playwright E2E (realtime sync)
```

| Script | Descrição |
| :--- | :--- |
| `test` | Todos os testes (85 testes) |
| `test -- --watch` | Watch mode |
| `test -- --coverage` | Relatório de cobertura |
| `test:lint` | Design system |
| `test:core` | Módulos core |
| `test:features` | Lógica de domínio |
| `test:integration` | Screens + Hooks |
| `test:e2e` | Playwright E2E |

---

## 📋 Tasks Pendentes

| Task | Prioridade | Status |
| :--- | :--- | :--- |
| Corrigir teste `useRealtimeModels.should refetch models when a Realtime event is received` | baixa | skipped |

---

## 📝 Commit Standard (Conventional Commits)

All commit messages must be in **English** following the Conventional Commits pattern:

| Type | Description |
| :--- | :--- |
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Formatting, missing semi colons, etc; no code change |
| `refactor` | Refactoring production code |
| `test` | Adding missing tests, refactoring tests |
| `chore` | Updating build tasks, package manager configs, etc |

**Format**: `type(scope): description`
**Example**: `feat(sync): implement real-time event system`

---
*Dica: Você pode me pedir para realizar qualquer um desses passos de merge por você!*
