import { useState, useEffect } from "react";
import supabase from "../supabase";
import useSupabaseRealtime from "../hooks/useSupabaseRealtime";
import DiagnosticoModal from "./DiagnosticoModal";
import DiagnosticoView from "./DiagnosticoView";
import { Plus, Search, AlertCircle } from "lucide-react";
import { formatDateWorkshop } from "../utils/datetime";

export default function MecanicoDiagnosticosModule({ darkMode = false, session = null }) {
  const [proyectos, setProyectos] = useState([]);
  const [mecanicosAsignados, setMecanicosAsignados] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("activo");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProyecto, setSelectedProyecto] = useState(null);
  const [mecanico_id, setMecanico_id] = useState(null);

  useEffect(() => {
    // Obtener ID del mecánico actual
    const fetchMecanicoId = async () => {
      if (session?.user?.email) {
        const { data } = await supabase
          .from("empleados")
          .select("id")
          .eq("correo", session.user.email)
          .maybeSingle();
        if (data?.id) setMecanico_id(data.id);
      }
    };
    fetchMecanicoId();
  }, [session]);

  const [rtTick, setRtTick] = useState(0);
  useSupabaseRealtime("proyectos", () => setRtTick(t => t + 1));
  useSupabaseRealtime("diagnosticos", () => setRtTick(t => t + 1));

  useEffect(() => {
    if (mecanico_id) {
      fetchProyectos();
    }
  }, [mecanico_id, rtTick]);

  const fetchProyectos = async () => {
    setLoading(true);
    try {
      // Obtener todos los proyectos asignados al mecánico
      const { data, error } = await supabase
        .from("proyectos")
        .select(`
          id,
          titulo,
          descripcion,
          estado,
          fecha_ingreso,
          fecha_cierre,
          mecanico_id,
          clientes (
            id,
            nombre,
            telefono
          ),
          vehiculos (
            id,
            marca,
            modelo,
            anio,
            placas,
            color
          ),
          diagnosticos (
            id,
            tipo,
            created_at
          )
        `)
        .eq("mecanico_id", mecanico_id)
        .order("fecha_ingreso", { ascending: false });

      if (error) throw error;

      // Agrupar diagnósticos por proyecto
      const diagnosticosMap = {};
      if (data) {
        data.forEach((proyecto) => {
          diagnosticosMap[proyecto.id] = proyecto.diagnosticos || [];
        });
      }

      setProyectos(data || []);
      setMecanicosAsignados(diagnosticosMap);
    } catch (error) {
      console.error("Error al cargar proyectos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (proyecto) => {
    if (!["activo", "en_progreso"].includes(proyecto.estado)) return;
    setSelectedProyecto(proyecto);
    setModalOpen(true);
  };

  const handleDiagnosticoGuardado = () => {
    fetchProyectos(); // Recargar para actualizar lista de diagnósticos
  };

  const filteredProyectos = proyectos.filter((p) => {
    const matchEstado = filterEstado === "todos" || p.estado === filterEstado;
    const matchSearch = 
      search === "" ||
      p.titulo.toLowerCase().includes(search.toLowerCase()) ||
      p.clientes?.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      p.vehiculos?.placas?.toLowerCase().includes(search.toLowerCase());
    return matchEstado && matchSearch;
  });

  const diagnosticoInitialCount = proyectos.filter((p) => 
    (mecanicosAsignados[p.id] || []).some(d => d.tipo === "inicial")
  ).length;

  const estadoColor = (estado) => {
    const colors = {
      activo: darkMode ? "bg-sky-900/30 text-sky-300 border-sky-700" : "bg-sky-50 text-sky-700 border-sky-200",
      en_progreso: darkMode ? "bg-blue-900/30 text-blue-300 border-blue-700" : "bg-blue-50 text-blue-700 border-blue-200",
      terminado: darkMode ? "bg-emerald-900/30 text-emerald-300 border-emerald-700" : "bg-emerald-50 text-emerald-700 border-emerald-200",
      entregado: darkMode ? "bg-teal-900/30 text-teal-300 border-teal-700" : "bg-teal-50 text-teal-700 border-teal-200",
      cancelado: darkMode ? "bg-zinc-800 text-zinc-400 border-zinc-700" : "bg-gray-100 text-gray-500 border-gray-200",
    };
    return colors[estado] || (darkMode ? "bg-zinc-800 text-zinc-400 border-zinc-700" : "bg-gray-100 text-gray-500 border-gray-200");
  };

  const bgInput = darkMode ? "bg-zinc-900 border-zinc-700 text-white" : "bg-white border-gray-300 text-gray-900";
  const bgCard = darkMode ? "bg-[#1e1e28] border-zinc-800" : "bg-white border-gray-200";
  const textPrimary = darkMode ? "text-zinc-100" : "text-gray-800";
  const textSecondary = darkMode ? "text-zinc-500" : "text-gray-500";

  if (loading) {
    return (
      <div className={`flex-1 p-4 md:p-6 min-h-full ${darkMode ? "bg-[#16161e]" : "bg-gray-50"}`}>
        <p className={`text-sm ${textSecondary}`}>Cargando proyectos...</p>
      </div>
    );
  }

  return (
    <div className={`flex-1 p-4 md:p-6 min-h-full page-enter ${darkMode ? "bg-[#16161e]" : "bg-gray-50"}`}>
      {/* Encabezado */}
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${textPrimary}`}> Diagnósticos de Vehículos</h1>
        <p className={`text-sm ${textSecondary} mt-1`}>Registra y gestiona diagnósticos iniciales de fallas</p>
        <p className={`text-xs ${textSecondary} mt-2`}>
          {diagnosticoInitialCount} de {proyectos.length} proyectos con diagnóstico inicial
        </p>
      </div>

      {/* Búsqueda y Filtros */}
      <div className={`rounded-lg p-4 mb-6 border ${bgCard}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className={`block text-xs font-medium mb-1 ${textSecondary}`}>Buscar</label>
            <div className="relative">
              <Search className={`absolute left-3 top-2.5 w-4 h-4 ${textSecondary}`} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Proyecto, cliente, placas..."
                className={`w-full pl-9 pr-3 py-2 rounded border text-sm ${bgInput}`}
              />
            </div>
          </div>
          <div>
            <label className={`block text-xs font-medium mb-1 ${textSecondary}`}>Estado</label>
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className={`w-full px-3 py-2 rounded border text-sm ${bgInput}`}
            >
              <option value="todos">Todos</option>
              <option value="activo">Activo</option>
              <option value="en_progreso">En Progreso</option>
              <option value="terminado">Terminado</option>
              <option value="entregado">Entregado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Proyectos */}
      <div className="space-y-4">
        {filteredProyectos.length === 0 ? (
          <div className={`text-center py-12 rounded-lg border ${bgCard}`}>
            <AlertCircle className={`w-8 h-8 ${textSecondary} mx-auto mb-2`} />
            <p className={`text-sm ${textSecondary}`}>
              {proyectos.length === 0 
                ? "No tienes proyectos asignados" 
                : "No se encontraron proyectos con los filtros seleccionados"}
            </p>
          </div>
        ) : (
          filteredProyectos.map((proyecto) => {
            const tieneDiagInitial = (mecanicosAsignados[proyecto.id] || []).some(d => d.tipo === "inicial");
            const tieneObservacion = (mecanicosAsignados[proyecto.id] || []).some(d => d.tipo === "final");
            const esActivo = proyecto.estado === "activo";
            const esEnProgreso = proyecto.estado === "en_progreso";
            const puedeCapturar = (esActivo && !tieneDiagInitial) || esEnProgreso;

            const accionLabel = esActivo
              ? (tieneDiagInitial ? "Diagnóstico Inicial Registrado" : "Registrar Diagnóstico Inicial")
              : esEnProgreso
              ? (tieneObservacion ? "Añadir Otra Observación" : "Añadir Observación")
              : "No disponible";

            return (
              <div
                key={proyecto.id}
                className={`rounded-lg border overflow-hidden transition hover:shadow-md ${bgCard}`}
              >
                {/* Header */}
                <div className={`p-4 ${darkMode ? "bg-zinc-800/50" : "bg-gray-50"}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className={`text-lg font-semibold ${textPrimary}`}>{proyecto.titulo}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${estadoColor(proyecto.estado)}`}>
                          {proyecto.estado.replace(/_/g, " ").toUpperCase()}
                        </span>
                      </div>
                      <div className={`text-sm ${textSecondary} space-y-0.5`}>
                        <p>
                          <span className="font-medium">Cliente:</span> {proyecto.clientes?.nombre}
                          {proyecto.clientes?.telefono && ` • ${proyecto.clientes.telefono}`}
                        </p>
                        <p>
                          <span className="font-medium">Vehículo:</span> {proyecto.vehiculos?.marca} {proyecto.vehiculos?.modelo}{" "}
                          ({proyecto.vehiculos?.anio}) • {proyecto.vehiculos?.placas}
                        </p>
                        <p>
                          <span className="font-medium">Ingreso:</span> {formatDateWorkshop(proyecto.fecha_ingreso)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenModal(proyecto)}
                      disabled={!puedeCapturar}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition ${
                        !puedeCapturar
                          ? darkMode
                            ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : esActivo
                          ? darkMode
                            ? "bg-orange-600 hover:bg-orange-700 text-white"
                            : "bg-orange-500 hover:bg-orange-600 text-white"
                          : esEnProgreso
                          ? darkMode
                            ? "bg-sky-600 hover:bg-sky-700 text-white"
                            : "bg-sky-500 hover:bg-sky-600 text-white"
                          : tieneDiagInitial
                          ? darkMode
                            ? "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          : darkMode
                            ? "bg-orange-600 hover:bg-orange-700 text-white"
                            : "bg-orange-500 hover:bg-orange-600 text-white"
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                      {accionLabel}
                    </button>
                  </div>

                  {/* Descripción */}
                  {proyecto.descripcion && (
                    <p className={`text-sm ${textSecondary} line-clamp-2`}>{proyecto.descripcion}</p>
                  )}
                </div>

                {/* Diagnósticos Registrados */}
                <div className="p-4">
                  <p className={`text-xs font-semibold ${textSecondary} uppercase mb-3`}>📋 Diagnósticos</p>
                  <DiagnosticoView 
                    proyectoId={proyecto.id}
                    mecanico_id={mecanico_id}
                    darkMode={darkMode}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Diagnóstico */}
      {selectedProyecto && (
        <DiagnosticoModal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedProyecto(null);
          }}
          proyectoId={selectedProyecto.id}
          proyectoEstado={selectedProyecto.estado}
          mecanico_id={mecanico_id}
          darkMode={darkMode}
          onSuccess={handleDiagnosticoGuardado}
        />
      )}
    </div>
  );
}
