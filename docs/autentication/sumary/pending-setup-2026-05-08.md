# Pendente — Setup Final do Auth (Maio 2026)

**Status:** Parcialmente implementado — em espera

---

## O que foi feito

- Migration SQL executada (profiles, access_logs, RLS em models)
- Auth Hook ativado no Dashboard
- Sign-up público desativado
- Edge Functions deployadas (locais) — falta fazer deploy de verdade
- CORS atualizado para suportar production + staging
- `.env` atualizado com `EXPO_PUBLIC_EDGE_FUNCTIONS_URL`

---

## O que falta fazer

### 1. Deploy das Edge Functions

```bash
npx supabase link --project-ref uqihnpwpcrujqycbuzxv
npx supabase secrets set ALLOWED_ORIGIN=https://ipu-calculator.vercel.app
npx supabase functions deploy
```

### 2. Configurar .env.local do frontend (Vercel)

```bash
EXPO_PUBLIC_EDGE_FUNCTIONS_URL=https://uqihnpwpcrujqycbuzxv.supabase.co/functions/v1
```

Adicionar no painel da Vercel: Project Settings > Environment Variables

### 3. Criar primeiro usuário admin

1. Supabase Dashboard > Authentication > Users > Add user
   - Criar usuário com email e senha
2. Executar SQL para definir role admin:
   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE id = 'uuid-do-usuario-criado';
   ```
3. Login no app com esse usuário
4. Via painel `/admin/users`, criar os demais usuários

---

## Teste manual esperado

1. Acessar `/models` → redireciona para `/login`
2. Fazer login → redireciona para `/models`
3. Criar modelo → aparece na lista
4. Acessar `/admin/users` → ver lista de usuários

---

## Debugging — se algo não funcionar

### Edge Function retorna 401 na validação
- Verificar se o Auth Hook (Custom Access Token) está ativado
- Dashboard > Authentication > Hooks

### CORS error no navegador
- Verificar se `ALLOWED_ORIGIN` está configurado nos secrets
- `npx supabase secrets list`

### AuthProvider fica em loading infinito
- Verificar `EXPO_PUBLIC_EDGE_FUNCTIONS_URL` no .env
- Verificar se `auth-validate` está deployada e respondendo

### Tela em branco em /models
- Sem `EXPO_PUBLIC_EDGE_FUNCTIONS_URL` → todas as chamadas falham silenciosamente
- Ver console do navegador (F12) para erros de rede