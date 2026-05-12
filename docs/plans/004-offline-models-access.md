# Plano de Implementação: Acesso Offline aos Modelos

Este plano descreve as alterações finais para permitir o acesso offline resiliente aos modelos salvos em cache.

## User Review Required

> [!IMPORTANT]
> O acesso offline utiliza o cache local do `AsyncStorage`. As alterações garantem que este cache seja preservado mesmo em falhas de rede e que a transição para o modo offline seja suave, sem redirecionamentos incorretos.

## Proposed Changes

### 1. Núcleo e Sincronização

#### [MODIFY] [AuthProvider.tsx](file:///media/edson-ubuntu/Data1/Astra/calculadora-ipu/src/core/auth/AuthProvider.tsx)
- Implementado timeout de 3s para validação de sessão.
- Fallback automático para perfil cacheado em caso de timeout/offline.

#### [MODIFY] [edgeFunctionsClient.ts](file:///media/edson-ubuntu/Data1/Astra/calculadora-ipu/src/core/api/edgeFunctionsClient.ts)
- `getModels` agora lança erro real em falhas de rede em vez de retornar `[]`. Isso evita que o sincronizador limpe o cache local por engano.

#### [MODIFY] [fetchRemoteModelsUseCase.ts](file:///media/edson-ubuntu/Data1/Astra/calculadora-ipu/src/features/models/application/fetchRemoteModelsUseCase.ts)
- Adicionada verificação de integridade: o cache local só é filtrado se a resposta do servidor for válida e bem-sucedida.

### 2. Hooks de Proteção

#### [MODIFY] [useRequireAuth.ts](file:///media/edson-ubuntu/Data1/Astra/calculadora-ipu/src/hooks/useRequireAuth.ts)
- Adicionado estado `isCheckingCache` para sincronizar a leitura do banco local com a lógica de redirecionamento.
- Bloqueia o redirecionamento para o login até que a existência de cache seja confirmada.

### 3. Interface (UI)

#### [MODIFY] [login.tsx](file:///media/edson-ubuntu/Data1/Astra/calculadora-ipu/app/login.tsx)
- Botão "Acessar Offline" agora inclui ícone de wifi e visibilidade aprimorada (`isConnected !== true`).

---

## Verification Plan

### Manual Verification
1. **Fluxo Online**: Login normal -> Ver modelos (popula cache).
2. **Fluxo Offline (Refresh)**: Ficar offline -> Atualizar página de modelos. Deve carregar via cache em até 3s.
3. **Fluxo Offline (Sem Sessão)**: Logout -> Offline -> Acessar login -> Clicar "Acessar Offline". Deve entrar na lista de modelos sem redirecionar de volta.
