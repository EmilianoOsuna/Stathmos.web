import { useState, useEffect, useRef } from "react";
import supabase from "../supabase";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { formatDateWorkshop } from "../utils/datetime";

export default function Ticket({ proyectoId, darkMode = false, onClose = null }) {
  const ticketRef = useRef(null);
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);

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
          vehiculos (
            marca,
            modelo,
            anio,
            placas,
            color
          ),
          cotizaciones (
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

      setTicket({
        id: proyecto.id,
        titulo: proyecto.titulo,
        descripcion: proyecto.descripcion,
        estado: proyecto.estado,
        fechaIngreso: proyecto.fecha_ingreso,
        fechaCierre: proyecto.fecha_cierre,
        vehiculo: proyecto.vehiculos,
        cotizacion: proyecto.cotizaciones?.[0] || null,
        items: proyecto.cotizaciones?.[0]?.cotizacion_items || [],
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
        backgroundColor: darkMode ? "#1a1a22" : "#ffffff",
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

      setTicket((prev) => (prev ? { ...prev, estado: "entregado" } : prev));

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

  return (
    <div
      className={`min-h-screen p-6 ${
        darkMode
          ? "bg-gradient-to-br from-[#1a1a22] to-[#252530]"
          : "bg-gradient-to-br from-gray-50 to-gray-100"
      }`}
    >
      <div className="max-w-2xl mx-auto">
        {/* Botón Descargar PDF */}
        <div className="mb-6 flex justify-end">
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
        <div ref={ticketRef} className={darkMode ? "bg-[#1a1a22]" : "bg-white"}>
          {/* Encabezado Ticket */}
          <div
          className={`rounded-lg p-6 mb-6 border ${
            darkMode
              ? "bg-[#1e1e28] border-zinc-800"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1
                className={`text-3xl font-bold ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Ticket #{ticket.id.slice(0, 8).toUpperCase()}
              </h1>
              <p
                className={`text-sm mt-1 ${
                  darkMode ? "text-zinc-400" : "text-gray-500"
                }`}
              >
                {formatDateWorkshop(ticket.fechaIngreso, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                ticket.estado === "entregado"
                  ? "bg-emerald-900/30 text-emerald-300 border border-emerald-800"
                  : "bg-blue-900/30 text-blue-300 border border-blue-800"
              }`}
            >
              {ticket.estado === "entregado" ? "Entregado" : "Pendiente"}
            </div>
          </div>
        </div>

        {/* Información del Vehículo */}
        <div
          className={`rounded-lg p-6 mb-6 border ${
            darkMode
              ? "bg-[#1e1e28] border-zinc-800"
              : "bg-white border-gray-200"
          } shadow-sm`}
        >
          <h2
            className={`text-xl font-semibold mb-4 ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            🚗 Tu Vehículo
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className={`text-xs ${darkMode ? "text-zinc-500" : "text-gray-500"}`}>
                Marca
              </p>
              <p
                className={`text-lg font-semibold ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                {ticket.vehiculo?.marca || "—"}
              </p>
            </div>
            <div>
              <p className={`text-xs ${darkMode ? "text-zinc-500" : "text-gray-500"}`}>
                Modelo
              </p>
              <p
                className={`text-lg font-semibold ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                {ticket.vehiculo?.modelo || "—"}
              </p>
            </div>
            <div>
              <p className={`text-xs ${darkMode ? "text-zinc-500" : "text-gray-500"}`}>
                Año
              </p>
              <p
                className={`text-lg font-semibold ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                {ticket.vehiculo?.anio || "—"}
              </p>
            </div>
            <div>
              <p className={`text-xs ${darkMode ? "text-zinc-500" : "text-gray-500"}`}>
                Placas
              </p>
              <p
                className={`text-lg font-semibold ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                {ticket.vehiculo?.placas || "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Servicio Realizado */}
        <div
          className={`rounded-lg p-6 mb-6 border ${
            darkMode
              ? "bg-[#1e1e28] border-zinc-800"
              : "bg-white border-gray-200"
          } shadow-sm`}
        >
          <h2
            className={`text-xl font-semibold mb-4 ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            🔧 Servicio Realizado
          </h2>
          <div
            className={`p-4 rounded-lg mb-4 ${
              darkMode ? "bg-zinc-900/50" : "bg-gray-50"
            }`}
          >
            <p
              className={`font-semibold ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {ticket.titulo}
            </p>
            <p
              className={`text-sm mt-2 ${
                darkMode ? "text-zinc-400" : "text-gray-600"
              }`}
            >
              {ticket.descripcion || "Sin descripción"}
            </p>
          </div>

          {ticket.items.length > 0 && (
            <div>
              <p
                className={`font-semibold mb-3 ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Detalles de Servicios:
              </p>
              <div className="space-y-2">
                {ticket.items.map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex justify-between p-2 rounded ${
                      darkMode ? "bg-zinc-900/30" : "bg-gray-100"
                    }`}
                  >
                    <div className="flex-1">
                      <p
                        className={`text-sm ${
                          darkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {item.descripcion}
                      </p>
                      <p
                        className={`text-xs ${
                          darkMode ? "text-zinc-500" : "text-gray-500"
                        }`}
                      >
                        Cantidad: {item.cantidad}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-semibold ${
                          darkMode ? "text-emerald-400" : "text-emerald-600"
                        }`}
                      >
                        ${item.subtotal.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Desglose de Precios */}
        <div
          className={`rounded-lg p-6 mb-6 border ${
            darkMode
              ? "bg-[#1e1e28] border-zinc-800"
              : "bg-white border-gray-200"
          } shadow-sm`}
        >
          <h2
            className={`text-xl font-semibold mb-4 ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            💰 Desglose de Precios
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className={darkMode ? "text-zinc-400" : "text-gray-600"}>
                Mano de Obra
              </p>
              <p
                className={`font-semibold ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                ${montoManoObra.toFixed(2)}
              </p>
            </div>
            <div className="flex justify-between items-center">
              <p className={darkMode ? "text-zinc-400" : "text-gray-600"}>
                Refacciones
              </p>
              <p
                className={`font-semibold ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                ${montoRefacciones.toFixed(2)}
              </p>
            </div>
            <div
              className={`border-t pt-3 flex justify-between items-center ${
                darkMode ? "border-zinc-700" : "border-gray-200"
              }`}
            >
              <p
                className={`font-semibold text-lg ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Total
              </p>
              <p className="font-bold text-2xl text-emerald-500">
                ${montoTotal.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Métodos de Pago */}
        {ticket.estado !== "entregado" && (
          <div
            className={`rounded-lg p-6 border ${
              darkMode
                ? "bg-[#1e1e28] border-zinc-800"
                : "bg-white border-gray-200"
            } shadow-sm`}
          >
            <h2
              className={`text-xl font-semibold mb-4 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              💳 Métodos de Pago
            </h2>

            {paymentSuccess && (
              <div className="bg-emerald-900/30 border border-emerald-700 rounded-lg p-4 mb-4">
                <p className="text-emerald-300 font-semibold">
                  ✓ Pago procesado correctamente
                </p>
              </div>
            )}

            {paymentError && (
              <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-4">
                <p className="text-red-300">{paymentError}</p>
              </div>
            )}

            {!showPaymentForm ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Tarjeta */}
                <button
                  onClick={() => {
                    setSelectedPayment("tarjeta");
                    setShowPaymentForm(true);
                  }}
                  disabled={processingPayment}
                  className={`p-4 rounded-lg border-2 transition ${
                    selectedPayment === "tarjeta"
                      ? "border-blue-500 bg-blue-900/10"
                      : darkMode
                      ? "border-zinc-700 bg-zinc-900/50 hover:border-blue-600"
                      : "border-gray-300 bg-gray-50 hover:border-blue-500"
                  }`}
                >
                  <p className="text-2xl mb-2">💳</p>
                  <p
                    className={`font-semibold ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Tarjeta
                  </p>
                  <p
                    className={`text-xs ${
                      darkMode ? "text-zinc-400" : "text-gray-600"
                    }`}
                  >
                    Débito o Crédito
                  </p>
                </button>

                {/* Efectivo */}
                <button
                  onClick={() => {
                    setSelectedPayment("efectivo");
                    setShowPaymentForm(true);
                  }}
                  disabled={processingPayment}
                  className={`p-4 rounded-lg border-2 transition ${
                    selectedPayment === "efectivo"
                      ? "border-blue-500 bg-blue-900/10"
                      : darkMode
                      ? "border-zinc-700 bg-zinc-900/50 hover:border-blue-600"
                      : "border-gray-300 bg-gray-50 hover:border-blue-500"
                  }`}
                >
                  <p className="text-2xl mb-2">💵</p>
                  <p
                    className={`font-semibold ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Efectivo
                  </p>
                  <p
                    className={`text-xs ${
                      darkMode ? "text-zinc-400" : "text-gray-600"
                    }`}
                  >
                    En sucursal
                  </p>
                </button>

                {/* Stripe */}
                <button
                  onClick={() => {
                    setSelectedPayment("stripe");
                    setShowPaymentForm(true);
                  }}
                  disabled={processingPayment}
                  className={`p-4 rounded-lg border-2 transition ${
                    selectedPayment === "stripe"
                      ? "border-blue-500 bg-blue-900/10"
                      : darkMode
                      ? "border-zinc-700 bg-zinc-900/50 hover:border-blue-600"
                      : "border-gray-300 bg-gray-50 hover:border-blue-500"
                  }`}
                >
                  <p className="text-2xl mb-2">🌐</p>
                  <p
                    className={`font-semibold ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Stripe
                  </p>
                  <p
                    className={`text-xs ${
                      darkMode ? "text-zinc-400" : "text-gray-600"
                    }`}
                  >
                    Online
                  </p>
                </button>
              </div>
            ) : (
              /* Formulario de Pago */
              <div
                className={`p-4 rounded-lg ${
                  darkMode ? "bg-zinc-900/50" : "bg-gray-50"
                }`}
              >
                {selectedPayment === "tarjeta" && (
                  <div className="space-y-4">
                    <div>
                      <label
                        className={`block text-sm font-medium mb-1 ${
                          darkMode ? "text-zinc-300" : "text-gray-700"
                        }`}
                      >
                        Titular de la Tarjeta
                      </label>
                      <input
                        type="text"
                        value={cardData.titular}
                        onChange={(e) =>
                          setCardData({ ...cardData, titular: e.target.value })
                        }
                        placeholder="Juan Pérez"
                        className={`w-full px-3 py-2 rounded border ${
                          darkMode
                            ? "bg-zinc-800 border-zinc-700 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                      />
                    </div>
                    <div>
                      <label
                        className={`block text-sm font-medium mb-1 ${
                          darkMode ? "text-zinc-300" : "text-gray-700"
                        }`}
                      >
                        Número de Tarjeta
                      </label>
                      <input
                        type="text"
                        value={cardData.numero}
                        onChange={(e) =>
                          setCardData({
                            ...cardData,
                            numero: e.target.value.replace(/\D/g, "").slice(0, 16),
                          })
                        }
                        placeholder="1234 5678 9012 3456"
                        maxLength="19"
                        className={`w-full px-3 py-2 rounded border ${
                          darkMode
                            ? "bg-zinc-800 border-zinc-700 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label
                          className={`block text-sm font-medium mb-1 ${
                            darkMode ? "text-zinc-300" : "text-gray-700"
                          }`}
                        >
                          Mes
                        </label>
                        <input
                          type="text"
                          value={cardData.mes}
                          onChange={(e) =>
                            setCardData({
                              ...cardData,
                              mes: e.target.value
                                .replace(/\D/g, "")
                                .slice(0, 2),
                            })
                          }
                          placeholder="MM"
                          maxLength="2"
                          className={`w-full px-3 py-2 rounded border ${
                            darkMode
                              ? "bg-zinc-800 border-zinc-700 text-white"
                              : "bg-white border-gray-300 text-gray-900"
                          }`}
                        />
                      </div>
                      <div>
                        <label
                          className={`block text-sm font-medium mb-1 ${
                            darkMode ? "text-zinc-300" : "text-gray-700"
                          }`}
                        >
                          Año
                        </label>
                        <input
                          type="text"
                          value={cardData.ano}
                          onChange={(e) =>
                            setCardData({
                              ...cardData,
                              ano: e.target.value
                                .replace(/\D/g, "")
                                .slice(0, 2),
                            })
                          }
                          placeholder="YY"
                          maxLength="2"
                          className={`w-full px-3 py-2 rounded border ${
                            darkMode
                              ? "bg-zinc-800 border-zinc-700 text-white"
                              : "bg-white border-gray-300 text-gray-900"
                          }`}
                        />
                      </div>
                      <div>
                        <label
                          className={`block text-sm font-medium mb-1 ${
                            darkMode ? "text-zinc-300" : "text-gray-700"
                          }`}
                        >
                          CVV
                        </label>
                        <input
                          type="text"
                          value={cardData.cvv}
                          onChange={(e) =>
                            setCardData({
                              ...cardData,
                              cvv: e.target.value
                                .replace(/\D/g, "")
                                .slice(0, 3),
                            })
                          }
                          placeholder="CVV"
                          maxLength="3"
                          className={`w-full px-3 py-2 rounded border ${
                            darkMode
                              ? "bg-zinc-800 border-zinc-700 text-white"
                              : "bg-white border-gray-300 text-gray-900"
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {selectedPayment === "efectivo" && (
                  <div className="space-y-4">
                    <p
                      className={`text-sm ${
                        darkMode ? "text-zinc-300" : "text-gray-700"
                      }`}
                    >
                      Deberás pagar la cantidad de <strong>${montoTotal.toFixed(2)}</strong> en nuestra sucursal en efectivo.
                    </p>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={efectivoData.confirmacion}
                        onChange={(e) =>
                          setEfectivoData({
                            ...efectivoData,
                            confirmacion: e.target.checked,
                          })
                        }
                        className="w-4 h-4 rounded"
                      />
                      <span
                        className={`text-sm ${
                          darkMode ? "text-zinc-300" : "text-gray-700"
                        }`}
                      >
                        Confirmo que pagaré en efectivo en la sucursal
                      </span>
                    </label>
                  </div>
                )}

                {selectedPayment === "stripe" && (
                  <div className="space-y-4">
                    <p
                      className={`text-sm ${
                        darkMode ? "text-zinc-300" : "text-gray-700"
                      }`}
                    >
                      Serás redirigido a Stripe para completar el pago de forma segura.
                    </p>
                    <div className="bg-blue-900/20 border border-blue-700 rounded p-3">
                      <p className="text-blue-300 text-sm">
                        We'll integrate Stripe payment gateway for secure online payments.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowPaymentForm(false)}
                    disabled={processingPayment}
                    className={`flex-1 px-4 py-2 rounded font-medium ${
                      darkMode
                        ? "bg-zinc-700 text-white hover:bg-zinc-600"
                        : "bg-gray-300 text-gray-900 hover:bg-gray-400"
                    }`}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handlePayment(selectedPayment)}
                    disabled={processingPayment}
                    className="flex-1 px-4 py-2 rounded font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {processingPayment ? "Procesando..." : "Pagar"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {ticket.estado === "entregado" && (
          <div className="bg-emerald-900/20 border border-emerald-700 rounded-lg p-4 text-center">
            <p className="text-emerald-300 font-semibold">
              ✓ Servicio completado y pagado
            </p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
