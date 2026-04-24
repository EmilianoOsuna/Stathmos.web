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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized: missing token" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const { data: authData, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !authData?.user) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const role = normalizeRole(authData.user?.app_metadata?.rol || authData.user?.user_metadata?.rol || "");
    if (role !== "administrador") {
      return new Response(JSON.stringify({ success: false, error: "No autorizado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    const { dia_id } = await req.json();
    if (!dia_id) {
      return new Response(JSON.stringify({ success: false, error: "dia_id es requerido" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const { data: dia, error: diaErr } = await supabaseAdmin
      .from("dias_inhabiles")
      .select("id, fecha, activo")
      .eq("id", dia_id)
      .maybeSingle();

    if (diaErr) throw diaErr;
    if (!dia?.id) {
      return new Response(JSON.stringify({ success: false, error: "Día inhábil no encontrado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    const { error: updateErr } = await supabaseAdmin
      .from("dias_inhabiles")
      .update({ activo: false, updated_at: new Date().toISOString() })
      .eq("id", dia_id);

    if (updateErr) throw updateErr;

    return new Response(JSON.stringify({ success: true, dia_id, fecha: dia.fecha }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: String(error?.message || error) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
