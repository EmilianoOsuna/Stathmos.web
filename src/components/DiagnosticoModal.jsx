import { useState } from "react";
import supabase from "../supabase";
import { X, AlertCircle, CheckCircle } from "lucide-react";

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

  if (!open) return null;

  const bgModal = darkMode ? "bg-[#1e1e28]" : "bg-white";
  const bgInput = darkMode ? "bg-zinc-900 border-zinc-700 text-white" : "bg-white border-gray-300 text-gray-900";
  const textPrimary = darkMode ? "text-zinc-100" : "text-gray-800";
  const textSecondary = darkMode ? "text-zinc-500" : "text-gray-500";
  const bgError = darkMode ? "bg-red-900/20 border-red-700/30" : "bg-red-50 border-red-200";
  const textError = darkMode ? "text-red-300" : "text-red-700";
  const bgSuccess = darkMode ? "bg-emerald-900/20 border-emerald-700/30" : "bg-emerald-50 border-emerald-200";
  const textSuccess = darkMode ? "text-emerald-300" : "text-emerald-700";
  const esActivo = proyectoEstado === "activo";
  const esEnProgreso = proyectoEstado === "en_progreso";

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 ${esEnProgreso ? "observaciones-overlay" : ""}`}>
      <div className={`w-full max-w-2xl rounded-lg shadow-xl border ${bgModal} ${darkMode ? "border-zinc-700" : "border-gray-200"} ${esEnProgreso ? "observaciones-modal" : ""}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${darkMode ? "border-zinc-700" : "border-gray-200"}`}>
          <div>
            <h2 className={`text-xl font-bold ${textPrimary}`}>
              {esActivo ? "Diagnóstico inicial" : esEnProgreso ? " Observación de proyecto" : "Diagnóstico"}
            </h2>
            <p className={`text-sm ${textSecondary} mt-1`}>
              {esActivo
                ? "Captura cómo llega el vehículo al taller"
                : esEnProgreso
                ? "Agrega observaciones durante la ejecución del proyecto"
                : "Este proyecto no admite captura de diagnóstico"}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition ${darkMode ? "hover:bg-zinc-700" : "hover:bg-gray-100"}`}
          >
            <X className={`w-5 h-5 ${textSecondary}`} />
          </button>
        </div>

        {/* Contenido */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {esActivo && (
            <>
              <div>
                <label className={`block text-sm font-medium mb-2 ${textPrimary}`}>
                   Diagnóstico inicial <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.sintomas}
                  onChange={(e) => handleChange("sintomas", e.target.value)}
                  placeholder="Describe cómo llega el vehículo al taller y qué síntomas presenta"
                  className={`w-full px-4 py-3 rounded-lg border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${bgInput}`}
                  rows="4"
                  disabled={loading || success}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${textPrimary}`}>
                  Causa del problema
                </label>
                <textarea
                  value={form.causa_raiz}
                  onChange={(e) => handleChange("causa_raiz", e.target.value)}
                  placeholder="Análisis inicial de la causa del problema"
                  className={`w-full px-4 py-3 rounded-lg border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${bgInput}`}
                  rows="3"
                  disabled={loading || success}
                />
              </div>
            </>
          )}

          {esEnProgreso && (
            <div>
              <label className={`block text-sm font-medium mb-2 ${textPrimary}`}>
                Observaciones <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.hallazgos}
                onChange={(e) => handleChange("hallazgos", e.target.value)}
                placeholder="Describe observaciones del trabajo realizado"
                className={`w-full px-4 py-3 rounded-lg border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${bgInput}`}
                rows="4"
                disabled={loading || success}
              />
              <p className={`text-xs ${textSecondary} mt-1`}>Una vez guardada, esta observación no se podrá editar.</p>
            </div>
          )}

          {/* Mensajes */}
          {error && (
            <div className={`flex items-start gap-3 p-4 rounded-lg border ${bgError}`}>
              <AlertCircle className={`w-5 h-5 ${textError} flex-shrink-0 mt-0.5`} />
              <p className={`text-sm ${textError}`}>{error}</p>
            </div>
          )}

          {success && (
            <div className={`flex items-start gap-3 p-4 rounded-lg border ${bgSuccess}`}>
              <CheckCircle className={`w-5 h-5 ${textSuccess} flex-shrink-0 mt-0.5`} />
              <p className={`text-sm ${textSuccess}`}>✓ Diagnóstico guardado correctamente</p>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading || success}
              className={`px-6 py-2 rounded-lg font-medium text-sm transition ${
                loading || success
                  ? darkMode
                    ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : darkMode
                    ? "bg-zinc-700 hover:bg-zinc-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-900"
              }`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className={`px-6 py-2 rounded-lg font-medium text-sm transition ${
                loading || success
                  ? darkMode
                    ? "bg-blue-900 text-blue-400 cursor-not-allowed"
                    : "bg-blue-300 text-blue-600 cursor-not-allowed"
                  : darkMode
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
            >
              {loading ? "Guardando..." : success ? "Guardado" : "Guardar Diagnóstico"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
