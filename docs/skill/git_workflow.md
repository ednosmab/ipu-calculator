# SKILL: Git Workflow & Commit Standard

Este documento define o fluxo obrigatório de branches, commits e deploy do IPU Calculator. Seguir este fluxo evita quebrar o app em produção.

---

## 🌿 Estrutura de Branches

| Branch | Ambiente | URL | Regra |
|--------|----------|-----|-------|
| `main` | **Produção** | ipu-calculator.vercel.app | Nunca commit direto |
| `develop` | **Staging** | ipu-calculator-staging.vercel.app | Validação antes da main |
| `refactor` (ou feature branch) | **Local** | — | Todo desenvolvimento novo |

---

## 🔄 Ciclo Completo

### 1. Desenvolver na branch de feature
```bash
git checkout refactor          # ou git checkout -b feat/nome-da-feature
# ... implementar e testar ...
npm run lint && npm test        # obrigatório antes do push
git add .
git commit -m "feat(scope): descrição em inglês"
git push origin refactor
```

### 2. Promover para Staging
```bash
git checkout develop
git merge refactor
git push origin develop
# Validar no link de staging antes de prosseguir
```

### 3. Promover para Produção
```bash
git checkout main
git merge develop
git push origin main
# Deploy automático via Vercel CI
```

---

## 📝 Conventional Commits (obrigatório)

**Formato:** `type(scope): descrição em inglês`

| Type | Quando usar |
|------|-------------|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `docs` | Apenas documentação |
| `style` | Formatação, sem mudança de lógica |
| `refactor` | Refatoração sem nova feature ou bug fix |
| `test` | Adição ou correção de testes |
| `chore` | Build, config, dependências |

**Exemplos válidos:**
```
feat(sync): implement cache versioning system
fix(repository): prevent direct AsyncStorage write bypassing mutex
refactor(migration): extend schemaMigrationService to all storage keys
test(modelRepository): add schema version mismatch invalidation case
docs(workflow): update branch strategy section
```

**Regra de escopo:** usar o nome da feature ou módulo afetado (`sync`, `ipu`, `calibration`, `models`, `i18n`, `design-system`, `repository`, `migration`).

---

## 🔐 Variáveis de Ambiente

Ao adicionar nova chave no `.env` local:
1. Adicionar também no painel da **Vercel** (Settings > Environment Variables)
2. Definir para os três ambientes: Production, Preview, Development
3. Prefixo obrigatório para exposição ao client: `EXPO_PUBLIC_`

Chaves atuais:
```
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
EXPO_PUBLIC_APP_VERSION
```

---

## ✅ Checklist pré-push

- [ ] `npm run lint` passa sem erros
- [ ] `npm test` — todos os testes passam
- [ ] Smoke tests manuais executados (se feature afeta UI)
- [ ] Nenhum `console.log` de debug no código
- [ ] Variáveis de ambiente novas documentadas
- [ ] Commit message segue Conventional Commits em inglês

---

## ⚠️ Proibições

- ❌ Commit direto na `main`
- ❌ `git push --force` em `develop` ou `main`
- ❌ Merge sem lint + testes passando
- ❌ Chave de API ou secret no código-fonte
