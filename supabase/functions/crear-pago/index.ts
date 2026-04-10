// @ts-nocheck
// Note: this file runs on Deno (Supabase Functions). Editor/TypeScript in Node may flag imports
// from Deno URLs; we add @ts-nocheck to avoid IDE/TS errors in the repo workspace.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Credentials": "true",
};

// This Edge Function was added to securely create `pagos` using the service role key.
// Reason: direct inserts from the browser were rejected by Row-Level Security (RLS).
// Flow:
//  - The frontend calls this function with the user's JWT (Authorization: Bearer <token>).
//  - The function uses the user's token to verify the proyecto is accessible (RLS enforced).
//  - If accessible, it uses the service role client (supabaseAdmin) to insert the pago and
//    update the proyecto to `entregado` (bypassing RLS for the insert/update).
//  - Returns the created pago to the client.
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
      return new Response(JSON.stringify({ success: false, error: "Unauthorized: missing token" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 });
    }

    const supabaseUser = createClient(supabaseUrl, token);

    const { proyecto_id, monto, metodo_cobro, referencia, factura_id } = await req.json();

    if (!proyecto_id || !monto || !metodo_cobro) {
      return new Response(JSON.stringify({ success: false, error: "Missing required fields: proyecto_id, monto, metodo_cobro" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
    }

    // Verify the authenticated user has access to the proyecto (RLS via user token)
    const { data: proyecto, error: proyectoErr } = await supabaseUser
      .from("proyectos")
      .select("id")
      .eq("id", proyecto_id)
      .maybeSingle();

    if (proyectoErr) throw proyectoErr;
    if (!proyecto) {
      return new Response(JSON.stringify({ success: false, error: "Forbidden: proyecto not accessible or does not exist" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 });
    }

    // Insert pago using service role (bypasses RLS)
    const { data: pago, error: pagoErr } = await supabaseAdmin
      .from("pagos")
      .insert([
        {
          factura_id: factura_id ?? null,
          proyecto_id,
          monto,
          metodo_cobro,
          estado: "completado",
          referencia: referencia ?? `PAGO-${String(proyecto_id).slice(0,8).toUpperCase()}-${Date.now()}`,
        },
      ])
      .select()
      .maybeSingle();

    if (pagoErr) throw pagoErr;

    // Update proyecto estado a entregado
    const { error: proyectoUpdateErr } = await supabaseAdmin
      .from("proyectos")
      .update({ estado: "entregado", updated_at: new Date().toISOString() })
      .eq("id", proyecto_id);

    if (proyectoUpdateErr) throw proyectoUpdateErr;

    return new Response(JSON.stringify({ success: true, pago }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: String(error?.message || error) }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
  }
});