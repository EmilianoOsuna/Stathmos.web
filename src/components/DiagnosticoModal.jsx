import { useState } from "react";
import supabase from "../supabase";
import { AlertCircle, CheckCircle } from "lucide-react";
import { Modal, Button, Field, Textarea, Input, Icon } from "./UIPrimitives";

export default function DiagnosticoModal({ 
  open, 
  onClose, 
  proyectoId, 
  proyectoEstado = "activo",
  mecanico_id,
  darkMode = false,
  onSuccess = null
}) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    sintomas: "",
    hallazgos: "",
    causa_raiz: "",
  });

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const notifyClientDiagnostico = async ({ tipo, texto }) => {
    try {
      const { data: proyectoData, error: proyectoErr } = await supabase
        .from("proyectos")
        .select("id, titulo, cliente_id, clientes(usuario_id, correo)")
        .eq("id", proyectoId)
        .maybeSingle();

      if (proyectoErr) throw proyectoErr;
      if (!proyectoData?.cliente_id) return;

      let usuarioId = proyectoData?.clientes?.usuario_id || null;
      let clienteCorreo = proyectoData?.clientes?.correo || null;

      if (!usuarioId && !clienteCorreo) {
        const { data: clienteData } = await supabase
          .from("clientes")
          .select("usuario_id, correo")
          .eq("id", proyectoData.cliente_id)
          .maybeSingle();
        usuarioId = clienteData?.usuario_id || null;
        clienteCorreo = clienteData?.correo || null;
      }

      if (!usuarioId && clienteCorreo) {
        const { data: usuarioData } = await supabase
          .from("usuarios")
          .select("id")
          .eq("correo", clienteCorreo)
          .maybeSingle();
        usuarioId = usuarioData?.id || null;
      }

      if (!usuarioId) return;

      const titulo = tipo === "inicial"
        ? "Diagnóstico inicial registrado"
        : "Nueva observación en tu proyecto";

      const mensaje = tipo === "inicial"
        ? `Se registró el diagnóstico inicial de tu proyecto "${proyectoData.titulo}".`
        : `Se agregó una nueva observación en tu proyecto "${proyectoData.titulo}": ${texto}`;

      await supabase.functions.invoke("enviar-notificacion", {
        body: {
          usuario_id: usuarioId,
          proyecto_id: proyectoId,
          titulo,
          mensaje,
        },
      });
    } catch (notifyErr) {
      console.warn("[notifyClientDiagnostico] error:", notifyErr);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const esActivo = proyectoEstado === "activo";
    const esEnProgreso = proyectoEstado === "en_progreso";

    if (!esActivo && !esEnProgreso) {
      setError("Solo puedes registrar diagnóstico en proyectos activos o en progreso.");
      return;
    }
    
    if (esActivo && !form.sintomas.trim()) {
      setError("Debes describir el diagnóstico inicial del proyecto");
      return;
    }

    if (esEnProgreso && !form.hallazgos.trim()) {
      setError("Debes agregar una observación del proyecto en progreso");
      return;
    }

    setLoading(true);
    try {
      let data = null;

      if (esEnProgreso) {
        const nuevaObservacion = form.hallazgos.trim();
        const bloqueObservacion = nuevaObservacion;

        const { data: existente, error: existenteError } = await supabase
          .from("diagnosticos")
          .select("id, hallazgos")
          .eq("proyecto_id", proyectoId)
          .eq("tipo", "final")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existenteError) throw existenteError;

        if (existente?.id) {
          const historial = existente.hallazgos ? `${existente.hallazgos}\n\n${bloqueObservacion}` : bloqueObservacion;
          const { data: updated, error: updateError } = await supabase
            .from("diagnosticos")
            .update({ hallazgos: historial })
            .eq("id", existente.id)
            .select()
            .single();

          if (updateError) throw updateError;
          data = updated;
        } else {
          const { data: inserted, error: insertError } = await supabase
            .from("diagnosticos")
            .insert([{
              proyecto_id: proyectoId,
              mecanico_id: mecanico_id,
              tipo: "final",
              hallazgos: bloqueObservacion,
            }])
            .select()
            .single();

          if (insertError) throw insertError;
          data = inserted;
        }

        await notifyClientDiagnostico({ tipo: "observacion", texto: bloqueObservacion });
      } else {
        const { data: inserted, error: dbError } = await supabase
          .from("diagnosticos")
          .insert([{
            proyecto_id: proyectoId,
            mecanico_id: mecanico_id,
            tipo: "inicial",
            sintomas: form.sintomas.trim(),
            causa_raiz: form.causa_raiz.trim() || null,
          }])
          .select()
          .single();

        if (dbError) throw dbError;
        data = inserted;

        await notifyClientDiagnostico({ tipo: "inicial", texto: form.sintomas.trim() });
      }

      setForm({ sintomas: "", hallazgos: "", causa_raiz: "" });

      if (onSuccess) onSuccess(data);

      if (esEnProgreso) {
        onClose();
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);
    } catch (err) {
      console.error("Error al guardar diagnóstico:", err);
      setError(err.message || "Error al guardar el diagnóstico");
    } finally {
      setLoading(false);
    }
  };

  const esActivo = proyectoEstado === "activo";
  const esEnProgreso = proyectoEstado === "en_progreso";

  const modalTitle = esActivo ? "Diagnóstico inicial" : esEnProgreso ? "Observación de proyecto" : "Diagnóstico";
  const modalSubtitle = esActivo
    ? "Captura cómo llega el vehículo al taller"
    : esEnProgreso
    ? "Agrega observaciones durante la ejecución del proyecto"
    : "Este proyecto no admite captura de diagnóstico";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={modalTitle}
      subtitle={modalSubtitle}
      darkMode={darkMode}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {esActivo && (
          <>
            <Field label="Diagnóstico inicial" required darkMode={darkMode}>
              <Textarea
                darkMode={darkMode}
                value={form.sintomas}
                onChange={(e) => handleChange("sintomas", e.target.value)}
                placeholder="Describe cómo llega el vehículo al taller y qué síntomas presenta"
                rows={4}
                disabled={loading || success}
              />
            </Field>

            <Field label="Causa del problema" darkMode={darkMode}>
              <Textarea
                darkMode={darkMode}
                value={form.causa_raiz}
                onChange={(e) => handleChange("causa_raiz", e.target.value)}
                placeholder="Análisis inicial de la causa del problema"
                rows={3}
                disabled={loading || success}
              />
            </Field>
          </>
        )}

        {esEnProgreso && (
          <Field label="Observaciones" required darkMode={darkMode}>
            <Textarea
              darkMode={darkMode}
              value={form.hallazgos}
              onChange={(e) => handleChange("hallazgos", e.target.value)}
              placeholder="Describe observaciones del trabajo realizado"
              rows={4}
              disabled={loading || success}
            />
            <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-tight">Una vez guardada, esta observación no se podrá editar.</p>
          </Field>
        )}

        {/* Mensajes */}
        {error && (
          <div className={`p-4 rounded-lg border text-sm flex items-center gap-3 ${darkMode ? "bg-red-900/20 border-red-800 text-red-400" : "bg-red-50 border-red-200 text-red-700"}`}>
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {success && (
          <div className={`p-4 rounded-lg border text-sm flex items-center gap-3 ${darkMode ? "bg-emerald-900/20 border-emerald-800 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>
            <CheckCircle className="w-5 h-5" />
            Diagnóstico guardado correctamente
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3 justify-end pt-4 border-t border-zinc-800/50 mt-6">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading || success}
            darkMode={darkMode}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading || success}
            darkMode={darkMode}
          >
            {loading ? "Guardando..." : success ? "Guardado" : "Guardar Diagnóstico"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
