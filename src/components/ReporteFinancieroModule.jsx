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
      container.style.width = "800px";
      container.style.padding = "40px";
      container.style.background = "white";
      container.style.fontFamily = "Arial, sans-serif";
      container.style.color = "#111";

      const hoy = new Date().toLocaleDateString("es-MX", { day: 'numeric', month: 'long', year: 'numeric' });

      container.innerHTML = `
        <div style="border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h1 style="font-size: 28px; margin: 0; color: #111;">Reporte Financiero</h1>
            <p style="font-size: 14px; margin: 5px 0 0; color: #666;">Stathmos - Software de gestión para talleres</p>
          </div>
          <div style="text-align: right;">
            <p style="font-size: 12px; font-weight: bold; margin: 0;">Fecha de Emisión</p>
            <p style="font-size: 14px; margin: 0;">${hoy}</p>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px;">
          <div style="background: #f9fafb; padding: 20px; border-radius: 12px; border: 1px solid #eee;">
            <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #666; margin: 0 0 10px;">Ingresos Reales</p>
            <p style="font-size: 24px; font-weight: bold; color: #10b981; margin: 0;">$${stats.totalIngresos.toLocaleString()}</p>
          </div>
          <div style="background: #f9fafb; padding: 20px; border-radius: 12px; border: 1px solid #eee;">
            <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #666; margin: 0 0 10px;">Gastos Refacciones</p>
            <p style="font-size: 24px; font-weight: bold; color: #ef4444; margin: 0;">$${stats.totalEgresos.toLocaleString()}</p>
          </div>
          <div style="background: #f9fafb; padding: 20px; border-radius: 12px; border: 1px solid #eee;">
            <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #666; margin: 0 0 10px;">Utilidad Bruta</p>
            <p style="font-size: 24px; font-weight: bold; color: #3b82f6; margin: 0;">$${stats.utilidadBruta.toLocaleString()}</p>
          </div>
          <div style="background: #f9fafb; padding: 20px; border-radius: 12px; border: 1px solid #eee;">
            <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #666; margin: 0 0 10px;">Saldo por Cobrar</p>
            <p style="font-size: 24px; font-weight: bold; color: #f59e0b; margin: 0;">$${stats.porCobrar.toLocaleString()}</p>
          </div>
        </div>

        <div style="margin-bottom: 40px;">
          <h2 style="font-size: 18px; margin-bottom: 15px; border-left: 4px solid #3b82f6; padding-left: 10px;">Estatus de Inventario</h2>
          <div style="background: #f3f4f6; padding: 25px; border-radius: 12px; text-align: center;">
            <p style="font-size: 12px; color: #444; margin-bottom: 5px;">Valor Total en Almacén</p>
            <p style="font-size: 32px; font-weight: bold; color: #111; margin: 0;">$${stats.valorInventario.toLocaleString()}</p>
          </div>
        </div>

        <div>
          <h2 style="font-size: 18px; margin-bottom: 15px; border-left: 4px solid #3b82f6; padding-left: 10px;">Pagos Recientes</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead>
              <tr style="background: #f9fafb; border-bottom: 2px solid #eee;">
                <th style="padding: 12px; text-align: left;">Proyecto</th>
                <th style="padding: 12px; text-align: center;">Fecha</th>
                <th style="padding: 12px; text-align: right;">Monto</th>
              </tr>
            </thead>
            <tbody>
              ${pagos.slice(0, 8).map(p => `
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 12px; font-weight: bold;">${p.proyectos?.titulo || 'Venta Directa'}</td>
                  <td style="padding: 12px; text-align: center; color: #666;">${new Date(p.fecha_pago || p.created_at).toLocaleDateString()}</td>
                  <td style="padding: 12px; text-align: right; font-weight: bold; color: #10b981;">$${Number(p.monto).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div style="margin-top: 50px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 20px;">
          Este documento es un reporte financiero generado por Stathmos. No tiene validez fiscal oficial.
        </div>
      `;

      document.body.appendChild(container);

      const canvas = await html2canvas(container, {
        scale: 2,
        backgroundColor: "#ffffff",
        logging: false,
        useCORS: true
      });

      document.body.removeChild(container);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Reporte_Financiero_${new Date().toISOString().split("T")[0]}.pdf`);
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
