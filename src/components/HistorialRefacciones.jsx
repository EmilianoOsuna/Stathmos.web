import { useEffect, useState, useMemo } from "react";
import supabase from "../supabase";
import { formatDateTimeWorkshop } from "../utils/datetime";
import { Icon } from "./UIPrimitives";

export default function HistorialRefacciones({
  darkMode,
  searchTerm = "",
  filtroTipo = "todos",
  fechaInicio = "",
  fechaFin = "",
  orden = "reciente",
}) {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistorial = async () => {
    setLoading(true);
    try {
      // Consultamos ambas tablas en paralelo para mayor velocidad
      const [ventasRes, comprasRes] = await Promise.all([
        supabase.from("ventas_refacciones").select("*, refacciones(nombre), proyectos(titulo)"),
        supabase.from("compras_refacciones").select("*, refacciones(nombre), proyectos(titulo), proveedores(nombre)")
      ]);

      // Etiquetamos cada tipo para la tabla unificada
      const ventas = (ventasRes.data || []).map(v => ({
        ...v,
        tipo_mov: 'VENTA',
        colorBadge: 'text-red-400 bg-red-400/10 border-red-400/20',
        label: 'SALIDA',
        proyecto_titulo: v.proyectos?.titulo || 'Venta Directa' 
    }));

      const compras = (comprasRes.data || []).map(c => ({
        ...c,
        tipo_mov: 'COMPRA',
        colorBadge: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
        label: 'ENTRADA'
      }));

      // Unimos y ordenamos por fecha (más reciente primero)
      const unificado = [...ventas, ...compras].sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );

      setMovimientos(unificado);
    } catch (error) {
      console.error("Error al cargar historial:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistorial(); }, []);

  const t = darkMode ? "text-zinc-100" : "text-gray-800";
  const st = darkMode ? "text-zinc-500" : "text-gray-400";
  const divider = darkMode ? "border-zinc-800" : "border-gray-100";

  // ─── Filtrado en memoria ────────────────────────────────────────────────
  const filtrados = useMemo(() => {
    let list = [...movimientos];

    if (filtroTipo !== "todos") {
      list = list.filter((m) => m.tipo_mov === filtroTipo);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter((m) =>
        m.refacciones?.nombre?.toLowerCase().includes(q) ||
        m.proyectos?.titulo?.toLowerCase().includes(q) ||
        m.proveedores?.nombre?.toLowerCase().includes(q)
      );
    }

    if (fechaInicio) {
      const inicio = new Date(fechaInicio + "T00:00:00");
      list = list.filter((m) => new Date(m.created_at) >= inicio);
    }
    if (fechaFin) {
      const fin = new Date(fechaFin + "T23:59:59");
      list = list.filter((m) => new Date(m.created_at) <= fin);
    }

    list.sort((a, b) =>
      orden === "reciente"
        ? new Date(b.created_at) - new Date(a.created_at)
        : new Date(a.created_at) - new Date(b.created_at)
    );

    return list;
  }, [movimientos, searchTerm, filtroTipo, fechaInicio, fechaFin, orden]);

  return (
    <div className="anim-fadeUp">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className={`text-sm font-semibold ${t}`}>Registro de Movimientos</h3>
          <p className={`text-xs ${st} mt-0.5`}>
            {loading ? "Cargando..." : `${filtrados.length} de ${movimientos.length} movimientos`}
          </p>
        </div>
        <button
          onClick={fetchHistorial}
          className={`text-xs ${st} hover:text-sky-400 transition-colors flex items-center gap-1.5`}
        >
          <Icon name="refresh" className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Actualizar
        </button>
      </div>

      <div className={`rounded-xl border ${darkMode ? "bg-[#1e1e28] border-zinc-800" : "bg-white border-gray-200"} overflow-hidden`}>
        {loading ? (
          <div className="p-12 text-center text-sm text-zinc-500 italic">Cargando registros...</div>
        ) : filtrados.length === 0 ? (
          <div className="p-12 text-center text-sm text-zinc-500 italic">
            {movimientos.length === 0 ? "No hay movimientos registrados." : "Ningún movimiento coincide con los filtros."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] text-left">
              <thead>
                <tr className={`border-b ${divider} bg-zinc-900/10`}>
                  <th className={`px-4 py-3 font-semibold uppercase tracking-wider ${st}`}>Fecha</th>
                  <th className={`px-4 py-3 font-semibold uppercase tracking-wider ${st}`}>Operación</th>
                  <th className={`px-4 py-3 font-semibold uppercase tracking-wider ${st}`}>Refacción</th>
                  <th className={`px-4 py-3 font-semibold uppercase tracking-wider ${st}`}>Cant.</th>
                  <th className={`px-4 py-3 font-semibold uppercase tracking-wider ${st}`}>Relacionado con</th>
                  <th className={`px-4 py-3 font-semibold uppercase tracking-wider ${st}`}>Total</th>
                </tr>
              </thead>
              <tbody className={darkMode ? "divide-y divide-zinc-800" : "divide-y divide-gray-100"}>
                {filtrados.map((m) => (
                  <tr key={m.id} className={`${darkMode ? "hover:bg-zinc-800/20" : "hover:bg-gray-50/50"} transition-colors`}>
                    <td className={`px-4 py-3 whitespace-nowrap ${st}`}>{formatDateTimeWorkshop(m.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${m.colorBadge}`}>
                        {m.label}
                      </span>
                    </td>
                    <td className={`px-4 py-3 font-medium ${t}`}>{m.refacciones?.nombre || "—"}</td>
                    <td className={`px-4 py-3 ${t}`}>{m.cantidad}</td>
                    <td className={`px-4 py-3 ${st}`}>
                      {m.proyectos?.titulo ? (
                        <span className="flex items-center gap-1"> {m.proyectos.titulo}</span>
                      ) : m.proveedores?.nombre ? (
                        <span className="flex items-center gap-1"> {m.proveedores.nombre}</span>
                      ) : (
                        <span className="italic opacity-60">Mostrador / Directo</span>
                      )}
                    </td>
                    <td className={`px-4 py-3 font-bold ${t}`}>${(Number(m.precio_unit) * m.cantidad).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}