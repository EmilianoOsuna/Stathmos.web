import { useEffect, useMemo, useState } from "react";
import supabase from "../supabase";
import { Icon, Input, Select, Button } from "./UIPrimitives";

const C_BLUE = "#60aebb";

const fmtMoney = (value) => {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n.toFixed(2) : "0.00";
};

export default function CompraRefacciones({ darkMode }) {
  const [refacciones, setRefacciones] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [proyectos, setProyectos] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [proveedorId, setProveedorId] = useState("");
  const [proyectoId, setProyectoId] = useState(""); 
  const [status, setStatus] = useState({ type: "", message: "" });
  const [saving, setSaving] = useState(false);

  // ÚNICA declaración de fetchAll corregida
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [{ data: refData }, { data: provData }, { data: projData }] = await Promise.all([
        supabase.from("refacciones").select("id, nombre, numero_parte, precio_compra, stock").order("nombre"),
        supabase.from("proveedores").select("id, nombre").eq("activo", true).order("nombre"),
        supabase.from("proyectos").select("id, titulo").neq("estado", "cancelado").neq("estado", "entregado").order("titulo")
      ]);
      setRefacciones(refData || []);
      setProveedores(provData || []);
      setProyectos(projData || []);
    } catch (err) {
      console.error("Error cargando datos:", err);
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

  const showStatus = (type, message) => setStatus({ type, message });

  const addToCart = (refaccion) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === refaccion.id);
      if (existing) {
        return prev.map((item) =>
          item.id === refaccion.id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }
      return [...prev, {
        id: refaccion.id,
        nombre: refaccion.nombre,
        numero_parte: refaccion.numero_parte,
        cantidad: 1,
        precio_unit: Number(refaccion.precio_compra || 0),
      }];
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
        const { data, error } = await supabase.functions.invoke("gestionar-inventario", {
          body: {
            tipo_operacion: "COMPRA",
            refaccion_id: item.id,
            cantidad: Number(item.cantidad),
            precio_unit: Number(item.precio_unit),
            proveedor_id: proveedorId || null,
            proyecto_id: proyectoId || null, 
          },
        });

        if (error || !data?.success) {
          throw new Error(error?.message || data?.error || "No se pudo registrar la compra.");
        }
      }

      showStatus("success", "Compra registrada y stock actualizado.");
      setCart([]);
      setProveedorId("");
      setProyectoId("");
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
        <div className={`mb-4 rounded-md border px-4 py-3 text-sm ${status.type === "success" ? "bg-emerald-900/20 text-emerald-300" : "bg-red-900/20 text-red-300"}`}>
          {status.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4">
        <div className={`rounded-xl border p-4 ${darkMode ? "bg-[#1e1e28] border-zinc-800" : "bg-white border-gray-200"}`}>
          <Input placeholder="Buscar refaccion..." value={search} onChange={(e) => setSearch(e.target.value)} darkMode={darkMode} />
          {loading ? (
            <div className={`p-12 text-center ${st} text-sm`}>Cargando...</div>
          ) : (
            <div className={`divide-y ${divider} mt-3`}>
              {filtered.map((r) => (
                <div key={r.id} className={`py-3 flex items-center justify-between gap-3 ${rowH}`}>
                  <div>
                    <p className={`font-medium ${t}`}>{r.nombre}</p>
                    <p className={`text-xs ${st}`}>{r.numero_parte || "—"}</p>
                  </div>
                  <Button onClick={() => addToCart(r)} variant="secondary">
                    Agregar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`rounded-xl border p-4 ${darkMode ? "bg-[#1e1e28] border-zinc-800" : "bg-white border-gray-200"}`}>
          <h3 className={`text-sm font-semibold mb-3 ${t}`}>Carrito</h3>
          
          <div className="space-y-3 mb-4">
            <div>
              <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>Proveedor</label>
              <Select value={proveedorId} onChange={(e) => setProveedorId(e.target.value)} darkMode={darkMode}>
                <option value="">Sin proveedor</option>
                {proveedores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </Select>
            </div>
          </div>

          <div className={`divide-y ${divider}`}>
            {cart.map((item) => (
              <div key={item.id} className="py-3 flex flex-col gap-2">
                <div className="flex justify-between">
                  <p className={`text-sm font-medium ${t}`}>{item.nombre}</p>
                  <button onClick={() => removeCartItem(item.id)} className="text-xs text-red-400">Quitar</button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input type="number" value={item.cantidad} onChange={(e) => updateCartItem(item.id, { cantidad: Number(e.target.value) })} darkMode={darkMode} />
                  <Input type="number" value={item.precio_unit} onChange={(e) => updateCartItem(item.id, { precio_unit: e.target.value })} darkMode={darkMode} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-between items-center">
            <p className={st}>Total</p>
            <p className={`text-lg font-bold ${t}`}>${fmtMoney(total)}</p>
          </div>

          <Button onClick={handleSubmit} disabled={saving || cart.length === 0} className="mt-4 w-full py-2" variant="primary">
            {saving ? "Registrando..." : "Registrar Compra"}
          </Button>
        </div>
      </div>
    </div>
  );
}