// ─── Wrapper para módulo de reportes operativos ───────────────────────────
// Envuelve ReportesOperativosModule con estilos de página y soporte dark mode
// Genera KPIs, análisis de productividad y estadísticas de cuellos de botella
import ReportesOperativosModule from "./ReportesOperativosModule";

export default function ReportesOperativosWrapper({ darkMode = false }) {
  return (
    <div className={`flex-1 min-h-full page-enter ${darkMode ? "bg-[#16161e]" : "bg-gray-50"}`}>
      <ReportesOperativosModule darkMode={darkMode} />
    </div>
  );
}
