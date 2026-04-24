-- ==============================================================================
-- SCRIPTS PARA COMPLETAR EL FLUJO DE REGISTRO
-- ==============================================================================

-- 1. Crear el trigger para generar el perfil en 'public.usuarios' automáticamente
-- al momento en que Supabase Auth inserta un nuevo usuario (al enviar invite o registrarse).
CREATE OR REPLACE FUNCTION public.fn_crear_perfil_y_rol()
RETURNS trigger AS $$
DECLARE
    v_rol_id uuid;
    v_rol_nombre text;
BEGIN
    -- Obtenemos el rol desde los metadatos enviados en la Edge Function (ej: 'cliente')
    v_rol_nombre := COALESCE(NEW.raw_user_meta_data->>'rol', 'Cliente');
    
    -- Normalizamos por si en la DB está como 'Cliente' en lugar de 'cliente'
    IF v_rol_nombre = 'cliente' THEN
        v_rol_nombre := 'Cliente';
    END IF;

    -- Buscamos el ID del rol en la tabla roles
    SELECT id INTO v_rol_id FROM public.roles WHERE nombre ILIKE v_rol_nombre LIMIT 1;
    
    -- Insertamos el usuario para tener la referencia en la DB pública
    INSERT INTO public.usuarios (id, rol_id, nombre, correo)
    VALUES (
        NEW.id,
        v_rol_id,
        COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
        NEW.email
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- En caso de que el trigger ya exista, lo borraremos para asegurar que se re-cree
DROP TRIGGER IF EXISTS tr_crear_perfil_usuario ON auth.users;

-- Asociamos el Trigger a la tabla de Auth de Supabase
CREATE TRIGGER tr_crear_perfil_usuario
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.fn_crear_perfil_y_rol();


-- 2. Crear la función RPC que llama el Frontend en CompletarRegistro.jsx
-- Esta función vincula 'usuario_id' con la tabla 'clientes' usando el auth.uid() actual.
CREATE OR REPLACE FUNCTION public.fn_completar_registro_cliente()
RETURNS void AS $$
BEGIN
    -- Establecer el UUID del usuario autenticado en el Cliente que tenga el mismo correo
    UPDATE public.clientes 
    SET usuario_id = auth.uid(),
        invite_enviado = true,
        updated_at = now()
    WHERE correo = (SELECT email FROM auth.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
