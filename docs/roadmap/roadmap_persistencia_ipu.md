# Roadmap --- Persistência + Sync (IPU Calculator)

## 🎯 Objetivo

Implementar persistência local e sincronização com banco externo para: -
Histórico de cálculos - CRUD de modelos

------------------------------------------------------------------------

## 🧱 Fase 1 --- Infraestrutura

### Estrutura

    src/
      core/
        storage/
          asyncStorageClient.ts
          storageKeys.ts

### Tarefas

-   Criar client AsyncStorage
-   Definir chaves de armazenamento

------------------------------------------------------------------------

## 🧱 Fase 2 --- Histórico

### Estrutura

    features/history/
      domain/
      infra/
      application/

### Tarefas

-   Criar tipo CalculationHistory
-   Criar repository
-   Criar use case saveCalculation
-   Integrar com cálculo IPU

------------------------------------------------------------------------

## 🧱 Fase 3 --- Modelos (CRUD)

### Estrutura

    features/models/
      domain/
      infra/
      application/

### Tarefas

-   Criar Model type
-   Implementar create/update/delete/get
-   Validar dados

------------------------------------------------------------------------

## 🧱 Fase 4 --- UI

### Histórico

-   Listagem
-   Limpar histórico

### Modelos

-   Criar
-   Editar
-   Excluir

------------------------------------------------------------------------

## 🧱 Fase 5 --- Evolução (SQLite + Sync)

### Banco local

-   Criar tabelas:
    -   calculation_history
    -   models

### Sync

-   Campo synced
-   Enviar dados para backend
-   Atualizar status

------------------------------------------------------------------------

## 🧱 Fase 6 --- Backend

### Opções

-   Supabase (recomendado)
-   API própria

### Tarefas

-   Criar endpoints
-   Sincronizar dados

------------------------------------------------------------------------

## 🚀 Ordem de execução

1.  AsyncStorage base
2.  Histórico funcionando
3.  Botão salvar
4.  CRUD modelos
5.  UI completa
6.  Migrar para SQLite
7.  Implementar sync

------------------------------------------------------------------------

## 🧠 Insight final

Evolução do projeto: - App simples → Produto industrial - Dados locais →
Dados sincronizados - Cálculo → Inteligência de processo
