-- =============================================================
-- IPU Calculator — Migration 009: Fix realtime by not overwriting
-- the reserved 'role' claim in the JWT
-- Data: 2026-06-07
-- Origem: continuação do Item 27 do backlog (realtime INSERT/UPDATE)
--
-- Causa raiz final: a função `custom_access_token_hook` estava
-- sobrescrevendo o claim **reservado** `role` do JWT com valores
-- como 'viewer', 'editor' ou 'admin' (linha:
--   claims := jsonb_set(claims, '{role}', to_jsonb(user_role));)
--
-- O claim `role` no Supabase é **reservado** para mapear o
-- `auth.role()` no SQL, que corresponde a uma role Postgres
-- (default: 'authenticated', 'anon', 'service_role'). Quando o
-- realtime server vê "role": "viewer" no JWT, ele tenta
-- `SET ROLE 'viewer'` para avaliar as policies RLS no contexto
-- de replication, mas a role Postgres `viewer` não existe →
-- ERROR 42704 (undefined_object) → listener postgres_changes
-- falha ao ser ativado. O system event reporta:
--   "Unable to subscribe to changes with given parameters.
--    An exception happened... role \"viewer\" does not exist"
--
-- Sintomas observados no Item 27:
-- - DELETE chegava via realtime (na verdade era sincronização
--   após confirmação do servidor, não o evento realtime)
-- - INSERT e UPDATE não chegavam (evento realtime bloqueado)
-- - App minimizado e reaberto disparava fetch que "resolvia"
-- - realtime.subscription permanecia em 0 rows porque o
--   listener nunca era ativado
--
-- Correção: NÃO sobrescrever o claim `role`. Manter apenas
-- `is_active` no JWT. As policies RLS já usam:
-- - models_select: auth.jwt() ->> 'is_active' (não depende de role)
-- - models_insert/update/delete: subquery em profiles (não depende de role)
-- - access_logs: subquery em profiles (não depende de role)
-- - profiles_select_own: auth.uid() (não depende de role)
--
-- Nenhuma policy depende de auth.role() = 'admin'/'editor'/'viewer',
-- então remover o overwrite é seguro. O role de aplicação
-- continua sendo buscado do banco via subquery, mantendo a fonte
-- da verdade única (public.profiles).
-- =============================================================

-- -------------------------------------------------------------
-- 1. Atualizar o hook para NÃO sobrescrever o claim 'role'
--    Manter apenas 'is_active' no JWT
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
  user_active boolean;
BEGIN
  -- Buscar apenas active do profile (role continua vindo do banco via subquery)
  SELECT active
    INTO user_active
    FROM public.profiles
    WHERE id = (event->>'userId')::uuid;

  -- Default seguro
  IF user_active IS NULL THEN user_active := true; END IF;

  -- Inserir APENAS is_active no payload do JWT
  -- IMPORTANTE: NÃO tocar no claim 'role' (reservado para Postgres role)
  -- O claim 'role' permanece 'authenticated' (default do Supabase)
  -- e o role de aplicação (admin/editor/viewer) é lido de profiles
  -- via subquery nas RLS policies.
  claims := event->'claims';
  claims := jsonb_set(claims, '{is_active}', to_jsonb(user_active));

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;

-- =============================================================
-- CHECKLIST DE VERIFICAÇÃO (rodar após aplicar a migration):
--
-- [ ] Fazer login e decodificar o JWT:
--     echo $TOKEN | cut -d'.' -f2 | base64 -d | jq
--     → claim 'role' deve ser 'authenticated' (NÃO 'viewer'/'admin'/'editor')
--     → claim 'is_active' deve estar presente (true/false)
--     → NÃO deve haver outras claims com nome 'role' sobrescrito
--
-- [ ] Verificar funções do hook:
--     SELECT pg_get_functiondef('public.custom_access_token_hook'::regproc);
--     → NÃO deve conter a linha
--       `claims := jsonb_set(claims, '{role}', ...)`
--     → deve conter APENAS a linha
--       `claims := jsonb_set(claims, '{is_active}', ...)`
--
-- [ ] Confirmar que NENHUMA policy usa auth.role() = 'admin'/'editor'/'viewer':
--     SELECT tablename, policyname, qual
--     FROM pg_policies
--     WHERE schemaname = 'public'
--       AND (qual::text LIKE '%auth.role%' OR with_check::text LIKE '%auth.role%');
--     → deve retornar 0 rows
--
-- TESTE REALTIME (cross-device, staging):
-- [ ] PC e celular logados no staging com o novo bundle
-- [ ] PC cria modelo "REALTIME TEST 009"
-- [ ] Em até 2s, o celular deve receber notificação realtime
--     e refazer fetch automático (sem hard reset / AppState change)
-- [ ] PC edita o modelo (muda nome)
-- [ ] Em até 2s, o celular deve refletir a edição
-- [ ] DELETE continua funcionando (regressão)
-- [ ] Console do mobile: NÃO deve mais aparecer o erro
--     "role \"viewer\" does not exist" no system event do WS
--
-- TESTE NODE PURO (diagnóstico):
-- [ ] Login via curl obtém JWT com role=authenticated
-- [ ] WS subscribe com event=INSERT/UPDATE/DELETE em public.models
--     NÃO retorna system event com erro 42704
-- [ ] INSERT direto via REST dispara postgres_changes event
--     no cliente WS (não apenas realtime.messages)
-- =============================================================
