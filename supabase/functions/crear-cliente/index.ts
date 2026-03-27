import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { nombre, correo, telefono, rfc, direccion } = await req.json();

    // Validar campos requeridos
    if (!nombre || !correo) {
      return new Response(
        JSON.stringify({ success: false, error: "Faltan campos requeridos: nombre, correo" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // 1. Insertar en public.clientes primero
    // usuario_id queda null hasta que el cliente acepte el invite
    const { error: dbError } = await supabaseAdmin.from("clientes").insert({
      nombre,
      correo,
      telefono: telefono ?? null,
      rfc: rfc ? rfc.toUpperCase() : null,
      direccion: direccion ?? null,
      invite_enviado: false,
    });

    if (dbError) throw dbError;

    // 2. Enviar invite por correo
    // El trigger fn_crear_perfil_y_rol crea public.usuarios automáticamente
    // cuando el cliente acepta el invite y confirma su cuenta
    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(correo, {
      data: { rol: "cliente", nombre },
      redirectTo: "https://stathmos.online/completar-registro",
    });

    if (inviteError) throw inviteError;

    // 3. Marcar invite como enviado
    await supabaseAdmin
      .from("clientes")
      .update({
        invite_enviado: true,
        invite_enviado_at: new Date().toISOString(),
      })
      .eq("correo", correo);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});