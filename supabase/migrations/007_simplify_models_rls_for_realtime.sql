-- =============================================================
-- IPU Calculator — Migration 007: Simplify models SELECT RLS for Realtime
-- Data: 2026-06-06
-- Origem: bug ativo Item 27 do backlog
--   Realtime sync entre devices só funciona para DELETE.
--   INSERT e UPDATE não chegam ao cliente via WebSocket.
--
-- Causa raiz: a policy `models_select` em 001_auth_security.sql
-- usa subquery:
--   USING (EXISTS (SELECT 1 FROM public.profiles
--                  WHERE id = auth.uid() AND active = true))
--
-- Em contexto de replicação lógica do Supabase Realtime, esta
-- subquery falha para INSERT (NEW row) e UPDATE (OLD + NEW rows)
-- mas funciona para DELETE (OLD row). O resultado é que o
-- realtime service filtra os eventos antes de enviar ao cliente.
-- Ver: https://github.com/supabase/realtime/issues/ (RLS subquery
-- em contexto de replication)
--
-- Correção: substituir a subquery por uma SECURITY DEFINER function.
-- A função executa com as permissões do dono (não do caller),
-- garantindo comportamento consistente em ambos os contextos:
--   - API REST (PostgREST): mesma performance/semântica
--   - Realtime (logical replication): subquery funciona
-- =============================================================

-- -------------------------------------------------------------
-- 1. Função SECURITY DEFINER que encapsula a consulta a profiles
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_user_is_active()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    (SELECT active FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

-- Permitir que authenticated e anon executem a função
-- (anon não tem auth.uid(), então retornará false — bloqueia acesso)
GRANT EXECUTE ON FUNCTION public.current_user_is_active() TO authenticated, anon;

-- -------------------------------------------------------------
-- 2. Substituir a SELECT policy para usar a função
--    Idempotente: DROP + CREATE
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "models_select" ON public.models;
CREATE POLICY "models_select" ON public.models
  FOR SELECT TO authenticated
  USING (public.current_user_is_active());

-- =============================================================
-- CHECKLIST DE VERIFICAÇÃO (rodar após aplicar a migration):
--
-- [ ] SELECT proname FROM pg_proc WHERE proname = 'current_user_is_active';
--     → deve retornar 1 linha
-- [ ] SELECT policyname FROM pg_policies WHERE tablename = 'models' AND cmd = 'SELECT';
--     → deve listar 'models_select'
-- [ ] Teste realtime cross-device:
--     1. PC e celular logados no staging
--     2. PC cria modelo "REALTIME TEST 007"
--     3. Em até 2s, o celular deve receber notificação realtime
--        e refazer fetch automático (sem hard reset)
-- [ ] Mesmo teste para UPDATE (editar nome do modelo)
-- [ ] DELETE continua funcionando (regressão)
-- =============================================================
