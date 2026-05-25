-- 1. Crear la tabla
CREATE TABLE public.push_subscriptions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription jsonb NOT NULL,
    created_at timestamp with time zone NULL DEFAULT now(),
    CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id)
);

-- 2. Índices
CREATE INDEX push_subscriptions_user_id_idx ON public.push_subscriptions USING btree (user_id);

-- 3. Habilitar RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS
-- Permitir a los usuarios insertar sus propias suscripciones
CREATE POLICY "Users can insert their own subscriptions" 
ON public.push_subscriptions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Permitir a los usuarios ver sus propias suscripciones
CREATE POLICY "Users can view their own subscriptions" 
ON public.push_subscriptions FOR SELECT 
USING (auth.uid() = user_id);

-- Permitir a los usuarios eliminar sus propias suscripciones
CREATE POLICY "Users can delete their own subscriptions" 
ON public.push_subscriptions FOR DELETE 
USING (auth.uid() = user_id);

-- (Opcional) Si la Edge Function usa el service_role, ya tiene acceso bypass RLS por defecto.
