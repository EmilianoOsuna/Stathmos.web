// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-user-token",
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

const getUserRole = async (supabaseAdmin, user) => {
  let dbRole = "";

  const { data: perfil, error: perfilErr } = await supabaseAdmin
    .from("usuarios")
    .select("rol_id")
    .eq("id", user.id)
    .maybeSingle();

  if (perfilErr) throw perfilErr;

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
  return dbRole || metadataRole;
};

const getClienteIdForUser = async (supabaseAdmin, user) => {
  const { data: clienteByUserId, error: clienteByUserIdErr } = await supabaseAdmin
    .from("clientes")
    .select("id")
    .eq("usuario_id", user.id)
    .maybeSingle();

  if (clienteByUserIdErr) throw clienteByUserIdErr;
  if (clienteByUserId?.id) return clienteByUserId.id;

  const email = user?.email || "";
  if (!email) return null;

  const { data: clienteByCorreo, error: clienteByCorreoErr } = await supabaseAdmin
    .from("clientes")
    .select("id")
    .eq("correo", email)
    .maybeSingle();

  if (clienteByCorreoErr) throw clienteByCorreoErr;
  return clienteByCorreo?.id || null;
};

const buildStockShortage = (items = []) =>
  items
    .filter((item) => {
      const stock = item?.refacciones?.stock ?? 0;
      return !item?.refacciones?.id || stock < (item?.cantidad ?? 0);
    })
    .map((item) => ({
      item_id: item?.id ?? null,
      refaccion_id: item?.refaccion_id ?? null,
      nombre: item?.refacciones?.nombre ?? null,
      numero_parte: item?.refacciones?.numero_parte ?? null,
      stock_disponible: item?.refacciones?.stock ?? 0,
      cantidad_requerida: item?.cantidad ?? 0,
    }));

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("authorization") || "";
    const headerToken = authHeader.replace("Bearer ", "").trim();
    const userToken = (req.headers.get("x-user-token") || "").trim();
    const token = userToken || headerToken;
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

    const role = await getUserRole(supabaseAdmin, authData.user);
    if (!["cliente", "administrador"].includes(role)) {
      return new Response(
        JSON.stringify({ success: false, error: "Forbidden: role not allowed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    const body = await req.json();
    const { cotizacion_id, accion, decision, notas, cliente_id } = body || {};
    const actionRaw = accion ?? decision;

    if (!cotizacion_id || !actionRaw) {
      return new Response(
        JSON.stringify({ success: false, error: "Faltan campos: cotizacion_id, accion" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const accionNorm = String(actionRaw).trim().toLowerCase();
    if (!["aprobar", "rechazar"].includes(accionNorm)) {
      return new Response(
        JSON.stringify({ success: false, error: "Accion invalida" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { data: cotizacion, error: cotizacionErr } = await supabaseAdmin
      .from("cotizaciones")
      .select("id, estado, proyecto_id, proyectos (cliente_id, estado)")
      .eq("id", cotizacion_id)
      .maybeSingle();

    if (cotizacionErr) throw cotizacionErr;
    if (!cotizacion?.id) {
      return new Response(
        JSON.stringify({ success: false, error: "Cotizacion no encontrada" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    const estadosPermitidos = accionNorm === "aprobar"
      ? ["pendiente", "modificada", "rechazada"]
      : ["pendiente", "modificada"];

    if (!estadosPermitidos.includes(cotizacion.estado)) {
      return new Response(
        JSON.stringify({ success: false, error: "Cotizacion ya resuelta" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 409 }
      );
    }

    let clienteId = null;
    if (role !== "administrador") {
      clienteId = await getClienteIdForUser(supabaseAdmin, authData.user);
      if (!clienteId) {
        return new Response(
          JSON.stringify({ success: false, error: "Cliente no encontrado para el usuario" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
        );
      }

      if (cotizacion?.proyectos?.cliente_id !== clienteId) {
        return new Response(
          JSON.stringify({ success: false, error: "Forbidden: cotizacion not accessible" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
        );
      }
    } else if (cliente_id) {
      clienteId = cliente_id;
    } else {
      return new Response(
        JSON.stringify({ success: false, error: "cliente_id es requerido para administrador" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const nowIso = new Date().toISOString();
    const estadoCotizacion = accionNorm === "aprobar" ? "aprobada" : "rechazada";
    const updateCotizacion = {
      estado: estadoCotizacion,
      aprobada_por: accionNorm === "aprobar" ? clienteId : null,
      rechazada_por: accionNorm === "rechazar" ? clienteId : null,
      fecha_respuesta: nowIso,
      notas: notas ?? null,
      updated_at: nowIso,
    };

    if (accionNorm === "aprobar") {
      const { data: items, error: itemsErr } = await supabaseAdmin
        .from("cotizacion_items")
        .select("id, refaccion_id, cantidad, tipo, refacciones (id, nombre, numero_parte, stock)")
        .eq("cotizacion_id", cotizacion_id)
        .eq("tipo", "refaccion");

      if (itemsErr) throw itemsErr;

      const faltantes = buildStockShortage(items || []);
      if (faltantes.length) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Stock insuficiente para aprobar la cotizacion",
            faltantes,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 409 }
        );
      }

      const actorId = authData?.user?.id ?? null;
      const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || null;
      const auditRows = [];

      for (const item of items || []) {
        const beforeStock = item?.refacciones?.stock ?? 0;
        const newStock = beforeStock - (item?.cantidad ?? 0);

        const { error: updateStockErr } = await supabaseAdmin
          .from("refacciones")
          .update({ stock: newStock, updated_at: nowIso })
          .eq("id", item.refaccion_id);

        if (updateStockErr) throw updateStockErr;

        auditRows.push({
          usuario_id: actorId,
          tabla: "refacciones",
          operacion: "UPDATE",
          registro_id: item.refaccion_id,
          datos_antes: {
            stock: beforeStock,
          },
          datos_despues: {
            stock: newStock,
            motivo: "APROBACION_COTIZACION",
            cotizacion_id,
            item_id: item.id,
            cantidad: item.cantidad,
          },
          ip,
        });
      }

      if (auditRows.length) {
        await supabaseAdmin.from("auditoria").insert(auditRows);
      }
    }

    const { error: updateCotErr } = await supabaseAdmin
      .from("cotizaciones")
      .update(updateCotizacion)
      .eq("id", cotizacion_id);

    if (updateCotErr) throw updateCotErr;

    const estadoProyecto = accionNorm === "aprobar" ? "en_progreso" : "no_aprobado";
    const updateProyecto = {
      estado: estadoProyecto,
      updated_at: nowIso,
    };

    if (accionNorm === "aprobar") {
      updateProyecto.fecha_aprobacion = nowIso;
    }

    const { error: updateProyectoErr } = await supabaseAdmin
      .from("proyectos")
      .update(updateProyecto)
      .eq("id", cotizacion.proyecto_id);

    if (updateProyectoErr) throw updateProyectoErr;

    return new Response(
      JSON.stringify({ success: true, cotizacion_id, estado: estadoCotizacion, estado_proyecto: estadoProyecto }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("resolver-cotizacion error:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error?.message || error) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
