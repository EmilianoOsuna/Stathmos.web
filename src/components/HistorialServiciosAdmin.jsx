import { useState, useEffect, useCallback, useRef } from "react";
import supabase from "../supabase";
import useSupabaseRealtime from "../hooks/useSupabaseRealtime";
import { formatDateWorkshop, formatDateTimeWorkshop } from "../utils/datetime";
import { Icon, Input, Select, Button, DatePicker } from "./UIPrimitives";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function HistorialServiciosAdmin({
  darkMode = false,
  initialSearchTerm = "",
  initialSearchType = "cliente",
  initialEstado = "todos",
  initialFechaInicio = "",
  initialFechaFin = "",
}) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [searchType, setSearchType] = useState(initialSearchType);
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedServicio, setExpandedServicio] = useState(null);
  const [fotos, setFotos] = useState({});
  const [loadingFotos, setLoadingFotos] = useState({});
  const [filtroEstado, setFiltroEstado] = useState(initialEstado);
  const [fechaInicio, setFechaInicio] = useState(initialFechaInicio);
  const [fechaFin, setFechaFin] = useState(initialFechaFin);
  const [generandoPDF, setGenerandoPDF] = useState({});
  const detailRef = useRef(null);

  // Sync with parent filters
  useEffect(() => { setSearchTerm(initialSearchTerm); }, [initialSearchTerm]);
  useEffect(() => { setSearchType(initialSearchType); }, [initialSearchType]);
  useEffect(() => { setFiltroEstado(initialEstado); }, [initialEstado]);
  useEffect(() => { setFechaInicio(initialFechaInicio); }, [initialFechaInicio]);
  useEffect(() => { setFechaFin(initialFechaFin); }, [initialFechaFin]);

  // Estados para modal de fotos
  const [lightbox, setLightbox] = useState(null);

  // Realtime
  const [rtTick, setRtTick] = useState(0);
  useSupabaseRealtime("proyectos", () => setRtTick(t => t + 1));
  useSupabaseRealtime("fotografias", () => setRtTick(t => t + 1));

  const fetchAllServicios = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("proyectos").select(`
        id, titulo, descripcion, observaciones, estado,
        fecha_ingreso, fecha_cierre, fecha_aprobacion,
        mecanico_id, cliente_id, vehiculo_id,
        empleados ( nombre ),
        clientes ( id, nombre, correo, telefono, rfc, direccion ),
        vehiculos ( id, marca, modelo, anio, placas, color, vin ),
        cotizaciones (
          id, estado, notas, created_at, fecha_emision,
          monto_mano_obra, monto_refacc, monto_total,
          cotizacion_items ( id, descripcion, tipo, cantidad, precio_unit, subtotal )
        ),
        diagnosticos (
          id, tipo, tipo_operacion, sintomas, descripcion, causa_raiz, created_at,
          empleados ( nombre )
        ),
        proyecto_refacciones (
          id, cantidad, precio_unitario, fue_usada,
          refacciones ( nombre, numero_parte )
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
              id, titulo, descripcion, observaciones, estado, fecha_ingreso, fecha_cierre, fecha_aprobacion, mecanico_id, cliente_id, vehiculo_id,
              empleados (nombre),
              clientes (id, nombre, correo, telefono, rfc, direccion),
              vehiculos (id, marca, modelo, anio, placas, color, vin),
              cotizaciones (id, estado, notas, created_at, fecha_emision, monto_mano_obra, monto_refacc, monto_total,
                cotizacion_items (id, descripcion, tipo, cantidad, precio_unit, subtotal)),
              diagnosticos (id, tipo, tipo_operacion, sintomas, descripcion, causa_raiz, created_at, empleados (nombre)), proyecto_refacciones (id, cantidad, precio_unitario, fue_usada, refacciones (nombre, numero_parte))
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
              id, titulo, descripcion, observaciones, estado, fecha_ingreso, fecha_cierre, fecha_aprobacion, mecanico_id, cliente_id, vehiculo_id,
              empleados (nombre),
              clientes (id, nombre, correo, telefono, rfc, direccion),
              vehiculos (id, marca, modelo, anio, placas, color, vin),
              cotizaciones (id, estado, notas, created_at, fecha_emision, monto_mano_obra, monto_refacc, monto_total,
                cotizacion_items (id, descripcion, tipo, cantidad, precio_unit, subtotal)),
              diagnosticos (id, tipo, tipo_operacion, sintomas, descripcion, causa_raiz, created_at, empleados (nombre)), proyecto_refacciones (id, cantidad, precio_unitario, fue_usada, refacciones (nombre, numero_parte))
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
              id, titulo, descripcion, observaciones, estado, fecha_ingreso, fecha_cierre, fecha_aprobacion, mecanico_id, cliente_id, vehiculo_id,
              empleados (nombre),
              clientes (id, nombre, correo, telefono, rfc, direccion),
              vehiculos (id, marca, modelo, anio, placas, color, vin),
              cotizaciones (id, estado, notas, created_at, fecha_emision, monto_mano_obra, monto_refacc, monto_total,
                cotizacion_items (id, descripcion, tipo, cantidad, precio_unit, subtotal)),
              diagnosticos (id, tipo, tipo_operacion, sintomas, descripcion, causa_raiz, created_at, empleados (nombre)), proyecto_refacciones (id, cantidad, precio_unitario, fue_usada, refacciones (nombre, numero_parte))
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
    const container = document.createElement("div");
    container.style.cssText = `
      width: 794px;
      background: #ffffff;
      font-family: Arial, sans-serif;
      color: #1a1a2e;
      position: fixed;
      top: -9999px;
      left: -9999px;
    `;

    const hoy = new Date().toLocaleDateString("es-MX", {
      day: "numeric", month: "long", year: "numeric",
    });

    const cotizacionesOrdenadas = Array.isArray(servicio.cotizaciones)
      ? [...servicio.cotizaciones].sort(
          (a, b) =>
            new Date(a?.created_at || a?.fecha_emision || 0).getTime() -
            new Date(b?.created_at || b?.fecha_emision || 0).getTime()
        )
      : [];
    const cotizacionInicial = cotizacionesOrdenadas[0] || null;
    const cotizacionFinal = cotizacionesOrdenadas[cotizacionesOrdenadas.length - 1] || null;
    const utilidadColor = "#059669";

    const diagnosticoInicial = Array.isArray(servicio.diagnosticos)
      ? servicio.diagnosticos.find((d) => d.tipo === "inicial")
      : null;

    const diagnosticoFinal = Array.isArray(servicio.diagnosticos)
      ? [...servicio.diagnosticos]
          .filter((d) => d.tipo === "final")
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] || null
      : null;

    // Diagnósticos finales
    const observacionesRows = Array.isArray(servicio.diagnosticos)
      ? servicio.diagnosticos
          .filter((d) => d.tipo === "final")
          .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
          .map((obs, idx) => `
            <div style="margin-bottom: 12px; padding: 14px; border-radius: 8px; border: 1px solid #e5e7eb; background: #f8f9fa;">
              <p style="font-size: 10px; color: #6b7280; margin: 0 0 6px; font-family: Arial, sans-serif; text-transform: uppercase; letter-spacing: 1px;">Observación ${idx + 1}</p>
              <p style="font-size: 12px; color: #1a1a2e; margin: 0 0 6px; white-space: pre-wrap; font-family: Arial, sans-serif;">${cleanHallazgosText(obs.hallazgos || "") || "Sin contenido"}</p>
              <p style="font-size: 10px; color: #9ca3af; margin: 0; font-family: Arial, sans-serif;">
                ${obs.empleados?.nombre ? `Registrado por ${obs.empleados.nombre}` : ""}
                ${obs.created_at ? ` • ${new Date(obs.created_at).toLocaleDateString("es-MX")}` : ""}
              </p>
            </div>
          `).join("")
      : "";

    const diagnosticoInicialRow = diagnosticoInicial
      ? `
        <div style="margin-bottom: 32px;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 14px;">
            <div style="width: 3px; height: 18px; background: #3b82f6; border-radius: 2px;"></div>
            <h2 style="font-size: 14px; letter-spacing: 1px; text-transform: uppercase; color: #1a1a2e; margin: 0; font-family: Arial, sans-serif;">Diagnóstico Inicial</h2>
          </div>
          <div style="background: #f8f9fa; border-radius: 10px; padding: 16px 20px; border: 1px solid #e5e7eb;">
            ${diagnosticoInicial.tipo_operacion ? `<p style="font-size: 11px; color: #6b7280; margin: 0 0 8px; font-family: Arial, sans-serif;">Tipo: <strong>${String(diagnosticoInicial.tipo_operacion).replace(/_/g, " ")}</strong></p>` : ""}
            ${diagnosticoInicial.sintomas ? `<p style="font-size: 12px; color: #1a1a2e; margin: 0 0 8px; white-space: pre-wrap; font-family: Arial, sans-serif;"><strong>Síntomas:</strong> ${diagnosticoInicial.sintomas}</p>` : ""}
            ${diagnosticoInicial.descripcion ? `<p style="font-size: 12px; color: #1a1a2e; margin: 0 0 8px; white-space: pre-wrap; font-family: Arial, sans-serif;"><strong>Descripción:</strong> ${diagnosticoInicial.descripcion}</p>` : ""}
            ${diagnosticoInicial.causa_raiz ? `<p style="font-size: 12px; color: #1a1a2e; margin: 0; white-space: pre-wrap; font-family: Arial, sans-serif;"><strong>Causa raíz:</strong> ${diagnosticoInicial.causa_raiz}</p>` : ""}
          </div>
        </div>
      `
      : `
        <div style="margin-bottom: 32px;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 14px;">
            <div style="width: 3px; height: 18px; background: #3b82f6; border-radius: 2px;"></div>
            <h2 style="font-size: 14px; letter-spacing: 1px; text-transform: uppercase; color: #1a1a2e; margin: 0; font-family: Arial, sans-serif;">Diagnóstico Inicial</h2>
          </div>
          <div style="background: #f8f9fa; border-radius: 10px; padding: 16px 20px; border: 1px solid #e5e7eb; text-align: center;">
            <p style="font-size: 12px; color: #9ca3af; margin: 0; font-family: Arial, sans-serif;">Sin diagnóstico inicial registrado</p>
          </div>
        </div>
      `;

    const diagnosticoFinalRow = diagnosticoFinal
      ? `
        <div style="margin-bottom: 32px;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 14px;">
            <div style="width: 3px; height: 18px; background: #8b5cf6; border-radius: 2px;"></div>
            <h2 style="font-size: 14px; letter-spacing: 1px; text-transform: uppercase; color: #1a1a2e; margin: 0; font-family: Arial, sans-serif;">Diagnóstico Final</h2>
          </div>
          <div style="background: #f8f9fa; border-radius: 10px; padding: 16px 20px; border: 1px solid #e5e7eb;">
            ${diagnosticoFinal.sintomas ? `<p style="font-size: 12px; color: #1a1a2e; margin: 0 0 8px; white-space: pre-wrap; font-family: Arial, sans-serif;"><strong>Síntomas:</strong> ${diagnosticoFinal.sintomas}</p>` : ""}
            ${diagnosticoFinal.descripcion ? `<p style="font-size: 12px; color: #1a1a2e; margin: 0 0 8px; white-space: pre-wrap; font-family: Arial, sans-serif;"><strong>Descripción:</strong> ${diagnosticoFinal.descripcion}</p>` : ""}
            ${diagnosticoFinal.causa_raiz ? `<p style="font-size: 12px; color: #1a1a2e; margin: 0; white-space: pre-wrap; font-family: Arial, sans-serif;"><strong>Causa raíz:</strong> ${diagnosticoFinal.causa_raiz}</p>` : ""}
          </div>
        </div>
      `
      : "";

    const renderCotizacionPdf = (cot, label) => {
      if (!cot) return "";

      const cotItemsRows = Array.isArray(cot.cotizacion_items)
        ? cot.cotizacion_items.map((item, i) => `
            <tr style="background: ${i % 2 === 0 ? "#f8f9fa" : "#ffffff"};">
              <td style="padding: 9px 14px; font-size: 12px; color: #1a1a2e; font-family: Arial, sans-serif;">${item.descripcion}</td>
              <td style="padding: 9px 14px; font-size: 12px; color: #555; font-family: Arial, sans-serif; text-align: center;">${item.cantidad}</td>
              <td style="padding: 9px 14px; font-size: 12px; color: #555; font-family: Arial, sans-serif; text-align: right;">$${parseFloat(item.precio_unit || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
              <td style="padding: 9px 14px; font-size: 12px; font-weight: bold; color: #1e40af; font-family: Arial, sans-serif; text-align: right;">$${parseFloat(item.subtotal || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
            </tr>
          `).join("")
        : `<tr><td colspan="4" style="padding: 14px; text-align: center; color: #9ca3af; font-family: Arial, sans-serif; font-size: 12px;">Sin items registrados</td></tr>`;

      const badgeBg = cot.estado === "aprobada" ? "#d1fae5" : cot.estado === "rechazada" ? "#fee2e2" : "#fef3c7";
      const badgeColor = cot.estado === "aprobada" ? "#065f46" : cot.estado === "rechazada" ? "#991b1b" : "#92400e";

      return `
        <div style="margin-bottom: 18px;">
          <div style="display: flex; align-items: center; margin-bottom: 10px; gap: 8px;">
            <p style="font-size: 12px; font-weight: bold; color: #1a1a2e; margin: 0; font-family: Arial, sans-serif;">${label}</p>
            <span style="font-size: 10px; color: #6b7280; font-family: Arial, sans-serif;">• ${new Date(cot.fecha_emision || cot.created_at).toLocaleDateString("es-MX")}</span>
            <span style="margin-left: auto; font-size: 11px; background: ${badgeBg}; color: ${badgeColor}; padding: 3px 10px; border-radius: 20px; font-family: Arial, sans-serif; font-weight: bold;">
              ${cot.estado?.toUpperCase() || "PENDIENTE"}
            </span>
          </div>
          <table style="width: 100%; border-collapse: collapse; border-radius: 10px; overflow: hidden; border: 1px solid #e5e7eb;">
            <thead>
              <tr style="background: #1a1a2e;">
                <th style="padding: 11px 14px; text-align: left; font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: #94a3b8; font-family: Arial, sans-serif;">Descripción</th>
                <th style="padding: 11px 14px; text-align: center; font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: #94a3b8; font-family: Arial, sans-serif;">Cant.</th>
                <th style="padding: 11px 14px; text-align: right; font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: #94a3b8; font-family: Arial, sans-serif;">P. Unit</th>
                <th style="padding: 11px 14px; text-align: right; font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: #94a3b8; font-family: Arial, sans-serif;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${cotItemsRows}
            </tbody>
          </table>
          <div style="background: #f8f9fa; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none; padding: 16px 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span style="font-size: 12px; color: #6b7280; font-family: Arial, sans-serif;">Mano de obra</span>
              <span style="font-size: 12px; color: #374151; font-family: Arial, sans-serif;">$${parseFloat(cot.monto_mano_obra || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="font-size: 12px; color: #6b7280; font-family: Arial, sans-serif;">Refacciones</span>
              <span style="font-size: 12px; color: #374151; font-family: Arial, sans-serif;">$${parseFloat(cot.monto_refacc || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding-top: 10px; border-top: 1px dashed #d1d5db;">
              <span style="font-size: 14px; font-weight: bold; color: #1a1a2e; font-family: Arial, sans-serif;">Total</span>
              <span style="font-size: 20px; font-weight: bold; color: #059669; font-family: Arial, sans-serif;">$${parseFloat(cot.monto_total || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      `;
    };

    const estadoLabel = servicio.estado.replace(/_/g, " ").toUpperCase();
    const estadoColors = {
      activo: { bg: "#e0f2fe", color: "#0369a1" },
      en_progreso: { bg: "#dbeafe", color: "#1d4ed8" },
      terminado: { bg: "#d1fae5", color: "#065f46" },
      entregado: { bg: "#ccfbf1", color: "#0f766e" },
      cancelado: { bg: "#f3f4f6", color: "#6b7280" },
    };
    const ec = estadoColors[servicio.estado] || { bg: "#f3f4f6", color: "#6b7280" };

    container.innerHTML = `
      <!-- ENCABEZADO -->
      <div style="background: #1a1a2e; padding: 40px 50px 32px; position: relative; overflow: hidden;">
        <div style="position: absolute; top: -30px; right: -30px; width: 180px; height: 180px; border-radius: 50%; background: rgba(59,130,246,0.12);"></div>
        <div style="position: absolute; bottom: -20px; left: 200px; width: 100px; height: 100px; border-radius: 50%; background: rgba(16,185,129,0.08);"></div>
        <div style="display: flex; justify-content: space-between; align-items: flex-start; position: relative; z-index: 1;">
          <div>
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 14px;">
              <div style="width: 4px; height: 40px; background: linear-gradient(to bottom, #3b82f6, #10b981); border-radius: 2px;"></div>
              <div>
                <p style="font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #60a5fa; margin: 0 0 4px; font-family: Arial, sans-serif;">Stathmos · Historial de Servicios</p>
                <h1 style="font-size: 26px; color: #ffffff; margin: 0; letter-spacing: -0.5px; font-family: Arial, sans-serif;">${servicio.titulo}</h1>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 11px; font-family: Arial, sans-serif; font-weight: bold; padding: 4px 12px; border-radius: 20px; background: ${ec.bg}; color: ${ec.color};">
                ${estadoLabel}
              </span>
            </div>
          </div>
          <div style="text-align: right;">
            <p style="font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #60a5fa; margin: 0 0 5px; font-family: Arial, sans-serif;">Fecha de Emisión</p>
            <p style="font-size: 14px; color: #ffffff; margin: 0; font-family: Arial, sans-serif; font-weight: bold;">${hoy}</p>
            <div style="margin-top: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 6px 12px;">
              <p style="font-size: 10px; color: #94a3b8; margin: 0; font-family: Arial, sans-serif;">Documento interno · Sin validez fiscal</p>
            </div>
          </div>
        </div>
      </div>

      <!-- INFO CLIENTE + VEHÍCULO -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0; border-bottom: 1px solid #e5e7eb;">
        <div style="padding: 22px 28px; background: #f0fdf4; border-right: 1px solid #bbf7d0;">
          <p style="font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: #6b7280; margin: 0 0 10px; font-family: Arial, sans-serif;">Cliente</p>
          <p style="font-size: 16px; font-weight: bold; color: #059669; margin: 0 0 4px; font-family: Arial, sans-serif;">${servicio.clientes?.nombre || "—"}</p>
          ${servicio.clientes?.correo ? `<p style="font-size: 11px; color: #555; margin: 2px 0; font-family: Arial, sans-serif;">${servicio.clientes.correo}</p>` : ""}
          ${servicio.clientes?.telefono ? `<p style="font-size: 11px; color: #555; margin: 2px 0; font-family: Arial, sans-serif;">${servicio.clientes.telefono}</p>` : ""}
          ${servicio.clientes?.rfc ? `<p style="font-size: 11px; color: #555; margin: 2px 0; font-family: Arial, sans-serif;">RFC: ${servicio.clientes.rfc}</p>` : ""}
        </div>
        <div style="padding: 22px 28px; background: #eff6ff;">
          <p style="font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: #6b7280; margin: 0 0 10px; font-family: Arial, sans-serif;">Vehículo</p>
          <p style="font-size: 16px; font-weight: bold; color: #1d4ed8; margin: 0 0 4px; font-family: Arial, sans-serif;">${servicio.vehiculos?.marca} ${servicio.vehiculos?.modelo}</p>
          <p style="font-size: 11px; color: #555; margin: 2px 0; font-family: Arial, sans-serif;">Año: ${servicio.vehiculos?.anio} • Color: ${servicio.vehiculos?.color || "—"}</p>
          <p style="font-size: 11px; color: #555; margin: 2px 0; font-family: Arial, sans-serif;">Placas: <strong>${servicio.vehiculos?.placas || "—"}</strong></p>
          ${servicio.vehiculos?.vin ? `<p style="font-size: 11px; color: #555; margin: 2px 0; font-family: Arial, sans-serif;">VIN: ${servicio.vehiculos.vin}</p>` : ""}
        </div>
      </div>

      <!-- FECHAS -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0; border-bottom: 1px solid #e5e7eb;">
        <div style="padding: 14px 28px; background: #fffbeb; border-right: 1px solid #fde68a;">
          <p style="font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: #6b7280; margin: 0 0 4px; font-family: Arial, sans-serif;">Fecha de Ingreso</p>
          <p style="font-size: 13px; font-weight: bold; color: #d97706; margin: 0; font-family: Arial, sans-serif;">${new Date(servicio.fecha_ingreso).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
        <div style="padding: 14px 28px; background: #f9fafb;">
          <p style="font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: #6b7280; margin: 0 0 4px; font-family: Arial, sans-serif;">Fecha de Cierre</p>
          <p style="font-size: 13px; font-weight: bold; color: #374151; margin: 0; font-family: Arial, sans-serif;">${servicio.fecha_cierre ? new Date(servicio.fecha_cierre).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" }) : "En proceso"}</p>
        </div>
      </div>

      <div style="padding: 36px 50px;">

        <!-- DESCRIPCIÓN -->
        ${servicio.descripcion ? `
        <div style="margin-bottom: 32px;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 14px;">
            <div style="width: 3px; height: 18px; background: #3b82f6; border-radius: 2px;"></div>
            <h2 style="font-size: 14px; letter-spacing: 1px; text-transform: uppercase; color: #1a1a2e; margin: 0; font-family: Arial, sans-serif;">Descripción del Servicio</h2>
          </div>
          <div style="background: #f8f9fa; border-radius: 10px; padding: 16px 20px; border: 1px solid #e5e7eb;">
            <p style="font-size: 13px; color: #374151; margin: 0; font-family: Arial, sans-serif; line-height: 1.6;">${servicio.descripcion}</p>
          </div>
        </div>
        ` : ""}

        ${diagnosticoInicialRow}

        ${diagnosticoFinalRow}

        <!-- OBSERVACIONES -->
        <div style="margin-bottom: 32px;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 14px;">
            <div style="width: 3px; height: 18px; background: #8b5cf6; border-radius: 2px;"></div>
            <h2 style="font-size: 14px; letter-spacing: 1px; text-transform: uppercase; color: #1a1a2e; margin: 0; font-family: Arial, sans-serif;">Observaciones</h2>
          </div>
          ${observacionesRows || `
            <div style="background: #f8f9fa; border-radius: 10px; padding: 16px 20px; border: 1px solid #e5e7eb; text-align: center;">
              <p style="font-size: 12px; color: #9ca3af; margin: 0; font-family: Arial, sans-serif;">No hay observaciones registradas</p>
            </div>
          `}
        </div>

        <!-- COTIZACIÓN -->
        <div style="margin-bottom: 32px;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 14px;">
            <div style="width: 3px; height: 18px; background: #10b981; border-radius: 2px;"></div>
            <h2 style="font-size: 14px; letter-spacing: 1px; text-transform: uppercase; color: #1a1a2e; margin: 0; font-family: Arial, sans-serif;">Cotización</h2>
          </div>
          ${cotizacionesOrdenadas.length > 0 ? `
            ${cotizacionesOrdenadas.length === 1
              ? renderCotizacionPdf(cotizacionInicial, "Cotización Única")
              : `
                ${renderCotizacionPdf(cotizacionInicial, "Cotización Inicial")}
                ${renderCotizacionPdf(cotizacionFinal, "Cotización Final")}
              `}
          ` : `
            <div style="background: #f8f9fa; border-radius: 10px; padding: 16px 20px; border: 1px solid #e5e7eb; text-align: center;">
              <p style="font-size: 12px; color: #9ca3af; margin: 0; font-family: Arial, sans-serif;">No hay cotizaciones disponibles</p>
            </div>
          `}
        </div>

      </div>

      <!-- PIE -->
      <div style="background: #f8f9fa; border-top: 1px solid #e5e7eb; padding: 16px 50px; display: flex; justify-content: space-between; align-items: center;">
        <p style="font-size: 10px; color: #9ca3af; margin: 0; font-family: Arial, sans-serif;">© ${new Date().getFullYear()} Stathmos · Documento generado automáticamente</p>
        <p style="font-size: 10px; color: #9ca3af; margin: 0; font-family: Arial, sans-serif;">Este reporte no tiene validez fiscal oficial</p>
      </div>
    `;

    document.body.appendChild(container);

    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: "#ffffff",
      logging: false,
      useCORS: true,
      allowTaint: true,
      windowWidth: 794,
    });

    document.body.removeChild(container);

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    const pageHeight = pdf.internal.pageSize.getHeight();

    if (pdfHeight <= pageHeight) {
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    } else {
      let yOffset = 0;
      while (yOffset < pdfHeight) {
        if (yOffset > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, -yOffset, pdfWidth, pdfHeight);
        yOffset += pageHeight;
      }
    }

    pdf.save(`Historial_${servicio.vehiculos?.placas || servicio.id}_${new Date().toISOString().split("T")[0]}.pdf`);
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
              (() => {
                const diagInicial = Array.isArray(servicio.diagnosticos)
                  ? servicio.diagnosticos.find((d) => d.tipo === "inicial")
                  : null;
                const diagFinal = Array.isArray(servicio.diagnosticos)
                  ? [...servicio.diagnosticos]
                      .filter((d) => d.tipo === "final")
                      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] || null
                  : null;
                const cotizacionesOrdenadas = Array.isArray(servicio.cotizaciones)
                  ? [...servicio.cotizaciones].sort(
                      (a, b) =>
                        new Date(a.created_at || a.fecha_emision || 0) -
                        new Date(b.created_at || b.fecha_emision || 0)
                    )
                  : [];
                const cotizacionInicial = cotizacionesOrdenadas[0] || null;
                const cotizacionFinal = cotizacionesOrdenadas[cotizacionesOrdenadas.length - 1] || null;
                return (
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
                    <p>
                      <span className="font-medium">Diagnóstico inicial:</span> {diagInicial ? "Sí" : "No"}
                      {diagFinal ? " • Diagnóstico final: Sí" : " • Diagnóstico final: No"}
                    </p>
                    <p>
                      <span className="font-medium">Cotización inicial:</span>{" "}
                      {cotizacionInicial
                        ? formatDateWorkshop(cotizacionInicial.fecha_emision || cotizacionInicial.created_at)
                        : "No"}
                      {cotizacionFinal
                        ? ` • Cotización final: ${formatDateWorkshop(cotizacionFinal.fecha_emision || cotizacionFinal.created_at)}`
                        : " • Cotización final: No"}
                    </p>
                  </div>
                </div>

                <Icon
                  name="chevrondown"
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
                      .detail-ref-pdf { padding: 24px; border: 1px dashed #9ca3af; background: #ffffff; color: #111111; border-radius: 12px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
                      body { background: #ffffff !important; }
                      body * { visibility: hidden !important; }
                      .detail-ref-pdf, .detail-ref-pdf * { visibility: visible !important; }
                      .detail-ref-pdf { position: fixed; left: 0; top: 0; width: 100%; }
                    }
                  `}</style>
                  <div ref={detailRef} className="detail-ref-pdf">

                    {/* ── Info General ── */}
                    <div className="mb-6">
                      <h4 className={`font-semibold ${textPrimary} mb-3`}>Información General</h4>
                      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded ${darkMode ? "bg-zinc-800/50" : "bg-gray-50"}`}>
                        <div>
                          <p className={`text-xs ${textSecondary} font-medium mb-1`}>CLIENTE</p>
                          <p className={`${textPrimary} font-semibold`}>{servicio.clientes?.nombre || "—"}</p>
                          {servicio.clientes?.correo && <p className={`text-xs ${textSecondary}`}>{servicio.clientes.correo}</p>}
                          {servicio.clientes?.telefono && <p className={`text-xs ${textSecondary}`}>{servicio.clientes.telefono}</p>}
                          {servicio.clientes?.rfc && <p className={`text-xs ${textSecondary}`}>RFC: {servicio.clientes.rfc}</p>}
                          {servicio.clientes?.direccion && <p className={`text-xs ${textSecondary}`}>{servicio.clientes.direccion}</p>}
                        </div>
                        <div>
                          <p className={`text-xs ${textSecondary} font-medium mb-1`}>VEHÍCULO</p>
                          <p className={`${textPrimary} font-semibold`}>{servicio.vehiculos?.marca} {servicio.vehiculos?.modelo}</p>
                          {servicio.vehiculos?.anio && <p className={`text-xs ${textSecondary}`}>Año: {servicio.vehiculos.anio}</p>}
                          <p className={`text-xs ${textSecondary}`}>Placas: {servicio.vehiculos?.placas || "—"}</p>
                          {servicio.vehiculos?.color && <p className={`text-xs ${textSecondary}`}>Color: {servicio.vehiculos.color}</p>}
                          {servicio.vehiculos?.vin && <p className={`text-xs ${textSecondary}`}>VIN: {servicio.vehiculos.vin}</p>}
                        </div>
                        {servicio.empleados?.nombre && (
                          <div>
                            <p className={`text-xs ${textSecondary} font-medium mb-1`}>MECÁNICO</p>
                            <p className={`${textPrimary}`}>{servicio.empleados.nombre}</p>
                          </div>
                        )}
                        <div>
                          <p className={`text-xs ${textSecondary} font-medium mb-1`}>FECHAS</p>
                          <p className={`text-xs ${textSecondary}`}>Ingreso: {formatDateWorkshop(servicio.fecha_ingreso)}</p>
                          {servicio.fecha_aprobacion && <p className={`text-xs ${textSecondary}`}>Aprobación: {formatDateWorkshop(servicio.fecha_aprobacion)}</p>}
                          {servicio.fecha_cierre && <p className={`text-xs ${textSecondary}`}>Cierre: {formatDateWorkshop(servicio.fecha_cierre)}</p>}
                        </div>
                      </div>
                    </div>

                    {/* ── Descripción ── */}
                    {servicio.descripcion && (
                      <div className="mb-6">
                        <h4 className={`font-semibold ${textPrimary} mb-3`}>Descripción del Proyecto</h4>
                        <div className={`p-4 rounded border ${darkMode ? "border-zinc-700 bg-zinc-800/50" : "border-gray-200 bg-gray-50"}`}>
                          <p className={`text-sm whitespace-pre-wrap ${textPrimary}`}>{servicio.descripcion}</p>
                        </div>
                      </div>
                    )}

                    {/* ── Diagnóstico Inicial ── */}
                    {(() => {
                      const diagInicial = Array.isArray(servicio.diagnosticos)
                        ? servicio.diagnosticos.find(d => d.tipo === "inicial")
                        : null;
                      if (!diagInicial) return null;
                      return (
                        <div className="mb-6">
                          <h4 className={`font-semibold ${textPrimary} mb-3`}>Diagnóstico Inicial</h4>
                          <div className={`p-4 rounded border ${darkMode ? "border-zinc-700 bg-zinc-800/50" : "border-gray-200 bg-gray-50"}`}>
                            {diagInicial.tipo_operacion && (
                              <p className={`text-xs ${textSecondary} mb-2`}>
                                Tipo: <span className="font-medium capitalize">{diagInicial.tipo_operacion.replace(/_/g, " ")}</span>
                              </p>
                            )}
                            {diagInicial.sintomas && (
                              <div className="mb-2">
                                <p className={`text-xs font-medium uppercase tracking-widest ${textSecondary} mb-1`}>Síntomas</p>
                                <p className={`text-sm whitespace-pre-wrap ${textPrimary}`}>{diagInicial.sintomas}</p>
                              </div>
                            )}
                            {diagInicial.descripcion && (
                              <div className="mb-2">
                                <p className={`text-xs font-medium uppercase tracking-widest ${textSecondary} mb-1`}>Descripción</p>
                                <p className={`text-sm whitespace-pre-wrap ${textPrimary}`}>{diagInicial.descripcion}</p>
                              </div>
                            )}
                            {diagInicial.causa_raiz && (
                              <div className="mb-2">
                                <p className={`text-xs font-medium uppercase tracking-widest ${textSecondary} mb-1`}>Causa Raíz</p>
                                <p className={`text-sm whitespace-pre-wrap ${textPrimary}`}>{diagInicial.causa_raiz}</p>
                              </div>
                            )}
                            <p className={`text-xs mt-2 ${textSecondary}`}>
                              {diagInicial.empleados?.nombre ? `Registrado por ${diagInicial.empleados.nombre}` : ""}
                              {diagInicial.created_at ? ` • ${formatDateTimeWorkshop(diagInicial.created_at)}` : ""}
                            </p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* ── Cotización ── */}
                    <div className="mb-6">
                      <h4 className={`font-semibold ${textPrimary} mb-3`}>Cotización</h4>
                      {cotizacionesOrdenadas.length > 0 ? (
                        <div className="space-y-3">
                          {cotizacionesOrdenadas.map((cot, idx) => (
                            <div key={cot.id} className={`p-4 rounded border ${darkMode ? "border-zinc-700 bg-zinc-800/50" : "border-gray-200 bg-gray-50"}`}>
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <p className={`text-sm font-semibold ${textPrimary}`}>
                                    {cotizacionesOrdenadas.length === 1
                                      ? "Cotización Única"
                                      : idx === 0
                                        ? "Cotización Inicial"
                                        : idx === cotizacionesOrdenadas.length - 1
                                          ? "Cotización Final"
                                          : `Cotización Intermedia #${idx}`}
                                    {" "}• {formatDateWorkshop(cot.fecha_emision || cot.created_at)}
                                  </p>
                                  <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-bold border ${
                                    cot.estado === "aprobada"
                                      ? darkMode ? "bg-emerald-900/30 text-emerald-300 border-emerald-700" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : cot.estado === "rechazada"
                                        ? darkMode ? "bg-red-900/30 text-red-300 border-red-700" : "bg-red-50 text-red-700 border-red-200"
                                        : darkMode ? "bg-amber-900/30 text-amber-300 border-amber-700" : "bg-amber-50 text-amber-700 border-amber-200"
                                  }`}>
                                    {cot.estado === "aprobada" ? "✓ APROBADA" : cot.estado === "rechazada" ? "✗ RECHAZADA" : "⏳ PENDIENTE"}
                                  </span>
                                </div>
                              </div>
                              {Array.isArray(cot.cotizacion_items) && cot.cotizacion_items.length > 0 && (
                                <div className="mb-3 overflow-x-auto">
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className={`border-b ${darkMode ? "border-zinc-700" : "border-gray-200"}`}>
                                        <th className={`text-left py-2 px-2 ${textSecondary}`}>Descripción</th>
                                        <th className={`text-right py-2 px-2 ${textSecondary}`}>Cant.</th>
                                        <th className={`text-right py-2 px-2 ${textSecondary}`}>Precio</th>
                                        <th className={`text-right py-2 px-2 ${textSecondary}`}>Subtotal</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {cot.cotizacion_items.map((item, i) => (
                                        <tr key={item.id || i} className={`border-b ${darkMode ? "border-zinc-700" : "border-gray-200"}`}>
                                          <td className={`py-2 px-2 ${textPrimary}`}>{item.descripcion}</td>
                                          <td className={`text-right py-2 px-2 ${textSecondary}`}>{item.cantidad}</td>
                                          <td className={`text-right py-2 px-2 ${textSecondary}`}>${Number(item.precio_unit || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
                                          <td className={`text-right py-2 px-2 ${textPrimary} font-semibold`}>${Number(item.subtotal || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                              <div className={`pt-3 border-t ${darkMode ? "border-zinc-700" : "border-gray-200"} space-y-1`}>
                                <div className="flex justify-between text-sm">
                                  <span className={textSecondary}>Mano de obra:</span>
                                  <span className={textPrimary}>${Number(cot.monto_mano_obra || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className={textSecondary}>Refacciones:</span>
                                  <span className={textPrimary}>${Number(cot.monto_refacc || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold">
                                  <span className={textPrimary}>Total:</span>
                                  <span className={`text-base ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>
                                    ${Number(cot.monto_total || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
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
                          <p className={`text-sm ${textSecondary}`}>Sin cotización registrada</p>
                        </div>
                      )}
                    </div>

                    {/* ── Observaciones del proyecto ── */}
                    {servicio.observaciones && (
                      <div className="mb-6">
                        <h4 className={`font-semibold ${textPrimary} mb-3`}>Observaciones</h4>
                        <div className={`p-4 rounded border ${darkMode ? "border-zinc-700 bg-zinc-800/50" : "border-gray-200 bg-gray-50"}`}>
                          <p className={`text-sm whitespace-pre-wrap ${textPrimary}`}>{servicio.observaciones}</p>
                        </div>
                      </div>
                    )}

                    {/* ── Diagnóstico Final ── */}
                    {(() => {
                      const diagFinal = Array.isArray(servicio.diagnosticos)
                        ? servicio.diagnosticos.find(d => d.tipo === "final")
                        : null;
                      if (!diagFinal) return null;
                      return (
                        <div className="mb-6">
                          <h4 className={`font-semibold ${textPrimary} mb-3`}>Diagnóstico Final</h4>
                          <div className={`p-4 rounded border ${darkMode ? "border-zinc-700 bg-zinc-800/50" : "border-gray-200 bg-gray-50"}`}>
                            {diagFinal.sintomas && (
                              <div className="mb-2">
                                <p className={`text-xs font-medium uppercase tracking-widest ${textSecondary} mb-1`}>Síntomas</p>
                                <p className={`text-sm whitespace-pre-wrap ${textPrimary}`}>{diagFinal.sintomas}</p>
                              </div>
                            )}
                            {diagFinal.descripcion && (
                              <div className="mb-2">
                                <p className={`text-xs font-medium uppercase tracking-widest ${textSecondary} mb-1`}>Descripción</p>
                                <p className={`text-sm whitespace-pre-wrap ${textPrimary}`}>{diagFinal.descripcion}</p>
                              </div>
                            )}
                            {diagFinal.causa_raiz && (
                              <div className="mb-2">
                                <p className={`text-xs font-medium uppercase tracking-widest ${textSecondary} mb-1`}>Causa Raíz</p>
                                <p className={`text-sm whitespace-pre-wrap ${textPrimary}`}>{diagFinal.causa_raiz}</p>
                              </div>
                            )}
                            <p className={`text-xs mt-2 ${textSecondary}`}>
                              {diagFinal.empleados?.nombre ? `Registrado por ${diagFinal.empleados.nombre}` : ""}
                              {diagFinal.created_at ? ` • ${formatDateTimeWorkshop(diagFinal.created_at)}` : ""}
                            </p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* ── Refacciones asignadas ── */}
                    {Array.isArray(servicio.proyecto_refacciones) && servicio.proyecto_refacciones.length > 0 && (
                      <div className="mb-6">
                        <h4 className={`font-semibold ${textPrimary} mb-3`}>Refacciones Utilizadas</h4>
                        <div className={`rounded border overflow-hidden ${darkMode ? "border-zinc-700" : "border-gray-200"}`}>
                          <table className="w-full text-sm">
                            <thead className={darkMode ? "bg-zinc-800" : "bg-gray-50"}>
                              <tr>
                                <th className={`text-left py-2 px-3 ${textSecondary}`}>Refacción</th>
                                <th className={`text-right py-2 px-3 ${textSecondary}`}>Cant.</th>
                                <th className={`text-right py-2 px-3 ${textSecondary}`}>Precio unit.</th>
                                <th className={`text-right py-2 px-3 ${textSecondary}`}>Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {servicio.proyecto_refacciones.map((r) => (
                                <tr key={r.id} className={`border-t ${darkMode ? "border-zinc-700" : "border-gray-100"}`}>
                                  <td className={`py-2 px-3 ${textPrimary}`}>
                                    {r.refacciones?.nombre || "—"}
                                    {r.refacciones?.numero_parte && <span className={`ml-1 text-xs ${textSecondary}`}>#{r.refacciones.numero_parte}</span>}
                                  </td>
                                  <td className={`text-right py-2 px-3 ${textSecondary}`}>{r.cantidad}</td>
                                  <td className={`text-right py-2 px-3 ${textSecondary}`}>${Number(r.precio_unitario || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
                                  <td className={`text-right py-2 px-3 ${textPrimary} font-semibold`}>${(Number(r.precio_unitario || 0) * Number(r.cantidad || 0)).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* ── Fotos ── */}
                    <div className="mb-6">
                      <h4 className={`font-semibold ${textPrimary} mb-3`}>
                        Fotografías {fotos[servicio.id]?.length > 0 && `(${fotos[servicio.id].length})`}
                      </h4>
                      {loadingFotos[servicio.id] ? (
                        <div className={`p-4 rounded text-center ${darkMode ? "bg-zinc-800/50" : "bg-gray-50"}`}>
                          <p className={`text-sm ${textSecondary}`}>Cargando fotos...</p>
                        </div>
                      ) : fotos[servicio.id]?.length > 0 ? (
                        <div className="space-y-4">
                          {["antes", "durante", "despues"].map((momento) => {
                            const fotosMomento = fotos[servicio.id].filter(f => f.momento === momento);
                            if (!fotosMomento.length) return null;
                            const momentoLabels = { antes: "Antes", durante: "Durante", despues: "Después" };
                            const momentoBadgeColor = {
                              antes: darkMode ? "bg-amber-900/70 text-amber-200 border-amber-700" : "bg-amber-100 text-amber-800 border-amber-200",
                              durante: darkMode ? "bg-sky-900/70 text-sky-200 border-sky-700" : "bg-sky-100 text-sky-800 border-sky-200",
                              despues: darkMode ? "bg-emerald-900/70 text-emerald-200 border-emerald-700" : "bg-emerald-100 text-emerald-800 border-emerald-200",
                            };
                            return (
                              <div key={momento}>
                                <p className={`text-xs font-medium uppercase tracking-widest ${textSecondary} mb-2`}>{momentoLabels[momento]}</p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  {fotosMomento.map(foto => (
                                    <div key={foto.id} className="relative group cursor-pointer" onClick={() => setLightbox(foto)}>
                                      <div className={`aspect-square rounded-lg overflow-hidden border ${darkMode ? "border-zinc-700" : "border-gray-200"} hover:shadow-lg transition`}>
                                        <img src={foto.url} alt={foto.descripcion || momento} className="w-full h-full object-cover" />
                                      </div>
                                      <span className={`absolute top-2 left-2 px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${momentoBadgeColor[momento]}`}>
                                        {momentoLabels[momento]}
                                      </span>
                                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/40 rounded-lg flex items-center justify-center transition">
                                        <Icon name="eye" className="w-5 h-5 text-white" />
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

                  </div>

                  {/* Botones de acción */}
                  <div className={`flex flex-wrap gap-2 pt-4 px-4 border-t ${darkMode ? "border-zinc-700" : "border-gray-200"}`}>
                    <Button
                      onClick={() => imprimirTicketServicio(servicio.id)}
                      variant="primary"
                      className="flex items-center gap-2"
                    >
                      <Icon name="printer" className="w-4 h-4" />
                      Imprimir Ticket
                    </Button>
                    <Button
                      onClick={() => generarPDFServicio(servicio)}
                      disabled={generandoPDF[servicio.id]}
                      variant="secondary"
                      className="flex items-center gap-2"
                    >
                      <Icon name="download" className="w-4 h-4" />
                      {generandoPDF[servicio.id] ? "Generando..." : "Descargar PDF"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
                );
              })()
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
              <Icon name="x" className="w-6 h-6" />
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
