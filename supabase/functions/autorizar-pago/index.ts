// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const normalizeRole = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const toCanonicalRole = (value = "") => {
  const role = normalizeRole(value);
  if (["admin", "administrador"].includes(role)) return "administrador";
  if (["mecanico", "mecanica", "mecanico/a"].includes(role)) return "mecanico";
  return role;
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

    const { data: authData, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !authData?.user?.id) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const role = toCanonicalRole(
      authData.user?.app_metadata?.rol ||
      authData.user?.user_metadata?.rol ||
      ""
    );

    if (role !== "administrador") {
      return new Response(
        JSON.stringify({ success: false, error: "Forbidden: solo administrador puede autorizar pagos" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    const body = await req.json();
    const { pago_id, cambiar_a_entregado } = body;

    if (!pago_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required field: pago_id" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { data: pago, error: pagoErr } = await supabaseAdmin
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

    if (pago.estado !== "pendiente") {
      return new Response(
        JSON.stringify({ success: false, error: `El pago ya está en estado: ${pago.estado}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 409 }
      );
    }

    const { data: pagoActualizado, error: pagoUpdateErr } = await supabaseAdmin
      .from("pagos")
      .update({ estado: "completado" })
      .eq("id", pago_id)
      .select()
      .single();

    if (pagoUpdateErr) throw pagoUpdateErr;

    if (cambiar_a_entregado && pago.proyecto_id) {
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

    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || null;
    await supabaseAdmin.from("auditoria").insert([{
      usuario_id: authData.user.id,
      tabla: "pagos",
      operacion: "UPDATE",
      registro_id: pago_id,
      datos_antes: { estado: pago.estado },
      datos_despues: { estado: "completado", cambiar_a_entregado },
      ip,
    }]);

    return new Response(
      JSON.stringify({ success: true, pago: pagoActualizado, cambiar_a_entregado }),
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