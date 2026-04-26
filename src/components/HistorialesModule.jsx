import { useState, useCallback } from "react";
import { ModuleHeader, Icon, Input, Select, DatePicker } from "./UIPrimitives";
import HistorialRefacciones from "./HistorialRefacciones";
import HistorialTicketsWrapper from "./HistorialTicketsWrapper";
import HistorialServiciosAdminWrapper from "./HistorialServiciosAdminWrapper";

// ─── Configuración de filtros por tab ────────────────────────────────────────
const TAB_CONFIG = {
  servicios: {
    searchPlaceholder: "Buscar por cliente, vehículo o placa...",
    showEstado: true,
    showFechas: true,
    showSearchType: true,
    showTipoMov: false,
    showOrden: false,
    estadoOptions: [
      { value: "todos", label: "Todos los estados" },
      { value: "activo", label: "Activo" },
      { value: "en_progreso", label: "En progreso" },
      { value: "terminado", label: "Terminado" },
      { value: "entregado", label: "Entregado" },
      { value: "cancelado", label: "Cancelado" },
    ],
    searchTypeOptions: [
      { value: "cliente", label: "Cliente" },
      { value: "vehiculo", label: "Vehículo" },
      { value: "placa", label: "Placa" },
    ],
  },
  refacciones: {
    searchPlaceholder: "Buscar por refacción, proyecto o proveedor...",
    showEstado: false,
    showFechas: true,
    showSearchType: false,
    showTipoMov: true,
    showOrden: true,
    tipoMovOptions: [
      { value: "todos", label: "Entradas y salidas" },
      { value: "COMPRA", label: "Solo entradas" },
      { value: "VENTA", label: "Solo salidas" },
    ],
    ordenOptions: [
      { value: "reciente", label: "Más reciente" },
      { value: "antiguo", label: "Más antiguo" },
    ],
  },
  tickets: {
    searchPlaceholder: "Buscar por título, cliente o placas...",
    showEstado: true,
    showFechas: false,
    showSearchType: false,
    showTipoMov: false,
    showOrden: true,
    estadoOptions: [
      { value: "todos", label: "Todos" },
      { value: "entregado", label: "Entregados" },
      { value: "cancelado", label: "Cancelados" },
    ],
    ordenOptions: [
      { value: "reciente", label: "Más reciente" },
      { value: "antiguo", label: "Más antiguo" },
    ],
  },
};

