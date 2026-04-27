# Roadmap de Evolução: Calculadora IPU

Este documento descreve os próximos passos sugeridos para levar a Calculadora IPU de um MVP robusto para uma plataforma industrial de escala global.

---

## 🚀 Fase 1: Estabilização e Observabilidade (Curto Prazo)
*Foco: Garantir que saibamos quando algo quebra em produção.*

1.  **Monitoramento de Erros com Sentry**:
    *   Integrar `sentry-expo`.
    *   Configurar alertas para erros críticos de sincronização com o Supabase.
    *   Garantir captura de erros silenciosos no Service Worker.
2.  **Testes de Regressão Críticos**:
    *   Implementar testes de fumaça (Smoke Tests) para o fluxo de salvamento offline.
    *   Garantir que atualizações do manifesto PWA não quebrem a instalabilidade.

---

## 📈 Fase 2: Escala e Performance (Médio Prazo)
*Foco: Otimizar a experiência à medida que o volume de dados e usuários cresce.*

1.  **Migração para Zustand**:
    *   Centralizar o estado de "Modelos" e "Configurações" em um Store do Zustand.
    *   Eliminar o excesso de `Context Providers` no `_layout.tsx`, melhorando o tempo de renderização.
2.  **Testes E2E (End-to-End)**:
    *   Configurar **Playwright** para validar o comportamento do PWA em diferentes navegadores automaticamente.
    *   Simular cenários de "Internet Lenta" para validar a resiliência do Sync Engine.

---

## 🌍 Fase 3: Globalização e Ecossistema (Longo Prazo)
*Foco: Preparar o app para novos mercados e casos de uso.*

1.  **Gestão de i18n Profissional**:
    *   Mover os arquivos de tradução para uma plataforma externa (ex: Transifex ou Lokalise).
    *   Permitir que especialistas técnicos traduzam termos específicos da Astra sem tocar no código.
2.  **Dashboard de Analytics Industrial**:
    *   Integrar telemetria anônima para entender quais calculadoras são mais usadas e em quais horários.
    *   Uso dessas métricas para priorizar novas funcionalidades baseadas em dados reais.

---

## 🛠️ Manutenção Contínua
*   **Atualizações do SDK**: Manter o Expo e as dependências core sempre atualizadas (Trimestral).
*   **Audit de Segurança**: Revisar as políticas de RLS (Row Level Security) do Supabase semestralmente.

---
*Roadmap gerado em 27/04/2026 pela Antigravity AI.*
