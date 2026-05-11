# Resumo — Autenticação e Painel Admin (Maio 2026)

**Data:** 2026-05-10  
**Status:** ⚠️ Problema de role não está sendo carregado corretamente

---

## Problema Atual

O usuário admin2@ipu.com tem profile no banco com role `admin`, mas o app mostra `viewer`. O fluxo de login não está lendo o role correto do banco.

---

## O que foi feito

### 1. Fix de profile no banco
- Profile existe para userId `a41d5d1d-58ef-4a38-b0a4-64bf22dad2cb` (admin2@ipu.com)
- Role: admin, active: true
- Criado via Edge Function `update-profile`

### 2. Edge Functions deployadas
| Function | Status |
|----------|--------|
| auth-login | ✅ deployada |
| auth-logout | ✅ deployada |
| auth-validate | ✅ deployada |
| models-get | ✅ deployada |
| models-sync | ✅ deployada |
| models-delete | ✅ deployada |
| admin-users | ✅ deployada |
| admin-users-update | ✅ deployada |
| admin-logs | ✅ deployada |
| admin-metrics | ✅ deployada |
| update-profile | ✅ deployada (cria profile) |

### 3. Correções no frontend
- `src/hooks/admin/useAdminUsers.ts` - corrigido para usar `CONFIG.EDGE_FUNCTIONS_URL`
- `src/core/config.ts` - adicionado `EDGE_FUNCTIONS_URL`

### 4. Debug Panel melhorado
- Adicionado info de Auth: loading, user, email, profile, profile name, session

---

## Verificação do Profile no Banco

```bash
curl -s "https://uqihnpwpcrujqycbuzxv.supabase.co/functions/v1/update-profile" | jq .
```

Retorna:
```json
{
  "data": [{
    "id": "a41d5d1d-58ef-4a38-b0a4-64bf22dad2cb",
    "name": "Admin",
    "role": "admin",
    "active": true
  }]
}
```

---

## Possíveis Causas

1. **RLS blokend** - O AuthProvider tenta ler profile via REST com ANON_KEY, mas RLS pode estar bloqueando
2. **Cache antigo** - sessionStorage tem profile antigo cached com role viewer
3. **AuthProvider não fetching** - O fetchProfile no AuthProvider pode estar falhando silenciosamente

---

## Próximos Passos

1. **Limpar cache** - sessão e profile do sessionStorage, fazer login novamente
2. **Verificar RLS** - policy de SELECT para profiles deve permitir leitura por authenticated
3. **Verificar fetchProfile** - adicionar mais logs no AuthProvider

---

## Comandos úteis

```bash
# Testar login
curl -s -X POST "https://uqihnpwpcrujqycbuzxv.supabase.co/functions/v1/auth-login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin2@ipu.com","password":"Admin123456"}'

# Ver profile no banco
curl -s "https://uqihnpwpcrujqycbuzxv.supabase.co/functions/v1/update-profile"

# Build + serve
npm run build && npx serve dist -l 3000
```