export default function HistorialesModule({ darkMode }) {
  const [activeTab, setActiveTab] = useState("servicios");

  // ─── Estado global de filtros (se resetea al cambiar de tab) ─────────────
  const [search, setSearch] = useState("");
  const [searchType, setSearchType] = useState("cliente");
  const [estado, setEstado] = useState("todos");
  const [tipoMov, setTipoMov] = useState("todos");
  const [orden, setOrden] = useState("reciente");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    setSearch("");
    setSearchType("cliente");
    setEstado("todos");
    setTipoMov("todos");
    setOrden("reciente");
    setFechaInicio("");
    setFechaFin("");
  }, []);

  const resetFilters = () => {
    setSearch("");
    setSearchType("cliente");
    setEstado("todos");
    setTipoMov("todos");
    setOrden("reciente");
    setFechaInicio("");
    setFechaFin("");
  };

  const hasActiveFilters =
    search !== "" ||
    estado !== "todos" ||
    tipoMov !== "todos" ||
    orden !== "reciente" ||
    fechaInicio !== "" ||
    fechaFin !== "";

  const cfg = TAB_CONFIG[activeTab];

  const tabs = [
    { id: "servicios", label: "Servicios", icon: "scroll" },
    { id: "refacciones", label: "Refacciones", icon: "box" },
    { id: "tickets", label: "Tickets", icon: "clipboard" },
  ];

  const t  = darkMode ? "text-zinc-100" : "text-gray-800";
  const st = darkMode ? "text-zinc-500" : "text-gray-400";
  const activeBg = darkMode ? "bg-zinc-800/80 shadow-lg shadow-black/20" : "bg-white shadow-sm";
  const cardBg = darkMode ? "bg-[#1e1e28] border-zinc-800" : "bg-white border-gray-200";

  return (
    <div className={`flex-1 p-4 md:p-6 min-h-full page-enter ${darkMode ? "bg-[#16161e]" : "bg-gray-50"}`}>
      <ModuleHeader
        title="Centro de Historiales"
        subtitle="Consulta el registro histórico de operaciones, servicios y tickets del taller."
        darkMode={darkMode}
      />

      {/* ── Tabs ── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-zinc-500/5 w-fit border border-zinc-500/10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`
                flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-xs font-bold transition-all duration-300
                ${activeTab === tab.id ? `${t} ${activeBg}` : `${st} hover:text-zinc-400`}
              `}
            >
              <Icon name={tab.icon} className={`w-3.5 h-3.5 ${activeTab === tab.id ? "text-blue-500" : ""}`} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Barra de búsqueda y filtros contextuales ── */}
      <div className={`rounded-xl border p-4 mb-6 ${cardBg}`}>
        <div className="flex flex-wrap gap-3 items-end">

          {/* Tipo de búsqueda (solo servicios) */}
          {cfg.showSearchType && (
            <div className="w-36 shrink-0">
              <label className={`block text-[10px] font-semibold uppercase tracking-widest mb-1.5 ${st}`}>
                Buscar por
              </label>
              <Select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                darkMode={darkMode}
                options={cfg.searchTypeOptions}
              />
            </div>
          )}

          {/* Buscador principal */}
          <div className="flex-1 min-w-[200px]">
            <label className={`block text-[10px] font-semibold uppercase tracking-widest mb-1.5 ${st}`}>
              Buscar
            </label>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={cfg.searchPlaceholder}
              darkMode={darkMode}
              icon="search"
            />
          </div>

          {/* Filtro de estado */}
          {cfg.showEstado && (
            <div className="w-44 shrink-0">
              <label className={`block text-[10px] font-semibold uppercase tracking-widest mb-1.5 ${st}`}>
                Estado
              </label>
              <Select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                darkMode={darkMode}
                options={cfg.estadoOptions}
              />
            </div>
          )}

          {/* Filtro tipo movimiento (solo refacciones) */}
          {cfg.showTipoMov && (
            <div className="w-44 shrink-0">
              <label className={`block text-[10px] font-semibold uppercase tracking-widest mb-1.5 ${st}`}>
                Operación
              </label>
              <Select
                value={tipoMov}
                onChange={(e) => setTipoMov(e.target.value)}
                darkMode={darkMode}
                options={cfg.tipoMovOptions}
              />
            </div>
          )}

          {/* Orden */}
          {cfg.showOrden && (
            <div className="w-40 shrink-0">
              <label className={`block text-[10px] font-semibold uppercase tracking-widest mb-1.5 ${st}`}>
                Ordenar
              </label>
              <Select
                value={orden}
                onChange={(e) => setOrden(e.target.value)}
                darkMode={darkMode}
                options={cfg.ordenOptions}
              />
            </div>
          )}

          {/* Rango de fechas */}
          {cfg.showFechas && (
            <>
              <div className="w-44 shrink-0">
                <label className={`block text-[10px] font-semibold uppercase tracking-widest mb-1.5 ${st}`}>
                  Desde
                </label>
                <DatePicker
                  value={fechaInicio}
                  onChange={(val) => setFechaInicio(val)}
                  darkMode={darkMode}
                  placeholder="Fecha inicio..."
                />
              </div>
              <div className="w-44 shrink-0">
                <label className={`block text-[10px] font-semibold uppercase tracking-widest mb-1.5 ${st}`}>
                  Hasta
                </label>
                <DatePicker
                  value={fechaFin}
                  onChange={(val) => setFechaFin(val)}
                  darkMode={darkMode}
                  placeholder="Fecha fin..."
                />
              </div>
            </>
          )}

          {/* Botón limpiar */}
          {hasActiveFilters && (
            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  darkMode
                    ? "text-zinc-400 hover:text-zinc-200 border border-zinc-700 hover:border-zinc-500"
                    : "text-gray-500 hover:text-gray-700 border border-gray-200 hover:border-gray-400"
                }`}
              >
                <Icon name="x" className="w-3.5 h-3.5" />
                Limpiar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Contenido del tab activo ── */}
      <div className="anim-fadeUp">
        {activeTab === "servicios" && (
          <div className="space-y-4">
            <HistorialServiciosAdminWrapper
              darkMode={darkMode}
              initialSearchTerm={search}
              initialSearchType={searchType}
              initialEstado={estado}
              initialFechaInicio={fechaInicio}
              initialFechaFin={fechaFin}
            />
          </div>
        )}
        {activeTab === "refacciones" && (
          <div className="space-y-4">
            <HistorialRefacciones
              darkMode={darkMode}
              searchTerm={search}
              filtroTipo={tipoMov}
              fechaInicio={fechaInicio}
              fechaFin={fechaFin}
              orden={orden}
            />
          </div>
        )}
        {activeTab === "tickets" && (
          <div className="space-y-4">
            <HistorialTicketsWrapper
              darkMode={darkMode}
              initialSearch={search}
              initialFilter={estado}
              initialSort={orden}
            />
          </div>
        )}
      </div>
    </div>
  );
}
