# Plano de Implementação: Acesso Offline aos Modelos

Este plano descreve as alterações necessárias para permitir que o usuário acesse a lista de modelos já salvos em cache mesmo quando estiver offline e não conseguir realizar o login.

## User Review Required

> [!IMPORTANT]
> O acesso offline permitirá visualizar os modelos, mas o usuário não terá um `role` verificado pelo servidor. Por padrão, o sistema assumirá que ele pode visualizar os modelos (viewer). Ações de edição/criação podem falhar ou ser enfileiradas conforme o protocolo de sync já existente.

## Proposed Changes

### 1. Hooks e Lógica de Negócio

#### [MODIFY] [useRealtimeModels.ts](file:///media/edson-ubuntu/Data1/Astra/calculadora-ipu/src/features/models/hooks/useRealtimeModels.ts)
Ajustar o hook para permitir o carregamento de dados locais mesmo se não houver um usuário logado.
- No `useEffect`, se não houver `user`, chamar `fetchModels(false)` em vez de apenas retornar.
- No `fetchModels`, garantir que a busca local (`modelRepository.getAll()`) ocorra mesmo se o skip da sync remota for acionado por falta de usuário.

#### [MODIFY] [useRequireAuth.ts](file:///media/edson-ubuntu/Data1/Astra/calculadora-ipu/src/hooks/useRequireAuth.ts)
- Garantir que `allowOfflineAccess` seja respeitado e que a detecção de cache local seja robusta.

---

### 2. Interface do Usuário (UI)

#### [MODIFY] [login.tsx](file:///media/edson-ubuntu/Data1/Astra/calculadora-ipu/app/login.tsx)
Adicionar suporte para modo offline na tela de login.
- Injetar `useNetworkStatus` e verificar `modelRepository.getAll()` para detectar estado.
- Se estiver offline (`isConnected === false`) e houver cache, exibir um botão secundário "Acessar Offline (Cache)".
- Ao clicar, redirecionar para `/models`.

#### [MODIFY] [ModelsScreen.tsx](file:///media/edson-ubuntu/Data1/Astra/calculadora-ipu/src/features/models/screens/ModelsScreen.tsx)
- O banner offline já existe, mas garantir que ele apareça corretamente para usuários "convidados" (offline e sem login).

## Verification Plan

### Manual Verification
1. **Fluxo Online**: Abrir o app com internet, logar, ver modelos (cache é populado).
2. **Fluxo Offline (Sessão Ativa)**: Fechar o app, desligar internet, abrir o app. O `AuthProvider` deve restaurar a sessão via cache e permitir acesso direto.
3. **Fluxo Offline (Sem Sessão)**: Limpar cache de sessão (ou fechar aba no Web), desligar internet, abrir o app.
   - Deve cair na tela de login.
   - Deve aparecer o botão "Acessar Offline".
   - Clicar no botão deve mostrar os modelos salvos anteriormente.
4. **Fluxo Offline (Sem Cache)**: Limpar todo o storage, desligar internet, abrir o app.
   - Deve cair na tela de login.
   - O botão "Acessar Offline" NÃO deve aparecer (pois não há dados).
