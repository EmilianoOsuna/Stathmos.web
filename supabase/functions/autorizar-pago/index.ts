// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized: missing token" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const supabaseUser = createClient(supabaseUrl, token);

    // Obtener el cuerpo de la solicitud
    const body = await req.json();
    const { pago_id, cambiar_a_entregado } = body;

    if (!pago_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required field: pago_id" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Obtener el pago
    const { data: pago, error: pagoErr } = await supabaseUser
      .from("pagos")
      .select("id, proyecto_id, estado")
      .eq("id", pago_id)
      .maybeSingle();

    if (pagoErr) throw pagoErr;
    if (!pago) {
      return new Response(
        JSON.stringify({ success: false, error: "Pago no encontrado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Validar que el pago esté en estado "pendiente"
    if (pago.estado !== "pendiente") {
      return new Response(
        JSON.stringify({ success: false, error: `El pago ya está en estado: ${pago.estado}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 409 }
      );
    }

    // Autorizar el pago (cambiar a "completado")
    const { data: pagoActualizado, error: pagoUpdateErr } = await supabaseAdmin
      .from("pagos")
      .update({
        estado: "completado",
      })
      .eq("id", pago_id)
      .select()
      .single();

    if (pagoUpdateErr) throw pagoUpdateErr;

    // Si el admin eligió cambiar el estado del proyecto a "entregado"
    if (cambiar_a_entregado) {
      const { error: proyectoErr } = await supabaseAdmin
        .from("proyectos")
        .update({
          estado: "entregado",
          fecha_cierre: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", pago.proyecto_id);

      if (proyectoErr) throw proyectoErr;
    }

    // Registrar en auditoría
    const { data: userData } = await supabaseAdmin.auth.getUser(token);
    const usuarioId = userData?.user?.id ?? null;
    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || null;

    await supabaseAdmin
      .from("auditoria")
      .insert([
        {
          usuario_id: usuarioId,
          tabla: "pagos",
          operacion: "UPDATE",
          registro_id: pago_id,
          datos_antes: { estado: pago.estado },
          datos_despues: { estado: "completado", cambiar_a_entregado },
          ip,
        },
      ]);

    return new Response(
      JSON.stringify({ 
        success: true, 
        pago: pagoActualizado,
        cambiar_a_entregado,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("autorizar-pago error:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error?.message || error) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
