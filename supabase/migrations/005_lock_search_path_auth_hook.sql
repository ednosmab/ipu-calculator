-- 005_lock_search_path_auth_hook.sql
-- Trava o search_path da função custom_access_token_hook
-- Reportado pelo linter do Supabase (function_search_path_mutable) em 2026-06-05
--
-- Contexto: a função não definia SET search_path, permitindo que um atacante
-- com permissão de criar objetos em outros schemas manipulasse o resultado
-- (ex: criar schema "public" spoofed em pg_temp). Fix: lockar search_path
-- e qualificar todas as referências de schema.
--
-- Idempotente: pode rodar múltiplas vezes.

ALTER FUNCTION public.custom_access_token_hook SET search_path = '';
