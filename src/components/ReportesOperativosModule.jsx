import { useEffect, useMemo, useState, useRef } from "react";
import supabase from "../supabase";
import useSupabaseRealtime from "../hooks/useSupabaseRealtime";
import { Calendar, Download, BarChart3, AlertTriangle, Wrench, Activity, FileText } from "lucide-react";
import { formatDateWorkshop } from "../utils/datetime";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const ACTIVE_PROJECT_STATES = ["activo", "en_progreso", "pendiente_cotizacion", "pendiente_refaccion"];

const STATE_LABELS = {
  activo: "Activo",
  en_progreso: "En progreso",
  pendiente_cotizacion: "Pendiente cotizacion",
  pendiente_refaccion: "Pendiente refaccion",
  terminado: "Terminado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

const daysBetween = (from, to) => {
  if (!from || !to) return null;
  const diff = new Date(to).getTime() - new Date(from).getTime();
  if (Number.isNaN(diff) || diff < 0) return null;
  return diff / (1000 * 60 * 60 * 24);
};

const daysSince = (from) => {
  if (!from) return null;
  const diff = Date.now() - new Date(from).getTime();
  if (Number.isNaN(diff) || diff < 0) return null;
  return diff / (1000 * 60 * 60 * 24);
};

export default function ReportesOperativosModule({ darkMode = false }) {
  const reportRef = useRef(null);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [loading, setLoading] = useState(false);
  const [reporteActivo, setReporteActivo] = useState("productividad");
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [generandoCSV, setGenerandoCSV] = useState(false);

  const [resumenGeneral, setResumenGeneral] = useState(null);
  const [cargaMecanicos, setCargaMecanicos] = useState([]);
  const [alertasStock, setAlertasStock] = useState([]);
  const [rotacionRefacciones, setRotacionRefacciones] = useState([]);
  const [flujoCitas, setFlujoCitas] = useState(null);
  const [cuellosBotella, setCuellosBotella] = useState([]);

  useEffect(() => {
    const hoy = new Date();
    const hace30Dias = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);
    setFechaFin(hoy.toISOString().split("T")[0]);
    setFechaInicio(hace30Dias.toISOString().split("T")[0]);
  }, []);

  const [rtTick, setRtTick] = useState(0);
  useSupabaseRealtime("citas", () => setRtTick(t => t + 1));
  useSupabaseRealtime("cotizaciones", () => setRtTick(t => t + 1));
  useSupabaseRealtime("compras_refacciones", () => setRtTick(t => t + 1));

  useEffect(() => {
    if (resumenGeneral) {
      generateReports();
    }
  }, [rtTick]);

  const generateReports = async () => {
    if (!fechaInicio || !fechaFin) {
      alert("Debes seleccionar fecha de inicio y fin");
      return;
    }

    setLoading(true);
    try {
      const fechaInicioISO = new Date(`${fechaInicio}T00:00:00`).toISOString();
      const fechaFinISO = new Date(`${fechaFin}T23:59:59`).toISOString();

      const [
        proyectosPeriodoResp,
        proyectosActivosResp,
        cotizacionesResp,
        refaccionesResp,
        comprasRefaccionesResp,
        citasResp,
      ] = await Promise.all([
        supabase
          .from("proyectos")
          .select(
            `
            id,
            estado,
            fecha_ingreso,
            fecha_cierre,
            fecha_entrega,
            mecanico_id,
            empleados:mecanico_id (
              id,
              nombre
            )
          `
          )
          .gte("fecha_ingreso", fechaInicioISO)
          .lte("fecha_ingreso", fechaFinISO),
        supabase
          .from("proyectos")
          .select(
            `
            id,
            estado,
            mecanico_id,
            empleados:mecanico_id (
              id,
              nombre
            )
          `
          )
          .in("estado", ACTIVE_PROJECT_STATES),
        supabase
          .from("cotizaciones")
          .select("id, estado, fecha_emision")
          .gte("fecha_emision", fechaInicioISO)
          .lte("fecha_emision", fechaFinISO),
        supabase
          .from("refacciones")
          .select("id, nombre, numero_parte, stock, stock_minimo, activo")
          .eq("activo", true),
        supabase
          .from("compras_refacciones")
          .select(
            `
            id,
            refaccion_id,
            cantidad,
            fecha_compra,
            refacciones:refaccion_id (
              id,
              nombre,
              numero_parte
            )
          `
          )
          .gte("fecha_compra", fechaInicioISO)
          .lte("fecha_compra", fechaFinISO),
        supabase
          .from("citas")
          .select("id, estado, fecha_hora")
          .gte("fecha_hora", fechaInicioISO)
          .lte("fecha_hora", fechaFinISO),
      ]);

      const errores = [
        proyectosPeriodoResp.error,
        proyectosActivosResp.error,
        cotizacionesResp.error,
        refaccionesResp.error,
        comprasRefaccionesResp.error,
        citasResp.error,
      ].filter(Boolean);

      if (errores.length) {
        throw errores[0];
      }

      const proyectosPeriodo = proyectosPeriodoResp.data || [];
      const proyectosActivos = proyectosActivosResp.data || [];
      const cotizaciones = cotizacionesResp.data || [];
      const refacciones = refaccionesResp.data || [];
      const comprasRefacciones = comprasRefaccionesResp.data || [];
      const citas = citasResp.data || [];

      const tiemposCiclo = proyectosPeriodo
        .filter((p) => ["terminado", "entregado"].includes(p.estado))
        .map((p) => daysBetween(p.fecha_ingreso, p.fecha_cierre || p.fecha_entrega))
        .filter((d) => d !== null);

      const tiempoPromedioCiclo =
        tiemposCiclo.length > 0
          ? (tiemposCiclo.reduce((acc, v) => acc + v, 0) / tiemposCiclo.length).toFixed(1)
          : "0.0";

      const cotizacionesAprobadas = cotizaciones.filter((c) => c.estado === "aprobada").length;
      const tasaConversion = cotizaciones.length > 0 ? ((cotizacionesAprobadas / cotizaciones.length) * 100).toFixed(1) : "0.0";

      const cargaMap = {};
      proyectosActivos.forEach((p) => {
        const mecId = p.mecanico_id || "sin_asignar";
        const mecNombre = p.empleados?.nombre || "Sin asignar";
        if (!cargaMap[mecId]) {
          cargaMap[mecId] = { mecanico: mecNombre, activos: 0 };
        }
        cargaMap[mecId].activos += 1;
      });
      const cargaRows = Object.values(cargaMap).sort((a, b) => b.activos - a.activos);
      setCargaMecanicos(cargaRows);

      const alertas = refacciones
        .filter((r) => Number(r.stock) <= Number(r.stock_minimo))
        .sort((a, b) => Number(a.stock) - Number(b.stock));
      setAlertasStock(alertas);

      const rotacionMap = {};
      comprasRefacciones.forEach((compra) => {
        const id = compra.refaccion_id;
        const nombre = compra.refacciones?.nombre || "Desconocida";
        if (!rotacionMap[id]) {
          rotacionMap[id] = {
            nombre,
            numero_parte: compra.refacciones?.numero_parte || "-",
            usos: 0,
            movimientos: 0,
          };
        }
        rotacionMap[id].usos += Number(compra.cantidad || 0);
        rotacionMap[id].movimientos += 1;
      });

      const rotacionRows = Object.values(rotacionMap)
        .sort((a, b) => b.usos - a.usos)
        .slice(0, 15);
      setRotacionRefacciones(rotacionRows);

      const totalCitas = citas.length;
      const citasConfirmadas = citas.filter((c) => c.estado === "confirmada").length;
      const citasCompletadas = citas.filter((c) => c.estado === "completada").length;
      const citasCanceladas = citas.filter((c) => c.estado === "cancelada").length;
      const favorables = citasConfirmadas + citasCompletadas;
      const tasaAsistencia = totalCitas > 0 ? ((favorables / totalCitas) * 100).toFixed(1) : "0.0";
      setFlujoCitas({
        total: totalCitas,
        confirmadas: citasConfirmadas,
        completadas: citasCompletadas,
        canceladas: citasCanceladas,
        favorables,
        tasaAsistencia,
      });

      const bottleneckMap = {};
      proyectosPeriodo.forEach((p) => {
        if (!bottleneckMap[p.estado]) {
          bottleneckMap[p.estado] = { estado: p.estado, cantidad: 0, totalEdad: 0, conEdad: 0 };
        }
        bottleneckMap[p.estado].cantidad += 1;
        const edad = daysSince(p.fecha_ingreso);
        if (edad !== null && ["activo", "en_progreso", "pendiente_cotizacion", "pendiente_refaccion"].includes(p.estado)) {
          bottleneckMap[p.estado].totalEdad += edad;
          bottleneckMap[p.estado].conEdad += 1;
        }
      });

      const bottleneckRows = Object.values(bottleneckMap)
        .map((row) => ({
          ...row,
          edadPromedioDias: row.conEdad > 0 ? (row.totalEdad / row.conEdad).toFixed(1) : "-",
        }))
        .sort((a, b) => b.cantidad - a.cantidad);
      setCuellosBotella(bottleneckRows);

      setResumenGeneral({
        periodo: `${formatDateWorkshop(fechaInicio)} - ${formatDateWorkshop(fechaFin)}`,
        proyectosPeriodo: proyectosPeriodo.length,
        tiempoPromedioCiclo,
        tasaConversion,
        cotizacionesAprobadas,
        totalCotizaciones: cotizaciones.length,
        cargaActivaTotal: proyectosActivos.length,
        refaccionesCriticas: alertas.length,
        tasaAsistencia,
        citasTotal: totalCitas,
      });
    } catch (error) {
      console.error("Error al generar reportes:", error);
      alert("Error al generar reportes operativos");
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    if (!resumenGeneral) return;

    setGenerandoPDF(true);
    try {
      const container = document.createElement("div");
      container.style.width = "1000px";
      container.style.padding = "20px";
      container.style.background = "white";
      container.style.fontFamily = "Arial, sans-serif";
      container.style.color = "#333";

      const html = `
        <div>
          <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 10px; text-align: center;">Reporte Operativo</h1>
          <p style="font-size: 12px; text-align: center; margin-bottom: 20px; color: #666;">Periodo: ${resumenGeneral.periodo}</p>

          <h2 style="font-size: 16px; font-weight: bold; margin-top: 20px; margin-bottom: 10px;">Indicadores Clave</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #ddd;">
            <thead>
              <tr style="background-color: #f5f5f5; border-bottom: 2px solid #333;">
                <th style="text-align: left; padding: 12px; border-right: 1px solid #ddd; font-weight: bold;">Métrica</th>
                <th style="text-align: right; padding: 12px; font-weight: bold;">Valor</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 10px; text-align: left; border-right: 1px solid #ddd;">Tiempo promedio de ciclo (días)</td>
                <td style="padding: 10px; text-align: right; font-weight: bold;">${resumenGeneral.tiempoPromedioCiclo}</td>
              </tr>
              <tr style="border-bottom: 1px solid #ddd; background-color: #fafafa;">
                <td style="padding: 10px; text-align: left; border-right: 1px solid #ddd;">Tasa de conversión (%)</td>
                <td style="padding: 10px; text-align: right; font-weight: bold;">${resumenGeneral.tasaConversion}%</td>
              </tr>
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 10px; text-align: left; border-right: 1px solid #ddd;">Cotizaciones aprobadas</td>
                <td style="padding: 10px; text-align: right; font-weight: bold;">${resumenGeneral.cotizacionesAprobadas}/${resumenGeneral.totalCotizaciones}</td>
              </tr>
              <tr style="border-bottom: 1px solid #ddd; background-color: #fafafa;">
                <td style="padding: 10px; text-align: left; border-right: 1px solid #ddd;">Carga activa total (proyectos)</td>
                <td style="padding: 10px; text-align: right; font-weight: bold;">${resumenGeneral.cargaActivaTotal}</td>
              </tr>
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 10px; text-align: left; border-right: 1px solid #ddd;">Refacciones en stock crítico</td>
                <td style="padding: 10px; text-align: right; font-weight: bold;">${resumenGeneral.refaccionesCriticas}</td>
              </tr>
              <tr style="background-color: #fafafa;">
                <td style="padding: 10px; text-align: left; border-right: 1px solid #ddd;">Tasa de asistencia de citas (%)</td>
                <td style="padding: 10px; text-align: right; font-weight: bold;">${resumenGeneral.tasaAsistencia}%</td>
              </tr>
            </tbody>
          </table>

          <h2 style="font-size: 16px; font-weight: bold; margin-top: 20px; margin-bottom: 10px;">Carga de Trabajo por Mecánico</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #ddd;">
            <thead>
              <tr style="background-color: #f5f5f5; border-bottom: 2px solid #333;">
                <th style="text-align: left; padding: 12px; border-right: 1px solid #ddd; font-weight: bold;">Mecánico</th>
                <th style="text-align: right; padding: 12px; border-right: 1px solid #ddd; font-weight: bold;">Proyectos activos</th>
                <th style="text-align: right; padding: 12px; font-weight: bold;">Participación (%)</th>
              </tr>
            </thead>
            <tbody>
              ${cargaMecanicos.length === 0 ? '<tr><td colspan="3" style="padding: 10px; text-align: center; color: #666;">Sin datos</td></tr>' : 
                cargaMecanicos.map((row, i) => {
                  const total = Number(resumenGeneral.cargaActivaTotal || 0);
                  const ratio = total > 0 ? ((row.activos / total) * 100).toFixed(1) : "0.0";
                  return `<tr style="border-bottom: 1px solid #ddd; ${i % 2 === 0 ? 'background-color: #fafafa;' : ''}">
                    <td style="padding: 10px; border-right: 1px solid #ddd;">${row.mecanico}</td>
                    <td style="padding: 10px; border-right: 1px solid #ddd; text-align: right; font-weight: bold;">${row.activos}</td>
                    <td style="padding: 10px; text-align: right;">${ratio}%</td>
                  </tr>`;
                }).join('')}
            </tbody>
          </table>

          <h2 style="font-size: 16px; font-weight: bold; margin-top: 20px; margin-bottom: 10px;">Alertas de Stock Crítico</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #ddd;">
            <thead>
              <tr style="background-color: #f5f5f5; border-bottom: 2px solid #333;">
                <th style="text-align: left; padding: 12px; border-right: 1px solid #ddd; font-weight: bold;">Refacción</th>
                <th style="text-align: left; padding: 12px; border-right: 1px solid #ddd; font-weight: bold;">Número de parte</th>
                <th style="text-align: right; padding: 12px; border-right: 1px solid #ddd; font-weight: bold;">Stock</th>
                <th style="text-align: right; padding: 12px; font-weight: bold;">Mínimo</th>
              </tr>
            </thead>
            <tbody>
              ${alertasStock.length === 0 ? '<tr><td colspan="4" style="padding: 10px; text-align: center; color: #666;">Sin alertas</td></tr>' :
                alertasStock.map((row, i) => `<tr style="border-bottom: 1px solid #ddd; ${i % 2 === 0 ? 'background-color: #fafafa;' : ''}">
                  <td style="padding: 10px; border-right: 1px solid #ddd;">${row.nombre}</td>
                  <td style="padding: 10px; border-right: 1px solid #ddd;">${row.numero_parte || "-"}</td>
                  <td style="padding: 10px; border-right: 1px solid #ddd; text-align: right; color: #dc2626; font-weight: bold;">${row.stock}</td>
                  <td style="padding: 10px; text-align: right;">${row.stock_minimo}</td>
                </tr>`).join('')}
            </tbody>
          </table>

          <h2 style="font-size: 16px; font-weight: bold; margin-top: 20px; margin-bottom: 10px;">Refacciones con Mayor Rotación</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #ddd;">
            <thead>
              <tr style="background-color: #f5f5f5; border-bottom: 2px solid #333;">
                <th style="text-align: left; padding: 12px; border-right: 1px solid #ddd; font-weight: bold;">Refacción</th>
                <th style="text-align: left; padding: 12px; border-right: 1px solid #ddd; font-weight: bold;">Número de parte</th>
                <th style="text-align: right; padding: 12px; border-right: 1px solid #ddd; font-weight: bold;">Unidades usadas</th>
                <th style="text-align: right; padding: 12px; font-weight: bold;">Movimientos</th>
              </tr>
            </thead>
            <tbody>
              ${rotacionRefacciones.length === 0 ? '<tr><td colspan="4" style="padding: 10px; text-align: center; color: #666;">Sin datos</td></tr>' :
                rotacionRefacciones.map((row, i) => `<tr style="border-bottom: 1px solid #ddd; ${i % 2 === 0 ? 'background-color: #fafafa;' : ''}">
                  <td style="padding: 10px; border-right: 1px solid #ddd;">${row.nombre}</td>
                  <td style="padding: 10px; border-right: 1px solid #ddd;">${row.numero_parte}</td>
                  <td style="padding: 10px; border-right: 1px solid #ddd; text-align: right; font-weight: bold;">${row.usos}</td>
                  <td style="padding: 10px; text-align: right;">${row.movimientos}</td>
                </tr>`).join('')}
            </tbody>
          </table>

          <h2 style="font-size: 16px; font-weight: bold; margin-top: 20px; margin-bottom: 10px;">Cuellos de Botella por Estado</h2>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
            <thead>
              <tr style="background-color: #f5f5f5; border-bottom: 2px solid #333;">
                <th style="text-align: left; padding: 12px; border-right: 1px solid #ddd; font-weight: bold;">Estado</th>
                <th style="text-align: right; padding: 12px; border-right: 1px solid #ddd; font-weight: bold;">Cantidad de proyectos</th>
                <th style="text-align: right; padding: 12px; font-weight: bold;">Edad promedio (días)</th>
              </tr>
            </thead>
            <tbody>
              ${cuellosBotella.length === 0 ? '<tr><td colspan="3" style="padding: 10px; text-align: center; color: #666;">Sin datos</td></tr>' :
                cuellosBotella.map((row, i) => `<tr style="border-bottom: 1px solid #ddd; ${i % 2 === 0 ? 'background-color: #fafafa;' : ''}">
                  <td style="padding: 10px; border-right: 1px solid #ddd;">${STATE_LABELS[row.estado] || row.estado}</td>
                  <td style="padding: 10px; border-right: 1px solid #ddd; text-align: right; font-weight: bold;">${row.cantidad}</td>
                  <td style="padding: 10px; text-align: right;">${row.edadPromedioDias}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      `;

      container.innerHTML = html;
      document.body.appendChild(container);

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        allowTaint: true,
        logging: false,
      });

      document.body.removeChild(container);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? "landscape" : "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 10;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 5;

      pdf.addImage(imgData, "PNG", 5, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - 10;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 5, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - 10;
      }

      pdf.save(`Reportes_Operativos_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("Error al generar PDF:", error);
      alert("Error al generar PDF");
    } finally {
      setGenerandoPDF(false);
    }
  };

  const generateCSV = () => {
    if (!resumenGeneral) return;

    setGenerandoCSV(true);
    try {
      const rows = [];
      
      // Header
      rows.push(["REPORTE OPERATIVO"]);
      rows.push([]);
      rows.push(["Periodo", resumenGeneral.periodo]);
      rows.push(["Fecha de generación", new Date().toLocaleString()]);
      rows.push([]);
      
      // Resumen general
      rows.push(["INDICADORES CLAVE"]);
      rows.push(["Métrica", "Valor"]);
      rows.push(["Tiempo promedio de ciclo (días)", resumenGeneral.tiempoPromedioCiclo]);
      rows.push(["Tasa de conversión de cotizaciones (%)", resumenGeneral.tasaConversion]);
      rows.push(["Cotizaciones aprobadas", `${resumenGeneral.cotizacionesAprobadas}/${resumenGeneral.totalCotizaciones}`]);
      rows.push(["Carga activa total (proyectos)", resumenGeneral.cargaActivaTotal]);
      rows.push(["Refacciones en stock crítico", resumenGeneral.refaccionesCriticas]);
      rows.push(["Tasa de asistencia de citas (%)", resumenGeneral.tasaAsistencia]);
      rows.push([]);
      
      // Carga por mecánico
      rows.push(["CARGA DE TRABAJO POR MECÁNICO"]);
      rows.push(["Mecánico", "Proyectos activos", "Participación (%)"]);
      const total = Number(resumenGeneral.cargaActivaTotal || 0);
      cargaMecanicos.forEach((row) => {
        const ratio = total > 0 ? ((row.activos / total) * 100).toFixed(1) : "0.0";
        rows.push([row.mecanico, row.activos, ratio]);
      });
      rows.push([]);
      
      // Stock crítico
      rows.push(["ALERTAS DE STOCK CRÍTICO"]);
      rows.push(["Refacción", "Número de parte", "Stock", "Mínimo"]);
      alertasStock.forEach((row) => {
        rows.push([row.nombre, row.numero_parte || "-", row.stock, row.stock_minimo]);
      });
      rows.push([]);
      
      // Rotación de refacciones
      rows.push(["REFACCIONES CON MAYOR ROTACIÓN"]);
      rows.push(["Refacción", "Número de parte", "Unidades usadas", "Movimientos"]);
      rotacionRefacciones.forEach((row) => {
        rows.push([row.nombre, row.numero_parte, row.usos, row.movimientos]);
      });
      rows.push([]);
      
      // Flujo de citas
      if (flujoCitas) {
        rows.push(["TASA DE ASISTENCIA DE CITAS"]);
        rows.push(["Métrica", "Valor"]);
        rows.push(["Total de citas", flujoCitas.total]);
        rows.push(["Confirmadas", flujoCitas.confirmadas]);
        rows.push(["Completadas", flujoCitas.completadas]);
        rows.push(["Canceladas", flujoCitas.canceladas]);
        rows.push(["Tasa de asistencia (%)", flujoCitas.tasaAsistencia]);
        rows.push([]);
      }
      
      // Cuellos de botella
      rows.push(["CUELLOS DE BOTELLA POR ESTADO"]);
      rows.push(["Estado", "Cantidad de proyectos", "Edad promedio (días)"]);
      cuellosBotella.forEach((row) => {
        rows.push([STATE_LABELS[row.estado] || row.estado, row.cantidad, row.edadPromedioDias]);
      });
      
      // Convertir a CSV
      const csv = rows.map(row => row.map(cell => `"${String(cell || "").replace(/"/g, '""')}"`).join(",")).join("\n");
      
      // Descargar
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `Reportes_Operativos_${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error al generar CSV:", error);
      alert("Error al generar CSV");
    } finally {
      setGenerandoCSV(false);
    }
  };

  const bgInput = darkMode ? "bg-zinc-900 border-zinc-700 text-white" : "bg-white border-gray-300 text-gray-900";
  const bgCard = darkMode ? "bg-[#1e1e28] border-zinc-800" : "bg-white border-gray-200";
  const bgTabs = darkMode ? "bg-zinc-800 border-zinc-700" : "bg-gray-100 border-gray-200";
  const textPrimary = darkMode ? "text-zinc-100" : "text-gray-800";
  const textSecondary = darkMode ? "text-zinc-500" : "text-gray-500";

  return (
    <div className={`flex-1 p-4 md:p-6 min-h-full page-enter ${darkMode ? "bg-[#16161e]" : "bg-gray-50"}`}>
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${textPrimary}`}>Reportes Operativos</h1>
        <p className={`text-sm ${textSecondary} mt-1`}>
          Monitorea productividad, inventario y flujo operativo sin enfoque financiero.
        </p>
      </div>

      <div className={`rounded-lg p-4 mb-6 border ${bgCard}`}>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className={`block text-xs font-medium mb-2 ${textSecondary}`}>Fecha Inicio</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className={`w-full px-3 py-2 rounded border text-sm ${bgInput}`}
            />
          </div>
          <div>
            <label className={`block text-xs font-medium mb-2 ${textSecondary}`}>Fecha Fin</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className={`w-full px-3 py-2 rounded border text-sm ${bgInput}`}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={generateReports}
              disabled={loading}
              className={`w-full px-4 py-2 rounded font-medium text-sm transition flex items-center justify-center gap-2 ${
                loading
                  ? darkMode
                    ? "bg-blue-900 text-blue-400 cursor-not-allowed"
                    : "bg-blue-300 text-blue-600 cursor-not-allowed"
                  : darkMode
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              {loading ? "Generando..." : "Generar"}
            </button>
          </div>
          <div className="flex items-end">
            <button
              onClick={generatePDF}
              disabled={!resumenGeneral || generandoPDF}
              className={`w-full px-4 py-2 rounded font-medium text-sm transition flex items-center justify-center gap-2 ${
                !resumenGeneral || generandoPDF
                  ? darkMode
                    ? "bg-emerald-900 text-emerald-400 cursor-not-allowed"
                    : "bg-emerald-300 text-emerald-600 cursor-not-allowed"
                  : darkMode
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-emerald-500 hover:bg-emerald-600 text-white"
              }`}
            >
              <Download className="w-4 h-4" />
              {generandoPDF ? "Generando..." : "PDF"}
            </button>
          </div>
          <div className="flex items-end">
            <button
              onClick={generateCSV}
              disabled={!resumenGeneral || generandoCSV}
              className={`w-full px-4 py-2 rounded font-medium text-sm transition flex items-center justify-center gap-2 ${
                !resumenGeneral || generandoCSV
                  ? darkMode
                    ? "bg-amber-900 text-amber-400 cursor-not-allowed"
                    : "bg-amber-300 text-amber-600 cursor-not-allowed"
                  : darkMode
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "bg-amber-500 hover:bg-amber-600 text-white"
              }`}
            >
              <FileText className="w-4 h-4" />
              {generandoCSV ? "Generando..." : "CSV"}
            </button>
          </div>
        </div>
      </div>

      {resumenGeneral && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3 mb-6">
          <KpiCard darkMode={darkMode} title="Periodo" value={resumenGeneral.periodo} subtitle="Rango analizado" icon={<Calendar className="w-4 h-4" />} />
          <KpiCard darkMode={darkMode} title="Ciclo Promedio" value={`${resumenGeneral.tiempoPromedioCiclo} dias`} subtitle="Ingreso a terminado" icon={<Activity className="w-4 h-4" />} />
          <KpiCard darkMode={darkMode} title="Conversion" value={`${resumenGeneral.tasaConversion}%`} subtitle={`${resumenGeneral.cotizacionesAprobadas}/${resumenGeneral.totalCotizaciones} aprobadas`} icon={<BarChart3 className="w-4 h-4" />} />
          <KpiCard darkMode={darkMode} title="Carga Activa" value={resumenGeneral.cargaActivaTotal} subtitle="Proyectos en curso" icon={<Wrench className="w-4 h-4" />} />
          <KpiCard darkMode={darkMode} title="Stock Critico" value={resumenGeneral.refaccionesCriticas} subtitle="Refacciones bajo minimo" icon={<AlertTriangle className="w-4 h-4" />} />
          <KpiCard darkMode={darkMode} title="Asistencia Citas" value={`${resumenGeneral.tasaAsistencia}%`} subtitle={`${resumenGeneral.citasTotal} citas en periodo`} icon={<Calendar className="w-4 h-4" />} />
        </div>
      )}

      <div className={`rounded-lg border ${bgCard} mb-6 overflow-hidden`}>
        <div className={`flex border-b ${bgTabs}`}>
          {[
            { id: "productividad", label: "Productividad", icon: "Productividad" },
            { id: "inventario", label: "Inventario", icon: "Inventario" },
            { id: "flujo", label: "Flujo", icon: "Flujo" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setReporteActivo(tab.id)}
              className={`flex-1 px-4 py-3 font-medium text-sm transition ${
                reporteActivo === tab.id
                  ? darkMode
                    ? "bg-blue-600 text-white border-b-2 border-blue-500"
                    : "bg-blue-500 text-white border-b-2 border-blue-400"
                  : darkMode
                  ? "text-zinc-400 hover:text-zinc-200"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.icon}
            </button>
          ))}
        </div>

        <div className={`p-6 ${darkMode ? "bg-[#16161e]" : "bg-white"}`}>
          {reporteActivo === "productividad" && (
            <ProductividadPanel darkMode={darkMode} cargaMecanicos={cargaMecanicos} resumenGeneral={resumenGeneral} />
          )}
          {reporteActivo === "inventario" && (
            <InventarioPanel darkMode={darkMode} alertasStock={alertasStock} rotacionRefacciones={rotacionRefacciones} />
          )}
          {reporteActivo === "flujo" && (
            <FlujoPanel darkMode={darkMode} flujoCitas={flujoCitas} cuellosBotella={cuellosBotella} />
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ darkMode, title, value, subtitle, icon }) {
  const bgCard = darkMode ? "bg-zinc-800/60 border-zinc-700" : "bg-gray-50 border-gray-200";
  const textPrimary = darkMode ? "text-zinc-100" : "text-gray-800";
  const textSecondary = darkMode ? "text-zinc-500" : "text-gray-500";

  return (
    <div className={`rounded-lg border p-3 ${bgCard}`}>
      <div className={`text-xs uppercase font-semibold tracking-wide ${textSecondary} flex items-center gap-2`}>
        {icon}
        <span>{title}</span>
      </div>
      <p className={`text-lg font-bold mt-1 ${textPrimary}`}>{value}</p>
      <p className={`text-xs ${textSecondary}`}>{subtitle}</p>
    </div>
  );
}

function ProductividadPanel({ darkMode, cargaMecanicos, resumenGeneral }) {
  const textPrimary = darkMode ? "text-zinc-100" : "text-gray-800";
  const textSecondary = darkMode ? "text-zinc-500" : "text-gray-500";
  const bgBorder = darkMode ? "border-zinc-700" : "border-gray-200";
  const bgEven = darkMode ? "bg-zinc-800/40" : "bg-gray-50";

  return (
    <div className="space-y-4">
      <h3 className={`text-lg font-bold ${textPrimary}`}>Indicadores de Productividad</h3>
      <p className={`text-sm ${textSecondary}`}>
        El tiempo de ciclo y la conversion reflejan eficiencia del proceso. La carga activa muestra distribucion de trabajo.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className={`border-b ${bgBorder}`}>
              <th className={`text-left py-3 px-4 font-semibold ${textSecondary}`}>Mecanico</th>
              <th className={`text-right py-3 px-4 font-semibold ${textSecondary}`}>Proyectos activos</th>
              <th className={`text-right py-3 px-4 font-semibold ${textSecondary}`}>Participacion</th>
            </tr>
          </thead>
          <tbody>
            {cargaMecanicos.length === 0 ? (
              <tr>
                <td className={`py-4 px-4 ${textSecondary}`} colSpan={3}>
                  Sin carga activa registrada.
                </td>
              </tr>
            ) : (
              cargaMecanicos.map((row, i) => {
                const total = Number(resumenGeneral?.cargaActivaTotal || 0);
                const ratio = total > 0 ? ((row.activos / total) * 100).toFixed(1) : "0.0";
                return (
                  <tr key={row.mecanico + i} className={`border-b ${bgBorder} ${i % 2 === 0 ? bgEven : ""}`}>
                    <td className={`py-3 px-4 ${textPrimary}`}>{row.mecanico}</td>
                    <td className={`py-3 px-4 text-right font-semibold ${textPrimary}`}>{row.activos}</td>
                    <td className={`py-3 px-4 text-right ${textSecondary}`}>{ratio}%</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InventarioPanel({ darkMode, alertasStock, rotacionRefacciones }) {
  const textPrimary = darkMode ? "text-zinc-100" : "text-gray-800";
  const textSecondary = darkMode ? "text-zinc-500" : "text-gray-500";
  const bgBorder = darkMode ? "border-zinc-700" : "border-gray-200";
  const bgEven = darkMode ? "bg-zinc-800/40" : "bg-gray-50";

  return (
    <div className="space-y-6">
      <div>
        <h3 className={`text-lg font-bold ${textPrimary}`}>Alertas de Stock Critico</h3>
        <p className={`text-sm ${textSecondary} mt-1`}>Refacciones por debajo del stock minimo configurado.</p>
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-sm">
            <thead>
              <tr className={`border-b ${bgBorder}`}>
                <th className={`text-left py-3 px-4 font-semibold ${textSecondary}`}>Refaccion</th>
                <th className={`text-left py-3 px-4 font-semibold ${textSecondary}`}>Numero de parte</th>
                <th className={`text-right py-3 px-4 font-semibold ${textSecondary}`}>Stock</th>
                <th className={`text-right py-3 px-4 font-semibold ${textSecondary}`}>Minimo</th>
              </tr>
            </thead>
            <tbody>
              {alertasStock.length === 0 ? (
                <tr>
                  <td className={`py-4 px-4 ${textSecondary}`} colSpan={4}>
                    Sin alertas de stock critico.
                  </td>
                </tr>
              ) : (
                alertasStock.map((row, i) => (
                  <tr key={row.id} className={`border-b ${bgBorder} ${i % 2 === 0 ? bgEven : ""}`}>
                    <td className={`py-3 px-4 ${textPrimary}`}>{row.nombre}</td>
                    <td className={`py-3 px-4 ${textSecondary}`}>{row.numero_parte || "-"}</td>
                    <td className="py-3 px-4 text-right text-red-500 font-semibold">{row.stock}</td>
                    <td className={`py-3 px-4 text-right ${textPrimary}`}>{row.stock_minimo}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className={`text-lg font-bold ${textPrimary}`}>Indice de Rotacion</h3>
        <p className={`text-sm ${textSecondary} mt-1`}>
          Refacciones con mayor uso en compras_refacciones vinculadas a proyectos.
        </p>
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-sm">
            <thead>
              <tr className={`border-b ${bgBorder}`}>
                <th className={`text-left py-3 px-4 font-semibold ${textSecondary}`}>Refaccion</th>
                <th className={`text-left py-3 px-4 font-semibold ${textSecondary}`}>Numero de parte</th>
                <th className={`text-right py-3 px-4 font-semibold ${textSecondary}`}>Unidades usadas</th>
                <th className={`text-right py-3 px-4 font-semibold ${textSecondary}`}>Movimientos</th>
              </tr>
            </thead>
            <tbody>
              {rotacionRefacciones.length === 0 ? (
                <tr>
                  <td className={`py-4 px-4 ${textSecondary}`} colSpan={4}>
                    Sin movimientos de refacciones en el periodo.
                  </td>
                </tr>
              ) : (
                rotacionRefacciones.map((row, i) => (
                  <tr key={row.nombre + i} className={`border-b ${bgBorder} ${i % 2 === 0 ? bgEven : ""}`}>
                    <td className={`py-3 px-4 ${textPrimary}`}>{row.nombre}</td>
                    <td className={`py-3 px-4 ${textSecondary}`}>{row.numero_parte}</td>
                    <td className={`py-3 px-4 text-right font-semibold ${textPrimary}`}>{row.usos}</td>
                    <td className={`py-3 px-4 text-right ${textSecondary}`}>{row.movimientos}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FlujoPanel({ darkMode, flujoCitas, cuellosBotella }) {
  const textPrimary = darkMode ? "text-zinc-100" : "text-gray-800";
  const textSecondary = darkMode ? "text-zinc-500" : "text-gray-500";
  const bgCard = darkMode ? "bg-zinc-800/50 border-zinc-700" : "bg-gray-50 border-gray-200";

  const maxCuello = useMemo(() => {
    if (!cuellosBotella.length) return 1;
    return Math.max(...cuellosBotella.map((c) => c.cantidad), 1);
  }, [cuellosBotella]);

  return (
    <div className="space-y-5">
      <div>
        <h3 className={`text-lg font-bold ${textPrimary}`}>Tasa de Asistencia</h3>
        <p className={`text-sm ${textSecondary} mt-1`}>
          Relacion entre citas confirmadas/completadas contra canceladas.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3">
          <MiniStat darkMode={darkMode} title="Total" value={flujoCitas?.total ?? 0} />
          <MiniStat darkMode={darkMode} title="Confirmadas" value={flujoCitas?.confirmadas ?? 0} />
          <MiniStat darkMode={darkMode} title="Completadas" value={flujoCitas?.completadas ?? 0} />
          <MiniStat darkMode={darkMode} title="Canceladas" value={flujoCitas?.canceladas ?? 0} />
          <MiniStat darkMode={darkMode} title="Asistencia" value={`${flujoCitas?.tasaAsistencia ?? "0.0"}%`} />
        </div>
      </div>

      <div>
        <h3 className={`text-lg font-bold ${textPrimary}`}>Cuellos de Botella por Estado</h3>
        <p className={`text-sm ${textSecondary} mt-1`}>
          Se muestran estados con mayor acumulacion de proyectos y la edad promedio de los que siguen abiertos.
        </p>
        <div className="space-y-3 mt-3">
          {cuellosBotella.length === 0 && <p className={textSecondary}>Sin datos de flujo.</p>}
          {cuellosBotella.map((row) => {
            const width = `${(row.cantidad / maxCuello) * 100}%`;
            return (
              <div key={row.estado} className={`rounded-lg border p-3 ${bgCard}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className={`font-semibold ${textPrimary}`}>{STATE_LABELS[row.estado] || row.estado}</p>
                  <p className={`text-sm ${textSecondary}`}>
                    {row.cantidad} proyectos · edad prom.: {row.edadPromedioDias} dias
                  </p>
                </div>
                <div className={`h-2 rounded-full ${darkMode ? "bg-zinc-700" : "bg-gray-200"}`}>
                  <div className="h-2 rounded-full bg-amber-500" style={{ width }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ darkMode, title, value }) {
  const bg = darkMode ? "bg-zinc-800/60 border-zinc-700" : "bg-gray-50 border-gray-200";
  const textPrimary = darkMode ? "text-zinc-100" : "text-gray-800";
  const textSecondary = darkMode ? "text-zinc-500" : "text-gray-500";

  return (
    <div className={`rounded-lg border p-3 ${bg}`}>
      <p className={`text-xs uppercase tracking-wide font-semibold ${textSecondary}`}>{title}</p>
      <p className={`text-xl font-bold ${textPrimary}`}>{value}</p>
    </div>
  );
}
