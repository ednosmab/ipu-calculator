-- supabase/migrations/003_fix_auth_hook.sql
-- 1. Corrige o campo de ID (user_id em vez de userId)
-- 2. Altera o nome da claim de 'role' para 'user_role' para evitar conflito com o Supabase

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb AS $$
DECLARE
  claims    jsonb;
  user_role text;
BEGIN
  -- Busca o role no banco pelo user_id do evento (padrão Supabase Auth Hook)
  -- Nota: se 'user_id' não funcionar em versões específicas, tente 'sub'
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = (event->>'user_id')::uuid;

  -- Se não encontrar (usuário sem perfil), usa 'viewer' como fallback
  IF user_role IS NULL THEN
    user_role := 'viewer';
  END IF;

  claims := event->'claims';
  
  -- NUNCA sobrescrever a claim 'role' de topo, pois o Supabase a usa para o papel do Postgres
  -- Injetamos em 'user_role' para uso no frontend (opcional)
  claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir que o grant continue válido
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
