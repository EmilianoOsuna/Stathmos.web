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

    const user = authData.user;
    const role = normalizeRole(user?.app_metadata?.rol || user?.user_metadata?.rol || "");
    const { cita_id, accion } = await req.json();
    if (!cita_id || !accion) {
      return new Response(
        JSON.stringify({ success: false, error: "Faltan campos: cita_id, accion" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const accionNorm = String(accion).toLowerCase();
    const esAutoCancelacion = accionNorm === "auto_cancelar";

    if (!esAutoCancelacion && !["administrador", "mecanico"].includes(role)) {
      return new Response(
        JSON.stringify({ success: false, error: "No autorizado para validar citas" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    if (!["aceptar", "rechazar", "auto_cancelar"].includes(accionNorm)) {
      return new Response(
        JSON.stringify({ success: false, error: "Acción inválida" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { data: cita, error: citaErr } = await supabaseAdmin
      .from("citas")
      .select("id, estado, fecha_hora, cliente_id")
      .eq("id", cita_id)
      .maybeSingle();

    if (citaErr) throw citaErr;
    if (!cita?.id) {
      return new Response(
        JSON.stringify({ success: false, error: "Cita no encontrada" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    if (esAutoCancelacion) {
      const citaFecha = new Date(cita.fecha_hora);
      if (Number.isNaN(citaFecha.getTime())) {
        return new Response(
          JSON.stringify({ success: false, error: "Fecha de cita inválida" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      if (citaFecha.getTime() > Date.now()) {
        return new Response(
          JSON.stringify({ success: false, error: "La cita aún no vence" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      if (role === "cliente") {
        const { data: cliente, error: clienteErr } = await supabaseAdmin
          .from("clientes")
          .select("id")
          .or(`usuario_id.eq.${user.id},correo.eq.${user.email}`)
          .maybeSingle();

        if (clienteErr) throw clienteErr;
        if (!cliente?.id || cliente.id !== cita.cliente_id) {
          return new Response(
            JSON.stringify({ success: false, error: "No autorizado para cancelar esta cita" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
          );
        }
      }
    }

    const nuevoEstado = accionNorm === "aceptar" ? "confirmada" : "cancelada";
    const { error: updateErr } = await supabaseAdmin
      .from("citas")
      .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
      .eq("id", cita_id);

    if (updateErr) throw updateErr;

    return new Response(
      JSON.stringify({ success: true, estado: nuevoEstado, auto_cancelada: esAutoCancelacion }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: String(error?.message || error) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
