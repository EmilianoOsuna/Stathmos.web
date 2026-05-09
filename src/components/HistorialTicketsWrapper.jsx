// ─── Wrapper para historial de tickets completados/cancelados ──────────────
// Envuelve HistorialTickets en un contenedor con estilos y estado inicial
// Pasa props para búsqueda, filtrado y ordenamiento inicial
import HistorialTickets from "./HistorialTickets";

export default function HistorialTicketsWrapper({
  darkMode = false,
  initialSearch = "",
  initialFilter = "todos",
  initialSort = "reciente",
}) {
  return (
    <div className={`flex-1 p-4 md:p-6 min-h-full page-enter ${darkMode ? "bg-[#16161e]" : "bg-gray-50"}`}>
      <HistorialTickets
        darkMode={darkMode}
        initialSearch={initialSearch}
        initialFilter={initialFilter}
        initialSort={initialSort}
      />
    </div>
  );
}
