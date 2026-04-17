// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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