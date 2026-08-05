# Plano de Teste: Concorrência Multi-Device (Item 28)

**Status:** 🟡 Planejado
**Pré-requisito:** Realtime funcionando (migration 009 aplicada, Item 27 validado)

---

## Contexto do Sistema

| Aspecto | Comportamento Atual |
|---------|---------------------|
| **Merge** | `version` primeiro, `updatedAt` como desempate. Remoto vence se `version > local.version` |
| **models-sync** | UPSERT cego (sem version guard no servidor) — último a chegar vence |
| **models-delete** | HARD DELETE (sem soft delete) |
| **Duplicate check** | LOCAL apenas (por `getByType()` no cache) — dois devices podem criar mesmo nome |
| **Realtime** | INSERT/UPDATE/DELETE chegam via WebSocket (migration 009) |

---

## Cenário 28.1 — CREATE com mesmo nome

**Objetivo:** Verificar se dois devices podem criar modelos com o mesmo nome simultaneamente e qual o resultado.

**Setup:**
- Devices A e B logados com role `editor` ou `admin`
- Ambos na tela de Modelos
- Nenhum modelo existente com o nome "CONCORRENCIA_28_1"

**Passos:**

| # | Device A | Device B | Tempo |
|---|----------|----------|-------|
| 1 | Abre modal "Novo Modelo" | Abre modal "Novo Modelo" | T0 |
| 2 | Preenche nome "CONCORRENCIA_28_1" | Preenche nome "CONCORRENCIA_28_1" | T0+5s |
| 3 | Preenche inputs: iso=0.08, poly=0.16 | Preenche inputs: iso=0.09, poly=0.15 | T0+10s |
| 4 | Clica "Salvar" | Clica "Salvar" | T0+15s |
| 5 | Aguardar sync automático | Aguardar sync automático | T0+20s |
| 6 | Verificar lista | Verificar lista | T0+25s |

**Comportamento Esperado:**
- [ ] Device A: cria localmente com `syncStatus: 'pending'`, versão 1
- [ ] Device B: cria localmente com `syncStatus: 'pending'`, versão 1
- [ ] Check de duplicata local NÃO impede B (cada device só vê seu próprio cache)
- [ ] Sync envia ambos para o servidor — banco aceita 2 rows com mesmo `name` (sem UNIQUE constraint)
- [ ] Realtime entrega INSERT para ambos — cada device vê 2 cards "CONCORRENCIA_28_1"
- [ ] UI: dois cards com o mesmo nome aparecem

**Resultado Aceitável:** Sim — dois cards com mesmo nome existem. Limitação documentada (YAGNI — não há necessidade de CRDT/lock distribuído).

**Cleanup:** Deletar ambos os modelos manualmente após o teste.

---

## Cenário 28.2 — UPDATE no mesmo modelo

**Objetivo:** Verificar como o sistema lida com duas edições concorrentes do mesmo modelo.

**Setup:**
- Modelo "CONCORRENCIA_28_2" existe no servidor com `version: 3`
- Devices A e B ambos têm cópia local com `version: 3`

**Passos:**

| # | Device A | Device B | Tempo |
|---|----------|----------|-------|
| 1 | Abre editor do modelo | Abre editor do modelo | T0 |
| 2 | Altera iso para 0.080 | Altera iso para 0.090 | T0+5s |
| 3 | Clica "Salvar" | (ainda editando) | T0+10s |
| 4 | — | Clica "Salvar" | T0+15s |
| 5 | Aguardar sync (A: version 4, B: version 4) | Aguardar sync | T0+20s |
| 6 | Verificar versão no card | Verificar versão no card | T0+25s |

**Comportamento Esperado:**

Device A salva:
- Local: `version: 4, updatedAt: T1`
- Sync envia POST /models-sync → servidor grava `version: 4`

Device B salva (ainda com base v3):
- Local: `version: 4, updatedAt: T2` (T2 > T1)
- Sync envia POST /models-sync → servidor sobrescreve com `version: 4, updatedAt: T2`

Merge (quando realtime entrega UPDATE):
- Comparação: `rm.version (4) === local.version (4)` → fallback para `updatedAt`
- Se `rm.updatedAt (T2) > local.updatedAt (T1)` → remoto vence
- Device A vê a versão de B (iso=0.090)

- [ ] Servidor aceita ambos os upserts (sem version guard)
- [ ] Último POST vence no banco
- [ ] Realtime entrega UPDATE para ambos devices
- [ ] Device perdedor (A) vê a versão que venceu
- [ ] UI: badge "Editado" some quando `syncStatus` vira `synced`

**Resultado Aceitável:** Last-write-wins. Sem conflito visível para o usuário. Documentar como limitação.

---

## Cenário 28.3 — DELETE vs UPDATE

**Objetivo:** Verificar o que acontece quando um device deleta enquanto o outro edita o mesmo modelo.

**Setup:**
- Modelo "CONCORRENCIA_28_3" existe no servidor
- Devices A e B ambos têm cópia local

**Passos:**

| # | Device A | Device B | Tempo |
|---|----------|----------|-------|
| 1 | — | Abre editor do modelo | T0 |
| 2 | Clica lixeira → confirma delete | Altera iso para 0.075 | T0+5s |
| 3 | Sync: DELETE /models-delete | Clica "Salvar" | T0+10s |
| 4 | — | Sync: POST /models-sync (upsert) | T0+15s |
| 5 | Verificar lista | Verificar lista | T0+20s |

**Comportamento Esperado:**

Servidor processa DELETE primeiro:
- Row removida permanentemente

Servidor processa UPSERT de B:
- `models-sync` faz upsert → row **ressurge** no servidor (com id de B)
- Isso é "ressurreição" — o delete foi anulado pelo upsert posterior

Device A recebe UPDATE do realtime:
- Modelo volta na tela de A (row ressurgiu)
- A vê o modelo com a edição de B

Device B recebe INSERT do realtime:
- Modelo aparece (ou atualiza) na tela de B

- [ ] DELETE é hard delete (row some do banco)
- [ ] UPSERT posterior ressuscita a row
- [ ] Device A vê o modelo "voltar" com as edições de B
- [ ] Device B vê o modelo com sua edição

**Resultado Aceitável:** Ressurreição é o comportamento documentado. soft delete resolveria, mas YAGNI.

---

## Resumo das Limitações Conhecidas

| Limitação | Severidade | Mitigação |
|-----------|-----------|-----------|
| Dois devices podem criar modelos com mesmo nome | Baixa | UI mostra ambos; usuário manualmente decide qual manter |
| Servidor não guarda version — upsert cego | Média | Frontend vence por `updatedAt` no merge; última escrita vence |
| DELETE seguido de UPsert causa ressurreição | Baixa | Caso raro (2 devices operando no mesmo modelo ao mesmo tempo) |
| Notificação de conflito inexistente | Baixa | Usuário vê apenas a versão vencedora; sem toast de "conflito" |

---

## Comandos de Cleanup Após Teste

```sql
-- Remover todos os modelos de teste
DELETE FROM public.models WHERE name LIKE 'CONCORRENCIA_28_%';
```

---

## Referências

- ADR-16: Version Counter para Merge
- ADR-17: Fila de Operações Pendentes
- `fetchRemoteModelsUseCase.ts`: lógica de merge
- `models-sync/index.ts`: upsert cego
- `models-delete/index.ts`: hard delete
- `modelUseCases.ts`: duplicate check local
