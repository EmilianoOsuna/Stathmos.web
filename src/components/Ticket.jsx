import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../supabase";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { formatDateTimeWorkshop, formatDateWorkshop } from "../utils/datetime";

export default function Ticket({ proyectoId, darkMode = false, onClose = null }) {
  const ticketRef = useRef(null);
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const getLatestCotizacion = (cotizaciones = []) => {
    const sorted = [...cotizaciones].sort((a, b) => {
      const ad = new Date(a?.created_at || a?.fecha_emision || 0).getTime();
      const bd = new Date(b?.created_at || b?.fecha_emision || 0).getTime();
      return bd - ad;
    });

    const aprobada = sorted.find((c) => c?.estado === "aprobada");
    return aprobada || sorted[0] || null;
  };

  // Datos formulario de pago
  const [cardData, setCardData] = useState({
    titular: "",
    numero: "",
    mes: "",
    ano: "",
    cvv: "",
  });

  const [efectivoData, setEfectivoData] = useState({
    confirmacion: false,
  });

  useEffect(() => {
    fetchTicket();
  }, [proyectoId]);

  const fetchTicket = async () => {
    try {
      setLoading(true);

      // Obtener datos del proyecto con información completa
      const { data: proyecto, error: errorProyecto } = await supabase
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
            telefono,
            correo,
            rfc,
            direccion
          ),
          vehiculos (
            marca,
            modelo,
            anio,
            placas,
            color
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
          )
        `
        )
        .eq("id", proyectoId)
        .single();

      if (errorProyecto) throw errorProyecto;

      const cotizacion = getLatestCotizacion(Array.isArray(proyecto?.cotizaciones) ? proyecto.cotizaciones : []);

      const { data: pagos, error: pagosError } = await supabase
        .from("pagos")
        .select("id, monto, metodo_cobro, fecha_pago, referencia, factura_id, facturas(folio)")
        .eq("proyecto_id", proyectoId)
        .order("fecha_pago", { ascending: false })
        .limit(1);

      if (pagosError) {
        console.warn("No se pudo cargar el pago:", pagosError.message || pagosError);
      }

      const pagoRaw = Array.isArray(pagos) ? pagos[0] : null;
      const pago = pagoRaw
        ? {
            ...pagoRaw,
            factura_folio: pagoRaw.facturas?.folio || null,
          }
        : null;

      setTicket({
        id: proyecto.id,
        titulo: proyecto.titulo,
        descripcion: proyecto.descripcion,
        estado: proyecto.estado,
        fechaIngreso: proyecto.fecha_ingreso,
        fechaCierre: proyecto.fecha_cierre,
        cliente: proyecto.clientes || null,
        vehiculo: proyecto.vehiculos,
        cotizacion,
        items: cotizacion?.cotizacion_items || [],
        pago,
      });
    } catch (error) {
      console.error("Error al obtener ticket:", error);
      setPaymentError("Error al cargar el ticket");
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    try {
      setGeneratingPDF(true);
      
      if (!ticketRef.current) {
        setPaymentError("Error: No se puede generar el PDF");
        return;
      }

      const canvas = await html2canvas(ticketRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= 297;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= 297;
      }

      const nombreArchivo = `Ticket_${ticket.id.slice(0, 8).toUpperCase()}_${new Date().getTime()}.pdf`;
      pdf.save(nombreArchivo);
      
      setGeneratingPDF(false);
    } catch (error) {
      console.error("Error al generar PDF:", error);
      setPaymentError("Error al generar el PDF");
      setGeneratingPDF(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleOmit = () => {
    if (onClose) {
      onClose();
      return;
    }
    navigate(-1);
  };


  const handlePayment = async (metodo) => {
    try {
      setProcessingPayment(true);
      setPaymentError(null);

      // Validaciones según método
      if (metodo === "tarjeta") {
        if (
          !cardData.titular ||
          !cardData.numero ||
          !cardData.mes ||
          !cardData.ano ||
          !cardData.cvv
        ) {
          setPaymentError("Por favor completa todos los datos de la tarjeta");
          setProcessingPayment(false);
          return;
        }
        // Validación básica del número de tarjeta
        if (cardData.numero.replace(/\s/g, "").length !== 16) {
          setPaymentError("El número de tarjeta debe tener 16 dígitos");
          setProcessingPayment(false);
          return;
        }
      } else if (metodo === "efectivo") {
        if (!efectivoData.confirmacion) {
          setPaymentError("Por favor confirma que entiendes los términos");
          setProcessingPayment(false);
          return;
        }
      }

      const montoTotal = ticket.cotizacion?.monto_total || 0;
      if (montoTotal <= 0) {
        throw new Error("No se puede cobrar un ticket sin cotización válida.");
      }

      const cotizacionAprobada = ticket.cotizacion?.estado === "aprobada";
      const proyectoEnProgreso = String(ticket.estado || "").toLowerCase().trim() === "en_progreso";
      if (!cotizacionAprobada || !proyectoEnProgreso) {
        throw new Error("No es posible procesar el pago: la cotización debe estar aprobada y el proyecto en progreso.");
      }

      const metodoCobro = metodo === "stripe" ? "tarjeta" : metodo;

      const { data: json, error: invokeError } = await supabase.functions.invoke("crear-pago", {
        body: {
          proyecto_id: ticket.id,
          monto: montoTotal,
          metodo_cobro: metodoCobro,
          referencia: null,
        },
      });

      if (invokeError) {
        throw new Error(invokeError.message || "No se pudo invocar la función crear-pago.");
      }
      if (!json?.success) {
        throw new Error(json?.error || "No se pudo registrar el pago.");
      }

      setTicket((prev) => {
        if (!prev) return prev;
        const pagoResponse = json?.pago
          ? { ...json.pago, factura_folio: json?.factura_folio || null }
          : prev.pago;
        return { ...prev, estado: "entregado", pago: pagoResponse };
      });

      setPaymentSuccess(true);
      setShowPaymentForm(false);

      setTimeout(() => {
        if (onClose) onClose();
      }, 2000);
    } catch (error) {
      console.error("Error al procesar pago:", error);
      setPaymentError("Error al procesar el pago");
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center p-8 ${
          darkMode ? "bg-[#1e1e28]" : "bg-white"
        }`}
      >
        <div
          className={`text-lg ${
            darkMode ? "text-zinc-400" : "text-gray-600"
          }`}
        >
          Cargando ticket...
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div
        className={`flex items-center justify-center p-8 ${
          darkMode ? "bg-[#1e1e28]" : "bg-white"
        }`}
      >
        <div className={`text-lg ${darkMode ? "text-red-400" : "text-red-600"}`}>
          No se encontró el ticket
        </div>
      </div>
    );
  }

  const montoTotal = ticket.cotizacion?.monto_total || 0;
  const montoManoObra = ticket.cotizacion?.monto_mano_obra || 0;
  const montoRefacciones = ticket.cotizacion?.monto_refacc || 0;
  const cotizacionAprobada = ticket.cotizacion?.estado === "aprobada";
  const proyectoEnProgreso = String(ticket.estado || "").toLowerCase().trim() === "en_progreso";
  const pagoHabilitado = cotizacionAprobada && proyectoEnProgreso;

  return (
    <div
      className={`min-h-screen p-6 ${
        darkMode
          ? "bg-gradient-to-br from-[#1a1a22] to-[#252530]"
          : "bg-gradient-to-br from-gray-50 to-gray-100"
      }`}
    >
      <style>{`
        .ticket-frame {
          padding: 18px;
          border-radius: 18px;
          background: linear-gradient(160deg, rgba(96,174,187,0.18), rgba(219,60,28,0.08));
          border: 1px solid rgba(148,163,184,0.35);
        }
        .ticket-frame-dark {
          background: linear-gradient(160deg, rgba(96,174,187,0.12), rgba(219,60,28,0.12));
          border: 1px solid rgba(63,63,80,0.7);
        }
        .ticket-wrap {
          display: flex;
          justify-content: center;
        }
        .ticket-paper {
          width: 360px;
          background: #ffffff;
          color: #111111;
          font-family: "Courier New", Courier, monospace;
          border: 1px dashed #9ca3af;
          padding: 16px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          position: relative;
        }
        .ticket-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #0f172a;
          color: #e2e8f0;
          padding: 10px 12px;
          border-radius: 10px;
          margin-bottom: 10px;
          font-weight: 700;
          font-size: 12px;
          letter-spacing: 0.5px;
        }
        .ticket-badge {
          background: #60aebb;
          color: #0b1324;
          padding: 4px 8px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 700;
        }
        .ticket-brand {
          text-align: center;
          font-weight: 700;
          font-size: 18px;
          letter-spacing: 2px;
        }
        .ticket-title {
          text-align: center;
          font-weight: 700;
          font-size: 18px;
          letter-spacing: 1px;
        }
        .ticket-subtitle {
          text-align: center;
          font-size: 11px;
          margin-top: 4px;
          color: #4b5563;
        }
        .ticket-sep {
          border-top: 1px dashed #9ca3af;
          margin: 12px 0;
        }
        .ticket-panel {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 8px 10px;
        }
        .ticket-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          margin: 2px 0;
        }
        .ticket-label {
          color: #4b5563;
        }
        .ticket-value {
          font-weight: 600;
          text-align: right;
          max-width: 200px;
        }
        .ticket-table {
          width: 100%;
          font-size: 12px;
        }
        .ticket-table-header {
          display: grid;
          grid-template-columns: 1fr 40px 70px;
          font-weight: 700;
          margin-bottom: 6px;
        }
        .ticket-table-row {
          display: grid;
          grid-template-columns: 1fr 40px 70px;
          gap: 6px;
          margin: 4px 0;
        }
        .ticket-right {
          text-align: right;
        }
        .ticket-total {
          font-size: 14px;
          font-weight: 700;
        }
        .ticket-footer {
          text-align: center;
          font-size: 11px;
          color: #4b5563;
        }
        @media print {
          body {
            background: #ffffff !important;
          }
          .ticket-print-hide {
            display: none !important;
          }
          .ticket-frame {
            padding: 0;
            border: none;
            background: transparent;
          }
          .ticket-paper {
            width: 100%;
            border: none;
            box-shadow: none;
          }
        }
      `}</style>
      <div className="max-w-2xl mx-auto">
        {/* Acciones */}
        <div className="mb-6 flex flex-wrap justify-end gap-3 ticket-print-hide">
          <button
            onClick={handleOmit}
            className={`px-4 py-2 rounded-lg font-medium border transition-colors ${
              darkMode
                ? "border-zinc-600 text-zinc-200 hover:border-zinc-400"
                : "border-gray-300 text-gray-700 hover:border-gray-500"
            }`}
          >
            Omitir
          </button>
          <button
            onClick={handlePrint}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition ${
              darkMode
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-emerald-500 text-white hover:bg-emerald-600"
            }`}
          >
            🖨️ Imprimir
          </button>
          <button
            onClick={generatePDF}
            disabled={generatingPDF || !ticket}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition ${
              darkMode
                ? "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                : "bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
            }`}
          >
            {generatingPDF ? "📥 Generando..." : "📥 Descargar PDF"}
          </button>
        </div>

        {/* Contenido del Ticket (Para PDF) */}
        <div className="ticket-wrap">
          <div className={`ticket-frame ${darkMode ? "ticket-frame-dark" : ""}`}>
            <div ref={ticketRef} className="ticket-paper">
              <div className="ticket-header">
                <span>STATHMOS</span>
                <span className="ticket-badge">Pago confirmado</span>
              </div>
              <div className="ticket-brand">Taller Mecanico Don Elias</div>
              <div className="ticket-subtitle">Comprobante de Pago</div>

            <div className="ticket-sep" />

            <div className="ticket-row">
              <span className="ticket-label">Ticket</span>
              <span className="ticket-value">#{ticket.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <div className="ticket-row">
              <span className="ticket-label">Fecha</span>
              <span className="ticket-value">{formatDateWorkshop(ticket.fechaIngreso)}</span>
            </div>
            <div className="ticket-row">
              <span className="ticket-label">Estado</span>
              <span className="ticket-value">{ticket.estado || "—"}</span>
            </div>

            <div className="ticket-sep" />

            <div className="ticket-panel">
              <div className="ticket-row">
                <span className="ticket-label">Cliente</span>
                <span className="ticket-value">{ticket.cliente?.nombre || "—"}</span>
              </div>
              <div className="ticket-row">
                <span className="ticket-label">Telefono</span>
                <span className="ticket-value">{ticket.cliente?.telefono || "—"}</span>
              </div>
              <div className="ticket-row">
                <span className="ticket-label">RFC</span>
                <span className="ticket-value">{ticket.cliente?.rfc || "—"}</span>
              </div>
            </div>

            <div className="ticket-sep" />

            <div className="ticket-panel">
              <div className="ticket-row">
                <span className="ticket-label">Vehiculo</span>
                <span className="ticket-value">
                  {ticket.vehiculo?.marca || "—"} {ticket.vehiculo?.modelo || ""}
                </span>
              </div>
              <div className="ticket-row">
                <span className="ticket-label">Placas</span>
                <span className="ticket-value">{ticket.vehiculo?.placas || "—"}</span>
              </div>
            </div>

            <div className="ticket-sep" />

            <div className="ticket-table">
              <div className="ticket-table-header">
                <span>Concepto</span>
                <span className="ticket-right">Qty</span>
                <span className="ticket-right">Total</span>
              </div>
              {(ticket.items || []).length === 0 && (
                <div className="ticket-table-row">
                  <span>Servicio</span>
                  <span className="ticket-right">1</span>
                  <span className="ticket-right">${montoTotal.toFixed(2)}</span>
                </div>
              )}
              {(ticket.items || []).map((item, idx) => (
                <div key={idx} className="ticket-table-row">
                  <span>{item.descripcion}</span>
                  <span className="ticket-right">{item.cantidad}</span>
                  <span className="ticket-right">${Number(item.subtotal || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="ticket-sep" />

            <div className="ticket-row">
              <span className="ticket-label">Mano de obra</span>
              <span className="ticket-value">${montoManoObra.toFixed(2)}</span>
            </div>
            <div className="ticket-row">
              <span className="ticket-label">Refacciones</span>
              <span className="ticket-value">${montoRefacciones.toFixed(2)}</span>
            </div>
            <div className="ticket-row ticket-total">
              <span>Total</span>
              <span className="ticket-value">${montoTotal.toFixed(2)}</span>
            </div>

            <div className="ticket-sep" />

            <div className="ticket-panel">
              <div className="ticket-row">
                <span className="ticket-label">Metodo</span>
                <span className="ticket-value">{ticket.pago?.metodo_cobro || "—"}</span>
              </div>
              <div className="ticket-row">
                <span className="ticket-label">Fecha pago</span>
                <span className="ticket-value">
                  {ticket.pago?.fecha_pago ? formatDateTimeWorkshop(ticket.pago.fecha_pago) : "—"}
                </span>
              </div>
              <div className="ticket-row">
                <span className="ticket-label">Numero de pago</span>
                <span className="ticket-value">{ticket.pago?.id || "—"}</span>
              </div>
              <div className="ticket-row">
                <span className="ticket-label">Factura</span>
                <span className="ticket-value">{ticket.pago?.factura_folio || ticket.pago?.factura_id || "—"}</span>
              </div>
              <div className="ticket-row">
                <span className="ticket-label">Referencia</span>
                <span className="ticket-value">{ticket.pago?.referencia || "—"}</span>
              </div>
            </div>

            <div className="ticket-sep" />
            <div className="ticket-footer">Gracias por tu preferencia</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
