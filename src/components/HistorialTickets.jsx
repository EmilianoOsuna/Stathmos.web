import { useState, useEffect } from "react";
import supabase from "../supabase";
import useSupabaseRealtime from "../hooks/useSupabaseRealtime";
import Ticket from "./Ticket";
import { formatDateWorkshop } from "../utils/datetime";

export default function HistorialTickets({ darkMode = false }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [filter, setFilter] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("reciente");

  const [rtTick, setRtTick] = useState(0);
  useSupabaseRealtime("proyectos", () => setRtTick(t => t + 1));

  useEffect(() => {
    fetchTickets();
  }, [rtTick]);

  const fetchTickets = async () => {
    try {
      setLoading(true);

      const { data: proyectos, error } = await supabase
        .from("proyectos")
        .select(
          `
          id,
          titulo,
          descripcion,
          estado,
          fecha_ingreso,
          fecha_cierre,
          clientes (
            nombre,
            correo,
            telefono
          ),
          vehiculos (
            marca,
            modelo,
            anio,
            placas
          ),
          cotizaciones (
            monto_total,
            cotizacion_items (
              descripcion,
              cantidad,
              precio_unit,
              subtotal
            )
          )
        `
        )
        .in("estado", ["entregado", "cancelado"])
        .order("fecha_cierre", { ascending: false });

      if (error) throw error;

      setTickets(
        (proyectos || []).map((p) => ({
          id: p.id,
          titulo: p.titulo,
          descripcion: p.descripcion,
          estado: p.estado,
          fechaIngreso: p.fecha_ingreso,
          fechaCierre: p.fecha_cierre,
          cliente: p.clientes,
          vehiculo: p.vehiculos,
          cotizacion: p.cotizaciones?.[0] || null,
          items: p.cotizaciones?.[0]?.cotizacion_items || [],
        }))
      );
    } catch (error) {
      console.error("Error al obtener historial:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = tickets
    .filter((ticket) => {
      if (filter !== "todos" && ticket.estado !== filter) return false;
      if (
        searchTerm &&
        !ticket.titulo.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !ticket.cliente?.nombre
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) &&
        !ticket.vehiculo?.placas
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase())
      )
        return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "reciente") {
        return new Date(b.fechaCierre) - new Date(a.fechaCierre);
      } else {
        return new Date(a.fechaCierre) - new Date(b.fechaCierre);
      }
    });

  if (selectedTicket) {
    return (
      <div className="w-full">
        <button
          onClick={() => setSelectedTicket(null)}
          className={`mb-4 px-4 py-2 rounded text-sm font-medium ${
            darkMode
              ? "bg-zinc-700 text-white hover:bg-zinc-600"
              : "bg-gray-300 text-gray-900 hover:bg-gray-400"
          }`}
        >
          ← Volver a Historial
        </button>
        <Ticket proyectoId={selectedTicket.id} darkMode={darkMode} showOmit={false} />
      </div>
    );
  }

  const t = darkMode ? "text-zinc-100" : "text-gray-800";
  const st = darkMode ? "text-zinc-500" : "text-gray-400";
  const inputBg = darkMode ? "bg-zinc-900 border-zinc-700 text-white" : "bg-white border-gray-300 text-gray-900";

  return (
    <div>
      {/* Encabezado */}
      <div className="mb-6">
        <h2 className={`text-xl font-semibold ${t}`}>📋 Historial de Tickets</h2>
        <p className={`text-xs ${st} mt-0.5`}>Gestiona todos los servicios completados</p>
      </div>

      {/* Filtros y Búsqueda */}
      <div
        className={`rounded-lg p-4 mb-6 border ${
          darkMode ? "bg-[#1e1e28] border-zinc-800" : "bg-white border-gray-200"
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className={`block text-xs font-medium mb-1 ${st}`}>Buscar</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Título, cliente, placas..."
              className={`w-full px-3 py-2 rounded border text-sm ${inputBg} placeholder-opacity-50`}
            />
          </div>

          <div>
            <label className={`block text-xs font-medium mb-1 ${st}`}>Estado</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className={`w-full px-3 py-2 rounded border text-sm ${inputBg}`}
            >
              <option value="todos">Todos</option>
              <option value="entregado">Entregados</option>
              <option value="cancelado">Cancelados</option>
            </select>
          </div>

          <div>
            <label className={`block text-xs font-medium mb-1 ${st}`}>Ordenar</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`w-full px-3 py-2 rounded border text-sm ${inputBg}`}
            >
              <option value="reciente">Más Reciente</option>
              <option value="antiguo">Más Antiguo</option>
            </select>
          </div>

          <div className="flex items-end">
            <div className={`text-sm ${st}`}>
              <span className="font-semibold">{filteredTickets.length}</span> ticket{filteredTickets.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Tickets */}
      {loading ? (
        <div className={`text-center p-8 ${st} text-sm`}>Cargando historial...</div>
      ) : filteredTickets.length === 0 ? (
        <div className={`text-center p-8 ${st} text-sm`}>No hay tickets para mostrar</div>
      ) : (
        <div className="grid gap-3">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => setSelectedTicket(ticket)}
              className={`cursor-pointer rounded-lg p-4 border transition ${
                darkMode
                  ? "bg-[#1e1e28] border-zinc-800 hover:border-blue-600 hover:shadow-lg hover:shadow-blue-900/20"
                  : "bg-white border-gray-200 hover:border-blue-500 hover:shadow-lg"
              }`}
            >
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {/* Ticket ID y Título */}
                <div>
                  <p className={`text-xs font-mono ${st}`}>
                    #{ticket.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className={`font-semibold text-sm ${t}`}>{ticket.titulo}</p>
                  <p className={`text-xs ${st}`}>
                    🚗 {ticket.vehiculo?.marca} {ticket.vehiculo?.modelo}
                  </p>
                </div>

                {/* Cliente */}
                <div>
                  <p className={`text-xs font-medium mb-1 ${st}`}>CLIENTE</p>
                  <p className={`font-semibold text-sm ${t}`}>
                    {ticket.cliente?.nombre || "—"}
                  </p>
                  <p className={`text-xs ${st}`}>{ticket.cliente?.telefono || "—"}</p>
                </div>

                {/* Monto */}
                <div>
                  <p className={`text-xs font-medium mb-1 ${st}`}>TOTAL</p>
                  <p className="font-bold text-emerald-500">
                    ${(ticket.cotizacion?.monto_total || 0).toFixed(2)}
                  </p>
                </div>

                {/* Estado */}
                <div>
                  <p className={`text-xs font-medium mb-1 ${st}`}>ESTADO</p>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium inline-block ${
                      ticket.estado === "entregado"
                        ? "bg-emerald-900/30 text-emerald-300 border border-emerald-800"
                        : "bg-red-900/30 text-red-300 border border-red-800"
                    }`}
                  >
                    {ticket.estado === "entregado" ? "✓ Entregado" : "✗ Cancelado"}
                  </span>
                </div>

                {/* Fecha */}
                <div className="flex items-end">
                  <p className={`text-xs ${st}`}>
                    {formatDateWorkshop(ticket.fechaCierre)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
