# Checklist de Debug

## Frontend

- [x] API_BASE preenchido (EXPO_PUBLIC_EDGE_FUNCTIONS_URL)
- [x] Edge Functions URL configurada (.env.local)
- [x] try/catch implementado (AuthProvider.tsx, edgeFunctionsClient.ts)
- [x] token salvo (sessionStorage.ts com web-safe)
- [x] restoreSession funcionando (AuthProvider.tsx com validação de servidor)

## Backend (Edge Functions)

- [x] auth-login deployado
- [x] auth-logout deployado
- [x] auth-validate deployado
- [x] models-sync deployado
- [x] models-delete deployado
- [x] models-get deployado
- [x] CORS habilitado (ALLOWED_ORIGIN)
- [x] retorno JSON correto

## Debugging

Se a tela de modelos não carregar:
1. Abrir DevTools (F12) → aba Console
2. Procurar logs `[edgeFunctionsClient]`
3. Se ver "NO_TOKEN_AVAILABLE" → fazer login novamente
4. Se ver "TIMEOUT" → verificar conexão de rede
5. Se ver "NETWORK_ERROR" → verificar EXPO_PUBLIC_EDGE_FUNCTIONS_URL
