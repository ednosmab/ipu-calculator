# Plano de Implementação: Correção de Acesso Offline e Tela Branca

Este plano visa corrigir os problemas relatados pelo usuário ao acessar o aplicativo offline:
1. Tela branca ao atualizar a lista de modelos estando offline.
2. Botão "Acessar Offline" não aparecendo na tela de login quando desconectado.

## User Review Required

> [!IMPORTANT]
> A principal alteração é a inclusão de um **timeout** nas requisições de validação de sessão no `AuthProvider`. Isso garante que o aplicativo não fique "travado" esperando uma resposta da rede que nunca virá (ou demorará muito) quando o sinal estiver fraco ou inesperado.

## Proposed Changes

### 1. Núcleo de Autenticação

#### [MODIFY] [AuthProvider.tsx](file:///media/edson-ubuntu/Data1/Astra/calculadora-ipu/src/core/auth/AuthProvider.tsx)
- Implementar um timeout de 3 segundos nas chamadas de `fetch` durante a restauração da sessão.
- Se a chamada falhar ou atingir o timeout, o `AuthProvider` deve usar imediatamente os dados do perfil salvos no cache local em vez de esperar indefinidamente.
- Isso evitará que `isLoading` permaneça `true` por muito tempo, o que causa a tela branca nas rotas protegidas (que dependem de `!isLoading` para renderizar).

### 2. Interface do Usuário (UI)

#### [MODIFY] [login.tsx](file:///media/edson-ubuntu/Data1/Astra/calculadora-ipu/app/login.tsx)
- Ajustar a condição de exibição do botão "Acessar Offline (Cache)".
- Atualmente, ele só aparece se `isConnected === false`. Se o estado for `null` (carregando/verificando), o botão não aparece.
- Alterar para exibir se `isConnected !== true` (abrange `false` e `null`) desde que haja cache local (`hasCache === true`).

---

### 3. Hooks de Rede e Utilidades

#### [MODIFY] [useNetworkStatus.ts](file:///media/edson-ubuntu/Data1/Astra/calculadora-ipu/src/hooks/useNetworkStatus.ts)
- Adicionar log de depuração para facilitar a identificação de estados de rede no Vercel.
- Garantir que `navigator.onLine` seja priorizado para uma resposta instantânea em ambientes Web antes de tentar o `verifyActualInternet`.

## Verification Plan

### Manual Verification
1. **Teste de Tela Branca (Offline Refresh)**:
   - Logar no sistema online.
   - Ir para a lista de modelos.
   - Desligar a internet.
   - Atualizar a página (F5).
   - **Esperado:** A página deve carregar os modelos do cache em até 3 segundos (tempo do timeout), exibindo o banner de modo offline.

2. **Teste de Botão Offline (Login)**:
   - Deslogar.
   - Desligar a internet.
   - Acessar a tela de login.
   - **Esperado:** O botão "Acessar Offline (Cache)" deve aparecer prontamente se houver modelos no banco local.

3. **Teste de Transição Online/Offline**:
   - Abrir o app online.
   - Desligar a rede.
   - Verificar se o status de rede muda para `false` e se o banner/botão aparece conforme o contexto.
