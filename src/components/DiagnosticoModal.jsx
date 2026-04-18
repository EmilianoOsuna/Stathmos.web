import { useState } from "react";
import supabase from "../supabase";
import { X, AlertCircle, CheckCircle } from "lucide-react";

export default function DiagnosticoModal({ 
  open, 
  onClose, 
  proyectoId, 
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
    
    // Validar que haya al menos síntomas
    if (!form.sintomas.trim()) {
      setError("Debes describir al menos los síntomas observados");
      return;
    }

    setLoading(true);
    try {
      // Insertar diagnóstico inicial
      const { data, error: dbError } = await supabase
        .from("diagnosticos")
        .insert([{
          proyecto_id: proyectoId,
          mecanico_id: mecanico_id,
          tipo: "inicial",
          sintomas: form.sintomas.trim(),
          hallazgos: form.hallazgos.trim() || null,
          causa_raiz: form.causa_raiz.trim() || null,
        }])
        .select()
        .single();

      if (dbError) throw dbError;

      setSuccess(true);
      setForm({ sintomas: "", hallazgos: "", causa_raiz: "" });
      
      // Llamar callback si existe
      if (onSuccess) onSuccess(data);

      // Cerrar modal después de 2 segundos
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className={`w-full max-w-2xl rounded-lg shadow-xl border ${bgModal} ${darkMode ? "border-zinc-700" : "border-gray-200"}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${darkMode ? "border-zinc-700" : "border-gray-200"}`}>
          <div>
            <h2 className={`text-xl font-bold ${textPrimary}`}>📋 Registrar Diagnóstico Inicial</h2>
            <p className={`text-sm ${textSecondary} mt-1`}>Describe las fallas observadas en el vehículo</p>
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
          {/* Síntomas */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${textPrimary}`}>
              🔧 Síntomas Observados <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.sintomas}
              onChange={(e) => handleChange("sintomas", e.target.value)}
              placeholder="Describe los síntomas que presenta el vehículo (sonidos extraños, olores, falta de potencia, etc.)"
              className={`w-full px-4 py-3 rounded-lg border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${bgInput}`}
              rows="4"
              disabled={loading || success}
            />
            <p className={`text-xs ${textSecondary} mt-1`}>Campo obligatorio</p>
          </div>

          {/* Hallazgos */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${textPrimary}`}>
              🔍 Hallazgos Encontrados
            </label>
            <textarea
              value={form.hallazgos}
              onChange={(e) => handleChange("hallazgos", e.target.value)}
              placeholder="Describe lo que encontraste durante la inspección inicial (partes desgastadas, conexiones sueltas, etc.)"
              className={`w-full px-4 py-3 rounded-lg border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${bgInput}`}
              rows="3"
              disabled={loading || success}
            />
            <p className={`text-xs ${textSecondary} mt-1`}>Opcional</p>
          </div>

          {/* Causa Raíz */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${textPrimary}`}>
              ⚡ Causa Raíz Identificada
            </label>
            <textarea
              value={form.causa_raiz}
              onChange={(e) => handleChange("causa_raiz", e.target.value)}
              placeholder="Análisis inicial de la causa del problema"
              className={`w-full px-4 py-3 rounded-lg border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${bgInput}`}
              rows="3"
              disabled={loading || success}
            />
            <p className={`text-xs ${textSecondary} mt-1`}>Opcional</p>
          </div>

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
              {loading ? "Guardando..." : success ? "✓ Guardado" : "Guardar Diagnóstico"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
