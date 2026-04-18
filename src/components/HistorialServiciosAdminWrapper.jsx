import HistorialServiciosAdmin from "./HistorialServiciosAdmin";

export default function HistorialServiciosAdminWrapper({ darkMode = false }) {
  return (
    <div className={`flex-1 min-h-full page-enter ${darkMode ? "bg-[#16161e]" : "bg-gray-50"}`}>
      <HistorialServiciosAdmin darkMode={darkMode} />
    </div>
  );
}
