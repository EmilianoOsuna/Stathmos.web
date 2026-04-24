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

    // --- SEGURIDAD: Validar que sea un Admin quien invita ---
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error("No hay sesión activa.");
    }

    const { data: { user: adminUser }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    // Verificamos en los metadatos de Supabase Auth si es Administrador
    if (userError || adminUser?.user_metadata?.rol?.toLowerCase() !== 'administrador') {
      throw new Error("No tienes permisos para invitar empleados. Solo administradores pueden hacer esto.");
    }

    const { nombre, correo, telefono, rfc, rol_destino, fecha_contratacion } = await req.json();

    if (!nombre || !correo || !rol_destino) {
      return new Response(
        JSON.stringify({ success: false, error: "Faltan campos requeridos." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Determinamos el origen para el redireccionamiento
    const origin = req.headers.get("origin") || "https://stathmos.online";

    // 1. Crear y enviar invite por correo 
    // El trigger `tr_crear_perfil_usuario` leerá el rol ('Mecánico' o 'Administrador') 
    // lo insertará en public.roles si no existe y luego en public.usuarios
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(correo, {
      redirectTo: `${origin}/completar-registro`,
      data: { nombre, rol: rol_destino },
    });

    if (authError) throw authError;

    // 2. Insertar en public.empleados
    const { error: dbError } = await supabaseAdmin.from("empleados").insert({
      usuario_id: authData.user.id,
      nombre,
      correo,
      telefono: telefono ?? null,
      rfc: rfc ?? null,
      fecha_ingreso: fecha_contratacion ?? new Date().toISOString().split('T')[0],
    });

    if (dbError) {
      // Si falla la tabla, borramos el "fantasma" que Auth creó para limpiar el error
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw dbError;
    }

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
