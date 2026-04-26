# ☁️ Roadmap: Cloud Sync & Offline Resilience

Este documento descreve os passos para implementar a sincronização dos modelos com um banco de dados externo, garantindo funcionamento offline-first e sincronização automática.

## Fase 1: Infraestrutura e Setup Supabase (Semana 1)
- [x] **Configuração do Projeto no Supabase**: Criação da conta e projeto gratuito.
- [x] **Configuração do SDK**: Instalação do `@supabase/supabase-js` e configuração de variáveis de ambiente.
- [x] **Modelagem de Dados (PostgreSQL)**: Criação da tabela `models` com campos de auditoria (`updated_at`, `id`, `name`, `type`, `inputs`).
- [x] **Políticas de Segurança (RLS)**: Configuração de permissões de leitura/escrita.

## Fase 2: Mecanismo de Outbox e Fila Local (Semana 2)
- [x] **Atualização do Model Schema**: Adicionar campos `sync_status` ('synced', 'pending') e `version`.
- [x] **Fila de Sincronização Local**: Criar repositório para gerenciar operações pendentes de envio.
- [x] **Upsert Logic**: Implementar lógica que tenta enviar ao remoto e, em caso de falha, marca como pendente no local.

## Fase 3: Monitoramento e Sincronização Ativa (Semana 2-3)
- [x] **Integração NetInfo**: Listener global para detectar quando o app volta a ter internet.
- [x] **Sync Engine**: Serviço que percorre a fila de pendências e as resolve sequencialmente ao reconectar.
- [ ] **Indicadores de UI**: Adicionar pequenos ícones de status (nuvem, check, alerta) nos cards de modelos para indicar estado de sincronização.

## Fase 4: Segundo Plano e Resiliência (Semana 3-4)
- [ ] **Background Sync (Expo TaskManager)**: Registrar tarefa para tentar sincronizar pendências mesmo se o app estiver minimizado.
- [ ] **Resolução de Conflitos**: Implementar estratégia "Last Write Wins" baseada no timestamp `updatedAt`.
- [ ] **Testes de Estresse Offline**: Validar comportamento com modo avião, interrupções de rede e concorrência.

---
*Nota: Este roadmap foca exclusivamente na feature de sincronização de modelos.*
