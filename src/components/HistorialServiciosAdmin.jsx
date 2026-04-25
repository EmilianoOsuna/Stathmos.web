import { useState, useEffect, useCallback, useRef } from "react";
import supabase from "../supabase";
import useSupabaseRealtime from "../hooks/useSupabaseRealtime";
import { formatDateWorkshop, formatDateTimeWorkshop } from "../utils/datetime";
import { ChevronDown, Download, Eye, Search, Filter, X, Printer } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function HistorialServiciosAdmin({ darkMode = false }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("cliente"); // cliente, vehiculo, placa
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedServicio, setExpandedServicio] = useState(null);
  const [fotos, setFotos] = useState({});
  const [loadingFotos, setLoadingFotos] = useState({});
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [generandoPDF, setGenerandoPDF] = useState({});
  const detailRef = useRef(null);

  // Estados para modal de fotos
  const [lightbox, setLightbox] = useState(null);

  // Cargar todos los servicios al inicializar
  const [rtTick, setRtTick] = useState(0);
  useSupabaseRealtime("proyectos", () => setRtTick(t => t + 1));
  useSupabaseRealtime("fotografias", () => setRtTick(t => t + 1));

  const fetchAllServicios = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("proyectos").select(`
        id,
        titulo,
        descripcion,
        estado,
        fecha_ingreso,
        fecha_cierre,
        cliente_id,
        vehiculo_id,
        clientes (
          id,
          nombre,
          correo,
          telefono,
          rfc,
          direccion
        ),
        vehiculos (
          id,
          marca,
          modelo,
          anio,
          placas,
          color,
          vin
        ),
        cotizaciones (
          id,
          estado,
          created_at,
          fecha_emision,
          monto_mano_obra,
          monto_refacc,
          monto_total,
          cotizacion_items (
            descripcion,
            cantidad,
            precio_unit,
            subtotal
          )
        ),
        diagnosticos (
          id,
          tipo,
          hallazgos,
          created_at,
          empleados (
            nombre
          )
        )
      `).order("fecha_ingreso", { ascending: false });

      if (error) throw error;
      console.log("[DEBUG] Todos los servicios cargados:", { total: data?.length || 0 });
      setServicios(data || []);
    } catch (error) {
      console.error("Error al cargar todos los servicios:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchServicios = useCallback(async () => {
    if (!searchTerm.trim()) {
      // Si no hay término de búsqueda, mostrar todos
      await fetchAllServicios();
      return;
    }

    setLoading(true);
    try {
      let serviciosEncontrados = [];

      if (searchType === "cliente") {
        // Buscar por cliente
        const { data: clientes, error: errorClientes } = await supabase
          .from("clientes")
          .select("id")
          .ilike("nombre", `%${searchTerm}%`);

        if (errorClientes) throw errorClientes;

        if (clientes && clientes.length > 0) {
          const clienteIds = clientes.map(c => c.id);
          const { data, error } = await supabase
            .from("proyectos")
            .select(`
              id, titulo, descripcion, estado, fecha_ingreso, fecha_cierre, cliente_id, vehiculo_id,
              clientes (id, nombre, correo, telefono, rfc, direccion),
              vehiculos (id, marca, modelo, anio, placas, color, vin),
              cotizaciones (id, estado, created_at, fecha_emision, monto_mano_obra, monto_refacc, monto_total, 
                cotizacion_items (descripcion, cantidad, precio_unit, subtotal)),
              diagnosticos (id, tipo, hallazgos, created_at, empleados (nombre))
            `)
            .in("cliente_id", clienteIds)
            .order("fecha_ingreso", { ascending: false });

          if (error) throw error;
          serviciosEncontrados = data || [];
          console.log("[DEBUG] Búsqueda por cliente:", { searchTerm, clienteIds, servicios: serviciosEncontrados.length });
        }
      } else if (searchType === "vehiculo") {
        // Buscar por marca o modelo
        const { data: vehiculos, error: errorVehiculos } = await supabase
          .from("vehiculos")
          .select("id")
          .or(`marca.ilike.%${searchTerm}%,modelo.ilike.%${searchTerm}%`);

        if (errorVehiculos) throw errorVehiculos;

        if (vehiculos && vehiculos.length > 0) {
          const vehiculoIds = vehiculos.map(v => v.id);
          const { data, error } = await supabase
            .from("proyectos")
            .select(`
              id, titulo, descripcion, estado, fecha_ingreso, fecha_cierre, cliente_id, vehiculo_id,
              clientes (id, nombre, correo, telefono, rfc, direccion),
              vehiculos (id, marca, modelo, anio, placas, color, vin),
              cotizaciones (id, estado, created_at, fecha_emision, monto_mano_obra, monto_refacc, monto_total, 
                cotizacion_items (descripcion, cantidad, precio_unit, subtotal)),
              diagnosticos (id, tipo, hallazgos, created_at, empleados (nombre))
            `)
            .in("vehiculo_id", vehiculoIds)
            .order("fecha_ingreso", { ascending: false });

          if (error) throw error;
          serviciosEncontrados = data || [];
          console.log("[DEBUG] Búsqueda por vehículo:", { searchTerm, vehiculoIds, servicios: serviciosEncontrados.length });
        }
      } else if (searchType === "placa") {
        // Buscar por placa exacta
        const { data: vehiculos, error: errorVehiculos } = await supabase
          .from("vehiculos")
          .select("id")
          .ilike("placas", `%${searchTerm}%`);

        if (errorVehiculos) throw errorVehiculos;

        if (vehiculos && vehiculos.length > 0) {
          const vehiculoIds = vehiculos.map(v => v.id);
          const { data, error } = await supabase
            .from("proyectos")
            .select(`
              id, titulo, descripcion, estado, fecha_ingreso, fecha_cierre, cliente_id, vehiculo_id,
              clientes (id, nombre, correo, telefono, rfc, direccion),
              vehiculos (id, marca, modelo, anio, placas, color, vin),
              cotizaciones (id, estado, created_at, fecha_emision, monto_mano_obra, monto_refacc, monto_total, 
                cotizacion_items (descripcion, cantidad, precio_unit, subtotal)),
              diagnosticos (id, tipo, hallazgos, created_at, empleados (nombre))
            `)
            .in("vehiculo_id", vehiculoIds)
            .order("fecha_ingreso", { ascending: false });

          if (error) throw error;
          serviciosEncontrados = data || [];
          console.log("[DEBUG] Búsqueda por placa:", { searchTerm, vehiculoIds, servicios: serviciosEncontrados.length });
        }
      }

      setServicios(serviciosEncontrados);
    } catch (error) {
      console.error("Error al buscar servicios:", error);
      setServicios([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, searchType]);

  const fetchFotosServicio = useCallback(async (servicioId, force = false) => {
    if (!force && fotos[servicioId]) return; // Ya cargadas

    setLoadingFotos((prev) => ({ ...prev, [servicioId]: true }));
    try {
      const { data, error } = await supabase
        .from("fotografias")
        .select("id, url, descripcion, momento, created_at, mecanico_id")
        .eq("proyecto_id", servicioId)
        .order("momento", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) throw error;
      setFotos((prev) => ({ ...prev, [servicioId]: data || [] }));
    } catch (error) {
      console.error("Error al cargar fotos:", error);
    } finally {
      setLoadingFotos((prev) => ({ ...prev, [servicioId]: false }));
    }
  }, [fotos]);

  useEffect(() => {
    fetchServicios();
  }, [searchTerm, searchType, rtTick]);

  useEffect(() => {
    if (expandedServicio) {
      fetchFotosServicio(expandedServicio, true);
    }
  }, [expandedServicio]);

  const serviciosFiltrados = servicios.filter((s) => {
    if (filtroEstado !== "todos" && s.estado !== filtroEstado) return false;
    
    if (fechaInicio || fechaFin) {
      const fechaServicio = new Date(s.fecha_ingreso);
      if (fechaInicio) {
        const inicio = new Date(fechaInicio);
        if (fechaServicio < inicio) return false;
      }
      if (fechaFin) {
        const fin = new Date(fechaFin);
        fin.setHours(23, 59, 59, 999);
        if (fechaServicio > fin) return false;
      }
    }
    
    return true;
  });

  const getLatestCotizacion = (cotizaciones = []) => {
    if (!Array.isArray(cotizaciones) || !cotizaciones.length) return null;
    return [...cotizaciones].sort((a, b) => {
      const ad = new Date(a?.created_at || a?.fecha_emision || 0).getTime();
      const bd = new Date(b?.created_at || b?.fecha_emision || 0).getTime();
      return bd - ad;
    })[0];
  };

  const cleanHallazgosText = (value = "") =>
    String(value)
      .split("\n")
      .map((line) => line.replace(/^\s*\[[^\]]+\]\s*/, ""))
      .join("\n")
      .trim();

  const generarPDFServicio = async (servicio) => {
    setGenerandoPDF((prev) => ({ ...prev, [servicio.id]: true }));
    try {
      const element = detailRef.current;
      if (!element) return;

      // Crear un contenedor temporal con estilos del ticket
      const tempContainer = document.createElement("div");
      tempContainer.style.padding = "18px";
      tempContainer.style.borderRadius = "18px";
      tempContainer.style.background = "linear-gradient(160deg, rgba(96,174,187,0.18), rgba(219,60,28,0.08))";
      tempContainer.style.border = "1px solid rgba(148,163,184,0.35)";
      tempContainer.style.margin = "16px";
      tempContainer.style.maxWidth = "600px";
      tempContainer.style.display = "flex";
      tempContainer.style.justifyContent = "center";

      const ticketPaper = document.createElement("div");
      ticketPaper.style.width = "100%";
      ticketPaper.style.maxWidth = "600px";
      ticketPaper.style.background = "#ffffff";
      ticketPaper.style.color = "#111111";
      ticketPaper.style.border = "1px dashed #9ca3af";
      ticketPaper.style.padding = "24px";
      ticketPaper.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
      ticketPaper.style.borderRadius = "12px";
      ticketPaper.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

      // Clonar el elemento
      const clone = element.cloneNode(true);
      
      // Remover todas las clases para evitar problemas con oklch colors
      const allElements = clone.querySelectorAll('*');
      allElements.forEach((el) => {
        el.removeAttribute("class");
        if (el.style && el.style.cssText) {
          const styles = el.style.cssText.split(';').filter(style => {
            return style.trim() && !style.includes('oklch');
          }).join(';');
          el.style.cssText = styles;
        }
      });
      
      ticketPaper.appendChild(clone);
      tempContainer.appendChild(ticketPaper);

      // Agregar al documento temporalmente
      document.body.appendChild(tempContainer);

      const canvas = await html2canvas(tempContainer, { 
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        allowTaint: true,
        logging: false,
      });

      // Remover el contenedor temporal
      document.body.removeChild(tempContainer);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageHeight = pdf.internal.pageSize.getHeight();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - 20;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - 20;
      }

      pdf.save(`Historial_${servicio.vehiculos?.placas}_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("Error al generar PDF:", error);
    } finally {
      setGenerandoPDF((prev) => ({ ...prev, [servicio.id]: false }));
    }
  };

  const imprimirTicketServicio = (servicioId) => {
    const ticketUrl = `${window.location.origin}/ticket/${servicioId}?autoprint=1`;
    const popup = window.open(ticketUrl, "_blank", "noopener,noreferrer");

    // If popup is blocked, fallback to same-tab navigation.
    if (!popup) {
      window.location.assign(ticketUrl);
    }
  };

  const estados = [
    { value: "todos", label: "Todos" },
    { value: "activo", label: "Activo" },
    { value: "en_progreso", label: "En Progreso" },
    { value: "terminado", label: "Terminado" },
    { value: "entregado", label: "Entregado" },
    { value: "cancelado", label: "Cancelado" },
  ];

  const estadoColor = (estado) => {
    const colors = {
      activo: darkMode ? "bg-sky-900/30 text-sky-300 border-sky-700" : "bg-sky-50 text-sky-700 border-sky-200",
      en_progreso: darkMode ? "bg-blue-900/30 text-blue-300 border-blue-700" : "bg-blue-50 text-blue-700 border-blue-200",
      terminado: darkMode ? "bg-emerald-900/30 text-emerald-300 border-emerald-700" : "bg-emerald-50 text-emerald-700 border-emerald-200",
      entregado: darkMode ? "bg-teal-900/30 text-teal-300 border-teal-700" : "bg-teal-50 text-teal-700 border-teal-200",
      cancelado: darkMode ? "bg-zinc-800 text-zinc-400 border-zinc-700" : "bg-gray-100 text-gray-500 border-gray-200",
      pendiente_cotizacion: darkMode ? "bg-amber-900/30 text-amber-300 border-amber-700" : "bg-amber-50 text-amber-700 border-amber-200",
    };
    return colors[estado] || (darkMode ? "bg-zinc-800 text-zinc-400 border-zinc-700" : "bg-gray-100 text-gray-500 border-gray-200");
  };

  const bgInput = darkMode ? "bg-zinc-900 border-zinc-700 text-white" : "bg-white border-gray-300 text-gray-900";
  const bgCard = darkMode ? "bg-[#1e1e28] border-zinc-800" : "bg-white border-gray-200";
  const textPrimary = darkMode ? "text-zinc-100" : "text-gray-800";
  const textSecondary = darkMode ? "text-zinc-500" : "text-gray-500";
  const textTertiary = darkMode ? "text-zinc-400" : "text-gray-400";

  return (
    <div className={`w-full ${darkMode ? "bg-[#16161e]" : "bg-gray-50"}`}>
      {/* Encabezado */}
      <div className="mb-6 px-4 md:px-6 pt-4">
        <h1 className={`text-2xl font-bold ${textPrimary}`}> Historial de Servicios</h1>
        <p className={`text-sm ${textSecondary} mt-1`}>Visualiza el historial completo de servicios, fotos y facturas</p>
      </div>

      {/* Búsqueda */}
      <div className={`mx-4 md:mx-6 mb-6 rounded-lg p-4 border ${bgCard}`}>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-2">
            <label className={`block text-xs font-medium mb-1 ${textSecondary}`}>Buscar por</label>
            <div className="flex gap-2">
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className={`px-3 py-2 rounded border text-sm ${bgInput}`}
              >
                <option value="cliente">Cliente</option>
                <option value="vehiculo">Vehículo</option>
                <option value="placa">Placa</option>
              </select>
              <div className="flex-1 relative">
                <Search className={`absolute left-3 top-2.5 w-4 h-4 ${textSecondary}`} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Ingresa término de búsqueda..."
                  className={`w-full pl-9 pr-3 py-2 rounded border text-sm ${bgInput} placeholder-opacity-50`}
                  onKeyPress={(e) => e.key === "Enter" && fetchServicios()}
                />
              </div>
            </div>
          </div>

          <div>
            <label className={`block text-xs font-medium mb-1 ${textSecondary}`}>Estado</label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className={`w-full px-3 py-2 rounded border text-sm ${bgInput}`}
            >
              {estados.map((e) => (
                <option key={e.value} value={e.value}>
                  {e.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-xs font-medium mb-1 ${textSecondary}`}>Desde</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className={`w-full px-3 py-2 rounded border text-sm ${bgInput}`}
            />
          </div>

          <div>
            <label className={`block text-xs font-medium mb-1 ${textSecondary}`}>Hasta</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className={`w-full px-3 py-2 rounded border text-sm ${bgInput}`}
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={searchTerm.trim() ? fetchServicios : fetchAllServicios}
              disabled={loading}
              className={`w-full px-4 py-2 rounded font-medium text-sm transition ${
                loading
                  ? darkMode
                    ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : darkMode
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
            >
              {loading ? "Cargando..." : searchTerm.trim() ? "Buscar" : "Mostrar Todos"}
            </button>
          </div>
        </div>
      </div>

      {/* Resultados */}
      <div className="px-4 md:px-6 pb-6">
        {serviciosFiltrados.length === 0 ? (
          <div className={`text-center py-12 rounded-lg border ${bgCard}`}>
            <p className={`text-sm ${textSecondary}`}>
              {servicios.length === 0
                ? "No hay servicios registrados"
                : `No hay servicios que coincidan con los filtros seleccionados`}
            </p>
            {servicios.length > 0 && (
              <p className={`text-xs ${textTertiary} mt-2`}>
                Verifica los filtros: estado, rango de fechas o término de búsqueda
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {serviciosFiltrados.map((servicio) => (
              <div
                key={servicio.id}
              className={`rounded-lg border overflow-hidden transition ${bgCard} hover:shadow-md`}
            >
              {/* Header del servicio */}
              <button
                onClick={() => {
                  setExpandedServicio(expandedServicio === servicio.id ? null : servicio.id);
                  if (expandedServicio !== servicio.id) {
                    fetchFotosServicio(servicio.id);
                  }
                }}
                className={`w-full p-4 text-left flex items-center justify-between hover:opacity-80 transition ${
                  darkMode ? "hover:bg-zinc-800/50" : "hover:bg-gray-50"
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className={`font-semibold ${textPrimary}`}>{servicio.titulo}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${estadoColor(servicio.estado)}`}>
                      {servicio.estado.replace(/_/g, " ").toUpperCase()}
                    </span>
                  </div>
                  <div className={`text-sm ${textSecondary} space-y-0.5`}>
                    <p>
                      <span className="font-medium">Cliente:</span> {servicio.clientes?.nombre || "—"}
                      {servicio.clientes?.telefono && ` • ${servicio.clientes.telefono}`}
                    </p>
                    <p>
                      <span className="font-medium">Vehículo:</span> {servicio.vehiculos?.marca} {servicio.vehiculos?.modelo}{" "}
                      ({servicio.vehiculos?.anio}) • Placas: {servicio.vehiculos?.placas || "—"}
                    </p>
                    <p>
                      <span className="font-medium">Fechas:</span> Ingreso: {formatDateWorkshop(servicio.fecha_ingreso)}
                      {servicio.fecha_cierre && ` • Cierre: ${formatDateWorkshop(servicio.fecha_cierre)}`}
                    </p>
                  </div>
                </div>

                <ChevronDown
                  className={`w-5 h-5 ${textSecondary} transition-transform ${
                    expandedServicio === servicio.id ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Contenido expandido */}
              {expandedServicio === servicio.id && (
                <div className={`border-t ${darkMode ? "border-zinc-700" : "border-gray-200"} p-4 space-y-6`}>
                  <style>{`
                    @media print {
                      .detail-ref-pdf {
                        padding: 24px;
                        border: 1px dashed #9ca3af;
                        background: #ffffff;
                        color: #111111;
                        border-radius: 12px;
                        box-shadow: 0 8px 24px rgba(0,0,0,0.12);
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                      }
                      body { background: #ffffff !important; }
                      body * { visibility: hidden !important; }
                      .detail-ref-pdf, .detail-ref-pdf * { visibility: visible !important; }
                      .detail-ref-pdf { position: fixed; left: 0; top: 0; width: 100%; }
                    }
                  `}</style>
                  <div ref={detailRef} className="detail-ref-pdf">
                    {/* Sección de Información General */}
                    <div className="mb-6">
                      <h4 className={`font-semibold ${textPrimary} mb-3`}> Información General</h4>
                      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded ${darkMode ? "bg-zinc-800/50" : "bg-gray-50"}`}>
                        <div>
                          <p className={`text-xs ${textSecondary} font-medium`}>CLIENTE</p>
                          <p className={`${textPrimary} font-semibold`}>{servicio.clientes?.nombre || "—"}</p>
                          <p className={`text-xs ${textSecondary}`}>{servicio.clientes?.correo}</p>
                          <p className={`text-xs ${textSecondary}`}>{servicio.clientes?.telefono}</p>
                          {servicio.clientes?.rfc && <p className={`text-xs ${textSecondary}`}>RFC: {servicio.clientes.rfc}</p>}
                        </div>
                        <div>
                          <p className={`text-xs ${textSecondary} font-medium`}>VEHÍCULO</p>
                          <p className={`${textPrimary} font-semibold`}>
                            {servicio.vehiculos?.marca} {servicio.vehiculos?.modelo}
                          </p>
                          <p className={`text-xs ${textSecondary}`}>Año: {servicio.vehiculos?.anio}</p>
                          <p className={`text-xs ${textSecondary}`}>Placas: {servicio.vehiculos?.placas}</p>
                          <p className={`text-xs ${textSecondary}`}>Color: {servicio.vehiculos?.color}</p>
                          {servicio.vehiculos?.vin && <p className={`text-xs ${textSecondary}`}>VIN: {servicio.vehiculos.vin}</p>}
                        </div>
                      </div>
                    </div>

                    {/* Sección de Descripción */}
                    {servicio.descripcion && (
                      <div className="mb-6">
                        <h4 className={`font-semibold ${textPrimary} mb-3`}> Descripción del Servicio</h4>
                        <div className={`p-4 rounded ${darkMode ? "bg-zinc-800/50" : "bg-gray-50"}`}>
                          <table className="w-full text-sm">
                            <thead>
                              <tr className={`border-b ${darkMode ? "border-zinc-700" : "border-gray-200"}`}>
                                <th className={`text-left py-2 px-2 ${textSecondary}`}>Descripción</th>
                                <th className={`text-right py-2 px-2 ${textSecondary}`}>Cantidad</th>
                                <th className={`text-right py-2 px-2 ${textSecondary}`}>Precio</th>
                                <th className={`text-right py-2 px-2 ${textSecondary}`}>Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className={`border-b ${darkMode ? "border-zinc-700" : "border-gray-200"}`}>
                                <td colSpan="4" className={`py-2 px-2 ${textPrimary}`}>{servicio.descripcion}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Sección de Observaciones del Proyecto */}
                    <div className="mb-6">
                      <h4 className={`font-semibold ${textPrimary} mb-3`}> Observaciones del Proyecto</h4>
                      {Array.isArray(servicio.diagnosticos) && servicio.diagnosticos.filter((d) => d.tipo === "final").length > 0 ? (
                        <div className="space-y-3">
                          {servicio.diagnosticos
                            .filter((d) => d.tipo === "final")
                            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
                            .map((obs, idx) => (
                              <div key={obs.id} className={`p-4 rounded border ${darkMode ? "border-zinc-700 bg-zinc-800/50" : "border-gray-200 bg-gray-50"}`}>
                                <p className={`text-xs font-medium mb-2 ${textSecondary}`}>Observación {idx + 1}</p>
                                <p className={`text-sm whitespace-pre-wrap ${textPrimary}`}>{cleanHallazgosText(obs.hallazgos || "") || "Sin contenido"}</p>
                                <p className={`text-xs mt-2 ${textSecondary}`}>
                                  {obs.empleados?.nombre ? `Registrado por ${obs.empleados.nombre}` : "Observación registrada"}
                                  {obs.created_at ? ` • ${formatDateTimeWorkshop(obs.created_at)}` : ""}
                                </p>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className={`p-4 rounded text-center ${darkMode ? "bg-zinc-800/50" : "bg-gray-50"}`}>
                          <p className={`text-sm ${textSecondary}`}>No hay observaciones registradas</p>
                        </div>
                      )}
                    </div>

                    {/* Sección de Fotos */}
                    <div className="mb-6">
                      <h4 className={`font-semibold ${textPrimary} mb-3`}>Fotos del Servicio</h4>
                      {loadingFotos[servicio.id] ? (
                        <div className={`p-4 rounded text-center ${darkMode ? "bg-zinc-800/50" : "bg-gray-50"}`}>
                          <p className={`text-sm ${textSecondary}`}>Cargando fotos...</p>
                        </div>
                      ) : fotos[servicio.id]?.length > 0 ? (
                        <div className="space-y-4">
                          {["antes", "durante", "despues"].map((momento) => {
                            const fotosMomento = fotos[servicio.id].filter((f) => f.momento === momento);
                            if (!fotosMomento.length) return null;

                            return (
                              <div key={momento}>
                                <p className={`text-xs font-medium ${textSecondary} uppercase mb-2`}>
                                  {momento === "antes" && "✓ Antes"}
                                  {momento === "durante" && "• Durante"}
                                  {momento === "despues" && "✓ Después"}
                                </p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  {fotosMomento.map((foto) => (
                                    <div key={foto.id} className="relative group cursor-pointer">
                                      <div
                                        onClick={() => setLightbox(foto)}
                                        className={`aspect-square rounded-lg overflow-hidden border ${
                                          darkMode ? "border-zinc-700" : "border-gray-200"
                                        } hover:shadow-lg transition`}
                                      >
                                        <img src={foto.url} alt={foto.descripcion || momento} className="w-full h-full object-cover" />
                                      </div>
                                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/40 rounded-lg flex items-center justify-center transition">
                                        <Eye className="w-5 h-5 text-white" />
                                      </div>
                                      {foto.descripcion && (
                                        <p className={`text-xs ${textSecondary} mt-1 line-clamp-1`}>{foto.descripcion}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className={`p-4 rounded text-center ${darkMode ? "bg-zinc-800/50" : "bg-gray-50"}`}>
                          <p className={`text-sm ${textSecondary}`}>No hay fotos disponibles</p>
                        </div>
                      )}
                    </div>

                    {/* Sección de Cotizaciones/Facturas */}
                    <div className="mb-6">
                      <h4 className={`font-semibold ${textPrimary} mb-3`}>Cotizaciones y Facturas</h4>
                      {Array.isArray(servicio.cotizaciones) && servicio.cotizaciones.length > 0 ? (
                        <div className="space-y-3">
                          {servicio.cotizaciones.map((cot, idx) => (
                            <div key={cot.id} className={`p-4 rounded border ${darkMode ? "border-zinc-700 bg-zinc-800/50" : "border-gray-200 bg-gray-50"}`}>
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <p className={`text-sm font-semibold ${textPrimary}`}>
                                    Cotización #{idx + 1} • {formatDateWorkshop(cot.fecha_emision || cot.created_at)}
                                  </p>
                                  <span
                                    className={`inline-block mt-1 px-2 py-1 rounded text-xs font-medium border ${
                                      cot.estado === "aprobada"
                                        ? darkMode
                                          ? "bg-emerald-900/30 text-emerald-300 border-emerald-700"
                                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : cot.estado === "rechazada"
                                          ? darkMode
                                            ? "bg-red-900/30 text-red-300 border-red-700"
                                            : "bg-red-50 text-red-700 border-red-200"
                                          : darkMode
                                            ? "bg-amber-900/30 text-amber-300 border-amber-700"
                                            : "bg-amber-50 text-amber-700 border-amber-200"
                                    }`}
                                  >
                                    {cot.estado === "aprobada" ? "✓ APROBADA" : cot.estado === "rechazada" ? "✗ RECHAZADA" : "⧖ PENDIENTE"}
                                  </span>
                                </div>
                              </div>

                              {/* Items de la cotización */}
                              {Array.isArray(cot.cotizacion_items) && cot.cotizacion_items.length > 0 && (
                                <div className="mb-3">
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className={`border-b ${darkMode ? "border-zinc-700" : "border-gray-200"}`}>
                                        <th className={`text-left py-2 px-2 ${textSecondary}`}>Descripción</th>
                                        <th className={`text-right py-2 px-2 ${textSecondary}`}>Cantidad</th>
                                        <th className={`text-right py-2 px-2 ${textSecondary}`}>Precio</th>
                                        <th className={`text-right py-2 px-2 ${textSecondary}`}>Subtotal</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {cot.cotizacion_items.map((item, i) => (
                                        <tr key={i} className={`border-b ${darkMode ? "border-zinc-700" : "border-gray-200"}`}>
                                          <td className={`py-2 px-2 ${textPrimary}`}>{item.descripcion}</td>
                                          <td className={`text-right py-2 px-2 ${textSecondary}`}>{item.cantidad}</td>
                                          <td className={`text-right py-2 px-2 ${textSecondary}`}>${item.precio_unit}</td>
                                          <td className={`text-right py-2 px-2 ${textPrimary} font-semibold`}>${item.subtotal}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}

                              {/* Resumen de montos */}
                              <div className={`pt-3 border-t ${darkMode ? "border-zinc-700" : "border-gray-200"} space-y-1`}>
                                <div className="flex justify-between text-sm">
                                  <span className={textSecondary}>Mano de obra:</span>
                                  <span className={textPrimary}>${parseFloat(cot.monto_mano_obra).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className={textSecondary}>Refacciones:</span>
                                  <span className={textPrimary}>${parseFloat(cot.monto_refacc).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold">
                                  <span className={textPrimary}>Total:</span>
                                  <span className={`text-base ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>
                                    ${parseFloat(cot.monto_total).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                              </div>

                              {cot.notas && (
                                <div className={`mt-3 p-2 rounded text-xs ${darkMode ? "bg-zinc-700/50" : "bg-gray-100"} ${textSecondary}`}>
                                  <span className="font-medium">Notas:</span> {cot.notas}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className={`p-4 rounded text-center ${darkMode ? "bg-zinc-800/50" : "bg-gray-50"}`}>
                          <p className={`text-sm ${textSecondary}`}>No hay cotizaciones disponibles</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className={`flex flex-wrap gap-2 pt-4 px-4 border-t ${darkMode ? "border-zinc-700" : "border-gray-200"}`}>
                    <button
                      onClick={() => imprimirTicketServicio(servicio.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded font-medium text-sm transition ${
                        darkMode
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-blue-500 hover:bg-blue-600 text-white"
                      }`}
                    >
                      <Printer className="w-4 h-4" />
                      Imprimir Ticket
                    </button>
                    <button
                      onClick={() => generarPDFServicio(servicio)}
                      disabled={generandoPDF[servicio.id]}
                      className={`flex items-center gap-2 px-4 py-2 rounded font-medium text-sm transition ${
                        generandoPDF[servicio.id]
                          ? darkMode
                            ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : darkMode
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : "bg-emerald-500 hover:bg-emerald-600 text-white"
                      }`}
                    >
                      <Download className="w-4 h-4" />
                      {generandoPDF[servicio.id] ? "Generando..." : "Descargar PDF"}
                    </button>
                  </div>
                </div>
              )}
            </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox para fotos */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightbox(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
            <img src={lightbox.url} alt={lightbox.descripcion} className="max-w-full max-h-[80vh] object-contain rounded-lg" />
            {lightbox.descripcion && (
              <p className="text-white text-center mt-4">{lightbox.descripcion}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
