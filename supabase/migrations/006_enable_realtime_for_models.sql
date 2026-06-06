-- =============================================================
-- IPU Calculator — Migration 006: Enable Realtime for models
-- Data: 2026-06-06
-- Origem: bug ativo — sync realtime entre devices não funciona.
--   Subscription conecta (✅ Realtime conectado com sucesso) mas
--   eventos postgres_changes nunca chegam.
-- =============================================================

-- -------------------------------------------------------------
-- 1. Adicionar tabela `models` à publicação `supabase_realtime`
--    Sem isso, o WebSocket não recebe eventos da tabela, mesmo
--    que o cliente esteja subscrito em postgres_changes.
-- -------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'models'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.models;
  END IF;
END $$;

-- -------------------------------------------------------------
-- 2. REPLICA IDENTITY FULL
--    Necessário para que UPDATE e DELETE enviem os valores
--    anteriores no payload.old. Sem isso, o RLS não consegue
--    aplicar o filtro e o cliente recebe payload.old = null.
--    É idempotente.
-- -------------------------------------------------------------
ALTER TABLE public.models REPLICA IDENTITY FULL;

-- -------------------------------------------------------------
-- 3. Grants para roles que escutam realtime
--    O Supabase Realtime usa as mesmas permissões de SELECT da
--    tabela para decidir se o cliente recebe o evento.
--    RLS já está configurado para `TO authenticated` em
--    migration 001, então o evento será entregue ao cliente
--    autenticado com policy válida.
--
--    Esta seção apenas garante que o SELECT base está liberado
--    (a RLS policy de 001_auth_security.sql continua aplicando).
-- -------------------------------------------------------------
GRANT SELECT ON public.models TO anon, authenticated;

-- =============================================================
-- CHECKLIST DE VERIFICAÇÃO (rodar após aplicar a migration):
--
-- [ ] SELECT * FROM pg_publication_tables
--       WHERE pubname = 'supabase_realtime' AND tablename = 'models';
--     → deve retornar 1 linha
-- [ ] SELECT relreplident FROM pg_class WHERE relname = 'models';
--     → deve retornar 'f' (FULL)
-- [ ] Criar modelo no PC; em até 2s, o celular deve receber
--     notificação via WebSocket e refazer fetch automático.
-- =============================================================
