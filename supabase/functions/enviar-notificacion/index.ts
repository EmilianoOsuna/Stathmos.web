// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Encabezados CORS para permitir solicitudes desde cualquier origen
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Credentials": "true",
};

/**
 * Función Supabase: Enviar Notificación
 * 
 * Crea una nueva notificación en la base de datos para un usuario específico.
 * Registra la operación en la tabla de auditoría para mantener un historial de cambios.
 * 
 * @async
 * @param {Request} req - Objeto de solicitud HTTP
 * @param {string} req.headers.authorization - Token de autenticación Bearer requerido
 * @param {Object} req.body - Cuerpo de la solicitud en JSON
 * @param {string} req.body.usuario_id - ID del usuario que recibirá la notificación (requerido)
 * @param {string} [req.body.proyecto_id] - ID del proyecto asociado (opcional)
 * @param {string} req.body.titulo - Título de la notificación (requerido)
 * @param {string} req.body.mensaje - Contenido del mensaje (requerido)
 * 
 * @returns {Response} JSON con estructura: 
 *   - success: true - Notificación creada exitosamente
 *   - notificacion: {id, usuario_id, proyecto_id, titulo, mensaje, leida, created_at}
 *   O
 *   - success: false - Error en la operación
 *   - error: Descripción del error
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const effectiveToken = (req.headers.get("authorization") || "")
      .replace("Bearer ", "").trim();

    if (!effectiveToken) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized: missing token" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${effectiveToken}` } },
    });

    const { data: userData, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !userData?.user) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const actorId = userData.user.id;

    const body = await req.json();
    const { usuario_id, proyecto_id, titulo, mensaje } = body || {};

    if (!usuario_id || !titulo || !mensaje) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields: usuario_id, titulo, mensaje" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { data: notificacion, error: insertError } = await supabaseAdmin
      .from("notificaciones")
      .insert([{ usuario_id, proyecto_id: proyecto_id ?? null, titulo, mensaje, leida: false }])
      .select()
      .maybeSingle();

    if (insertError) throw insertError;

    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || null;
    await supabaseAdmin
      .from("auditoria")
      .insert([{
        usuario_id: actorId,
        tabla: "notificaciones",
        operacion: "INSERT",
        registro_id: notificacion?.id ?? null,
        datos_antes: null,
        datos_despues: { notificacion_id: notificacion?.id ?? null, usuario_id, proyecto_id: proyecto_id ?? null, titulo, mensaje, leida: false },
        ip,
      }]);

    return new Response(
      JSON.stringify({ success: true, notificacion }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("enviar-notificacion error:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error?.message || error) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});