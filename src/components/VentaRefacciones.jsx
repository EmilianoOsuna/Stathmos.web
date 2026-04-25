import { useEffect, useMemo, useState } from "react";
import supabase from "../supabase";

const C_RED = "#db3c1c";

const inputCls = (darkMode) =>
  `w-full rounded-md px-3 py-2 text-sm outline-none transition-colors border ${
    darkMode ? "bg-[#2a2a35] border-zinc-700 text-white placeholder-zinc-600" : "bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400"
  }`;

const fmtMoney = (value) => {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n.toFixed(2) : "0.00";
};

export default function VentaRefacciones({ darkMode }) {
  const [refacciones, setRefacciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("refacciones")
        .select("id, nombre, numero_parte, precio_venta, stock")
        .eq("activo", true)
        .order("nombre");
      
      if (error) throw error;
      setRefacciones(data || []);
    } catch (err) {
      console.error("Error al cargar refacciones:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const filtered = useMemo(() => (
    refacciones.filter((r) =>
      r.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      r.numero_parte?.toLowerCase().includes(search.toLowerCase())
    )
  ), [refacciones, search]);

  const showStatus = (type, message) => {
    setStatus({ type, message });
    if (type === "success") setTimeout(() => setStatus({ type: "", message: "" }), 5000);
  };

  const addToCart = (refaccion) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === refaccion.id);
      if (existing) {
        if (existing.cantidad + 1 > refaccion.stock) {
          showStatus("error", `No hay suficiente stock de ${refaccion.nombre}`);
          return prev;
        }
        return prev.map((item) =>
          item.id === refaccion.id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: refaccion.id,
          nombre: refaccion.nombre,
          numero_parte: refaccion.numero_parte,
          stock: refaccion.stock,
          cantidad: 1,
          precio_unit: Number(refaccion.precio_venta || 0),
        },
      ];
    });
  };

  const updateCartItem = (id, patch) => {
    setCart((prev) => prev.map((item) => {
      if (item.id === id) {
        const updated = { ...item, ...patch };
        if (updated.cantidad > item.stock) {
          showStatus("error", `Stock máximo alcanzado (${item.stock})`);
          return { ...item, cantidad: item.stock };
        }
        return updated;
      }
      return item;
    }));
  };

  const removeCartItem = (id) => setCart((prev) => prev.filter((item) => item.id !== id));

  const total = cart.reduce((sum, item) => sum + (Number(item.precio_unit) * item.cantidad), 0);

  const handleSubmit = async () => {
    showStatus("", "");
    if (!cart.length) return;

    setSaving(true);
    try {
      for (const item of cart) {
        const { data, error } = await supabase.functions.invoke("gestionar-inventario", {
          body: {
            tipo_operacion: "VENTA",
            refaccion_id: item.id,
            cantidad: Number(item.cantidad),
            precio_unit: Number(item.precio_unit),
            proyecto_id: null, // Venta directa de mostrador
          },
        });

        if (error || !data?.success) {
          throw new Error(error?.message || data?.error || `Error procesando ${item.nombre}`);
        }
      }

      showStatus("success", "Venta de mostrador registrada correctamente.");
      setCart([]);
      fetchAll();
    } catch (err) {
      showStatus("error", err?.message || "Error al registrar la venta.");
    } finally {
      setSaving(false);
    }
  };

  const t = darkMode ? "text-zinc-100" : "text-gray-800";
  const st = darkMode ? "text-zinc-500" : "text-gray-400";
  const divider = darkMode ? "divide-zinc-800 border-zinc-800" : "divide-gray-100 border-gray-100";

  return (
    <div className={`flex-1 p-4 md:p-6 min-h-full page-enter ${darkMode ? "bg-[#16161e]" : "bg-gray-50"}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className={`text-lg font-semibold ${t}`}>Venta de Mostrador</h2>
          <p className={`text-xs ${st} mt-0.5`}>Venta directa de refacciones (sin proyecto)</p>
        </div>
      </div>

      {status.message && (
        <div className={`mb-4 rounded-md border px-4 py-3 text-sm anim-fadeUp ${
          status.type === "success" 
            ? "bg-emerald-900/20 text-emerald-300 border-emerald-800" 
            : "bg-red-900/20 text-red-300 border-red-800"
        }`}>
          {status.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
        {/* Catálogo */}
        <div className={`rounded-xl border p-4 ${darkMode ? "bg-[#1e1e28] border-zinc-800" : "bg-white border-gray-200"}`}>
          <input 
            className={inputCls(darkMode)} 
            placeholder="Buscar por nombre o número de parte..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
          
          {loading ? (
            <div className={`p-12 text-center ${st} text-sm`}>Cargando catálogo...</div>
          ) : (
            <div className={`divide-y ${divider} mt-4`}>
              {filtered.map((r) => (
                <div key={r.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className={`font-medium ${t}`}>{r.nombre}</p>
                    <p className={`text-xs ${st}`}>
                      {r.numero_parte || "S/N"} · 
                      <span className={r.stock <= 5 ? "text-amber-500 font-bold" : ""}> Stock: {r.stock}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className={`text-sm font-semibold ${t}`}>${fmtMoney(r.precio_venta)}</p>
                    <button 
                      onClick={() => addToCart(r)} 
                      disabled={r.stock <= 0}
                      className="px-3 py-1.5 rounded-md text-xs font-medium border bg-zinc-800 text-white disabled:opacity-20 hover:bg-zinc-700 transition-colors"
                    >
                      Agregar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Carrito */}
        <div className={`rounded-xl border p-5 h-fit ${darkMode ? "bg-[#1e1e28] border-zinc-800" : "bg-white border-gray-200"}`}>
          <h3 className={`text-base font-semibold mb-4 ${t} flex items-center gap-2`}>
            <span>🛒</span> Resumen de Venta
          </h3>

          {cart.length === 0 ? (
            <div className={`py-10 text-center ${st} border-2 border-dashed ${divider} rounded-lg text-sm`}>
              No hay productos seleccionados
            </div>
          ) : (
            <div className="space-y-4">
              <div className={`divide-y ${divider}`}>
                {cart.map((item) => (
                  <div key={item.id} className="py-3 group">
                    <div className="flex justify-between items-start mb-2">
                      <div className="max-w-[70%]">
                        <p className={`text-sm font-medium ${t} truncate`}>{item.nombre}</p>
                        <p className={`text-[10px] ${st}`}>Unit: ${fmtMoney(item.precio_unit)}</p>
                      </div>
                      <button onClick={() => removeCartItem(item.id)} className="text-zinc-500 hover:text-red-500 transition-colors">
                        <span className="text-xs">Quitar</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`text-[9px] font-bold uppercase tracking-tighter ${st}`}>Cantidad</label>
                        <input 
                          type="number" 
                          className={inputCls(darkMode)} 
                          value={item.cantidad} 
                          onChange={(e) => updateCartItem(item.id, { cantidad: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <label className={`text-[9px] font-bold uppercase tracking-tighter ${st}`}>Subtotal</label>
                        <div className={`px-3 py-2 text-sm font-semibold ${t}`}>
                          ${fmtMoney(item.precio_unit * item.cantidad)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className={`pt-4 border-t-2 ${divider}`}>
                <div className="flex justify-between items-center mb-6">
                  <p className={`text-sm font-medium ${st}`}>Total a pagar:</p>
                  <p className="text-2xl font-bold text-emerald-500">${fmtMoney(total)}</p>
                </div>

                <button 
                  onClick={handleSubmit} 
                  disabled={saving || cart.length === 0}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-lg shadow-red-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Procesando venta..." : "FINALIZAR VENTA"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}