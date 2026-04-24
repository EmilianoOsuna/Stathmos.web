import { useState, useEffect } from "react";
import supabase from "../supabase";
import { Edit, AlertCircle } from "lucide-react";
import { formatDateTimeWorkshop } from "../utils/datetime";

export default function DiagnosticoView({ 
  proyectoId, 
  mecanico_id,
  darkMode = false,
  onEdit = null,
}) {
  const [diagnosticos, setDiagnosticos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchDiagnosticos();
  }, [proyectoId]);

  const fetchDiagnosticos = async () => {
    setLoading(true);
    try {
      const { data, error: dbError } = await supabase
        .from("diagnosticos")
        .select("*, empleados(nombre, correo)")
        .eq("proyecto_id", proyectoId)
        .order("created_at", { ascending: false });

      if (dbError) throw dbError;
      setDiagnosticos(data || []);
    } catch (err) {
      console.error("Error al cargar diagnósticos:", err);
      setError("Error al cargar diagnósticos");
    } finally {
      setLoading(false);
    }
  };

  const textPrimary = darkMode ? "text-zinc-100" : "text-gray-800";
  const textSecondary = darkMode ? "text-zinc-500" : "text-gray-500";
  const bgCard = darkMode ? "bg-zinc-800/50" : "bg-gray-50";
  const bgBorder = darkMode ? "border-zinc-700" : "border-gray-200";

  const cleanHallazgosText = (value = "") =>
    String(value)
      .split("\n")
      .map((line) => line.replace(/^\s*\[[^\]]+\]\s*/, ""))
      .join("\n")
      .trim();

  if (loading) {
    return (
      <div className={`p-4 rounded-lg border ${bgCard}`}>
        <p className={`text-sm ${textSecondary}`}>Cargando diagnósticos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 rounded-lg border ${bgCard}`}>
        <p className={`text-sm text-red-500`}>{error}</p>
      </div>
    );
  }

  if (diagnosticos.length === 0) {
    return (
      <div className={`p-4 rounded-lg border ${bgCard}`}>
        <p className={`text-sm ${textSecondary}`}>No hay diagnósticos registrados</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {diagnosticos.map((diagnostico) => (
        <div
          key={diagnostico.id}
          className={`rounded-lg border ${bgBorder} overflow-hidden transition hover:shadow-md`}
        >
          {/* Header */}
          <button
            onClick={() => setExpandedId(expandedId === diagnostico.id ? null : diagnostico.id)}
            className={`w-full p-4 text-left flex items-start justify-between transition ${
              darkMode ? "hover:bg-zinc-700/30" : "hover:bg-gray-100"
            }`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`font-semibold ${textPrimary}`}>
                  {diagnostico.tipo === "inicial" ? " Diagnóstico Inicial" : " Observación"}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  diagnostico.tipo === "inicial"
                    ? darkMode ? "bg-blue-900/30 text-blue-300" : "bg-blue-50 text-blue-700"
                    : darkMode ? "bg-emerald-900/30 text-emerald-300" : "bg-emerald-50 text-emerald-700"
                }`}>
                  {diagnostico.tipo === "inicial" ? "inicial" : "observación"}
                </span>
              </div>
              <p className={`text-xs ${textSecondary}`}>
                Por: {diagnostico.empleados?.nombre} • {formatDateTimeWorkshop(diagnostico.created_at)}
              </p>
            </div>
          </button>

          {/* Contenido expandido */}
          {expandedId === diagnostico.id && (
            <div className={`border-t ${bgBorder} p-4 space-y-4`}>
              {/* Síntomas */}
              {diagnostico.sintomas && (
                <div>
                  <p className={`text-xs font-semibold ${textSecondary} uppercase mb-2`}>🔧 Síntomas</p>
                  <p className={`text-sm ${textPrimary} leading-relaxed whitespace-pre-wrap`}>
                    {diagnostico.sintomas}
                  </p>
                </div>
              )}

              {/* Hallazgos */}
              {diagnostico.hallazgos && (
                <div>
                  <p className={`text-xs font-semibold ${textSecondary} uppercase mb-2`}> Observaciones</p>
                  <p className={`text-sm ${textPrimary} leading-relaxed whitespace-pre-wrap`}>
                    {cleanHallazgosText(diagnostico.hallazgos)}
                  </p>
                </div>
              )}

              {/* Causa Raíz */}
              {diagnostico.causa_raiz && (
                <div>
                  <p className={`text-xs font-semibold ${textSecondary} uppercase mb-2`}>⚡ Causa Raíz</p>
                  <p className={`text-sm ${textPrimary} leading-relaxed whitespace-pre-wrap`}>
                    {diagnostico.causa_raiz}
                  </p>
                </div>
              )}

              {/* Acciones */}
              <div className={`flex gap-2 pt-3 border-t ${bgBorder}`}>
                {onEdit && diagnostico.tipo === "inicial" && (
                  <button
                    onClick={() => onEdit(diagnostico)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition ${
                      darkMode
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-blue-500 hover:bg-blue-600 text-white"
                    }`}
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </button>
                )}
                
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
