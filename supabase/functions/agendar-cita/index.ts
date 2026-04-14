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
  if (["cliente", "user", "usuario"].includes(role)) return "cliente";
  return role;
};

const hmToMinutes = (hhmm: string) => {
  const [h, m] = String(hhmm || "").split(":").map(Number);
  return h * 60 + m;
};

const TALLER_TIMEZONE_OFFSET = "-06:00";

const getDateDay = (fecha: string) => {
  const [year, month, day] = String(fecha || "").split("-").map(Number);
  if (!year || !month || !day) return Number.NaN;
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
};

const isValidSlot = (fecha: string, hora: string) => {
  if (!fecha || !hora) return false;

  const day = getDateDay(fecha);
  const dateTime = new Date(`${fecha}T${hora}:00${TALLER_TIMEZONE_OFFSET}`);
  if (Number.isNaN(day) || Number.isNaN(dateTime.getTime())) return false;

  if (dateTime.getTime() < Date.now()) return false;

  if (day === 0) return false;

  const mins = hmToMinutes(hora);
  const morning = mins >= 9 * 60 && mins <= 14 * 60;
  const evening = mins >= 17 * 60 && mins <= 20 * 60;

  if (day >= 1 && day <= 5) return morning || evening;
  if (day === 6) return morning;
  return false;
};

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
    const email = user.email;
    if (!email) {
      return new Response(
        JSON.stringify({ success: false, error: "Usuario sin correo" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { data: perfil, error: perfilErr } = await supabaseAdmin
      .from("usuarios")
      .select("id, rol_id, correo")
      .eq("id", user.id)
      .maybeSingle();

    if (perfilErr) throw perfilErr;

    let dbRole = "";
    if (perfil?.rol_id) {
      const { data: rolData, error: rolErr } = await supabaseAdmin
        .from("roles")
        .select("nombre")
        .eq("id", perfil.rol_id)
        .maybeSingle();

      if (rolErr) throw rolErr;
      dbRole = toCanonicalRole(rolData?.nombre || "");
    }

    const metadataRole = toCanonicalRole(user?.app_metadata?.rol || user?.user_metadata?.rol || "");
    const role = dbRole || metadataRole;

    const body = await req.json();
    const { fecha, hora, vehiculo_id, servicio, notas, cliente_id } = body || {};

    if (!fecha || !hora || !vehiculo_id || !servicio) {
      return new Response(
        JSON.stringify({ success: false, error: "Faltan campos: fecha, hora, vehiculo_id, servicio" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (!isValidSlot(fecha, hora)) {
      return new Response(
        JSON.stringify({ success: false, error: "Horario inválido" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    let finalClienteId = null;

    if (role === "administrador") {
      if (!cliente_id) {
        return new Response(
          JSON.stringify({ success: false, error: "cliente_id es requerido para administrador" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }
      finalClienteId = cliente_id;
    } else {
      let cliente = null;

      const { data: clienteByUserId, error: clienteByUserIdErr } = await supabaseAdmin
        .from("clientes")
        .select("id")
        .eq("usuario_id", user.id)
        .maybeSingle();

      if (clienteByUserIdErr) throw clienteByUserIdErr;
      cliente = clienteByUserId || null;

      if (!cliente?.id) {
        const { data: clienteByCorreo, error: clienteByCorreoErr } = await supabaseAdmin
          .from("clientes")
          .select("id")
          .eq("correo", email)
          .maybeSingle();

        if (clienteByCorreoErr) throw clienteByCorreoErr;
        cliente = clienteByCorreo || null;
      }

      if (!cliente?.id) {
        return new Response(
          JSON.stringify({ success: false, error: "No se encontró cliente asociado al usuario" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
        );
      }
      finalClienteId = cliente.id;
    }

    try {
      const { data: diaInhabil } = await supabaseAdmin
        .from("dias_inhabiles")
        .select("id")
        .eq("fecha", fecha)
        .eq("activo", true)
        .maybeSingle();

      if (diaInhabil?.id) {
        return new Response(
          JSON.stringify({ success: false, error: "La fecha seleccionada es inhábil" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }
    } catch (inhabilError) {
      console.warn("dias_inhabiles check skipped:", inhabilError?.message || inhabilError);
    }

    const { data: vehiculo, error: vehiculoErr } = await supabaseAdmin
      .from("vehiculos")
      .select("id")
      .eq("id", vehiculo_id)
      .eq("cliente_id", finalClienteId)
      .maybeSingle();

    if (vehiculoErr) throw vehiculoErr;
    if (!vehiculo?.id) {
      return new Response(
        JSON.stringify({ success: false, error: "El vehículo no pertenece al cliente" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    // Guardamos con offset fijo del taller para conservar horario de captura local.
    const fechaHoraISO = `${fecha}T${hora}:00${TALLER_TIMEZONE_OFFSET}`;

    const { data: cita, error: citaErr } = await supabaseAdmin
      .from("citas")
      .insert([
        {
          cliente_id: finalClienteId,
          vehiculo_id,
          fecha_hora: fechaHoraISO,
          motivo: servicio,
          notas: notas || null,
          estado: "pendiente",
        },
      ])
      .select("id, fecha_hora, estado, motivo")
      .single();

    if (citaErr) throw citaErr;

    return new Response(
      JSON.stringify({ success: true, cita }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: String(error?.message || error) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
