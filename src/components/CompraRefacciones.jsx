import { useEffect, useMemo, useState } from "react";
import supabase from "../supabase";

const C_BLUE = "#60aebb";

const inputCls = (darkMode) =>
  `w-full rounded-md px-3 py-2 text-sm outline-none transition-colors border ${
    darkMode ? "bg-[#2a2a35] border-zinc-700 text-white placeholder-zinc-600" : "bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400"
  }`;

const fmtMoney = (value) => {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n.toFixed(2) : "0.00";
};

export default function CompraRefacciones({ darkMode }) {
  const [refacciones, setRefacciones] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [proveedorId, setProveedorId] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: refData }, { data: provData }] = await Promise.all([
      supabase
        .from("refacciones")
        .select("id, nombre, numero_parte, precio_compra, stock")
        .order("nombre"),
      supabase
        .from("proveedores")
        .select("id, nombre")
        .eq("activo", true)
        .order("nombre"),
    ]);
    setRefacciones(refData || []);
    setProveedores(provData || []);
    setLoading(false);
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

  const showStatus = (type, message) => setStatus({ type, message });

  const addToCart = (refaccion) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === refaccion.id);
      if (existing) {
        return prev.map((item) =>
          item.id === refaccion.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          id: refaccion.id,
          nombre: refaccion.nombre,
          numero_parte: refaccion.numero_parte,
          cantidad: 1,
          precio_unit: Number(refaccion.precio_compra || 0),
        },
      ];
    });
  };

  const updateCartItem = (id, patch) => {
    setCart((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const removeCartItem = (id) => setCart((prev) => prev.filter((item) => item.id !== id));

  const total = cart.reduce((sum, item) => sum + Number(item.precio_unit || 0) * Number(item.cantidad || 0), 0);

  const handleSubmit = async () => {
    showStatus("", "");
    if (!cart.length) {
      showStatus("error", "Agrega al menos una refaccion.");
      return;
    }

    setSaving(true);
    try {
      for (const item of cart) {
        const cantidadNum = Number(item.cantidad);
        const precioUnitNum = Number(item.precio_unit);

        if (!Number.isFinite(cantidadNum) || cantidadNum <= 0 || !Number.isFinite(precioUnitNum) || precioUnitNum < 0) {
          throw new Error("Cantidad o precio unitario invalido.");
        }

        const { data, error } = await supabase.functions.invoke("gestionar-inventario", {
          body: {
            tipo_operacion: "COMPRA",
            refaccion_id: item.id,
            cantidad: cantidadNum,
            precio_unit: precioUnitNum,
            proveedor_id: proveedorId || null,
          },
        });

        if (error || !data?.success) {
          throw new Error(error?.message || data?.error || "No se pudo registrar la compra.");
        }
      }

      showStatus("success", "Compra registrada y stock actualizado.");
      setCart([]);
      setProveedorId("");
      await fetchAll();
    } catch (err) {
      showStatus("error", err?.message || "Error al registrar la compra.");
    } finally {
      setSaving(false);
    }
  };

  const t = darkMode ? "text-zinc-100" : "text-gray-800";
  const st = darkMode ? "text-zinc-500" : "text-gray-400";
  const divider = darkMode ? "divide-zinc-800" : "divide-gray-100";
  const rowH = darkMode ? "hover:bg-[#25252f]" : "hover:bg-gray-50";

  return (
    <div className={`flex-1 p-4 md:p-6 min-h-full page-enter ${darkMode ? "bg-[#16161e]" : "bg-gray-50"}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className={`text-lg font-semibold ${t}`}>Compra de Refacciones</h2>
          <p className={`text-xs ${st} mt-0.5`}>Selecciona refacciones y confirma la compra</p>
        </div>
      </div>

      {status.message && (
        <div
          className={`mb-4 rounded-md border px-4 py-3 text-sm ${
            status.type === "success"
              ? darkMode
                ? "border-emerald-900/50 bg-emerald-900/20 text-emerald-300"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
              : darkMode
              ? "border-red-900/50 bg-red-900/20 text-red-300"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {status.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4">
        <div className={`rounded-xl border p-4 ${darkMode ? "bg-[#1e1e28] border-zinc-800" : "bg-white border-gray-200"}`}>
          <div className="mb-3">
            <input
              className={inputCls(darkMode)}
              placeholder="Buscar refaccion por nombre o numero de parte..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div className={`p-12 text-center ${st} text-sm`}>Cargando...</div>
          ) : filtered.length === 0 ? (
            <div className={`p-12 text-center ${st} text-sm`}>Sin resultados</div>
          ) : (
            <div className={`divide-y ${divider}`}>
              {filtered.map((r) => (
                <div key={r.id} className={`py-3 flex items-center justify-between gap-3 ${rowH}`}>
                  <div>
                    <p className={`font-medium ${t}`}>{r.nombre}</p>
                    <p className={`text-xs ${st}`}>{r.numero_parte || "—"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className={`text-sm ${st}`}>${fmtMoney(r.precio_compra)}</p>
                    <button
                      onClick={() => addToCart(r)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium border ${darkMode ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800" : "border-gray-200 text-gray-600 hover:bg-gray-100"}`}
                    >
                      Agregar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`rounded-xl border p-4 ${darkMode ? "bg-[#1e1e28] border-zinc-800" : "bg-white border-gray-200"}`}>
          <h3 className={`text-sm font-semibold mb-3 ${t}`}>Carrito</h3>
          <div className="mb-3">
            <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>Proveedor (opcional)</label>
            <select className={inputCls(darkMode)} value={proveedorId} onChange={(e) => setProveedorId(e.target.value)}>
              <option value="">Sin proveedor</option>
              {proveedores.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          {cart.length === 0 ? (
            <div className={`py-12 text-center ${st} text-sm`}>Agrega refacciones desde la lista.</div>
          ) : (
            <div className={`divide-y ${divider}`}>
              {cart.map((item) => (
                <div key={item.id} className="py-3 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`font-medium ${t}`}>{item.nombre}</p>
                      <p className={`text-xs ${st}`}>{item.numero_parte || "—"}</p>
                    </div>
                    <button
                      onClick={() => removeCartItem(item.id)}
                      className={`text-xs px-2 py-1 rounded-md border ${darkMode ? "border-zinc-700 text-zinc-400 hover:text-red-300" : "border-gray-200 text-gray-500 hover:text-red-500"}`}
                    >
                      Quitar
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>Cantidad</label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        className={inputCls(darkMode)}
                        value={item.cantidad}
                        onChange={(e) => updateCartItem(item.id, { cantidad: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>Costo</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className={inputCls(darkMode)}
                        value={item.precio_unit}
                        onChange={(e) => updateCartItem(item.id, { precio_unit: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <p className={`text-sm ${st}`}>Total</p>
            <p className={`text-base font-semibold ${t}`}>${fmtMoney(total)}</p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={saving || cart.length === 0}
            className="mt-4 w-full px-4 py-2 rounded-lg text-white text-sm font-medium transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: C_BLUE, boxShadow: `0 2px 8px ${C_BLUE}40` }}
          >
            {saving ? "Registrando..." : "Registrar Compra"}
          </button>
        </div>
      </div>
    </div>
  );
}
