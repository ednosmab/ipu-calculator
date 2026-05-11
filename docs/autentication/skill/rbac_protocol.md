# SKILL: Role-Based Access Control (RBAC) Protocol

Este protocolo define como os níveis de acesso devem ser implementados e verificados no IPU Calculator, tanto no frontend quanto no backend.

---

## 🎭 Hierarquia de Roles

```
admin   →  gerencia usuários, acessa painel admin, lê e escreve modelos
editor  →  lê e escreve modelos
viewer  →  somente lê modelos
```

A hierarquia é ordinal: `admin > editor > viewer`. Um role mais alto inclui todas as permissões dos anteriores.

---

## 🗄️ RLS — Row Level Security

O RLS é a camada de segurança real. O frontend adapta a UI mas nunca controla acesso — o banco recusa operações não autorizadas independente do que o cliente enviar.

### Leitura (viewer+)
```sql
CREATE POLICY "models_select" ON models
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND active = true
    )
  );
```

### Escrita (editor+)
```sql
CREATE POLICY "models_insert" ON models
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('editor', 'admin')
        AND active = true
    )
  );

CREATE POLICY "models_update" ON models
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('editor', 'admin')
        AND active = true
    )
  );

CREATE POLICY "models_delete" ON models
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('editor', 'admin')
        AND active = true
    )
  );
```

---

## 🔧 Middleware de Autorização (Edge Functions)

Toda Edge Function deve chamar `requireAuth` antes de qualquer lógica de negócio.

```typescript
// shared/authMiddleware.ts
import { createClient } from '@supabase/supabase-js';

const ROLE_HIERARCHY = ['viewer', 'editor', 'admin'];

export async function requireAuth(req: Request, minRole: string = 'viewer') {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) {
    throw new AuthError('UNAUTHORIZED', 401);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw new AuthError('UNAUTHORIZED', 401);

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, active, name')
    .eq('id', user.id)
    .single();

  if (!profile?.active) throw new AuthError('ACCOUNT_SUSPENDED', 403);

  const userRoleIndex = ROLE_HIERARCHY.indexOf(profile.role);
  const minRoleIndex = ROLE_HIERARCHY.indexOf(minRole);

  if (userRoleIndex < minRoleIndex) {
    throw new AuthError('FORBIDDEN', 403);
  }

  return { user, profile };
}

class AuthError extends Error {
  constructor(public code: string, public status: number) {
    super(code);
  }
}
```

### Uso nas Edge Functions

```typescript
// Somente admin
Deno.serve(async (req) => {
  try {
    const { user, profile } = await requireAuth(req, 'admin');
    // ... lógica admin
  } catch (err) {
    if (err instanceof AuthError) {
      return new Response(JSON.stringify({ error: err.code }), {
        status: err.status
      });
    }
    return new Response(JSON.stringify({ error: 'INTERNAL_ERROR' }), {
      status: 500
    });
  }
});
```

---

## 🖥️ Adaptação de UI por Role

A UI adapta a experiência mas **nunca substitui a validação do servidor**.

```typescript
// hooks/usePermissions.ts
export function usePermissions() {
  const { profile } = useAuth();
  const role = profile?.role ?? 'viewer';

  const ROLE_HIERARCHY = ['viewer', 'editor', 'admin'];
  const hasRole = (min: string) =>
    ROLE_HIERARCHY.indexOf(role) >= ROLE_HIERARCHY.indexOf(min);

  return {
    canReadModels:   hasRole('viewer'),
    canWriteModels:  hasRole('editor'),
    canAccessAdmin:  hasRole('admin'),
  };
}
```

```typescript
// Uso em componente
const { canWriteModels, canAccessAdmin } = usePermissions();

return (
  <>
    <ModelList />
    {canWriteModels && <CreateModelButton />}
    {canAccessAdmin && <AdminLink />}
  </>
);
```

---

## ⚠️ Regras de Ouro

1. **O RLS é a fonte de verdade** — ocultar botões na UI é conveniência, não segurança
2. **Nunca passar role como parâmetro do cliente** — o servidor lê o role do banco pelo `auth.uid()`
3. **Conta suspensa (`active = false`) é tratada como FORBIDDEN** — não como UNAUTHORIZED
4. **Mudança de role tem efeito imediato no banco** — o JWT antigo ainda tem o role anterior até expirar; o RLS verifica o banco, não o JWT
5. **Admin não pode se auto-suspender** — validar no endpoint PATCH /admin/users

---

## 📋 Checklist de implementação

- [ ] RLS habilitado na tabela models
- [ ] As quatro policies criadas (SELECT, INSERT, UPDATE, DELETE)
- [ ] `requireAuth` aplicado em todas as Edge Functions
- [ ] `usePermissions` centraliza lógica de UI por role
- [ ] Botões de escrita ocultos para viewer
- [ ] Rota /admin inacessível para não-admin
- [ ] Teste manual: viewer tentando INSERT deve receber erro do banco
- [ ] Teste manual: usuário suspenso deve ser bloqueado imediatamente
