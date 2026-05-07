-- =============================================================
-- IPU Calculator — Migration 001: Auth & Security Foundation
-- Fase 1 do plano: docs/autentication/plain/security_implementation_plan.md
-- Idempotente: seguro de re-executar
-- =============================================================

-- -------------------------------------------------------------
-- 1. TABELA: profiles
--    Referencia auth.users; armazena role, status e último acesso
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name       text NOT NULL,
  role       text NOT NULL DEFAULT 'viewer'
               CHECK (role IN ('admin', 'editor', 'viewer')),
  active     boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  last_seen  timestamptz
);

-- RLS: profiles — permite leitura com service role key
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Policy para service role (bypass)
DROP POLICY IF EXISTS "profiles_select_service_role" ON public.profiles;
CREATE POLICY "profiles_select_service_role" ON public.profiles
  FOR SELECT TO service_role
  USING (true);

-- -------------------------------------------------------------
-- 2. RLS NA TABELA: models
--    SELECT: viewer+  |  INSERT/UPDATE/DELETE: editor+
-- -------------------------------------------------------------
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;

-- Leitura — viewer, editor e admin ativos
DROP POLICY IF EXISTS "models_select" ON public.models;
CREATE POLICY "models_select" ON public.models
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND active = true
    )
  );

-- Inserção — editor e admin ativos
DROP POLICY IF EXISTS "models_insert" ON public.models;
CREATE POLICY "models_insert" ON public.models
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('editor', 'admin')
        AND active = true
    )
  );

-- Atualização — editor e admin ativos
DROP POLICY IF EXISTS "models_update" ON public.models;
CREATE POLICY "models_update" ON public.models
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('editor', 'admin')
        AND active = true
    )
  );

-- Exclusão — editor e admin ativos
DROP POLICY IF EXISTS "models_delete" ON public.models;
CREATE POLICY "models_delete" ON public.models
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('editor', 'admin')
        AND active = true
    )
  );

-- -------------------------------------------------------------
-- 3. TABELA: access_logs
--    Auditoria de todas as ações relevantes (login, CRUD, admin)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.access_logs (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES auth.users ON DELETE SET NULL,
  action     text NOT NULL,
  resource   text,
  metadata   jsonb,
  ip         text,
  platform   text, -- 'web' | 'ios' | 'android' | 'native'
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_access_logs_user_id    ON public.access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_action     ON public.access_logs(action);
CREATE INDEX IF NOT EXISTS idx_access_logs_created_at ON public.access_logs(created_at DESC);

-- RLS: access_logs — somente admin lê (via Edge Function); nenhum cliente escreve diretamente
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "access_logs_admin_select" ON public.access_logs;
CREATE POLICY "access_logs_admin_select" ON public.access_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin' AND active = true
    )
  );



-- -------------------------------------------------------------
-- 5. CUSTOM CLAIMS HOOK
--    Injeta o campo "role" no JWT após cada login
--    Registrar no Supabase Dashboard > Auth > Hooks > Custom Access Token
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb AS $$
DECLARE
  claims    jsonb;
  user_role text;
BEGIN
  -- Busca o role no banco pelo userId do evento
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = (event->>'userId')::uuid;

  -- Se não encontrar (usuário sem perfil), usa 'viewer' como fallback
  IF user_role IS NULL THEN
    user_role := 'viewer';
  END IF;

  claims := event->'claims';
  claims := jsonb_set(claims, '{role}', to_jsonb(user_role));

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessário para o hook ser invocado pelo sistema de auth
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;

-- -------------------------------------------------------------
-- 6. TRIGGER: atualiza last_seen no login
--    Supabase não expõe hook de login via trigger nativo,
--    mas a Edge Function auth-login faz o UPDATE direto.
--    Este índice otimiza a query de last_seen no painel admin.
-- -------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON public.profiles(last_seen DESC);

-- =============================================================
-- CHECKLIST DE VERIFICAÇÃO (rodar após aplicar a migration):
--
-- [ ] SELECT * FROM public.profiles LIMIT 1;
-- [ ] SELECT policyname FROM pg_policies WHERE tablename = 'models';
--     → deve listar: models_select, models_insert, models_update, models_delete
-- [ ] SELECT policyname FROM pg_policies WHERE tablename = 'access_logs';
--     → deve listar: access_logs_admin_select
-- [ ] SELECT proname FROM pg_proc WHERE proname = 'custom_access_token_hook';
--     → deve retornar 1 linha
-- [ ] Ativar o hook em: Supabase Dashboard > Authentication > Hooks
-- [ ] Desativar sign-up público em: Dashboard > Auth > Settings > Disable signup
-- =============================================================
