# ☁️ Roadmap: Cloud Sync & Offline Resilience

Este documento descreve os passos para implementar a sincronização dos modelos com um banco de dados externo, garantindo funcionamento offline-first e sincronização automática.

## Fase 1: Infraestrutura e Escolha (Semana 1)
- [ ] **Definição do Banco Externo**: Escolha entre Supabase (PostgreSQL) ou Firebase (NoSQL).
- [ ] **Configuração do SDK**: Instalação das bibliotecas e chaves de acesso.
- [ ] **Modelagem de Dados Remota**: Criação da tabela/coleção `models` com campos de auditoria (`updated_at`, `deleted_at`).
- [ ] **Segurança (RLS)**: Configuração de regras para que cada usuário veja apenas seus modelos (se Auth for usado).

## Fase 2: Mecanismo de Outbox e Fila Local (Semana 2)
- [ ] **Atualização do Model Schema**: Adicionar campos `sync_status` ('synced', 'pending') e `version`.
- [ ] **Fila de Sincronização Local**: Criar repositório para gerenciar operações pendentes de envio.
- [ ] **Upsert Logic**: Implementar lógica que tenta enviar ao remoto e, em caso de falha, marca como pendente no local.

## Fase 3: Monitoramento e Sincronização Ativa (Semana 2-3)
- [ ] **Integração NetInfo**: Listener global para detectar quando o app volta a ter internet.
- [ ] **Sync Engine**: Serviço que percorre a fila de pendências e as resolve sequencialmente ao reconectar.
- [ ] **Indicadores de UI**: Adicionar pequenos ícones de status (nuvem, check, alerta) nos cards de modelos para indicar estado de sincronização.

## Fase 4: Segundo Plano e Resiliência (Semana 3-4)
- [ ] **Background Sync (Expo TaskManager)**: Registrar tarefa para tentar sincronizar pendências mesmo se o app estiver minimizado.
- [ ] **Resolução de Conflitos**: Implementar estratégia "Last Write Wins" baseada no timestamp `updatedAt`.
- [ ] **Testes de Estresse Offline**: Validar comportamento com modo avião, interrupções de rede e concorrência.

---
*Nota: Este roadmap foca exclusivamente na feature de sincronização de modelos.*
