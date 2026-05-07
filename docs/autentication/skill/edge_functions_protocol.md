# SKILL: Edge Functions Protocol

Este protocolo define como as Edge Functions do Supabase devem ser estruturadas no IPU Calculator — autenticação, tratamento de erros, logging e padrões de resposta.

---

## 🏗️ Estrutura de Pastas

```
supabase/functions/
  _shared/
    authMiddleware.ts    # requireAuth
    auditLogger.ts       # logAccess
    cors.ts              # headers CORS
    response.ts          # helpers de resposta padronizada
  auth-login/
    index.ts
  auth-logout/
    index.ts
  admin-users/
    index.ts             # GET (lista) e POST (criação)
  admin-users-update/
    index.ts             # PATCH /:id
  admin-logs/
    index.ts
  admin-metrics/
    index.ts
```

---

## 🔧 Helpers compartilhados

### cors.ts

```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
};

export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  return null;
}
```

### response.ts

```typescript
export function ok(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function err(code: string, status: number): Response {
  return new Response(JSON.stringify({ error: code }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
```

---

## 🔐 Padrão de Edge Function

Toda Edge Function segue este esqueleto:

```typescript
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '../_shared/authMiddleware.ts';
import { logAccess } from '../_shared/auditLogger.ts';
import { handleCors, corsHeaders } from '../_shared/cors.ts';
import { ok, err } from '../_shared/response.ts';

Deno.serve(async (req: Request) => {
  // 1. CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // 2. Autenticação e autorização
    const { user, profile } = await requireAuth(req, 'admin');

    // 3. Supabase client com service key (nunca ANON_KEY no servidor)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 4. Lógica de negócio
    const body = await req.json();
    // ... processamento

    // 5. Log de auditoria (fire-and-forget)
    logAccess({
      supabase,
      userId: user.id,
      action: 'alguma_action',
      resource: 'recurso',
      req,
    });

    // 6. Resposta
    return ok({ success: true });

  } catch (error) {
    if (error.code === 'UNAUTHORIZED') return err('UNAUTHORIZED', 401);
    if (error.code === 'FORBIDDEN')    return err('FORBIDDEN', 403);
    if (error.code === 'ACCOUNT_SUSPENDED') return err('ACCOUNT_SUSPENDED', 403);

    console.error('[FunctionName] Erro inesperado:', error);
    return err('INTERNAL_ERROR', 500);
  }
});
```

---

## 📡 Endpoints

### POST /auth-login

```typescript
// Sem requireAuth — é o endpoint de login
const { email, password } = await req.json();

const { data, error } = await supabase.auth.signInWithPassword({
  email, password
});

if (error) {
  logAccess({ userId: null, action: 'login_failed',
    metadata: { email }, req });
  return err('INVALID_CREDENTIALS', 401);
}

logAccess({ userId: data.user.id, action: 'login', req });
return ok({ session: data.session, profile });
```

### POST /auth-logout

```typescript
const { user } = await requireAuth(req);
await supabase.auth.admin.signOut(user.id);
logAccess({ userId: user.id, action: 'logout', req });
return ok({ success: true });
```

### GET /admin-users

```typescript
const { user } = await requireAuth(req, 'admin');

const { data } = await supabase
  .from('profiles')
  .select('id, name, role, active, last_seen, email:auth.users(email)')
  .order('created_at', { ascending: false });

logAccess({ userId: user.id, action: 'admin_access', resource: 'users', req });
return ok(data);
```

### POST /admin-users

```typescript
const { user } = await requireAuth(req, 'admin');
const { name, email, password, role } = await req.json();

const { data: newUser } = await supabase.auth.admin.createUser({
  email, password, email_confirm: true
});

await supabase.from('profiles').insert({
  id: newUser.user.id, name, role
});

logAccess({ userId: user.id, action: 'user_created',
  resource: `users:${newUser.user.id}`, metadata: { name, role }, req });
return ok(newUser.user, 201);
```

### PATCH /admin-users-update

```typescript
const { user } = await requireAuth(req, 'admin');
const { targetId, role, active } = await req.json();

// Impede auto-suspensão
if (targetId === user.id && active === false) {
  return err('CANNOT_SUSPEND_SELF', 400);
}

await supabase.from('profiles').update({ role, active }).eq('id', targetId);

const action = active === false ? 'user_suspended' : 'role_changed';
logAccess({ userId: user.id, action,
  resource: `users:${targetId}`, metadata: { role, active }, req });
return ok({ success: true });
```

---

## 🌍 Variáveis de Ambiente

```bash
# Supabase (nunca usar ANON_KEY no servidor)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# CORS — URL do deploy na Vercel
ALLOWED_ORIGIN=https://ipu-calculator.vercel.app
```

---

## ⚠️ Regras de Ouro

1. **Nunca usar ANON_KEY nas Edge Functions** — sempre `SERVICE_ROLE_KEY` que bypassa RLS quando necessário
2. **CORS restrito ao domínio do app** — `ALLOWED_ORIGIN` aponta só para o deploy da Vercel, não `*`
3. **Erros internos não vazam detalhes** — retornar sempre `INTERNAL_ERROR`, logar o detalhe no `console.error`
4. **Log é fire-and-forget** — falha no log não impede a resposta ao cliente
5. **Prefixo de log por função** — `[auth-login]`, `[admin-users]`, etc.

---

## 📋 Checklist de implementação

- [ ] Helpers _shared criados: cors, response, authMiddleware, auditLogger
- [ ] CORS restrito ao domínio da Vercel
- [ ] Todas as funções usam SERVICE_ROLE_KEY
- [ ] auth-login registra login e login_failed
- [ ] auth-logout invalida sessão e registra log
- [ ] admin-users GET retorna lista com last_seen
- [ ] admin-users POST cria usuário + perfil
- [ ] admin-users-update valida auto-suspensão
- [ ] admin-logs com filtros e paginação
- [ ] admin-metrics retorna agregações corretas
- [ ] Variáveis de ambiente configuradas no Supabase Dashboard
