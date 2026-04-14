import { useEffect, useMemo, useState } from "react";
import supabase from "../supabase";
import {
  WORKSHOP_OFFSET,
  formatDateWorkshop,
  formatDateTimeWorkshop,
  formatTimeWorkshop,
  toWorkshopYmd,
  todayWorkshopYmd,
} from "../utils/datetime";

const SERVICIOS = [
  "Mantenimiento",
  "Frenos",
  "Motor",
  "Suspensión",
  "Sistema eléctrico",
  "Transmisión",
  "Climatización",
  "Otro",
];

const estadoBadge = (estado, darkMode) => {
  const map = {
    pendiente: darkMode ? "bg-amber-900/40 text-amber-300 border-amber-800" : "bg-amber-50 text-amber-700 border-amber-200",
    confirmada: darkMode ? "bg-emerald-900/40 text-emerald-300 border-emerald-800" : "bg-emerald-50 text-emerald-700 border-emerald-200",
    cancelada: darkMode ? "bg-red-900/40 text-red-300 border-red-800" : "bg-red-50 text-red-700 border-red-200",
    completada: darkMode ? "bg-sky-900/40 text-sky-300 border-sky-800" : "bg-sky-50 text-sky-700 border-sky-200",
  };
  return map[estado] || (darkMode ? "bg-zinc-800 text-zinc-400 border-zinc-700" : "bg-gray-100 text-gray-600 border-gray-200");
};

const ymd = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const formatHm = (value) => formatTimeWorkshop(value);

const isSunday = (fecha) => new Date(`${fecha}T00:00:00`).getDay() === 0;

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const calendarStatusClasses = (estado, darkMode) => {
  if (estado === "confirmada" || estado === "completada") {
    return darkMode
      ? "bg-emerald-900/60 text-emerald-200 border-emerald-700"
      : "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  if (estado === "pendiente") {
    return darkMode
      ? "bg-amber-900/50 text-amber-200 border-amber-700"
      : "bg-amber-50 text-amber-800 border-amber-200";
  }

  return darkMode
    ? "bg-zinc-800 text-zinc-400 border-zinc-700"
    : "bg-gray-100 text-gray-500 border-gray-200";
};

const hmToMinutes = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const isValidSlot = (fecha, hora) => {
  if (!fecha || !hora) return false;

  const dateOnly = new Date(`${fecha}T00:00:00`);
  if (Number.isNaN(dateOnly.getTime())) return false;

  const now = new Date();
  const dateTime = new Date(`${fecha}T${hora}:00${WORKSHOP_OFFSET}`);
  if (Number.isNaN(dateTime.getTime())) return false;

  if (dateTime < now) return false;

  const day = dateOnly.getDay();
  if (day === 0) return false;

  const mins = hmToMinutes(hora);
  const inMorning = mins >= 9 * 60 && mins <= 14 * 60;
  const inEvening = mins >= 17 * 60 && mins <= 20 * 60;

  if (day >= 1 && day <= 5) return inMorning || inEvening;
  if (day === 6) return inMorning;
  return false;
};

const getFunctionErrorMessage = async (invokeError, fallbackMessage) => {
  if (!invokeError) return fallbackMessage;

  const directMessage = invokeError?.message;
  const response = invokeError?.context;

  if (!response || typeof response.json !== "function") {
    return directMessage || fallbackMessage;
  }

  try {
    const payload = await response.clone().json();
    return payload?.error || payload?.message || directMessage || fallbackMessage;
  } catch {
    return directMessage || fallbackMessage;
  }
};

