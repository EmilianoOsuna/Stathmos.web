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