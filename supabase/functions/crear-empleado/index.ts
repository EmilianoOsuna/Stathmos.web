import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Encabezados CORS para permitir solicitudes desde cualquier origen
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Obtiene la URL de redirección para completar el registro de empleado.
 * Prioriza la APP_URL configurada en variables de entorno, sino usa el origen de la solicitud.
 * @param {Request} req - Objeto de solicitud HTTP
 * @returns {string} URL completa para redireccionar a la página de completar registro
 */
const getInviteRedirectTo = (req: Request): string => {
  const appUrl = Deno.env.get("APP_URL")?.trim();
  if (appUrl) {
    return `${appUrl.replace(/\/$/, "")}/completar-registro`;
  }

  const origin = req.headers.get("origin") || "https://stathmos.online";
  return `${origin.replace(/\/$/, "")}/completar-registro`;
};

/**
 * Función Supabase: Crear Empleado
 * 
 * Crea un nuevo empleado en el sistema invitándolo por correo electrónico.
 * Solo administradores pueden crear empleados. Valida el token de autenticación
 * y la autorización antes de crear la invitación.
 * 
 * Flujo:
 * 1. Valida que el usuario sea administrador
 * 2. Envía invitación de auth por correo
 * 3. Inserta registro en tabla empleados
 * 4. En caso de error, limpia el usuario ghost creado por auth
 * 
 * @async
 * @param {Request} req - Objeto de solicitud HTTP
 * @param {string} req.headers.authorization - Token de autenticación Bearer del admin (requerido)
 * @param {Object} req.body - Cuerpo de la solicitud en JSON
 * @param {string} req.body.nombre - Nombre del empleado (requerido)
 * @param {string} req.body.correo - Correo electrónico del empleado (requerido)
 * @param {string} req.body.rol_destino - Rol del empleado: "Administrador" o "Mecánico" (requerido)
 * @param {string} [req.body.telefono] - Teléfono del empleado (opcional)
 * @param {string} [req.body.rfc] - RFC del empleado (opcional)
 * @param {string} [req.body.fecha_contratacion] - Fecha de contratación YYYY-MM-DD (opcional)
 * 
 * @returns {Response} JSON con estructura:
 *   - success: true - Empleado creado y invitación enviada exitosamente
 *   O
 *   - success: false - Error en la operación
 *   - error: Descripción del error específico
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // --- SEGURIDAD: Validar que sea un Admin quien invita ---
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error("No hay sesión activa.");
    }

    const { data: { user: adminUser }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    // Verificamos en los metadatos de Supabase Auth si es Administrador
    if (userError || adminUser?.user_metadata?.rol?.toLowerCase() !== 'administrador') {
      throw new Error("No tienes permisos para invitar empleados. Solo administradores pueden hacer esto.");
    }

    const { nombre, correo, telefono, rfc, rol_destino, fecha_contratacion } = await req.json();

    if (!nombre || !correo || !rol_destino) {
      return new Response(
        JSON.stringify({ success: false, error: "Faltan campos requeridos." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Determinamos la URL de redirección para la invitación
    const redirectTo = getInviteRedirectTo(req);

    // 1. Crear y enviar invite por correo 
    // El trigger `tr_crear_perfil_usuario` leerá el rol ('Mecánico' o 'Administrador') 
    // lo insertará en public.roles si no existe y luego en public.usuarios
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(correo, {
      redirectTo,
      data: { nombre, rol: rol_destino },
    });

    if (authError) throw authError;

    // 2. Insertar en public.empleados
    const { error: dbError } = await supabaseAdmin.from("empleados").insert({
      usuario_id: authData.user.id,
      nombre,
      correo,
      telefono: telefono ?? null,
      rfc: rfc ?? null,
      fecha_ingreso: fecha_contratacion ?? new Date().toISOString().split('T')[0],
    });

    if (dbError) {
      // Si falla la tabla, borramos el "fantasma" que Auth creó para limpiar el error
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw dbError;
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