const Modal = ({ open, onClose, darkMode, children, title }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-xl rounded-xl border ${darkMode ? "bg-[#1e1e26] border-zinc-700" : "bg-white border-gray-200"}`}
      >
        <div className={`px-5 py-4 border-b flex items-center justify-between ${darkMode ? "border-zinc-700" : "border-gray-200"}`}>
          <h3 className={`text-base font-semibold ${darkMode ? "text-zinc-100" : "text-gray-800"}`}>{title}</h3>
          <button onClick={onClose} className={darkMode ? "text-zinc-400" : "text-gray-500"}>×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

export default function CitasModule({
  darkMode = false,
  role = "cliente",
  clienteId = null,
  canManage = false,
}) {
  const [citas, setCitas] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [diasInhabiles, setDiasInhabiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [inhabilOpen, setInhabilOpen] = useState(false);
  const [filterMode, setFilterMode] = useState("hoy");
  const [filterDate, setFilterDate] = useState(ymd(new Date()));
  const [calendarView, setCalendarView] = useState("month");
  const [monthDate, setMonthDate] = useState(new Date());
  const [inhabilForm, setInhabilForm] = useState({ fecha: ymd(new Date()), motivo: "" });

  const [form, setForm] = useState({
    fecha: ymd(new Date()),
    hora: "09:00",
    cliente_id: "",
    vehiculo_id: "",
    servicio: "Mantenimiento",
    notas: "",
  });

  const selectedClienteId = role === "administrador" ? form.cliente_id : clienteId;

  const isBlockedDate = (fecha) => Boolean(fecha) && (isSunday(fecha) || inhabilSet.has(fecha));

  const nextSelectableDate = (startDate = new Date()) => {
    const candidate = new Date(startDate);
    candidate.setHours(0, 0, 0, 0);

    for (let i = 0; i < 30; i += 1) {
      const key = ymd(candidate);
      if (!isSunday(key) && !inhabilSet.has(key)) return key;
      candidate.setDate(candidate.getDate() + 1);
    }

    return ymd(startDate);
  };

  const fetchCitas = async () => {
    setLoading(true);
    setError("");
    try {
      if (role === "cliente") {
        if (!clienteId) {
          setCitas([]);
          setLoading(false);
          return;
        }

        const { data, error: citasError } = await supabase
          .from("citas")
          .select("id, fecha_hora, motivo, estado, notas, vehiculo_id, vehiculos(marca, modelo, placas)")
          .eq("cliente_id", clienteId)
          .order("fecha_hora", { ascending: true });

        if (citasError) throw citasError;
        setCitas(data || []);

        const { data: vData, error: vErr } = await supabase
          .from("vehiculos")
          .select("id, marca, modelo, placas")
          .eq("cliente_id", clienteId)
          .eq("activo", true)
          .order("created_at", { ascending: false });

        if (vErr) throw vErr;
        setVehiculos(vData || []);
      } else {
        const { data, error: citasError } = await supabase
          .from("citas")
          .select("id, fecha_hora, motivo, estado, notas, clientes(nombre, correo), vehiculos(marca, modelo, placas)")
          .order("fecha_hora", { ascending: true });

        if (citasError) throw citasError;
        setCitas(data || []);

        if (role === "administrador") {
          const { data: cData, error: cErr } = await supabase
            .from("clientes")
            .select("id, nombre, correo")
            .eq("activo", true)
            .order("nombre");
          if (cErr) throw cErr;
          setClientes(cData || []);

          const { data: vData, error: vErr } = await supabase
            .from("vehiculos")
            .select("id, cliente_id, marca, modelo, placas")
            .eq("activo", true)
            .order("created_at", { ascending: false });
          if (vErr) throw vErr;
          setVehiculos(vData || []);
        }
      }

      // Siempre cargamos días inhábiles para que el calendario refleje bloqueos en gris.
      const { data: inhabilData, error: inhabilErr } = await supabase
        .from("dias_inhabiles")
        .select("id, fecha, motivo, activo")
        .eq("activo", true)
        .order("fecha", { ascending: true });

      if (inhabilErr) {
        // Si la tabla no existe en el entorno actual, no rompemos la pantalla.
        console.warn("No se pudieron cargar días inhábiles:", inhabilErr.message || inhabilErr);
        setDiasInhabiles([]);
      } else {
        setDiasInhabiles(inhabilData || []);
      }
    } catch (e) {
      setError(e.message || "No se pudieron cargar las citas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCitas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, clienteId]);

  useEffect(() => {
    if (isBlockedDate(form.fecha)) {
      setForm((prev) => ({ ...prev, fecha: nextSelectableDate() }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diasInhabiles]);

  const todayKey = todayWorkshopYmd();

  const upcomingCitas = useMemo(() => {
    const now = new Date();
    return (citas || []).filter((c) => new Date(c.fecha_hora) >= now && c.estado !== "cancelada");
  }, [citas]);

  const citasPorDia = useMemo(() => {
    const map = new Map();
    for (const c of citas) {
      const key = toWorkshopYmd(c.fecha_hora);
      map.set(key, (map.get(key) || 0) + 1);
    }
    return map;
  }, [citas]);

  const inhabilSet = useMemo(() => {
    const set = new Set();
    for (const d of diasInhabiles) set.add(d.fecha);
    return set;
  }, [diasInhabiles]);

  const vehiculosParaFormulario = useMemo(() => {
    if (role === "administrador") {
      if (!selectedClienteId) return [];
      return vehiculos.filter((v) => v.cliente_id === selectedClienteId);
    }
    return vehiculos;
  }, [vehiculos, role, selectedClienteId]);

  const citasPorFecha = useMemo(() => {
    const map = new Map();
    for (const cita of citas || []) {
      const key = toWorkshopYmd(cita.fecha_hora);
      const list = map.get(key) || [];
      list.push(cita);
      map.set(key, list);
    }

    for (const [key, list] of map.entries()) {
      list.sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));
      map.set(key, list);
    }

    return map;
  }, [citas]);

  const calendarRange = useMemo(() => {
    const start = new Date(monthDate);
    start.setHours(0, 0, 0, 0);

    if (calendarView === "day") {
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    if (calendarView === "week") {
      const weekStart = new Date(start);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      return { start: weekStart, end: weekEnd };
    }

    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);
    return { start: monthStart, end: monthEnd };
  }, [calendarView, monthDate]);

  const calendarCitas = useMemo(() => {
    return (citas || [])
      .filter((cita) => {
        const fecha = new Date(cita.fecha_hora);
        return fecha >= calendarRange.start && fecha <= calendarRange.end;
      })
      .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));
  }, [calendarRange, citas]);

  const calendarRangeCitas = useMemo(() => {
    return calendarCitas.filter((cita) => cita.estado !== "cancelada");
  }, [calendarCitas]);

  const calendarDates = useMemo(() => {
    if (calendarView === "day") return [new Date(monthDate)];

    if (calendarView === "week") {
      const start = new Date(monthDate);
      start.setDate(start.getDate() - start.getDay());
      start.setHours(0, 0, 0, 0);
      return Array.from({ length: 7 }, (_, index) => addDays(start, index));
    }

    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const first = new Date(year, month, 1);
    const startDay = first.getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const cells = [];

    for (let i = 0; i < startDay; i += 1) cells.push(null);
    for (let d = 1; d <= totalDays; d += 1) cells.push(new Date(year, month, d));
    return cells;
  }, [calendarView, monthDate]);

  const calendarTitle = useMemo(() => {
    if (calendarView === "day") {
      return formatDateWorkshop(monthDate, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }

    if (calendarView === "week") {
      const start = new Date(calendarRange.start);
      const end = new Date(calendarRange.end);
      return `${formatDateWorkshop(start, { day: "numeric", month: "short" })} - ${formatDateWorkshop(end, { day: "numeric", month: "short", year: "numeric" })}`;
    }

    return formatDateWorkshop(monthDate, { month: "long", year: "numeric" });
  }, [calendarRange.end, calendarRange.start, calendarView, monthDate]);

  const calendarDayBg = (dateObj) => {
    if (!dateObj) return "";
    const key = ymd(dateObj);
    if (!isBlockedDate(key)) return darkMode ? "bg-[#17171f] border-zinc-800" : "bg-gray-50 border-gray-200";
    return darkMode ? "bg-zinc-700 border-zinc-600" : "bg-gray-200 border-gray-300";
  };

  const shiftCalendar = (direction) => {
    setMonthDate((current) => {
      const next = new Date(current);
      if (calendarView === "day") {
        next.setDate(next.getDate() + direction);
      } else if (calendarView === "week") {
        next.setDate(next.getDate() + direction * 7);
      } else {
        next.setMonth(next.getMonth() + direction);
      }
      return next;
    });
  };

  const managedList = useMemo(() => {
    if (!canManage) return [];
    const now = new Date();
    const today = toWorkshopYmd(now);
    const plus7 = new Date(now);
    plus7.setDate(plus7.getDate() + 7);

    return (citas || []).filter((c) => {
      const cDate = new Date(c.fecha_hora);
      const cKey = toWorkshopYmd(c.fecha_hora);
      if (filterMode === "hoy") return cKey === today;
      if (filterMode === "7dias") return cDate >= now && cDate <= plus7;
      if (inhabilSet.has(filterDate)) return false;
      return cKey === filterDate;
    });
  }, [canManage, citas, filterMode, filterDate, inhabilSet]);

  const handleFilterDateChange = (value) => {
    if (inhabilSet.has(value)) {
      setError("Ese día está catalogado como inhábil y no se puede usar para búsqueda de citas.");
      return;
    }
    setError("");
    setFilterDate(value);
  };

  const handleFormDateChange = (value) => {
    if (!value) {
      setForm((prev) => ({ ...prev, fecha: value }));
      return;
    }

    if (isBlockedDate(value)) {
      setError(isSunday(value) ? "Los domingos están bloqueados para agendar citas." : "Ese día está marcado como inhábil y no se puede seleccionar.");
      return;
    }

    setError("");
    setForm((prev) => ({ ...prev, fecha: value }));
  };

  const handleAgendar = async () => {
    setSaving(true);
    setError("");
    try {
      if (!form.vehiculo_id) throw new Error("Selecciona un vehículo.");
      if (role === "administrador" && !form.cliente_id) throw new Error("Selecciona un cliente.");
      if (isBlockedDate(form.fecha)) {
        throw new Error(isSunday(form.fecha) ? "Los domingos no están disponibles para agendar citas." : "El día seleccionado está marcado como inhábil.");
      }
      if (!isValidSlot(form.fecha, form.hora)) {
        throw new Error("Horario inválido. Usa lunes a viernes 9:00-14:00 y 17:00-20:00, o sábado 9:00-14:00.");
      }

      const { data, error: invokeError } = await supabase.functions.invoke("agendar-cita", {
        body: {
          fecha: form.fecha,
          hora: form.hora,
          cliente_id: role === "administrador" ? form.cliente_id : null,
          vehiculo_id: form.vehiculo_id,
          servicio: form.servicio,
          notas: form.notas || null,
        },
      });

      if (invokeError) {
        const message = await getFunctionErrorMessage(invokeError, "No se pudo agendar la cita.");
        throw new Error(message);
      }
      if (!data?.success) throw new Error(data?.error || "No se pudo agendar la cita.");

      setModalOpen(false);
      setForm((prev) => ({ ...prev, notas: "", vehiculo_id: "", fecha: nextSelectableDate() }));
      await fetchCitas();
    } catch (e) {
      setError(e.message || "No se pudo agendar la cita.");
    } finally {
      setSaving(false);
    }
  };

  const handleResolver = async (citaId, accion) => {
    setSaving(true);
    setError("");
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("resolver-cita", {
        body: { cita_id: citaId, accion },
      });

      if (invokeError) {
        const message = await getFunctionErrorMessage(invokeError, "No se pudo procesar la cita.");
        throw new Error(message);
      }
      if (!data?.success) throw new Error(data?.error || "No se pudo procesar la cita.");

      await fetchCitas();
    } catch (e) {
      setError(e.message || "No se pudo procesar la cita.");
    } finally {
      setSaving(false);
    }
  };

  const handleCrearDiaInhabil = async () => {
    setSaving(true);
    setError("");
    try {
      if (!inhabilForm.fecha) throw new Error("Selecciona una fecha.");
      const { data, error: invokeError } = await supabase.functions.invoke("crear-dia-inhabil", {
        body: {
          fecha: inhabilForm.fecha,
          motivo: inhabilForm.motivo || null,
        },
      });
      if (invokeError) {
        const message = await getFunctionErrorMessage(invokeError, "No se pudo guardar el día inhábil.");
        throw new Error(message);
      }
      if (!data?.success) throw new Error(data?.error || "No se pudo guardar el día inhábil.");
      setInhabilOpen(false);
      setInhabilForm({ fecha: ymd(new Date()), motivo: "" });
      await fetchCitas();
    } catch (e) {
      setError(e.message || "No se pudo guardar el día inhábil.");
    } finally {
      setSaving(false);
    }
  };

  const t = darkMode ? "text-zinc-100" : "text-gray-800";
  const st = darkMode ? "text-zinc-500" : "text-gray-500";

  return (
    <div className={`flex-1 p-4 md:p-6 min-h-full ${darkMode ? "bg-[#16161e]" : "bg-gray-50"}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className={`text-lg font-semibold ${t}`}>Citas</h2>
          <p className={`text-xs ${st}`}>{upcomingCitas.length} próximas</p>
        </div>
        <div className="flex gap-2">
          {(role === "cliente" || role === "administrador") && (
            <button
              onClick={() => setModalOpen(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ backgroundColor: "#60aebb" }}
            >
              Agendar cita
            </button>
          )}
          {role === "administrador" && (
            <button
              onClick={() => setInhabilOpen(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-amber-600 hover:bg-amber-700"
            >
              Agregar día inhábil
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded border border-red-300 bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className={`xl:col-span-2 rounded-xl border ${darkMode ? "bg-[#1e1e28] border-zinc-800" : "bg-white border-gray-200"}`}>
          <div className={`px-4 py-3 border-b ${darkMode ? "border-zinc-800" : "border-gray-200"}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  className={`px-2 py-1 rounded ${darkMode ? "text-zinc-400 hover:bg-zinc-800" : "text-gray-600 hover:bg-gray-100"}`}
                  onClick={() => shiftCalendar(-1)}
                >
                  ←
                </button>
                <p className={`text-sm font-semibold ${t}`}>{calendarTitle}</p>
                <button
                  className={`px-2 py-1 rounded ${darkMode ? "text-zinc-400 hover:bg-zinc-800" : "text-gray-600 hover:bg-gray-100"}`}
                  onClick={() => shiftCalendar(1)}
                >
                  →
                </button>
              </div>

              {canManage && (
                <div className="flex gap-2">
                  <button onClick={() => setCalendarView("day")} className={`px-3 py-1.5 rounded text-xs border ${calendarView === "day" ? "bg-sky-600 text-white border-sky-600" : darkMode ? "border-zinc-700 text-zinc-400" : "border-gray-300 text-gray-600"}`}>Día</button>
                  <button onClick={() => setCalendarView("week")} className={`px-3 py-1.5 rounded text-xs border ${calendarView === "week" ? "bg-sky-600 text-white border-sky-600" : darkMode ? "border-zinc-700 text-zinc-400" : "border-gray-300 text-gray-600"}`}>Semana</button>
                  <button onClick={() => setCalendarView("month")} className={`px-3 py-1.5 rounded text-xs border ${calendarView === "month" ? "bg-sky-600 text-white border-sky-600" : darkMode ? "border-zinc-700 text-zinc-400" : "border-gray-300 text-gray-600"}`}>Mes</button>
                </div>
              )}
            </div>
          </div>

          <div className="p-4">
            {calendarView === "month" ? (
              <>
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {["D", "L", "M", "M", "J", "V", "S"].map((d, idx) => (
                    <div key={`${d}-${idx}`} className={`text-center text-xs font-semibold ${st}`}>{d}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {calendarDates.map((dateObj, idx) => {
                    if (!dateObj) return <div key={`empty-${idx}`} className="min-h-24" />;
                    const key = ymd(dateObj);
                    const count = citasPorDia.get(key) || 0;
                    const isToday = key === todayKey;
                    const citasDelDia = (citasPorFecha.get(key) || []).filter((cita) => cita.estado !== "cancelada");
                    const visibleItems = citasDelDia.slice(0, 2);
                    return (
                      <div
                        key={key}
                        className={`min-h-24 rounded-lg border p-1.5 ${calendarDayBg(dateObj)}`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <p className={`text-xs font-semibold ${isToday ? "text-sky-500" : t}`}>{dateObj.getDate()}</p>
                          {count > 0 && <span className="text-[10px] text-emerald-500 font-medium">{count}</span>}
                        </div>
                        <div className="mt-1 space-y-1">
                          {visibleItems.map((cita) => (
                            <div key={cita.id} className={`text-[10px] leading-tight rounded px-1.5 py-1 border ${calendarStatusClasses(cita.estado, darkMode)}`}>
                              <span className="font-semibold">{formatHm(cita.fecha_hora)}</span> {cita.motivo || "Servicio"}
                            </div>
                          ))}
                          {citasDelDia.length > visibleItems.length && (
                            <p className={`text-[10px] ${st}`}>+{citasDelDia.length - visibleItems.length} más</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : calendarView === "week" ? (
              <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
                {calendarDates.map((dateObj) => {
                  const key = ymd(dateObj);
                  const citasDelDia = (citasPorFecha.get(key) || []).filter((cita) => cita.estado !== "cancelada");
                  return (
                    <div key={key} className={`rounded-lg border p-2 ${calendarDayBg(dateObj)}`}>
                      <p className={`text-xs font-semibold ${key === todayKey ? "text-sky-500" : t}`}>
                        {formatDateWorkshop(dateObj, { weekday: "short", day: "numeric" })}
                      </p>
                      <div className="mt-2 space-y-1.5 max-h-56 overflow-y-auto">
                        {citasDelDia.length === 0 ? (
                          <p className={`text-[10px] ${st}`}>Sin citas</p>
                        ) : (
                          citasDelDia.map((cita) => (
                            <div key={cita.id} className={`rounded px-2 py-1 text-[10px] border ${calendarStatusClasses(cita.estado, darkMode)}`}>
                              <p className="font-semibold">{formatHm(cita.fecha_hora)}</p>
                              <p>{cita.motivo || "Servicio"}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={`rounded-lg border p-3 ${calendarDayBg(monthDate)}`}>
                <div className="space-y-2">
                  {calendarRangeCitas.length === 0 ? (
                    <p className={`text-sm ${st}`}>No hay citas en este día.</p>
                  ) : (
                    calendarRangeCitas.map((cita) => (
                      <div key={cita.id} className={`rounded-lg border px-3 py-2 ${darkMode ? "border-zinc-800 bg-[#1d1d26]" : "border-gray-200 bg-white"}`}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className={`text-sm font-semibold ${t}`}>{formatHm(cita.fecha_hora)} · {cita.motivo || "Servicio"}</p>
                            <p className={`text-xs ${st}`}>{cita.clientes?.nombre || "Cliente"}{cita.vehiculos ? ` · ${cita.vehiculos.marca} ${cita.vehiculos.modelo} · ${cita.vehiculos.placas}` : ""}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-xs border ${estadoBadge(cita.estado, darkMode)}`}>{cita.estado}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={`rounded-xl border ${darkMode ? "bg-[#1e1e28] border-zinc-800" : "bg-white border-gray-200"}`}>
          <div className={`px-4 py-3 border-b ${darkMode ? "border-zinc-800" : "border-gray-200"}`}>
            <h3 className={`text-sm font-semibold ${t}`}>Próximas citas</h3>
          </div>
          <div className="p-3 max-h-[380px] overflow-y-auto">
            {loading ? (
              <p className={`text-sm ${st}`}>Cargando…</p>
            ) : upcomingCitas.length === 0 ? (
              <p className={`text-sm ${st}`}>Sin citas próximas.</p>
            ) : (
              <div className="space-y-2">
                {upcomingCitas.slice(0, 8).map((c) => (
                  <div key={c.id} className={`rounded-lg border p-2 ${darkMode ? "border-zinc-800" : "border-gray-200"}`}>
                    <p className={`text-sm font-semibold ${t}`}>{c.motivo || "Servicio"}</p>
                    <p className={`text-xs ${st}`}>{formatDateTimeWorkshop(c.fecha_hora)}</p>
                    <span className={`mt-1 inline-block px-2 py-0.5 text-xs rounded border ${estadoBadge(c.estado, darkMode)}`}>{c.estado}</span>
                    {canManage && c.estado === "pendiente" && (
                      <div className="mt-2 flex gap-2">
                        <button
                          disabled={saving}
                          onClick={() => handleResolver(c.id, "aceptar")}
                          className="px-2.5 py-1 rounded text-xs bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50"
                        >
                          {role === "administrador" ? "Validar cita" : "Aceptar"}
                        </button>
                        <button
                          disabled={saving}
                          onClick={() => handleResolver(c.id, "rechazar")}
                          className="px-2.5 py-1 rounded text-xs bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          Rechazar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {canManage && (
        <div className={`mt-5 rounded-xl border ${darkMode ? "bg-[#1e1e28] border-zinc-800" : "bg-white border-gray-200"}`}>
          <div className={`px-4 py-3 border-b ${darkMode ? "border-zinc-800" : "border-gray-200"}`}>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => setFilterMode("hoy")} className={`px-3 py-1.5 rounded text-xs border ${filterMode === "hoy" ? "bg-sky-600 text-white border-sky-600" : darkMode ? "border-zinc-700 text-zinc-400" : "border-gray-300 text-gray-600"}`}>Hoy</button>
              <button onClick={() => setFilterMode("7dias")} className={`px-3 py-1.5 rounded text-xs border ${filterMode === "7dias" ? "bg-sky-600 text-white border-sky-600" : darkMode ? "border-zinc-700 text-zinc-400" : "border-gray-300 text-gray-600"}`}>Siguientes 7 días</button>
              <button onClick={() => setFilterMode("fecha")} className={`px-3 py-1.5 rounded text-xs border ${filterMode === "fecha" ? "bg-sky-600 text-white border-sky-600" : darkMode ? "border-zinc-700 text-zinc-400" : "border-gray-300 text-gray-600"}`}>Día específico</button>
              {filterMode === "fecha" && (
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => handleFilterDateChange(e.target.value)}
                  className={`ml-auto px-2 py-1.5 rounded text-xs border ${darkMode ? "bg-[#2a2a35] border-zinc-700 text-zinc-300" : "bg-white border-gray-300 text-gray-700"}`}
                />
              )}
            </div>
          </div>

          <div className="p-3 overflow-x-auto">
            {managedList.length === 0 ? (
              <p className={`text-sm ${st}`}>No hay citas para este filtro.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className={darkMode ? "text-zinc-500" : "text-gray-500"}>
                    <th className="text-left py-2">Fecha</th>
                    <th className="text-left py-2">Cliente</th>
                    <th className="text-left py-2">Vehículo</th>
                    <th className="text-left py-2">Servicio</th>
                    <th className="text-left py-2">Estado</th>
                    <th className="text-right py-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {managedList.map((c) => (
                    <tr key={c.id} className={darkMode ? "border-t border-zinc-800" : "border-t border-gray-200"}>
                      <td className={`py-2 ${t}`}>{formatDateTimeWorkshop(c.fecha_hora)}</td>
                      <td className={t}>{c.clientes?.nombre || "—"}</td>
                      <td className={st}>{c.vehiculos ? `${c.vehiculos.marca} ${c.vehiculos.modelo} · ${c.vehiculos.placas}` : "—"}</td>
                      <td className={t}>{c.motivo || "—"}</td>
                      <td>
                        <span className={`inline-block px-2 py-0.5 rounded text-xs border ${estadoBadge(c.estado, darkMode)}`}>{c.estado}</span>
                      </td>
                      <td className="text-right">
                        {c.estado === "pendiente" ? (
                          <div className="inline-flex gap-2">
                            {role === "administrador" ? (
                              <button
                                disabled={saving}
                                onClick={() => handleResolver(c.id, "aceptar")}
                                className="px-2.5 py-1 rounded text-xs bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50"
                              >
                                Validar cita
                              </button>
                            ) : (
                              <button
                                disabled={saving}
                                onClick={() => handleResolver(c.id, "aceptar")}
                                className="px-2.5 py-1 rounded text-xs bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                              >
                                Aceptar
                              </button>
                            )}
                            <button
                              disabled={saving}
                              onClick={() => handleResolver(c.id, "rechazar")}
                              className="px-2.5 py-1 rounded text-xs bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                            >
                              Rechazar
                            </button>
                          </div>
                        ) : (
                          <span className={st}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} darkMode={darkMode} title="Agendar cita">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={`text-xs font-semibold ${st}`}>Día</label>
            <input
              type="date"
              min={todayKey}
              value={form.fecha}
              onChange={(e) => handleFormDateChange(e.target.value)}
              className={`mt-1 w-full px-3 py-2 rounded border text-sm ${darkMode ? "bg-[#2a2a35] border-zinc-700 text-zinc-100" : "bg-white border-gray-300 text-gray-700"}`}
            />
            <p className={`mt-1 text-[11px] ${st}`}>No se pueden seleccionar domingos ni días inhábiles.</p>
          </div>
          <div>
            <label className={`text-xs font-semibold ${st}`}>Hora</label>
            <input
              type="time"
              step="1800"
              value={form.hora}
              onChange={(e) => setForm({ ...form, hora: e.target.value })}
              className={`mt-1 w-full px-3 py-2 rounded border text-sm ${darkMode ? "bg-[#2a2a35] border-zinc-700 text-zinc-100" : "bg-white border-gray-300 text-gray-700"}`}
            />
          </div>
          {role === "administrador" && (
            <div>
              <label className={`text-xs font-semibold ${st}`}>Cliente</label>
              <select
                value={form.cliente_id}
                onChange={(e) => setForm({ ...form, cliente_id: e.target.value, vehiculo_id: "" })}
                className={`mt-1 w-full px-3 py-2 rounded border text-sm ${darkMode ? "bg-[#2a2a35] border-zinc-700 text-zinc-100" : "bg-white border-gray-300 text-gray-700"}`}
              >
                <option value="">Selecciona un cliente</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre} · {c.correo || "sin correo"}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className={`text-xs font-semibold ${st}`}>Vehículo</label>
            <select
              value={form.vehiculo_id}
              onChange={(e) => setForm({ ...form, vehiculo_id: e.target.value })}
              className={`mt-1 w-full px-3 py-2 rounded border text-sm ${darkMode ? "bg-[#2a2a35] border-zinc-700 text-zinc-100" : "bg-white border-gray-300 text-gray-700"}`}
            >
              <option value="">Selecciona un vehículo</option>
              {vehiculosParaFormulario.map((v) => (
                <option key={v.id} value={v.id}>{v.marca} {v.modelo} · {v.placas}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={`text-xs font-semibold ${st}`}>Tipo de servicio</label>
            <select
              value={form.servicio}
              onChange={(e) => setForm({ ...form, servicio: e.target.value })}
              className={`mt-1 w-full px-3 py-2 rounded border text-sm ${darkMode ? "bg-[#2a2a35] border-zinc-700 text-zinc-100" : "bg-white border-gray-300 text-gray-700"}`}
            >
              {SERVICIOS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={`text-xs font-semibold ${st}`}>Notas (opcional)</label>
            <textarea
              rows={3}
              value={form.notas}
              onChange={(e) => setForm({ ...form, notas: e.target.value })}
              className={`mt-1 w-full px-3 py-2 rounded border text-sm ${darkMode ? "bg-[#2a2a35] border-zinc-700 text-zinc-100" : "bg-white border-gray-300 text-gray-700"}`}
            />
          </div>
        </div>

        <div className="mt-4 text-xs text-amber-600">
          Horarios válidos: lunes a viernes de 9:00 a 14:00 y 17:00 a 20:00; sábado de 9:00 a 14:00. Domingos y días inhábiles están bloqueados.
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={() => setModalOpen(false)}
            className={`flex-1 px-4 py-2 rounded border text-sm ${darkMode ? "border-zinc-700 text-zinc-300" : "border-gray-300 text-gray-700"}`}
          >
            Cancelar
          </button>
          <button
            onClick={handleAgendar}
            disabled={saving}
            className="flex-1 px-4 py-2 rounded text-sm text-white bg-[#60aebb] hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Agendar cita"}
          </button>
        </div>
      </Modal>

      <Modal open={inhabilOpen} onClose={() => setInhabilOpen(false)} darkMode={darkMode} title="Agregar día inhábil">
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className={`text-xs font-semibold ${st}`}>Fecha</label>
            <input
              type="date"
              min={todayKey}
              value={inhabilForm.fecha}
              onChange={(e) => setInhabilForm({ ...inhabilForm, fecha: e.target.value })}
              className={`mt-1 w-full px-3 py-2 rounded border text-sm ${darkMode ? "bg-[#2a2a35] border-zinc-700 text-zinc-100" : "bg-white border-gray-300 text-gray-700"}`}
            />
          </div>
          <div>
            <label className={`text-xs font-semibold ${st}`}>Motivo (opcional)</label>
            <input
              type="text"
              value={inhabilForm.motivo}
              onChange={(e) => setInhabilForm({ ...inhabilForm, motivo: e.target.value })}
              className={`mt-1 w-full px-3 py-2 rounded border text-sm ${darkMode ? "bg-[#2a2a35] border-zinc-700 text-zinc-100" : "bg-white border-gray-300 text-gray-700"}`}
              placeholder="Festivo, mantenimiento, etc."
            />
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <button
            onClick={() => setInhabilOpen(false)}
            className={`flex-1 px-4 py-2 rounded border text-sm ${darkMode ? "border-zinc-700 text-zinc-300" : "border-gray-300 text-gray-700"}`}
          >
            Cancelar
          </button>
          <button
            onClick={handleCrearDiaInhabil}
            disabled={saving}
            className="flex-1 px-4 py-2 rounded text-sm text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
