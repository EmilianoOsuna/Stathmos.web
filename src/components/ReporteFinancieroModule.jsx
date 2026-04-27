import { useEffect, useState, useMemo, useRef } from "react";
import supabase from "../supabase";
import { ModuleHeader, Card, Icon, Button, Badge } from "./UIPrimitives";
import { formatDateTimeWorkshop } from "../utils/datetime";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function ReporteFinancieroModule({ darkMode }) {
 const reportRef = useRef(null); 
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [pagos, setPagos] = useState([]);
  const [compras, setCompras] = useState([]);
  const [refacciones, setRefacciones] = useState([]);
  const [proyectos, setProyectos] = useState([]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [pRes, cRes, rRes, prRes] = await Promise.all([
        supabase.from("pagos").select("*, proyectos(titulo)"),
        supabase.from("compras_refacciones").select("*"),
        supabase.from("refacciones").select("*"),
        supabase.from("proyectos").select("*, cotizaciones(monto_total, estado), pagos(monto)")
      ]);

      setPagos(pRes.data || []);
      setCompras(cRes.data || []);
      setRefacciones(rRes.data || []);
      setProyectos(prRes.data || []);
    } catch (error) {
      console.error("Error fetching financial data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const stats = useMemo(() => {
    const totalIngresos = pagos.filter(p => p.estado === 'completado').reduce((sum, p) => sum + Number(p.monto), 0);
    const ingresosPendientes = pagos.filter(p => p.estado === 'pendiente').reduce((sum, p) => sum + Number(p.monto), 0);
    const totalEgresos = compras.reduce((sum, c) => sum + (Number(c.precio_unit) * c.cantidad), 0);
    const utilidadBruta = totalIngresos - totalEgresos;

    const valorInventario = refacciones.reduce((sum, r) => sum + (Number(r.precio_compra || 0) * r.stock), 0);

    const porCobrar = proyectos
      .filter(p => p.estado !== 'cancelado')
      .reduce((sum, p) => {
        const approvedQuote = (p.cotizaciones || []).find(c => c.estado === 'aprobada');
        const totalCotizado = approvedQuote?.monto_total || 0;
        const totalPagado = (p.pagos || []).reduce((s, pg) => s + Number(pg.monto), 0);
        return sum + Math.max(0, totalCotizado - totalPagado);
      }, 0);

    // Max value for chart scaling
    const maxValue = Math.max(totalIngresos, totalEgresos, Math.abs(utilidadBruta), 1000);

    return { totalIngresos, ingresosPendientes, totalEgresos, utilidadBruta, valorInventario, porCobrar, maxValue };
  }, [pagos, compras, refacciones, proyectos]);

  const handleExportPDF = async () => {
  setExporting(true);
  try {
    const container = document.createElement("div");
    container.style.cssText = `
      width: 794px;
      background: #ffffff;
      font-family: 'Georgia', 'Times New Roman', serif;
      color: #1a1a2e;
      position: fixed;
      top: -9999px;
      left: -9999px;
    `;

    const hoy = new Date().toLocaleDateString("es-MX", {
      day: "numeric", month: "long", year: "numeric",
    });

    const maxVal = Math.max(stats.totalIngresos, stats.totalEgresos, 1);
    const ingresosW = Math.round((stats.totalIngresos / maxVal) * 420);
    const egresosW = Math.round((stats.totalEgresos / maxVal) * 420);
    const utilidadColor = stats.utilidadBruta >= 0 ? "#059669" : "#dc2626";

    // Tabla de refacciones
    const refaccionesRows = refacciones.map((r, i) => `
      <tr style="background: ${i % 2 === 0 ? '#f8f9fa' : '#ffffff'};">
        <td style="padding: 9px 14px; font-size: 12px; color: #1a1a2e; font-family: Arial, sans-serif;">${r.nombre || '—'}</td>
        <td style="padding: 9px 14px; font-size: 12px; color: #555; font-family: Arial, sans-serif; text-align: center;">${r.categoria || '—'}</td>
        <td style="padding: 9px 14px; font-size: 12px; color: #1a1a2e; font-family: Arial, sans-serif; text-align: center; font-weight: bold;">${r.stock ?? 0}</td>
        <td style="padding: 9px 14px; font-size: 12px; color: #555; font-family: Arial, sans-serif; text-align: right;">$${Number(r.precio_compra || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
        <td style="padding: 9px 14px; font-size: 12px; font-weight: bold; color: #1e40af; font-family: Arial, sans-serif; text-align: right;">$${(Number(r.precio_compra || 0) * (r.stock ?? 0)).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
      </tr>
    `).join("");

    // Filas de pagos recientes
    const pagosRows = pagos.slice(0, 6).map((p, i) => `
      <tr style="background: ${i % 2 === 0 ? '#f8f9fa' : '#ffffff'};">
        <td style="padding: 9px 14px; font-size: 12px; color: #1a1a2e; font-family: Arial, sans-serif;">${p.proyectos?.titulo || 'Venta Directa'}</td>
        <td style="padding: 9px 14px; font-size: 12px; color: #777; font-family: Arial, sans-serif; text-align: center;">${new Date(p.fecha_pago || p.created_at).toLocaleDateString("es-MX")}</td>
        <td style="padding: 9px 14px; text-align: center;">
          <span style="font-size: 10px; font-family: Arial, sans-serif; font-weight: bold; padding: 3px 10px; border-radius: 20px; background: ${p.estado === 'completado' ? '#d1fae5' : '#fef3c7'}; color: ${p.estado === 'completado' ? '#065f46' : '#92400e'};">
            ${p.estado === 'completado' ? 'Completado' : 'Pendiente'}
          </span>
        </td>
        <td style="padding: 9px 14px; font-size: 13px; font-weight: bold; color: #059669; font-family: Arial, sans-serif; text-align: right;">$${Number(p.monto).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
      </tr>
    `).join("");

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
                <p style="font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #60a5fa; margin: 0 0 4px; font-family: Arial, sans-serif;">Stathmos · Software de Gestión</p>
                <h1 style="font-size: 30px; color: #ffffff; margin: 0; letter-spacing: -0.5px;">Reporte Financiero</h1>
              </div>
            </div>
            <p style="font-size: 12px; color: #94a3b8; margin: 0; font-family: Arial, sans-serif;">Resumen de ingresos, egresos, inventario y pagos</p>
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

      <!-- KPI CARDS -->
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 0; border-bottom: 1px solid #e5e7eb;">
        ${[
          { label: "Ingresos Reales", value: `$${stats.totalIngresos.toLocaleString("es-MX")}`, color: "#059669", bg: "#f0fdf4", border: "#bbf7d0" },
          { label: "Gastos Refacciones", value: `$${stats.totalEgresos.toLocaleString("es-MX")}`, color: "#dc2626", bg: "#fff1f2", border: "#fecdd3" },
          { label: "Utilidad Bruta", value: `$${stats.utilidadBruta.toLocaleString("es-MX")}`, color: utilidadColor, bg: stats.utilidadBruta >= 0 ? "#f0fdf4" : "#fff1f2", border: stats.utilidadBruta >= 0 ? "#bbf7d0" : "#fecdd3" },
          { label: "Por Cobrar", value: `$${stats.porCobrar.toLocaleString("es-MX")}`, color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
        ].map((k, i) => `
          <div style="padding: 22px 20px; background: ${k.bg}; border-right: ${i < 3 ? `1px solid ${k.border}` : 'none'};">
            <p style="font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: #6b7280; margin: 0 0 8px; font-family: Arial, sans-serif;">${k.label}</p>
            <p style="font-size: 20px; font-weight: bold; color: ${k.color}; margin: 0; font-family: Arial, sans-serif;">${k.value}</p>
          </div>
        `).join("")}
      </div>

      <div style="padding: 36px 50px;">

        <!-- BALANCE VISUAL -->
        <div style="margin-bottom: 36px;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 18px;">
            <div style="width: 3px; height: 18px; background: #3b82f6; border-radius: 2px;"></div>
            <h2 style="font-size: 14px; letter-spacing: 1px; text-transform: uppercase; color: #1a1a2e; margin: 0; font-family: Arial, sans-serif;">Balance Comparativo</h2>
          </div>

          <div style="background: #f8f9fa; border-radius: 10px; padding: 24px 28px; border: 1px solid #e5e7eb;">
            <div style="margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                <span style="font-size: 11px; color: #374151; font-family: Arial, sans-serif; font-weight: bold;">Ingresos</span>
                <span style="font-size: 11px; color: #059669; font-family: Arial, sans-serif; font-weight: bold;">$${stats.totalIngresos.toLocaleString("es-MX")}</span>
              </div>
              <div style="height: 14px; background: #e5e7eb; border-radius: 7px; overflow: hidden;">
                <div style="height: 100%; width: ${ingresosW}px; max-width: 100%; background: linear-gradient(to right, #059669, #34d399); border-radius: 7px;"></div>
              </div>
            </div>
            <div style="margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                <span style="font-size: 11px; color: #374151; font-family: Arial, sans-serif; font-weight: bold;">Gastos</span>
                <span style="font-size: 11px; color: #dc2626; font-family: Arial, sans-serif; font-weight: bold;">$${stats.totalEgresos.toLocaleString("es-MX")}</span>
              </div>
              <div style="height: 14px; background: #e5e7eb; border-radius: 7px; overflow: hidden;">
                <div style="height: 100%; width: ${egresosW}px; max-width: 100%; background: linear-gradient(to right, #dc2626, #f87171); border-radius: 7px;"></div>
              </div>
            </div>
            <div style="padding-top: 14px; border-top: 1px dashed #d1d5db; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 12px; font-family: Arial, sans-serif; color: #374151; font-weight: bold;">Utilidad Bruta</span>
              <span style="font-size: 18px; font-family: Arial, sans-serif; font-weight: bold; color: ${utilidadColor};">$${stats.utilidadBruta.toLocaleString("es-MX")}</span>
            </div>
          </div>
        </div>

        <!-- INVENTARIO -->
        <div style="margin-bottom: 36px;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 18px;">
            <div style="width: 3px; height: 18px; background: #8b5cf6; border-radius: 2px;"></div>
            <h2 style="font-size: 14px; letter-spacing: 1px; text-transform: uppercase; color: #1a1a2e; margin: 0; font-family: Arial, sans-serif;">Inventario de Refacciones</h2>
            <span style="margin-left: auto; font-size: 11px; background: #ede9fe; color: #6d28d9; padding: 3px 10px; border-radius: 20px; font-family: Arial, sans-serif; font-weight: bold;">
              Valor en almacén: $${stats.valorInventario.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </span>
          </div>

          <table style="width: 100%; border-collapse: collapse; border-radius: 10px; overflow: hidden; border: 1px solid #e5e7eb;">
            <thead>
              <tr style="background: #1a1a2e;">
                <th style="padding: 11px 14px; text-align: left; font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: #94a3b8; font-family: Arial, sans-serif; font-weight: bold;">Refacción</th>
                <th style="padding: 11px 14px; text-align: center; font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: #94a3b8; font-family: Arial, sans-serif; font-weight: bold;">Categoría</th>
                <th style="padding: 11px 14px; text-align: center; font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: #94a3b8; font-family: Arial, sans-serif; font-weight: bold;">Stock</th>
                <th style="padding: 11px 14px; text-align: right; font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: #94a3b8; font-family: Arial, sans-serif; font-weight: bold;">P. Compra</th>
                <th style="padding: 11px 14px; text-align: right; font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: #94a3b8; font-family: Arial, sans-serif; font-weight: bold;">Valor Total</th>
              </tr>
            </thead>
            <tbody>
              ${refaccionesRows || `<tr><td colspan="5" style="padding: 20px; text-align: center; color: #9ca3af; font-family: Arial, sans-serif; font-size: 12px;">Sin refacciones registradas</td></tr>`}
            </tbody>
          </table>
        </div>

        <!-- PAGOS RECIENTES -->
        <div style="margin-bottom: 36px;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 18px;">
            <div style="width: 3px; height: 18px; background: #10b981; border-radius: 2px;"></div>
            <h2 style="font-size: 14px; letter-spacing: 1px; text-transform: uppercase; color: #1a1a2e; margin: 0; font-family: Arial, sans-serif;">Pagos Recientes</h2>
          </div>

          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden;">
            <thead>
              <tr style="background: #1a1a2e;">
                <th style="padding: 11px 14px; text-align: left; font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: #94a3b8; font-family: Arial, sans-serif;">Proyecto</th>
                <th style="padding: 11px 14px; text-align: center; font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: #94a3b8; font-family: Arial, sans-serif;">Fecha</th>
                <th style="padding: 11px 14px; text-align: center; font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: #94a3b8; font-family: Arial, sans-serif;">Estado</th>
                <th style="padding: 11px 14px; text-align: right; font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: #94a3b8; font-family: Arial, sans-serif;">Monto</th>
              </tr>
            </thead>
            <tbody>
              ${pagosRows || `<tr><td colspan="4" style="padding: 20px; text-align: center; color: #9ca3af; font-family: Arial, sans-serif; font-size: 12px;">Sin pagos registrados</td></tr>`}
            </tbody>
          </table>
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

    // Si el contenido excede una página, agrega páginas
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

    pdf.save(`Reporte_Financiero_Stathmos_${new Date().toISOString().split("T")[0]}.pdf`);
  } catch (error) {
    console.error("Error generating PDF:", error);
  } finally {
    setExporting(false);
  }
};

  const t = darkMode ? "text-zinc-100" : "text-gray-800";
  const st = darkMode ? "text-zinc-500" : "text-gray-400";

  if (loading) {
    return (
      <div className="flex-1 p-6 flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-800 border-t-blue-500 animate-spin" />
        <p className={st}>Generando balance financiero...</p>
      </div>
    );
  }

  return (
    <div ref={reportRef} className={`flex-1 p-4 md:p-6 min-h-full page-enter ${darkMode ? "bg-[#16161e]" : "bg-gray-50"}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <ModuleHeader
          title="Reporte Financiero"
          subtitle="Visualiza el estado económico, ingresos, egresos y proyecciones de cobro."
          darkMode={darkMode}
        />
        <Button
          onClick={handleExportPDF}
          disabled={exporting}
          variant="primary"
          className="md:self-start"
        >
          <Icon name="scroll" className="w-4 h-4" />
          {exporting ? "Generando..." : "Exportar PDF"}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Ingresos Reales"
          value={`$${stats.totalIngresos.toLocaleString()}`}
          icon="dollar"
          color="emerald"
          darkMode={darkMode}
          trend={`${stats.totalIngresos > 0 ? '+100%' : '0%'} de efectividad`}
        />
        <StatCard
          label="Gastos Refacciones"
          value={`$${stats.totalEgresos.toLocaleString()}`}
          icon="shoppingcart"
          color="red"
          darkMode={darkMode}
          trend="Inversión en stock"
        />
        <StatCard
          label="Utilidad Bruta"
          value={`$${stats.utilidadBruta.toLocaleString()}`}
          icon="chart"
          color={stats.utilidadBruta >= 0 ? "blue" : "red"}
          darkMode={darkMode}
          trend="Ingresos - Gastos"
        />
        <StatCard
          label="Cuentas por Cobrar"
          value={`$${stats.porCobrar.toLocaleString()}`}
          icon="clipboard"
          color="amber"
          darkMode={darkMode}
          trend="Saldo en calle"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6" darkMode={darkMode}>
          <div className="flex justify-between items-center mb-6">
            <h3 className={`text-sm font-bold ${t}`}>Balance Proporcional</h3>
            <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest">
              <span className="text-emerald-500 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Ingresos</span>
              <span className="text-red-500 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500" /> Gastos</span>
            </div>
          </div>

          <div className="h-64 flex items-end gap-12 px-8 pb-8 border-b border-zinc-800/50">
            <div className="flex-1 flex flex-col items-center gap-3 h-full justify-end">
              <div className="w-full bg-emerald-500/20 rounded-t-lg relative transition-all hover:bg-emerald-500/30 group border-t-2 border-emerald-500" style={{ height: `${(stats.totalIngresos / stats.maxValue) * 100}%` }}>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-emerald-500 whitespace-nowrap bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity">
                  ${stats.totalIngresos.toLocaleString()}
                </div>
              </div>
              <span className={`text-[10px] font-bold ${st}`}>INGRESOS</span>
            </div>
            <div className="flex-1 flex flex-col items-center gap-3 h-full justify-end">
              <div className="w-full bg-red-500/20 rounded-t-lg relative transition-all hover:bg-red-500/30 group border-t-2 border-red-500" style={{ height: `${(stats.totalEgresos / stats.maxValue) * 100}%` }}>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-red-500 whitespace-nowrap bg-red-500/10 px-2 py-1 rounded border border-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity">
                  ${stats.totalEgresos.toLocaleString()}
                </div>
              </div>
              <span className={`text-[10px] font-bold ${st}`}>GASTOS</span>
            </div>
            <div className="flex-1 flex flex-col items-center gap-3 h-full justify-end">
              <div className="w-full bg-blue-500/20 rounded-t-lg relative transition-all hover:bg-blue-500/30 group border-t-2 border-blue-500" style={{ height: `${(Math.max(0, stats.utilidadBruta) / stats.maxValue) * 100}%` }}>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-blue-500 whitespace-nowrap bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity">
                  ${stats.utilidadBruta.toLocaleString()}
                </div>
              </div>
              <span className={`text-[10px] font-bold ${st}`}>UTILIDAD</span>
            </div>
          </div>
          <p className={`text-[10px] ${st} mt-4 italic`}>* Las barras están escaladas proporcionalmente al valor máximo detectado (${stats.maxValue.toLocaleString()}).</p>
        </Card>

        <Card className="p-6 overflow-hidden" darkMode={darkMode}>
          <h3 className={`text-sm font-bold mb-4 ${t}`}>Estatus de Activos</h3>
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
              <p className={`text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1`}>Valor Total en Stock</p>
              <h4 className={`text-2xl font-bold ${t}`}>${stats.valorInventario.toLocaleString()}</h4>
              <p className={`text-[10px] ${st} mt-1`}>Dinero invertido actualmente en refacciones.</p>
            </div>

            <div>
              <p className={`text-[10px] font-bold ${st} uppercase tracking-widest mb-3`}>Flujo de Caja Reciente</p>
              <div className="space-y-3">
                {pagos.slice(0, 5).map(p => (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-zinc-800/30 last:border-0">
                    <div>
                      <p className={`text-[11px] font-bold ${t} truncate max-w-[120px]`}>{p.proyectos?.titulo || 'Venta Directa'}</p>
                      <p className={`text-[9px] ${st}`}>{formatDateTimeWorkshop(p.fecha_pago || p.created_at)}</p>
                    </div>
                    <Badge darkMode={darkMode} variant={p.estado === 'completado' ? 'success' : 'warning'}>
                      ${Number(p.monto).toLocaleString()}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color, darkMode, trend }) {
  const colors = {
    emerald: "text-emerald-500 bg-emerald-500/10",
    red: "text-red-500 bg-red-500/10",
    blue: "text-blue-500 bg-blue-500/10",
    amber: "text-amber-500 bg-amber-500/10",
  };

  return (
    <Card className="p-5 flex flex-col gap-3 relative overflow-hidden" darkMode={darkMode}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
        <Icon name={icon} className="w-5 h-5" />
      </div>
      <div>
        <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? "text-zinc-500" : "text-gray-400"}`}>{label}</p>
        <h3 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{value}</h3>
        {trend && <p className={`text-[10px] font-medium mt-1 ${color === 'red' ? 'text-red-400' : 'text-emerald-400'}`}>{trend}</p>}
      </div>
      <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full ${colors[color]} opacity-5 blur-2xl`} />
    </Card>
  );
}