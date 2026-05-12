# Resumo — Acesso Offline aos Modelos (Maio 2026)

**Data:** 2026-05-12  
**Status:** ✅ Concluído e Validado

---

## Objetivo

Permitir que usuários acessem a lista de modelos **sem login**, quando offline e com cache local.

---

## Problemas Identificados e Corrigidos

### 1. Bug de "Cache Wipe" (Crítico)
**Causa:** O `edgeFunctionsClient.getModels()` retornava um array vazio `[]` em caso de erro de rede em vez de lançar uma exceção. O `fetchRemoteModelsUseCase` interpretava isso como "o servidor não tem modelos" e deletava todo o cache local para sincronizar.
**Correção:** Alterado `getModels` para lançar erro em falhas de rede e adicionada trava no `fetchRemoteModelsUseCase` para nunca filtrar o cache se a resposta do servidor for nula ou inválida.

### 2. Corrida de Estados no Redirect
**Causa:** O `useRequireAuth` redirecionava para o login antes de terminar a leitura assíncrona do cache local.
**Correção:** Adicionado estado `isCheckingCache` para bloquear redirecionamentos até que o banco local seja consultado.

### 3. Travamento por falta de Timeout
**Causa:** `AuthProvider` ficava aguardando indefinidamente o Supabase validar a sessão em redes lentas/offline.
**Correção:** Implementado `fetchWithTimeout` (3s) na restauração de sessão.

### 4. Visibilidade do Botão Offline
**Causa:** O botão só aparecia se `isConnected` fosse estritamente `false`.
**Correção:** Alterado para `isConnected !== true` para abranger o estado de carregamento (`null`). Adicionado ícone de wifi para clareza visual.

---

## Arquivos Modificados

- `src/core/auth/AuthProvider.tsx` (Timeouts)
- `src/hooks/useRequireAuth.ts` (Race condition)
- `src/core/api/edgeFunctionsClient.ts` (Error handling)
- `src/features/models/application/fetchRemoteModelsUseCase.ts` (Cache protection)
- `app/login.tsx` (UI/Logs/Icon)
- `src/hooks/useNetworkStatus.ts` (Speed/Logs)

---

## Build e Verificação

- `npm run lint` ✅ Passou
- `Teste manual Localhost` ✅ Funcionando (Redirecionamento ok, cache preservado, botão visível)