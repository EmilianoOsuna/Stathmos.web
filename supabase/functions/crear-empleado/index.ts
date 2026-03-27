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

    const { nombre, correo, telefono, puesto, fecha_contratacion, contraseña } = await req.json();

    // Validar campos requeridos
    if (!nombre || !correo || !contraseña || !puesto) {
      return new Response(
        JSON.stringify({ success: false, error: "Faltan campos requeridos: nombre, correo, puesto, contraseña" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // 1. Crear usuario en auth.users
    // El trigger fn_crear_perfil_y_rol se encarga de:
    //   - Crear el registro en public.usuarios
    //   - Inyectar el rol en app_metadata del JWT
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: correo,
      password: contraseña,
      email_confirm: true,
      user_metadata: { nombre, rol: "mecanico" }, // el trigger lee de aquí
    });

    if (authError) throw authError;

    // 2. Insertar en public.empleados
    // usuario_id apunta a public.usuarios (que el trigger ya creó)
    const { error: dbError } = await supabaseAdmin.from("empleados").insert({
      usuario_id: authData.user.id,
      nombre,
      correo,
      telefono,
      puesto,
      fecha_ingreso: fecha_contratacion ?? null,
    });

    if (dbError) throw dbError;

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