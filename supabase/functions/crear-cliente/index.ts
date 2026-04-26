import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const getInviteRedirectTo = (req: Request): string => {
  const appUrl = Deno.env.get("APP_URL")?.trim();
  if (appUrl) {
    return `${appUrl.replace(/\/$/, "")}/completar-registro`;
  }

  const origin = req.headers.get("origin") || "https://stathmos.online";
  return `${origin.replace(/\/$/, "")}/completar-registro`;
};

// Validar RFC con REGEX (formato mexicano)
const isValidRFC = (rfc: string): boolean => {
  if (!rfc || rfc.trim() === "") return true; // RFC es opcional
  const rfcRegex = /^[A-ZÑ]{3,4}\d{6}[A-Z0-9]{2}[0-9A]?$/;
  return rfcRegex.test(rfc.toUpperCase());
};

// Validar email
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.toLowerCase());
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
    if (!nombre || !nombre.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: "El nombre es obligatorio." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (!correo || !correo.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: "El correo electrónico es obligatorio." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (!isValidEmail(correo)) {
      return new Response(
        JSON.stringify({ success: false, error: "El correo electrónico no es válido." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (!telefono || !telefono.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: "El teléfono es obligatorio." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (rfc && !isValidRFC(rfc)) {
      return new Response(
        JSON.stringify({ success: false, error: "El RFC no tiene un formato válido. Debe tener 12-13 caracteres (ej: GARC800101ABC)." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // 1. Insertar en public.clientes primero
    // usuario_id queda null hasta que el cliente acepte el invite
    const { error: dbError } = await supabaseAdmin.from("clientes").insert({
      nombre: nombre.trim(),
      correo: correo.trim().toLowerCase(),
      telefono: telefono ? telefono.trim() : null,
      rfc: rfc ? rfc.trim().toUpperCase() : null,
      direccion: direccion ? direccion.trim() : null,
      invite_enviado: false,
    });

    if (dbError) throw dbError;

    // 2. Enviar invite por correo
    const redirectTo = getInviteRedirectTo(req);
    
    // El trigger en la base de datos crea public.usuarios y vincula el public.clientes automáticamente
    // al ser llamado o por el RPC desde el cliente.
    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(correo.trim().toLowerCase(), {
      data: { rol: "cliente", nombre: nombre.trim() },
      redirectTo,
    });

    if (inviteError) throw inviteError;

    // 3. Marcar invite como enviado
    await supabaseAdmin
      .from("clientes")
      .update({
        invite_enviado: true,
        invite_enviado_at: new Date().toISOString(),
      })
      .eq("correo", correo.trim().toLowerCase());

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