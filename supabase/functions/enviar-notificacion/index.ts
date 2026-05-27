import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push";

/**
 * Encabezados CORS para permitir solicitudes desde cualquier origen
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Credentials": "true",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    
    // Configurar web-push
    const vapidPublicKey = Deno.env.get("VITE_VAPID_PUBLIC_KEY") ?? "";
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
    
    if (vapidPublicKey && vapidPrivateKey) {
      webpush.setVapidDetails(
        'mailto:soporte@stathmos.mx',
        vapidPublicKey,
        vapidPrivateKey
      );
    }

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

    // T008: Fetch target user's role information
    const { data: usuarioRoleData, error: roleError } = await supabaseAdmin
      .from("usuarios")
      .select(`
        id,
        roles (
          nombre
        )
      `)
      .eq("id", usuario_id)
      .maybeSingle();

    if (roleError) {
      console.error(`Error al consultar el rol del usuario ${usuario_id}:`, roleError);
    }

    // Extraer y normalizar rol del destinatario
    const rolesObject = usuarioRoleData?.roles;
    let userRoleName = "";
    if (rolesObject) {
      if (Array.isArray(rolesObject)) {
        userRoleName = rolesObject[0]?.nombre || "";
      } else {
        userRoleName = rolesObject.nombre || "";
      }
    }

    const normalizeRole = (value: string = "") =>
      value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();

    const targetUserRole = normalizeRole(userRoleName);

    // T009: Validation logic to verify user has the required role for the notification
    const getRequiredRole = (title: string): string | null => {
      const t = title.toLowerCase().trim();
      if (
        t.includes("cita agendada") ||
        t.includes("pago recibido") ||
        t.includes("cotizacion aceptada") ||
        t.includes("cotizacion rechazada") ||
        t.includes("alerta de inventario")
      ) {
        return "administrador";
      }
      if (
        t.includes("proyecto asignado") ||
        t.includes("refacciones disponibles") ||
        t.includes("refacciones listas") ||
        t.includes("cita asignada")
      ) {
        return "mecanico";
      }
      if (
        t.includes("actualizacion de tu proyecto") ||
        t.includes("proyecto finalizado") ||
        t.includes("nuevas fotos") ||
        t.includes("pago autorizado") ||
        t.includes("diagnostico inicial") ||
        t.includes("nueva observacion") ||
        t.includes("cita confirmada") ||
        t.includes("cita rechazada") ||
        t.includes("presupuesto disponible") ||
        t.includes("vehiculo listo para entrega") ||
        t.includes("pago pendiente")
      ) {
        return "cliente";
      }
      return null;
    };

    const requiredRole = getRequiredRole(titulo);

    if (requiredRole && targetUserRole !== requiredRole) {
      console.warn(`[Role Validation Check] Envío abortado: La notificación "${titulo}" requiere el rol "${requiredRole}", pero el usuario destinatario "${usuario_id}" tiene el rol "${targetUserRole || "ninguno"}".`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          skipped: true, 
          reason: `Role mismatch: notification requires "${requiredRole}" but user has "${targetUserRole || "none"}"` 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Guardar en la DB
    const { data: notificacion, error: insertError } = await supabaseAdmin
      .from("notificaciones")
      .insert([{ usuario_id, proyecto_id: proyecto_id ?? null, titulo, mensaje, leida: false }])
      .select()
      .maybeSingle();

    if (insertError) throw insertError;

    // Buscar suscripciones push del usuario
    const { data: subscriptions } = await supabaseAdmin
      .from("push_subscriptions")
      .select("id, subscription")
      .eq("user_id", usuario_id);

    const enviosExitosos = [];
    const enviosFallidos = [];

    // Enviar a todas las suscripciones registradas
    if (subscriptions && subscriptions.length > 0 && vapidPublicKey && vapidPrivateKey) {
      const payload = JSON.stringify({
        titulo,
        cuerpo: mensaje,
        icono: '/pwa-192x192.png',
        url: proyecto_id ? `/ticket/${proyecto_id}` : '/'
      });

      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification(sub.subscription, payload);
          enviosExitosos.push(sub.id);
        } catch (err) {
          console.error(`Error enviando a sub ${sub.id}:`, err);
          enviosFallidos.push({ id: sub.id, error: err });
          
          // T016: Si la suscripción expiró o es inválida (410/404), la eliminamos
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabaseAdmin.from("push_subscriptions").delete().eq("id", sub.id);
          }
        }
      }
    }

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
      JSON.stringify({ 
        success: true, 
        notificacion,
        pushStats: {
          intentados: subscriptions?.length || 0,
          exitosos: enviosExitosos.length,
          fallidos: enviosFallidos.length
        }
      }),
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