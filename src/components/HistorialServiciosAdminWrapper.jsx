import HistorialServiciosAdmin from "./HistorialServiciosAdmin";

export default function HistorialServiciosAdminWrapper({
  darkMode = false,
  initialSearchTerm = "",
  initialSearchType = "cliente",
  initialEstado = "todos",
  initialFechaInicio = "",
  initialFechaFin = "",
}) {
  return (
    <div className={`flex-1 min-h-full page-enter ${darkMode ? "bg-[#16161e]" : "bg-gray-50"}`}>
      <HistorialServiciosAdmin
        darkMode={darkMode}
        initialSearchTerm={initialSearchTerm}
        initialSearchType={initialSearchType}
        initialEstado={initialEstado}
        initialFechaInicio={initialFechaInicio}
        initialFechaFin={initialFechaFin}
      />
    </div>
  );
}
