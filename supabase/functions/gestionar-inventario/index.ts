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
    const { tipo_operacion, refaccion_id, cantidad, precio_unit, proyecto_id, proveedor_id } = body || {};

    const tipo = String(tipo_operacion || "").trim().toUpperCase();
    if (!refaccion_id || !tipo) {
      return new Response(
        JSON.stringify({ success: false, error: "Faltan campos: tipo_operacion, refaccion_id" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (!["COMPRA", "VENTA"].includes(tipo)) {
      return new Response(
        JSON.stringify({ success: false, error: "tipo_operacion invalido" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const cantidadNum = Number(cantidad);
    const precioUnitNum = Number(precio_unit);

    if (!Number.isFinite(cantidadNum) || cantidadNum <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: "cantidad invalida" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (!Number.isFinite(precioUnitNum) || precioUnitNum < 0) {
      return new Response(
        JSON.stringify({ success: false, error: "precio_unit invalido" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { data: refaccion, error: refaccionErr } = await supabaseAdmin
      .from("refacciones")
      .select("id, nombre, stock, precio_compra")
      .eq("id", refaccion_id)
      .maybeSingle();

    if (refaccionErr) throw refaccionErr;
    if (!refaccion?.id) {
      return new Response(
        JSON.stringify({ success: false, error: "Refaccion no encontrada" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    const actorId = authData.user.id;
    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || null;

    if (tipo === "COMPRA") {
      const { error: updateErr } = await supabaseAdmin
        .from("refacciones")
        .update({ precio_compra: precioUnitNum, updated_at: new Date().toISOString() })
        .eq("id", refaccion_id);

      if (updateErr) throw updateErr;

      const { data: compra, error: compraErr } = await supabaseAdmin
        .from("compras_refacciones")
        .insert([
          {
            refaccion_id,
            proveedor_id: proveedor_id ?? null,
            proyecto_id: proyecto_id ?? null,
            cantidad: cantidadNum,
            precio_unit: precioUnitNum,
          },
        ])
        .select()
        .maybeSingle();

      if (compraErr) throw compraErr;

      const { data: refaccionUpdated } = await supabaseAdmin
        .from("refacciones")
        .select("id, stock, precio_compra")
        .eq("id", refaccion_id)
        .maybeSingle();

      await supabaseAdmin
        .from("auditoria")
        .insert([
          {
            usuario_id: actorId,
            tabla: "refacciones",
            operacion: "UPDATE",
            registro_id: refaccion_id,
            datos_antes: {
              stock: refaccion.stock,
              precio_compra: refaccion.precio_compra,
            },
            datos_despues: {
              stock: refaccionUpdated?.stock ?? refaccion.stock,
              precio_compra: refaccionUpdated?.precio_compra ?? precioUnitNum,
              motivo: "COMPRA",
              compra_id: compra?.id ?? null,
              proveedor_id: proveedor_id ?? null,
              proyecto_id: proyecto_id ?? null,
              cantidad: cantidadNum,
              precio_unit: precioUnitNum,
            },
            ip,
          },
        ]);

      return new Response(
        JSON.stringify({ success: true, tipo, compra, refaccion: refaccionUpdated || refaccion }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    if (refaccion.stock < cantidadNum) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Stock insuficiente",
          refaccion_id,
          stock_disponible: refaccion.stock,
          cantidad_requerida: cantidadNum,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 409 }
      );
    }

    const { data: venta, error: ventaErr } = await supabaseAdmin
      .from("ventas_refacciones")
      .insert([
        {
          refaccion_id,
          cantidad: cantidadNum,
          precio_unit: precioUnitNum,
        },
      ])
      .select()
      .maybeSingle();

    if (ventaErr) throw ventaErr;

    const { data: refaccionUpdated } = await supabaseAdmin
      .from("refacciones")
      .select("id, stock, precio_compra")
      .eq("id", refaccion_id)
      .maybeSingle();

    await supabaseAdmin
      .from("auditoria")
      .insert([
        {
          usuario_id: actorId,
          tabla: "refacciones",
          operacion: "UPDATE",
          registro_id: refaccion_id,
          datos_antes: {
            stock: refaccion.stock,
          },
          datos_despues: {
            stock: refaccionUpdated?.stock ?? refaccion.stock,
            motivo: "VENTA_DIRECTA",
            venta_id: venta?.id ?? null,
            cantidad: cantidadNum,
            precio_unit: precioUnitNum,
          },
          ip,
        },
      ]);

    return new Response(
      JSON.stringify({ success: true, tipo, venta, refaccion: refaccionUpdated || refaccion }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("gestionar-inventario error:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error?.message || error) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
