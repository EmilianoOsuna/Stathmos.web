// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Credentials": "true",
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

    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authData?.user) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const role = toCanonicalRole(authData.user?.app_metadata?.rol || authData.user?.user_metadata?.rol || "");
    if (!["administrador", "mecanico"].includes(role)) {
      return new Response(
        JSON.stringify({ success: false, error: "Forbidden: role not allowed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    const body = await req.json();
    const { cotizacion_id } = body || {};

    if (!cotizacion_id) {
      return new Response(
        JSON.stringify({ success: false, error: "cotizacion_id es requerido" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { data: ventas, error: ventasErr } = await supabaseAdmin
      .from("ventas_refacciones")
      .select("id, refaccion_id, cantidad, estado")
      .eq("cotizacion_id", cotizacion_id);

    if (ventasErr) throw ventasErr;

    const rows = ventas || [];
    for (const venta of rows) {
      if (!venta?.refaccion_id || venta?.estado === "cancelado") continue;

      const { data: refaccion, error: refErr } = await supabaseAdmin
        .from("refacciones")
        .select("id, stock")
        .eq("id", venta.refaccion_id)
        .maybeSingle();

      if (refErr) throw refErr;

      const currentStock = Number(refaccion?.stock || 0);
      const nextStock = currentStock + Number(venta?.cantidad || 0);

      const { error: updateStockErr } = await supabaseAdmin
        .from("refacciones")
        .update({ stock: nextStock, updated_at: new Date().toISOString() })
        .eq("id", venta.refaccion_id);

      if (updateStockErr) throw updateStockErr;

      const { error: updateVentaErr } = await supabaseAdmin
        .from("ventas_refacciones")
        .update({ estado: "cancelado" })
        .eq("id", venta.id);

      if (updateVentaErr) throw updateVentaErr;
    }

    return new Response(
      JSON.stringify({ success: true, reintegradas: rows.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("reintegrar-cotizacion error:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error?.message || error) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
