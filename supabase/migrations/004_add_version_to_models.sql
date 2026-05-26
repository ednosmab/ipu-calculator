-- IPU Calculator — Migration 004: Add version column to models
-- Idempotente: seguro de re-executar

ALTER TABLE public.models ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;

-- Atualiza modelos existentes com version = 1
UPDATE public.models SET version = 1 WHERE version IS NULL;
