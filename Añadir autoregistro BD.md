-- Primero, asegúrate de tener los roles insertados (tu script solo crea la tabla)

INSERT INTO public.roles (nombre, descripcion)

VALUES ('Administrador', 'Eje central'), ('Mecánico', 'Gestión técnica'), ('Cliente', 'Portal de usuario');

  

-- Función para automatizar el registro de Clientes

CREATE OR REPLACE FUNCTION public.fn_crear_usuario_nuevo()

RETURNS trigger AS $$

DECLARE

  v_rol_cliente_id uuid;

BEGIN

  -- 1. Buscamos el ID del rol 'Cliente'

  SELECT id INTO v_rol_cliente_id FROM public.roles WHERE nombre = 'Cliente';

  

  -- 2. Insertamos en tu tabla public.usuarios

  INSERT INTO public.usuarios (id, rol_id, nombre, correo)

  VALUES (new.id, v_rol_cliente_id, COALESCE(new.raw_user_meta_data->>'nombre', 'Nuevo Cliente'), new.email);

  

  -- 3. Insertamos en la tabla public.clientes (RF-001)

  INSERT INTO public.clientes (usuario_id, nombre, correo, telefono)

  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'nombre', 'Nuevo Cliente'), new.email, new.raw_user_meta_data->>'telefono');

  

  RETURN NEW;

END;

$$ LANGUAGE plpgsql SECURITY DEFINER;

  

-- Trigger que se dispara tras el registro en Auth

CREATE TRIGGER tr_nuevo_usuario_auth

  AFTER INSERT ON auth.users

  FOR EACH ROW EXECUTE FUNCTION public.fn_crear_usuario_nuevo();