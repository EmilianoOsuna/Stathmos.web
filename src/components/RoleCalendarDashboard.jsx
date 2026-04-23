import { useEffect, useMemo, useState } from "react";
import supabase from "../supabase";
import { formatDateWorkshop, formatTimeWorkshop, toWorkshopYmd } from "../utils/datetime";

const ymd = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const markerClass = (tipo, darkMode) => {
  const mapDark = {
    cita: "bg-emerald-600",
    inhabil: "bg-zinc-500",
    proyecto: "bg-sky-500",
    cierre: "bg-fuchsia-500",
  };
  const mapLight = {
    cita: "bg-emerald-500",
    inhabil: "bg-zinc-400",
    proyecto: "bg-sky-500",
    cierre: "bg-fuchsia-500",
  };
  return (darkMode ? mapDark : mapLight)[tipo] || (darkMode ? "bg-zinc-500" : "bg-gray-500");
};

const startOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const addDays = (value, days) => {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
};

const startOfWeek = (value) => {
  const date = startOfDay(value);
  date.setDate(date.getDate() - date.getDay());
  return date;
};

export default function RoleCalendarDashboard({
  role,
  darkMode = false,
  clienteId = null,
  empleadoId = null,
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("month");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      try {
        const allEvents = [];

        if (role === "administrador") {
          const [citasRes, inhabilRes] = await Promise.all([
            supabase
              .from("citas")
              .select("id, fecha_hora, estado, motivo")
              .in("estado", ["pendiente", "confirmada", "concluida", "completada"]),
            supabase
              .from("dias_inhabiles")
              .select("id, fecha, motivo")
              .eq("activo", true),
          ]);

          (citasRes.data || []).forEach((c) => {
            allEvents.push({
              id: `cita-${c.id}`,
              fecha: toWorkshopYmd(c.fecha_hora),
              fechaHora: c.fecha_hora,
              hora: formatTimeWorkshop(c.fecha_hora),
              tipo: "cita",
              titulo: `Cita: ${c.motivo || "Servicio"}`,
            });
          });

          (inhabilRes.data || []).forEach((d) => {
            allEvents.push({
              id: `inhabil-${d.id}`,
              fecha: d.fecha,
              tipo: "inhabil",
              titulo: `Agenda bloqueada${d.motivo ? `: ${d.motivo}` : ""}`,
            });
          });
        }

        if (role === "cliente" && clienteId) {
          const [citasRes, proyectosRes] = await Promise.all([
            supabase
              .from("citas")
              .select("id, fecha_hora, estado, motivo")
              .eq("cliente_id", clienteId)
              .in("estado", ["pendiente", "confirmada", "concluida", "completada"]),
            supabase
              .from("proyectos")
              .select("id, titulo, fecha_ingreso, fecha_cierre")
              .eq("cliente_id", clienteId),
          ]);

          (citasRes.data || []).forEach((c) => {
            allEvents.push({
              id: `cita-${c.id}`,
              fecha: toWorkshopYmd(c.fecha_hora),
              fechaHora: c.fecha_hora,
              hora: formatTimeWorkshop(c.fecha_hora),
              tipo: "cita",
              titulo: `Cita: ${c.motivo || "Servicio"}`,
            });
          });

          (proyectosRes.data || []).forEach((p) => {
            if (p.fecha_ingreso) {
              allEvents.push({
                id: `ingreso-${p.id}`,
                fecha: p.fecha_ingreso,
                tipo: "proyecto",
                titulo: `Ingreso proyecto: ${p.titulo}`,
              });
            }
            if (p.fecha_cierre) {
              allEvents.push({
                id: `cierre-${p.id}`,
                fecha: p.fecha_cierre,
                tipo: "cierre",
                titulo: `Cierre proyecto: ${p.titulo}`,
              });
            }
          });
        }

        if (role === "mecanico" && empleadoId) {
          const [citasRes, proyectosRes] = await Promise.all([
            supabase
              .from("citas")
              .select("id, fecha_hora, estado, motivo")
              .in("estado", ["pendiente", "confirmada", "concluida", "completada"]),
            supabase
              .from("proyectos")
              .select("id, titulo, fecha_ingreso, fecha_cierre")
              .eq("mecanico_id", empleadoId),
          ]);

          (citasRes.data || []).forEach((c) => {
            allEvents.push({
              id: `cita-${c.id}`,
              fecha: toWorkshopYmd(c.fecha_hora),
              fechaHora: c.fecha_hora,
              hora: formatTimeWorkshop(c.fecha_hora),
              tipo: "cita",
              titulo: `Cita: ${c.motivo || "Servicio"}`,
            });
          });

          (proyectosRes.data || []).forEach((p) => {
            if (p.fecha_ingreso) {
              allEvents.push({
                id: `ingreso-${p.id}`,
                fecha: p.fecha_ingreso,
                tipo: "proyecto",
                titulo: `Ingreso proyecto: ${p.titulo}`,
              });
            }
            if (p.fecha_cierre) {
              allEvents.push({
                id: `cierre-${p.id}`,
                fecha: p.fecha_cierre,
                tipo: "cierre",
                titulo: `Cierre proyecto: ${p.titulo}`,
              });
            }
          });
        }

        setEvents(allEvents);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [role, clienteId, empleadoId]);

  const eventsByDate = useMemo(() => {
    const map = new Map();
    for (const event of events) {
      const list = map.get(event.fecha) || [];
      list.push(event);
      map.set(event.fecha, list);
    }
    return map;
  }, [events]);

  const citasByDate = useMemo(() => {
    const map = new Map();
    for (const event of events) {
      if (event.tipo !== "cita") continue;
      const list = map.get(event.fecha) || [];
      list.push(event);
      map.set(event.fecha, list);
    }
    for (const [key, list] of map.entries()) {
      list.sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora));
      map.set(key, list);
    }
    return map;
  }, [events]);

  const inhabilSet = useMemo(() => {
    const set = new Set();
    for (const event of events) {
      if (event.tipo === "inhabil") set.add(event.fecha);
    }
    return set;
  }, [events]);

  const todayKey = ymd(new Date());

  const calendarCells = useMemo(() => {
    if (viewMode === "day") return [startOfDay(currentDate)];

    if (viewMode === "week") {
      const start = startOfWeek(currentDate);
      return Array.from({ length: 7 }, (_, index) => addDays(start, index));
    }

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const first = new Date(year, month, 1);
    const startDayIndex = first.getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const cells = [];

    for (let i = 0; i < startDayIndex; i += 1) cells.push(null);
    for (let d = 1; d <= totalDays; d += 1) cells.push(new Date(year, month, d));
    return cells;
  }, [currentDate, viewMode]);

  const headerTitle = useMemo(() => {
    if (viewMode === "day") {
      return formatDateWorkshop(currentDate, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
    if (viewMode === "week") {
      const start = startOfWeek(currentDate);
      const end = addDays(start, 6);
      return `${formatDateWorkshop(start, { day: "numeric", month: "short" })} - ${formatDateWorkshop(end, { day: "numeric", month: "short", year: "numeric" })}`;
    }
    return formatDateWorkshop(currentDate, { month: "long", year: "numeric" });
  }, [currentDate, viewMode]);

  const shiftPeriod = (direction) => {
    setCurrentDate((value) => {
      const next = new Date(value);
      if (viewMode === "day") {
        next.setDate(next.getDate() + direction);
      } else if (viewMode === "week") {
        next.setDate(next.getDate() + direction * 7);
      } else {
        next.setMonth(next.getMonth() + direction);
      }
      return next;
    });
  };

  const nextEvents = useMemo(() => {
    const now = new Date();
    return [...events]
      .filter((e) => new Date(`${e.fecha}T00:00:00`) >= new Date(now.getFullYear(), now.getMonth(), now.getDate()))
      .sort((a, b) => new Date(`${a.fecha}T00:00:00`) - new Date(`${b.fecha}T00:00:00`))
      .slice(0, 8);
  }, [events]);

  const t = darkMode ? "text-zinc-100" : "text-gray-800";
  const st = darkMode ? "text-zinc-500" : "text-gray-500";

  return (
    <div className={`flex-1 p-4 md:p-6 min-h-full ${darkMode ? "bg-[#16161e]" : "bg-gray-50"}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className={`text-lg font-semibold ${t}`}>Fechas importantes</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center rounded-lg border p-1 ${darkMode ? "border-zinc-700 bg-zinc-900/40" : "border-gray-200 bg-white"}`}>
            {[
              { id: "day", label: "Día" },
              { id: "week", label: "Semana" },
              { id: "month", label: "Mes" },
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => setViewMode(option.id)}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                  viewMode === option.id
                    ? darkMode
                      ? "bg-zinc-700 text-zinc-100"
                      : "bg-gray-200 text-gray-800"
                    : darkMode
                    ? "text-zinc-400 hover:bg-zinc-800"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => shiftPeriod(-1)}
            className={`px-2 py-1 rounded ${darkMode ? "text-zinc-300 hover:bg-zinc-800" : "text-gray-700 hover:bg-gray-100"}`}
          >
            ←
          </button>
          <p className={`text-sm font-semibold ${t}`}>{headerTitle}</p>
          <button
            onClick={() => shiftPeriod(1)}
            className={`px-2 py-1 rounded ${darkMode ? "text-zinc-300 hover:bg-zinc-800" : "text-gray-700 hover:bg-gray-100"}`}
          >
            →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className={`xl:col-span-2 rounded-xl border p-3 ${darkMode ? "bg-[#1e1e28] border-zinc-800" : "bg-white border-gray-200"}`}>
          {viewMode !== "day" && (
            <div className="grid grid-cols-7 gap-2 mb-2">
              {["D", "L", "M", "M", "J", "V", "S"].map((d, idx) => (
                <div key={`${d}-${idx}`} className={`text-center text-xs font-semibold ${st}`}>{d}</div>
              ))}
            </div>
          )}
          <div className={`grid gap-2 ${viewMode === "day" ? "grid-cols-1" : "grid-cols-7"}`}>
            {calendarCells.map((dateObj, idx) => {
              if (!dateObj) return <div key={`empty-${idx}`} className="min-h-24" />;
              const key = ymd(dateObj);
              const dayEvents = eventsByDate.get(key) || [];
              const citasDia = citasByDate.get(key) || [];
              const isInhabil = inhabilSet.has(key);
              const nonCitaEvents = dayEvents.filter((ev) => ev.tipo !== "cita" && ev.tipo !== "inhabil");
              const visibleHoras = citasDia.slice(0, viewMode === "month" ? 3 : 10);

              const cellClass = isInhabil
                ? darkMode
                  ? "bg-zinc-700 border-zinc-600"
                  : "bg-gray-200 border-gray-300"
                : darkMode
                ? "bg-[#17171f] border-zinc-800"
                : "bg-gray-50 border-gray-200";

              return (
                <div key={key} className={`rounded-lg border p-1.5 ${viewMode === "day" ? "min-h-[360px]" : viewMode === "week" ? "min-h-40" : "min-h-24"} ${cellClass}`}>
                  <div className="flex items-center justify-between">
                    <p className={`text-xs font-semibold ${key === todayKey ? "text-sky-500" : t}`}>{dateObj.getDate()}</p>
                    {citasDia.length > 0 && <span className={`text-[10px] ${st}`}>{citasDia.length} cita{citasDia.length === 1 ? "" : "s"}</span>}
                  </div>
                  <div className="mt-1 space-y-1">
                    {visibleHoras.map((ev) => (
                      <div key={ev.id} className={`text-[10px] px-1.5 py-0.5 rounded ${darkMode ? "bg-black/20 text-zinc-100" : "bg-white/80 text-gray-700"}`}>
                        {ev.hora}
                      </div>
                    ))}
                    {citasDia.length > visibleHoras.length && <p className={`text-[10px] ${st}`}>+{citasDia.length - visibleHoras.length} citas</p>}
                    {nonCitaEvents.slice(0, 2).map((ev) => (
                      <div key={ev.id} className={`text-[10px] px-1.5 py-0.5 rounded text-white ${markerClass(ev.tipo, darkMode)}`}>
                        {ev.titulo}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={`rounded-xl border ${darkMode ? "bg-[#1e1e28] border-zinc-800" : "bg-white border-gray-200"}`}>
          <div className={`px-4 py-3 border-b ${darkMode ? "border-zinc-800" : "border-gray-200"}`}>
            <h3 className={`text-sm font-semibold ${t}`}>Próximas fechas</h3>
          </div>
          <div className="p-3 max-h-[420px] overflow-y-auto">
            {loading ? (
              <p className={`text-sm ${st}`}>Cargando…</p>
            ) : nextEvents.length === 0 ? (
              <p className={`text-sm ${st}`}>Sin eventos próximos.</p>
            ) : (
              <div className="space-y-2">
                {nextEvents.map((ev) => (
                  <div key={ev.id} className={`rounded-lg border p-2 ${darkMode ? "border-zinc-800" : "border-gray-200"}`}>
                    <p className={`text-xs font-semibold ${t}`}>{ev.titulo}</p>
                    <p className={`text-[11px] ${st}`}>{formatDateWorkshop(ev.fecha, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
