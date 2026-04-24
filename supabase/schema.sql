-- ============================================================
-- Contador Inteligente de Calorías — Supabase Schema
-- Ejecutar en: Supabase Dashboard > SQL Editor
--
-- REQUISITO PREVIO: Habilitar Anonymous Auth en
-- Supabase Dashboard > Authentication > Providers > Anonymous
-- ============================================================

-- 1. Perfil de usuario (nombre y meta diaria)
CREATE TABLE public.user_profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL DEFAULT '',
  daily_goal  INTEGER     NOT NULL DEFAULT 2000,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_profiles_self" ON public.user_profiles
  FOR ALL
  USING  (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 2. Plantillas de comidas
CREATE TABLE public.food_templates (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  total_calories  INTEGER     NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.food_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "food_templates_self" ON public.food_templates
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Ítems dentro de cada plantilla (se borran al borrar la plantilla)
CREATE TABLE public.template_items (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id  UUID    NOT NULL REFERENCES public.food_templates(id) ON DELETE CASCADE,
  name         TEXT    NOT NULL,
  calories     INTEGER NOT NULL
);

ALTER TABLE public.template_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "template_items_self" ON public.template_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.food_templates ft
      WHERE ft.id = template_id AND ft.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.food_templates ft
      WHERE ft.id = template_id AND ft.user_id = auth.uid()
    )
  );

-- 4. Registro diario de alimentos (fuente de verdad para el historial)
CREATE TABLE public.food_items (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date        DATE        NOT NULL,
  name        TEXT        NOT NULL,
  calories    INTEGER     NOT NULL,
  meal        TEXT        NOT NULL CHECK (meal IN ('Desayuno', 'Almuerzo', 'Cena', 'Otros')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para las consultas más frecuentes (usuario + fecha)
CREATE INDEX food_items_user_date_idx ON public.food_items (user_id, date);

ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "food_items_self" ON public.food_items
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Trigger: crear perfil vacío al registrar un usuario anónimo nuevo
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 6. Agregación de historial en servidor (solo migración aditiva)
--    Reduce el payload de loadHistory: devuelve 1 fila por día
--    en lugar de 1 fila por cada food_item.
--    Idempotente: seguro re-ejecutarlo.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_history_totals(cutoff_date DATE)
RETURNS TABLE (date DATE, total_calories INTEGER)
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
  SELECT fi.date, SUM(fi.calories)::INTEGER AS total_calories
  FROM public.food_items fi
  WHERE fi.user_id = auth.uid()
    AND fi.date >= cutoff_date
  GROUP BY fi.date
  ORDER BY fi.date DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_history_totals(DATE) TO authenticated;

-- ============================================================
-- 7. Purga automática de food_items con más de 90 días
--    Objetivo: estabilizar el tamaño de la DB (y quedarse bajo los
--    500 MB del plan gratuito de Supabase) eliminando datos que
--    ya no son legibles desde la app: loadHistory solo pide 90 días
--    vía get_history_totals, así que las filas más antiguas no se
--    leen nunca.
--
--    REQUISITO: pg_cron debe estar habilitado
--    (Dashboard > Database > Extensions > pg_cron).
--    Idempotente: seguro re-ejecutar.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.purge_old_food_items()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.food_items
  WHERE date < CURRENT_DATE - INTERVAL '90 days';
$$;

-- Reemplaza el job si ya existía, para poder re-ejecutar este archivo.
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'purge-old-food-items';

SELECT cron.schedule(
  'purge-old-food-items',
  '0 3 * * *',  -- 03:00 UTC todos los días
  $$SELECT public.purge_old_food_items();$$
);
