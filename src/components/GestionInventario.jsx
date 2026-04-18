import { useEffect, useMemo, useState } from "react";
import supabase from "../supabase";

const C_BLUE = "#60aebb";
const C_RED = "#db3c1c";

const inputCls = (darkMode) =>
  `w-full rounded-md px-3 py-2 text-sm outline-none transition-colors border ${
    darkMode ? "bg-[#2a2a35] border-zinc-700 text-white placeholder-zinc-600" : "bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400"
  }`;

const badgeStock = (r, darkMode) => {
  if (r.stock === 0) return darkMode ? "bg-red-900/40 text-red-400 border-red-800" : "bg-red-50 text-red-700 border-red-200";
  if (r.stock <= r.stock_minimo) return darkMode ? "bg-amber-900/40 text-amber-400 border-amber-800" : "bg-amber-50 text-amber-700 border-amber-200";
  return darkMode ? "bg-emerald-900/40 text-emerald-400 border-emerald-800" : "bg-emerald-50 text-emerald-700 border-emerald-200";
};

const fmtMoney = (value) => {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n.toFixed(2) : "0.00";
};

export default function GestionInventario({ darkMode, role = "administrador", initialTab = "" }) {
  const canManageCatalogs = role === "administrador";
  const canMoveStock = role === "administrador" || role === "mecanico";
  const [refacciones, setRefacciones] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [activeTab, setActiveTab] = useState("movimientos");

  const [compra, setCompra] = useState({
    refaccion_id: "",
    cantidad: "",
    precio_unit: "",
    proveedor_id: "",
  });

  const [venta, setVenta] = useState({
    refaccion_id: "",
    cantidad: "",
    precio_unit: "",
  });

  const [savingCompra, setSavingCompra] = useState(false);
  const [savingVenta, setSavingVenta] = useState(false);

  const [refForm, setRefForm] = useState({
    nombre: "",
    descripcion: "",
    numero_parte: "",
    precio_compra: "",
    precio_venta: "",
    stock: "",
    stock_minimo: "1",
    activo: true,
  });
  const [refEditTarget, setRefEditTarget] = useState(null);
  const [refSaving, setRefSaving] = useState(false);

  const [provForm, setProvForm] = useState({
    nombre: "",
    telefono: "",
    correo: "",
    direccion: "",
    rfc: "",
    activo: true,
  });
  const [provEditTarget, setProvEditTarget] = useState(null);
  const [provSaving, setProvSaving] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: refData }, { data: provData }] = await Promise.all([
      supabase
        .from("refacciones")
        .select("id, nombre, numero_parte, precio_compra, precio_venta, stock, stock_minimo, activo")
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

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (!canManageCatalogs && activeTab !== "movimientos" && activeTab !== "refacciones") {
      setActiveTab("movimientos");
    }
  }, [canManageCatalogs, activeTab]);

  const filtered = useMemo(() => (
    refacciones.filter((r) =>
      r.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      r.numero_parte?.toLowerCase().includes(search.toLowerCase())
    )
  ), [refacciones, search]);

  const showStatus = (type, message) => setStatus({ type, message });

  const handleCompraRefaccionChange = (refaccionId) => {
    const refaccion = refacciones.find((r) => r.id === refaccionId);
    const precioCompra = refaccion?.precio_compra;
    setCompra((prev) => ({
      ...prev,
      refaccion_id: refaccionId,
      precio_unit: precioCompra == null ? prev.precio_unit : String(precioCompra),
    }));
  };

  const openRefaccionCreate = () => {
    setRefEditTarget(null);
    setRefForm({
      nombre: "",
      descripcion: "",
      numero_parte: "",
      precio_compra: "",
      precio_venta: "",
      stock: "",
      stock_minimo: "1",
      activo: true,
    });
  };

  const openRefaccionEdit = (item) => {
    setRefEditTarget(item);
    setRefForm({
      nombre: item.nombre || "",
      descripcion: item.descripcion || "",
      numero_parte: item.numero_parte || "",
      precio_compra: String(item.precio_compra ?? ""),
      precio_venta: String(item.precio_venta ?? ""),
      stock: String(item.stock ?? ""),
      stock_minimo: String(item.stock_minimo ?? "1"),
      activo: Boolean(item.activo),
    });
  };

  const saveRefaccion = async () => {
    showStatus("", "");
    if (!refForm.nombre) {
      showStatus("error", "Nombre es requerido en refacciones.");
      return;
    }

    const payload = {
      nombre: refForm.nombre,
      descripcion: refForm.descripcion || null,
      numero_parte: refForm.numero_parte || null,
      precio_compra: Number(refForm.precio_compra || 0),
      precio_venta: Number(refForm.precio_venta || 0),
      stock: Number(refForm.stock || 0),
      stock_minimo: Number(refForm.stock_minimo || 1),
      activo: Boolean(refForm.activo),
      updated_at: new Date().toISOString(),
    };

    if (Number.isNaN(payload.stock) || payload.stock < 0 || Number.isNaN(payload.stock_minimo) || payload.stock_minimo < 0) {
      showStatus("error", "Stock y stock minimo deben ser numeros validos.");
      return;
    }

    setRefSaving(true);
    try {
      if (refEditTarget?.id) {
        const { error } = await supabase.from("refacciones").update(payload).eq("id", refEditTarget.id);
        if (error) throw error;
        showStatus("success", "Refaccion actualizada.");
      } else {
        const { error } = await supabase.from("refacciones").insert([payload]);
        if (error) throw error;
        showStatus("success", "Refaccion creada.");
      }

      await fetchAll();
      openRefaccionCreate();
    } catch (err) {
      showStatus("error", err?.message || "Error al guardar refaccion.");
    } finally {
      setRefSaving(false);
    }
  };

  const toggleRefaccionActivo = async (item) => {
    if (!item?.id) return;
    try {
      await supabase.from("refacciones").update({ activo: !item.activo, updated_at: new Date().toISOString() }).eq("id", item.id);
      await fetchAll();
    } catch (err) {
      showStatus("error", err?.message || "Error al actualizar refaccion.");
    }
  };

  const openProveedorCreate = () => {
    setProvEditTarget(null);
    setProvForm({
      nombre: "",
      telefono: "",
      correo: "",
      direccion: "",
      rfc: "",
      activo: true,
    });
  };

  const openProveedorEdit = (item) => {
    setProvEditTarget(item);
    setProvForm({
      nombre: item.nombre || "",
      telefono: item.telefono || "",
      correo: item.correo || "",
      direccion: item.direccion || "",
      rfc: item.rfc || "",
      activo: Boolean(item.activo),
    });
  };

  const saveProveedor = async () => {
    showStatus("", "");
    if (!provForm.nombre) {
      showStatus("error", "Nombre es requerido en proveedores.");
      return;
    }

    const payload = {
      nombre: provForm.nombre,
      telefono: provForm.telefono || null,
      correo: provForm.correo || null,
      direccion: provForm.direccion || null,
      rfc: provForm.rfc || null,
      activo: Boolean(provForm.activo),
      updated_at: new Date().toISOString(),
    };

    setProvSaving(true);
    try {
      if (provEditTarget?.id) {
        const { error } = await supabase.from("proveedores").update(payload).eq("id", provEditTarget.id);
        if (error) throw error;
        showStatus("success", "Proveedor actualizado.");
      } else {
        const { error } = await supabase.from("proveedores").insert([payload]);
        if (error) throw error;
        showStatus("success", "Proveedor creado.");
      }

      await fetchAll();
      openProveedorCreate();
    } catch (err) {
      showStatus("error", err?.message || "Error al guardar proveedor.");
    } finally {
      setProvSaving(false);
    }
  };

  const toggleProveedorActivo = async (item) => {
    if (!item?.id) return;
    try {
      await supabase.from("proveedores").update({ activo: !item.activo, updated_at: new Date().toISOString() }).eq("id", item.id);
      await fetchAll();
    } catch (err) {
      showStatus("error", err?.message || "Error al actualizar proveedor.");
    }
  };

  const handleCompra = async (e) => {
    e.preventDefault();
    showStatus("", "");

    if (!compra.refaccion_id || !compra.cantidad || !compra.precio_unit) {
      showStatus("error", "Completa los campos requeridos de compra.");
      return;
    }

    const cantidadNum = Number(compra.cantidad);
    const precioUnitNum = Number(compra.precio_unit);

    if (!Number.isFinite(cantidadNum) || cantidadNum <= 0 || !Number.isFinite(precioUnitNum) || precioUnitNum < 0) {
      showStatus("error", "Cantidad o precio unitario inválidos.");
      return;
    }

    setSavingCompra(true);
    try {
      const { data, error } = await supabase.functions.invoke("gestionar-inventario", {
        body: {
          tipo_operacion: "COMPRA",
          refaccion_id: compra.refaccion_id,
          cantidad: cantidadNum,
          precio_unit: precioUnitNum,
          proveedor_id: compra.proveedor_id || null,
        },
      });

      if (error || !data?.success) {
        throw new Error(error?.message || data?.error || "No se pudo registrar la compra.");
      }

      showStatus("success", "Compra registrada y stock actualizado.");
      setCompra({ refaccion_id: "", cantidad: "", precio_unit: "", proveedor_id: "" });
      await fetchAll();
    } catch (err) {
      showStatus("error", err?.message || "Error al registrar la compra.");
    } finally {
      setSavingCompra(false);
    }
  };

  const handleVenta = async (e) => {
    e.preventDefault();
    showStatus("", "");

    if (!venta.refaccion_id || !venta.cantidad || !venta.precio_unit) {
      showStatus("error", "Completa los campos requeridos de venta.");
      return;
    }

    const cantidadNum = Number(venta.cantidad);
    const precioUnitNum = Number(venta.precio_unit);

    if (!Number.isFinite(cantidadNum) || cantidadNum <= 0 || !Number.isFinite(precioUnitNum) || precioUnitNum < 0) {
      showStatus("error", "Cantidad o precio unitario inválidos.");
      return;
    }

    setSavingVenta(true);
    try {
      const { data, error } = await supabase.functions.invoke("gestionar-inventario", {
        body: {
          tipo_operacion: "VENTA",
          refaccion_id: venta.refaccion_id,
          cantidad: cantidadNum,
          precio_unit: precioUnitNum,
        },
      });

      if (error || !data?.success) {
        throw new Error(error?.message || data?.error || "No se pudo registrar la venta.");
      }

      showStatus("success", "Venta registrada y stock actualizado.");
      setVenta({ refaccion_id: "", cantidad: "", precio_unit: "" });
      await fetchAll();
    } catch (err) {
      showStatus("error", err?.message || "Error al registrar la venta.");
    } finally {
      setSavingVenta(false);
    }
  };

  const t = darkMode ? "text-zinc-100" : "text-gray-800";
  const st = darkMode ? "text-zinc-500" : "text-gray-400";
  const divider = darkMode ? "divide-zinc-800" : "divide-gray-100";
  const rowH = darkMode ? "hover:bg-[#25252f]" : "hover:bg-gray-50";
  const headTxt = darkMode ? "text-zinc-500 border-zinc-800" : "text-gray-400 border-gray-100";

  const tabs = [
    { id: "movimientos", label: "Movimientos", show: canMoveStock },
    { id: "refacciones", label: "Refacciones", show: true },
    { id: "proveedores", label: "Proveedores", show: canManageCatalogs },
  ].filter((t) => t.show);

  return (
    <div className={`flex-1 p-4 md:p-6 min-h-full page-enter ${darkMode ? "bg-[#16161e]" : "bg-gray-50"}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className={`text-lg font-semibold ${t}`}>Gestion de Inventario</h2>
          <p className={`text-xs ${st} mt-0.5`}>{refacciones.length} refacciones</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
              activeTab === tab.id
                ? darkMode
                  ? "bg-zinc-700 text-zinc-200 border-zinc-600"
                  : "bg-gray-200 text-gray-700 border-gray-300"
                : darkMode
                  ? "border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                  : "border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
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

      {activeTab === "movimientos" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className={`rounded-xl border p-4 ${darkMode ? "bg-[#1e1e28] border-zinc-800" : "bg-white border-gray-200"}`}>
          <h3 className={`text-sm font-semibold mb-3 ${t}`}>Registrar Compra</h3>
          <form className="flex flex-col gap-3" onSubmit={handleCompra}>
            <div>
              <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>Refaccion</label>
              <select
                className={inputCls(darkMode)}
                value={compra.refaccion_id}
                onChange={(e) => handleCompraRefaccionChange(e.target.value)}
              >
                <option value="">Seleccionar...</option>
                {refacciones.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nombre} {r.numero_parte ? `· ${r.numero_parte}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>Cantidad</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  className={inputCls(darkMode)}
                  value={compra.cantidad}
                  onChange={(e) => setCompra({ ...compra, cantidad: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>Precio Unitario</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={inputCls(darkMode)}
                  value={compra.precio_unit}
                  onChange={(e) => setCompra({ ...compra, precio_unit: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>Proveedor (opcional)</label>
              <select
                className={inputCls(darkMode)}
                value={compra.proveedor_id}
                onChange={(e) => setCompra({ ...compra, proveedor_id: e.target.value })}
              >
                <option value="">Sin proveedor</option>
                {proveedores.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={savingCompra}
              className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: C_BLUE, boxShadow: `0 2px 8px ${C_BLUE}40` }}
            >
              {savingCompra ? "Guardando..." : "Registrar Compra"}
            </button>
          </form>
        </div>

        <div className={`rounded-xl border p-4 ${darkMode ? "bg-[#1e1e28] border-zinc-800" : "bg-white border-gray-200"}`}>
          <h3 className={`text-sm font-semibold mb-3 ${t}`}>Venta Directa</h3>
          <form className="flex flex-col gap-3" onSubmit={handleVenta}>
            <div>
              <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>Refaccion</label>
              <select
                className={inputCls(darkMode)}
                value={venta.refaccion_id}
                onChange={(e) => setVenta({ ...venta, refaccion_id: e.target.value })}
              >
                <option value="">Seleccionar...</option>
                {refacciones.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nombre} {r.numero_parte ? `· ${r.numero_parte}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>Cantidad</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  className={inputCls(darkMode)}
                  value={venta.cantidad}
                  onChange={(e) => setVenta({ ...venta, cantidad: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>Precio Unitario</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={inputCls(darkMode)}
                  value={venta.precio_unit}
                  onChange={(e) => setVenta({ ...venta, precio_unit: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={savingVenta}
              className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: C_RED, boxShadow: `0 2px 8px ${C_RED}40` }}
            >
              {savingVenta ? "Guardando..." : "Registrar Venta"}
            </button>
          </form>
        </div>
        </div>
      )}

      {activeTab === "refacciones" && (
        <>
          {canManageCatalogs && (
            <div className={`rounded-xl border p-4 mb-5 ${darkMode ? "bg-[#1e1e28] border-zinc-800" : "bg-white border-gray-200"}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-sm font-semibold ${t}`}>{refEditTarget ? "Editar Refaccion" : "Nueva Refaccion"}</h3>
                {refEditTarget && (
                  <button
                    onClick={openRefaccionCreate}
                    className={`text-xs px-3 py-1.5 rounded-md border ${darkMode ? "border-zinc-700 text-zinc-400 hover:text-zinc-200" : "border-gray-200 text-gray-500 hover:text-gray-700"}`}
                  >
                    Cancelar
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>Nombre</label>
                  <input className={inputCls(darkMode)} value={refForm.nombre} onChange={(e) => setRefForm({ ...refForm, nombre: e.target.value })} />
                </div>
                <div>
                  <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>Numero de parte</label>
                  <input className={inputCls(darkMode)} value={refForm.numero_parte} onChange={(e) => setRefForm({ ...refForm, numero_parte: e.target.value })} />
                </div>
                <div>
                  <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>Precio compra</label>
                  <input type="number" min="0" step="0.01" className={inputCls(darkMode)} value={refForm.precio_compra} onChange={(e) => setRefForm({ ...refForm, precio_compra: e.target.value })} />
                </div>
                <div>
                  <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>Precio venta</label>
                  <input type="number" min="0" step="0.01" className={inputCls(darkMode)} value={refForm.precio_venta} onChange={(e) => setRefForm({ ...refForm, precio_venta: e.target.value })} />
                </div>
                <div>
                  <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>Stock</label>
                  <input type="number" min="0" step="1" className={inputCls(darkMode)} value={refForm.stock} onChange={(e) => setRefForm({ ...refForm, stock: e.target.value })} />
                </div>
                <div>
                  <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>Stock minimo</label>
                  <input type="number" min="0" step="1" className={inputCls(darkMode)} value={refForm.stock_minimo} onChange={(e) => setRefForm({ ...refForm, stock_minimo: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>Descripcion</label>
                  <textarea rows={2} className={inputCls(darkMode)} value={refForm.descripcion} onChange={(e) => setRefForm({ ...refForm, descripcion: e.target.value })} />
                </div>
                <div>
                  <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>Activo</label>
                  <select className={inputCls(darkMode)} value={refForm.activo ? "true" : "false"} onChange={(e) => setRefForm({ ...refForm, activo: e.target.value === "true" })}>
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </div>
              </div>
              <button
                onClick={saveRefaccion}
                disabled={refSaving}
                className="mt-4 px-4 py-2 rounded-lg text-white text-sm font-medium transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: C_BLUE, boxShadow: `0 2px 8px ${C_BLUE}40` }}
              >
                {refSaving ? "Guardando..." : refEditTarget ? "Actualizar" : "Crear"}
              </button>
            </div>
          )}

          <div className="mb-4">
            <input
              className={inputCls(darkMode)}
              placeholder="Buscar por nombre o numero de parte..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className={`rounded-xl border overflow-hidden ${darkMode ? "bg-[#1e1e28] border-zinc-800" : "bg-white border-gray-200"}`}>
            {loading ? (
              <div className={`p-12 text-center ${st} text-sm`}>Cargando...</div>
            ) : filtered.length === 0 ? (
              <div className={`p-12 text-center ${st} text-sm`}>Sin resultados</div>
            ) : (
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`border-b text-xs uppercase tracking-wider ${headTxt}`}>
                      {[
                        "Nombre",
                        "N° Parte",
                        "Precio Compra",
                        "Precio Venta",
                        "Stock",
                        "Estado",
                        canManageCatalogs ? "" : null,
                      ].filter(Boolean).map((h, i) => (
                        <th key={i} className={`px-5 py-3 font-medium ${i === 6 ? "text-right" : "text-left"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${divider}`}>
                    {filtered.map((r) => (
                      <tr key={r.id} className={`transition-colors ${rowH}`}>
                        <td className={`px-5 py-3 font-medium ${t}`}>{r.nombre}</td>
                        <td className={`px-5 py-3 font-mono text-xs ${st}`}>{r.numero_parte || "—"}</td>
                        <td className={`px-5 py-3 ${st}`}>${fmtMoney(r.precio_compra)}</td>
                        <td className={`px-5 py-3 ${st}`}>${fmtMoney(r.precio_venta)}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${badgeStock(r, darkMode)}`}>
                            {r.stock}
                          </span>
                        </td>
                        <td className={`px-5 py-3 ${st}`}>{r.activo ? "Activo" : "Inactivo"}</td>
                        {canManageCatalogs && (
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openRefaccionEdit(r)}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium border ${darkMode ? "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200" : "border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700"}`}
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => toggleRefaccionActivo(r)}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium border ${
                                  r.activo
                                    ? darkMode ? "border-zinc-700 text-zinc-400 hover:border-red-800 hover:text-red-400" : "border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500"
                                    : darkMode ? "border-zinc-700 text-zinc-400 hover:border-emerald-800 hover:text-emerald-400" : "border-gray-200 text-gray-500 hover:border-emerald-300 hover:text-emerald-600"
                                }`}
                              >
                                {r.activo ? "Desactivar" : "Activar"}
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && filtered.length > 0 && (
              <div className={`md:hidden divide-y ${divider}`}>
                {filtered.map((r) => (
                  <div key={r.id} className="px-4 py-4 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`font-medium ${t}`}>{r.nombre}</p>
                        <p className={`text-xs font-mono ${st}`}>{r.numero_parte || "—"}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${badgeStock(r, darkMode)}`}>
                        {r.stock}
                      </span>
                    </div>
                    <p className={`text-xs ${st}`}>Compra: ${fmtMoney(r.precio_compra)} · Venta: ${fmtMoney(r.precio_venta)}</p>
                    <p className={`text-xs ${st}`}>{r.activo ? "Activo" : "Inactivo"}</p>
                    {canManageCatalogs && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => openRefaccionEdit(r)}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium border ${darkMode ? "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200" : "border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700"}`}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => toggleRefaccionActivo(r)}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium border ${
                            r.activo
                              ? darkMode ? "border-zinc-700 text-zinc-400 hover:border-red-800 hover:text-red-400" : "border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500"
                              : darkMode ? "border-zinc-700 text-zinc-400 hover:border-emerald-800 hover:text-emerald-400" : "border-gray-200 text-gray-500 hover:border-emerald-300 hover:text-emerald-600"
                          }`}
                        >
                          {r.activo ? "Desactivar" : "Activar"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "proveedores" && canManageCatalogs && (
        <>
          <div className={`rounded-xl border p-4 mb-5 ${darkMode ? "bg-[#1e1e28] border-zinc-800" : "bg-white border-gray-200"}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-sm font-semibold ${t}`}>{provEditTarget ? "Editar Proveedor" : "Nuevo Proveedor"}</h3>
              {provEditTarget && (
                <button
                  onClick={openProveedorCreate}
                  className={`text-xs px-3 py-1.5 rounded-md border ${darkMode ? "border-zinc-700 text-zinc-400 hover:text-zinc-200" : "border-gray-200 text-gray-500 hover:text-gray-700"}`}
                >
                  Cancelar
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>Nombre</label>
                <input className={inputCls(darkMode)} value={provForm.nombre} onChange={(e) => setProvForm({ ...provForm, nombre: e.target.value })} />
              </div>
              <div>
                <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>Telefono</label>
                <input className={inputCls(darkMode)} value={provForm.telefono} onChange={(e) => setProvForm({ ...provForm, telefono: e.target.value })} />
              </div>
              <div>
                <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>Correo</label>
                <input type="email" className={inputCls(darkMode)} value={provForm.correo} onChange={(e) => setProvForm({ ...provForm, correo: e.target.value })} />
              </div>
              <div>
                <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>RFC</label>
                <input className={`${inputCls(darkMode)} font-mono`} value={provForm.rfc} onChange={(e) => setProvForm({ ...provForm, rfc: e.target.value.toUpperCase() })} />
              </div>
              <div className="md:col-span-2">
                <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>Direccion</label>
                <textarea rows={2} className={inputCls(darkMode)} value={provForm.direccion} onChange={(e) => setProvForm({ ...provForm, direccion: e.target.value })} />
              </div>
              <div>
                <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>Activo</label>
                <select className={inputCls(darkMode)} value={provForm.activo ? "true" : "false"} onChange={(e) => setProvForm({ ...provForm, activo: e.target.value === "true" })}>
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
              </div>
            </div>
            <button
              onClick={saveProveedor}
              disabled={provSaving}
              className="mt-4 px-4 py-2 rounded-lg text-white text-sm font-medium transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: C_BLUE, boxShadow: `0 2px 8px ${C_BLUE}40` }}
            >
              {provSaving ? "Guardando..." : provEditTarget ? "Actualizar" : "Crear"}
            </button>
          </div>

          <div className={`rounded-xl border overflow-hidden ${darkMode ? "bg-[#1e1e28] border-zinc-800" : "bg-white border-gray-200"}`}>
            {loading ? (
              <div className={`p-12 text-center ${st} text-sm`}>Cargando...</div>
            ) : proveedores.length === 0 ? (
              <div className={`p-12 text-center ${st} text-sm`}>Sin resultados</div>
            ) : (
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`border-b text-xs uppercase tracking-wider ${headTxt}`}>
                      {[
                        "Nombre",
                        "Telefono",
                        "Correo",
                        "RFC",
                        "Estado",
                        "",
                      ].map((h, i) => (
                        <th key={i} className={`px-5 py-3 font-medium ${i === 5 ? "text-right" : "text-left"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${divider}`}>
                    {proveedores.map((p) => (
                      <tr key={p.id} className={`transition-colors ${rowH}`}>
                        <td className={`px-5 py-3 font-medium ${t}`}>{p.nombre}</td>
                        <td className={`px-5 py-3 ${st}`}>{p.telefono || "—"}</td>
                        <td className={`px-5 py-3 ${st}`}>{p.correo || "—"}</td>
                        <td className={`px-5 py-3 font-mono text-xs ${st}`}>{p.rfc || "—"}</td>
                        <td className={`px-5 py-3 ${st}`}>{p.activo ? "Activo" : "Inactivo"}</td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openProveedorEdit(p)}
                              className={`px-3 py-1.5 rounded-md text-xs font-medium border ${darkMode ? "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200" : "border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700"}`}
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => toggleProveedorActivo(p)}
                              className={`px-3 py-1.5 rounded-md text-xs font-medium border ${
                                p.activo
                                  ? darkMode ? "border-zinc-700 text-zinc-400 hover:border-red-800 hover:text-red-400" : "border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500"
                                  : darkMode ? "border-zinc-700 text-zinc-400 hover:border-emerald-800 hover:text-emerald-400" : "border-gray-200 text-gray-500 hover:border-emerald-300 hover:text-emerald-600"
                              }`}
                            >
                              {p.activo ? "Desactivar" : "Activar"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && proveedores.length > 0 && (
              <div className={`md:hidden divide-y ${divider}`}>
                {proveedores.map((p) => (
                  <div key={p.id} className="px-4 py-4 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`font-medium ${t}`}>{p.nombre}</p>
                        <p className={`text-xs ${st}`}>{p.telefono || "—"}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${p.activo ? (darkMode ? "bg-emerald-900/40 text-emerald-400 border-emerald-800" : "bg-emerald-50 text-emerald-700 border-emerald-200") : (darkMode ? "bg-zinc-800 text-zinc-500 border-zinc-700" : "bg-gray-100 text-gray-400 border-gray-200")}`}>
                        {p.activo ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                    <p className={`text-xs ${st}`}>{p.correo || "—"} {p.rfc ? `· ${p.rfc}` : ""}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openProveedorEdit(p)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium border ${darkMode ? "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200" : "border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700"}`}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => toggleProveedorActivo(p)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium border ${
                          p.activo
                            ? darkMode ? "border-zinc-700 text-zinc-400 hover:border-red-800 hover:text-red-400" : "border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500"
                            : darkMode ? "border-zinc-700 text-zinc-400 hover:border-emerald-800 hover:text-emerald-400" : "border-gray-200 text-gray-500 hover:border-emerald-300 hover:text-emerald-600"
                        }`}
                      >
                        {p.activo ? "Desactivar" : "Activar"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
