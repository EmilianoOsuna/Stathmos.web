import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Encabezados CORS para permitir solicitudes desde cualquier origen
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Obtiene la URL de redirección para completar el registro de cliente.
 * Prioriza la APP_URL configurada en variables de entorno, sino usa el origen de la solicitud.
 * @param {Request} req - Objeto de solicitud HTTP
 * @returns {string} URL completa para redireccionar a la página de completar registro
 */
const getInviteRedirectTo = (req: Request): string => {
  const appUrl = Deno.env.get("APP_URL")?.trim();
  if (appUrl) {
    return `${appUrl.replace(/\/$/, "")}/completar-registro`;
  }

  const origin = req.headers.get("origin") || "https://stathmos.online";
  return `${origin.replace(/\/$/, "")}/completar-registro`;
};

/**
 * Valida si un RFC tiene el formato correcto para México.
 * Acepta RFC de 12-13 caracteres: 3-4 letras + 6 dígitos + 2 caracteres alfanuméricos + 1 opcional.
 * @param {string} rfc - RFC a validar
 * @returns {boolean} true si RFC es válido o vacío (RFC es opcional), false en caso contrario
 */
const isValidRFC = (rfc: string): boolean => {
  if (!rfc || rfc.trim() === "") return true; // RFC es opcional
  const rfcRegex = /^[A-ZÑ]{3,4}\d{6}[A-Z0-9]{2}[0-9A]?$/;
  return rfcRegex.test(rfc.toUpperCase());
};

/**
 * Valida si una cadena tiene formato válido de correo electrónico.
 * @param {string} email - Correo electrónico a validar
 * @returns {boolean} true si el email es válido, false en caso contrario
 */
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.toLowerCase());
};

/**
 * Función Supabase: Crear Cliente
 * 
 * Crea un nuevo cliente en el sistema y envía una invitación por correo electrónico
 * para que complete su registro. Valida los datos del cliente (nombre, email, teléfono, RFC).
 * 
 * Flujo:
 * 1. Inserta un registro en la tabla clientes con estado invite_enviado=false
 * 2. Envía una invitación por correo usando el sistema de auth de Supabase
 * 3. Marca la invitación como enviada (invite_enviado=true) para registro futuro
 * 
 * @async
 * @param {Request} req - Objeto de solicitud HTTP
 * @param {Object} req.body - Cuerpo de la solicitud en JSON
 * @param {string} req.body.nombre - Nombre del cliente (requerido)
 * @param {string} req.body.correo - Correo electrónico del cliente (requerido, debe ser válido)
 * @param {string} req.body.telefono - Teléfono del cliente (requerido)
 * @param {string} [req.body.rfc] - RFC del cliente en formato mexicano (opcional, 12-13 caracteres)
 * @param {string} [req.body.direccion] - Dirección del cliente (opcional)
 * 
 * @returns {Response} JSON con estructura:
 *   - success: true - Cliente creado y invitación enviada exitosamente
 *   O
 *   - success: false - Error en la operación
 *   - error: Descripción del error específico
 */
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