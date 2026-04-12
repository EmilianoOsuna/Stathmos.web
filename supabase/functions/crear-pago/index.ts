// @ts-nocheck
// Este archivo se ejecuta en Deno (Funciones de Supabase). Puede marcar importaciones
// desde URLs de Deno; agregamos @ts-nocheck para evitar errores de IDE/TS en el espacio de trabajo del repositorio.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Credentials": "true",
};

// Esta función Edge se añadió para crear `pagos` de manera segura utilizando la clave del rol de servicio.
// Flujo:
//  - El frontend llama a esta función con el JWT del usuario (Authorization: Bearer <token>).
//  - La función utiliza el token del usuario para verificar que el proyecto sea accesible (RLS aplicado).
//  - Si es accesible, utiliza el cliente del rol de servicio (supabaseAdmin) para insertar el pago y
//    actualizar el proyecto a `entregado` (eliminando RLS para la inserción/actualización).
//  - Devuelve el pago creado al cliente.

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
    console.log("crear-pago received body:", JSON.stringify(body));
    const { proyecto_id, monto, metodo_cobro, referencia, factura_id } = body;

    // Aceptar monto == 0; solo rechazar si un campo es nulo o indefinido
    if (proyecto_id == null || monto == null || metodo_cobro == null) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields: proyecto_id, monto, metodo_cobro", received: body }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Verificar que el usuario autenticado tenga acceso al proyecto (RLS a través del token del usuario)
    const { data: proyecto, error: proyectoErr } = await supabaseUser
      .from("proyectos")
      .select("id")
      .eq("id", proyecto_id)
      .maybeSingle();

    if (proyectoErr) throw proyectoErr;
    if (!proyecto) {
      return new Response(
        JSON.stringify({ success: false, error: "Forbidden: proyecto not accessible or does not exist" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    // Insertar pago usando el rol de servicio (elimina RLS)
    const { data: pago, error: pagoErr } = await supabaseAdmin
      .from("pagos")
      .insert([
        {
          factura_id: factura_id ?? null,
          proyecto_id,
          monto,
          metodo_cobro,
          estado: "completado",
          referencia: referencia ?? `PAGO-${String(proyecto_id).slice(0, 8).toUpperCase()}-${Date.now()}`,
        },
      ])
      .select()
      .maybeSingle();

    if (pagoErr) throw pagoErr;

    // Actualizar el estado del proyecto a entregado
    const { error: proyectoUpdateErr } = await supabaseAdmin
      .from("proyectos")
      .update({ estado: "entregado", updated_at: new Date().toISOString() })
      .eq("id", proyecto_id);

    if (proyectoUpdateErr) throw proyectoUpdateErr;

    return new Response(
      JSON.stringify({ success: true, pago }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("crear-pago error:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error?.message || error) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
