-- Fix profiles INSERT policy for service_role
DROP POLICY IF EXISTS "profiles_insert_service_role" ON public.profiles;
CREATE POLICY "profiles_insert_service_role" ON public.profiles
  FOR INSERT TO service_role
  WITH CHECK (true);