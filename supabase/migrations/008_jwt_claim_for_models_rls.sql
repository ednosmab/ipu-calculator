-- =============================================================
-- IPU Calculator — Migration 008: JWT claim for models RLS
-- Data: 2026-06-06
-- Origem: continuação do Item 27 do backlog
--   A migration 007 (SECURITY DEFINER function com auth.uid())
--   NÃO corrigiu o filtro realtime para INSERT/UPDATE.
--   A função ainda depende de auth.uid(), que retorna NULL no
--   contexto de replicação lógica do Supabase Realtime para
--   eventos INSERT (NEW row) e UPDATE (OLD+NEW row).
--
-- Causa raiz refinada: o `custom_access_token_hook` injeta a
-- claim `role` no JWT, mas nada mais. No contexto de replication,
-- `auth.uid()` vem de `current_setting('request.jwt.claim.sub')`,
-- que é resolvido em outro momento que `auth.jwt()`. Para INSERT,
-- o sub claim pode vir NULL mesmo com JWT válido, fazendo a
-- função SECURITY DEFINER retornar `false` e filtrar o evento.
--
-- Correção definitiva: usar `(auth.jwt() ->> 'is_active')`
-- em vez de subquery. A claim JWT é lida diretamente do token
-- anexado à requisição (ou subscription realtime), sem depender
-- de `current_setting` no contexto de replication.
--
-- O hook de access token é atualizado para incluir `is_active`
-- junto com `role`. Como o hook já é executado no login, todo
-- JWT novo terá a claim. Para garantir backward-compat, o
-- COALESCE default é `true` (JWTs antigos sem a claim continuam
-- funcionando até o próximo login).
-- =============================================================

-- -------------------------------------------------------------
-- 1. Atualizar o hook para incluir is_active no JWT
--    Idempotente: CREATE OR REPLACE
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  claims      jsonb;
  user_role   text;
  user_active boolean;
BEGIN
  -- Buscar role e active do profile
  SELECT role, active
    INTO user_role, user_active
  FROM public.profiles
  WHERE id = (event->>'userId')::uuid;

  -- Defaults seguros
  IF user_role   IS NULL THEN user_role   := 'viewer'; END IF;
  IF user_active IS NULL THEN user_active := true;    END IF;

  -- Inserir claims no payload do JWT
  claims := event->'claims';
  claims := jsonb_set(claims, '{role}',      to_jsonb(user_role));
  claims := jsonb_set(claims, '{is_active}', to_jsonb(user_active));

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;

-- -------------------------------------------------------------
-- 2. Substituir a SELECT policy para usar a claim JWT
--    Idempotente: DROP + CREATE
--    COALESCE(..., true) garante backward-compat: JWTs antigos
--    (sem a claim) continuam tendo acesso até o próximo login.
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "models_select" ON public.models;
CREATE POLICY "models_select" ON public.models
  FOR SELECT TO authenticated
  USING (COALESCE((auth.jwt() ->> 'is_active')::boolean, true));

-- -------------------------------------------------------------
-- 3. Limpar função dead code da migration 007
--    Não é mais usada pela policy e depende de auth.uid(),
--    que é exatamente o que queremos evitar.
-- -------------------------------------------------------------
DROP FUNCTION IF EXISTS public.current_user_is_active();

-- =============================================================
-- CHECKLIST DE VERIFICAÇÃO (rodar após aplicar a migration):
--
-- [ ] SELECT proname FROM pg_proc WHERE proname = 'custom_access_token_hook';
--     → deve retornar 1 linha com `is_jsonb_h` no `prosrc`
-- [ ] SELECT policyname, qual FROM pg_policies
--     WHERE tablename = 'models' AND cmd = 'SELECT';
--     → deve listar 'models_select' com `qual` referenciando
--       `auth.jwt()` em vez de subquery
-- [ ] SELECT proname FROM pg_proc WHERE proname = 'current_user_is_active';
--     → deve retornar 0 linhas (função removida)
--
-- TESTE REALTIME (cross-device, staging):
-- [ ] PC e celular logados no staging
-- [ ] PC cria modelo "REALTIME TEST 008"
-- [ ] Em até 2s, o celular deve receber notificação realtime
--     e refazer fetch automático (sem hard reset / AppState change)
-- [ ] PC edita o modelo (muda nome)
-- [ ] Em até 2s, o celular deve refletir a edição
-- [ ] DELETE continua funcionando (regressão)
--
-- NOTA: usuários com JWTs antigos (sem claim is_active) não
-- precisam re-logar imediatamente — COALESCE default `true`
-- mantém acesso. Mas o ideal é re-logar para que a suspensão
-- de conta tenha efeito imediato.
-- =============================================================
