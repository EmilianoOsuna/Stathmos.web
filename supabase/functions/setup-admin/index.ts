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

    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ success: false, error: "Email y contraseña son requeridos." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (password.length < 8) {
      return new Response(
        JSON.stringify({ success: false, error: "La contraseña debe tener al menos 8 caracteres." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Verificar si el usuario ya existe
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUser?.users?.some((u) => u.email === email);

    if (userExists) {
      // Actualizar contraseña del usuario existente
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.users.find((u) => u.email === email).id,
        { password }
      );
      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({ success: true, message: "Contraseña actualizada correctamente." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Crear nuevo usuario
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { rol: "Administrador", nombre: "Administrador" },
    });

    if (authError) throw authError;

    // Insertar en public.empleados
    const { error: dbError } = await supabaseAdmin.from("empleados").insert({
      usuario_id: authData.user.id,
      nombre: "Administrador",
      correo: email,
      telefono: null,
      rfc: null,
      fecha_ingreso: new Date().toISOString().split("T")[0],
      activo: true,
    });

    if (dbError) {
      // Borrar el usuario si falla la BD
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw dbError;
    }

    return new Response(
      JSON.stringify({ success: true, message: "Usuario administrador creado correctamente." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
