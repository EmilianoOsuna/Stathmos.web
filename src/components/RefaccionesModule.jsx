import { useEffect, useMemo, useState } from "react";
import supabase from "../supabase";

const C_BLUE = "#60aebb";

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

export default function RefaccionesModule({ darkMode, readOnly = false, allowStockEdit = true }) {
  const [refacciones, setRefacciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });

  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    numero_parte: "",
    precio_compra: "",
    precio_venta: "",
    stock: "",
    stock_minimo: "1",
    activo: true,
  });
  const [editTarget, setEditTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingSave, setPendingSave] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("refacciones")
      .select("id, nombre, descripcion, numero_parte, precio_compra, precio_venta, stock, stock_minimo, activo")
      .order("nombre");
    setRefacciones(data || []);
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

  const openCreate = () => {
    setEditTarget(null);
    setShowForm(true);
    setForm({
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

  const openEdit = (item) => {
    setEditTarget(item);
    setShowForm(true);
    setForm({
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

  const submitSave = async (payload) => {
    setSaving(true);
    try {
      if (editTarget?.id) {
        const { error } = await supabase.from("refacciones").update(payload).eq("id", editTarget.id);
        if (error) throw error;
        showStatus("success", "Refaccion actualizada.");
      } else {
        const { error } = await supabase.from("refacciones").insert([payload]);
        if (error) throw error;
        showStatus("success", "Refaccion creada.");
      }
      await fetchAll();
      setEditTarget(null);
      setShowForm(false);
      setForm({
        nombre: "",
        descripcion: "",
        numero_parte: "",
        precio_compra: "",
        precio_venta: "",
        stock: "",
        stock_minimo: "1",
        activo: true,
      });
    } catch (err) {
      showStatus("error", err?.message || "Error al guardar refaccion.");
    } finally {
      setSaving(false);
    }
  };

  const saveRefaccion = async () => {
    showStatus("", "");
    if (!form.nombre) {
      showStatus("error", "Nombre es requerido en refacciones.");
      return;
    }

    if (!allowStockEdit && editTarget?.id) {
      const nextStock = Number(form.stock || 0);
      const currentStock = Number(editTarget.stock || 0);
      if (nextStock !== currentStock) {
        showStatus("error", "No tienes permisos para modificar el stock.");
        return;
      }
    }

    const payload = {
      nombre: form.nombre,
      descripcion: form.descripcion || null,
      numero_parte: form.numero_parte || null,
      precio_compra: Number(form.precio_compra || 0),
      precio_venta: Number(form.precio_venta || 0),
      stock: Number(form.stock || 0),
      stock_minimo: Number(form.stock_minimo || 1),
      activo: Boolean(form.activo),
      updated_at: new Date().toISOString(),
    };

    if (Number.isNaN(payload.stock) || payload.stock < 0 || Number.isNaN(payload.stock_minimo) || payload.stock_minimo < 0) {
      showStatus("error", "Stock y stock minimo deben ser numeros validos.");
      return;
    }

    if (editTarget?.id && allowStockEdit) {
      const currentStock = Number(editTarget.stock || 0);
      if (payload.stock !== currentStock) {
        setPendingSave(payload);
        setConfirmOpen(true);
        return;
      }
    }
    await submitSave(payload);
  };

  const toggleActivo = async (item) => {
    if (!item?.id) return;
    if (item.activo && Number(item.stock || 0) > 0) {
      showStatus("error", "No puedes desactivar una refaccion con inventario.");
      return;
    }
    try {
      await supabase.from("refacciones").update({ activo: !item.activo, updated_at: new Date().toISOString() }).eq("id", item.id);
      await fetchAll();
    } catch (err) {
      showStatus("error", err?.message || "Error al actualizar refaccion.");
    }
  };

  const t = darkMode ? "text-zinc-100" : "text-gray-800";
  const st = darkMode ? "text-zinc-500" : "text-gray-400";
  const divider = darkMode ? "divide-zinc-800" : "divide-gray-100";
  const rowH = darkMode ? "hover:bg-[#25252f]" : "hover:bg-gray-50";
  const headTxt = darkMode ? "text-zinc-500 border-zinc-800" : "text-gray-400 border-gray-100";

  return (
    <div className={`flex-1 p-4 md:p-6 min-h-full page-enter ${darkMode ? "bg-[#16161e]" : "bg-gray-50"}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className={`text-lg font-semibold ${t}`}>Refacciones</h2>
          <p className={`text-xs ${st} mt-0.5`}>{refacciones.length} refacciones</p>
        </div>
        {!readOnly && (
          <button
            onClick={openCreate}
            className={`px-3 py-1.5 rounded-md text-xs font-medium border ${darkMode ? "border-zinc-700 text-zinc-300 hover:border-zinc-500" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
          >
            + Agregar refaccion
          </button>
        )}
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

      {!readOnly && showForm && (
        <div className={`rounded-xl border p-4 mb-5 ${darkMode ? "bg-[#1e1e28] border-zinc-800" : "bg-white border-gray-200"}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-sm font-semibold ${t}`}>{editTarget ? "Editar Refaccion" : "Nueva Refaccion"}</h3>
            <button
              onClick={() => { setShowForm(false); setEditTarget(null); }}
              className={`text-xs px-3 py-1.5 rounded-md border ${darkMode ? "border-zinc-700 text-zinc-400 hover:text-zinc-200" : "border-gray-200 text-gray-500 hover:text-gray-700"}`}
            >
              Cerrar
            </button>
            {editTarget && (
              <button
                onClick={openCreate}
                className={`text-xs px-3 py-1.5 rounded-md border ${darkMode ? "border-zinc-700 text-zinc-400 hover:text-zinc-200" : "border-gray-200 text-gray-500 hover:text-gray-700"}`}
              >
                Cancelar
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>Nombre</label>
              <input className={inputCls(darkMode)} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </div>
            <div>
              <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>Numero de parte</label>
              <input className={inputCls(darkMode)} value={form.numero_parte} onChange={(e) => setForm({ ...form, numero_parte: e.target.value })} />
            </div>
            <div>
              <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>Precio compra</label>
              <input type="number" min="0" step="0.01" className={inputCls(darkMode)} value={form.precio_compra} onChange={(e) => setForm({ ...form, precio_compra: e.target.value })} />
            </div>
            <div>
              <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>Precio venta</label>
              <input type="number" min="0" step="0.01" className={inputCls(darkMode)} value={form.precio_venta} onChange={(e) => setForm({ ...form, precio_venta: e.target.value })} />
            </div>
            <div>
              <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>Stock</label>
              <input type="number" min="0" step="1" className={inputCls(darkMode)} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            </div>
            <div>
              <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>Stock minimo</label>
              <input type="number" min="0" step="1" className={inputCls(darkMode)} value={form.stock_minimo} onChange={(e) => setForm({ ...form, stock_minimo: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>Descripcion</label>
              <textarea rows={2} className={inputCls(darkMode)} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
            </div>
            <div>
              <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>Activo</label>
              <select className={inputCls(darkMode)} value={form.activo ? "true" : "false"} onChange={(e) => setForm({ ...form, activo: e.target.value === "true" })}>
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </div>
          </div>
          <button
            onClick={saveRefaccion}
            disabled={saving}
            className="mt-4 px-4 py-2 rounded-lg text-white text-sm font-medium transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: C_BLUE, boxShadow: `0 2px 8px ${C_BLUE}40` }}
          >
            {saving ? "Guardando..." : editTarget ? "Actualizar" : "Crear"}
          </button>
        </div>
      )}

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 bg-black/50 overflow-y-auto">
          <div
            className={`relative w-full max-w-lg rounded-xl ${darkMode ? "bg-[#1e1e26] text-white" : "bg-white text-gray-800"}`}
            style={{ boxShadow: darkMode ? "0 24px 64px rgba(0,0,0,0.6)" : "0 16px 48px rgba(0,0,0,0.15)" }}
          >
            <div className={`flex items-center justify-between px-6 py-4 border-b ${darkMode ? "border-zinc-700/60" : "border-gray-200"}`}>
              <h2 className="font-semibold text-base">Confirmar cambio de stock</h2>
              <button onClick={() => { setConfirmOpen(false); setPendingSave(null); }} className="text-zinc-400 hover:text-current transition-colors text-xl leading-none">×</button>
            </div>
            <div className="px-6 py-5">
              <p className={`text-sm mb-5 ${darkMode ? "text-zinc-400" : "text-gray-500"}`}>
                Estas seguro de modificar el stock? Esta accion es sensible.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setConfirmOpen(false); setPendingSave(null); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${darkMode ? "border-zinc-700 text-zinc-400 hover:text-zinc-200" : "border-gray-200 text-gray-500 hover:text-gray-700"}`}
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    const payload = pendingSave;
                    setConfirmOpen(false);
                    setPendingSave(null);
                    if (payload) await submitSave(payload);
                  }}
                  className="flex-1 py-2 rounded-lg text-sm font-medium text-white"
                  style={{ backgroundColor: "#db3c1c", boxShadow: "0 2px 8px #db3c1c40" }}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
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
                    !readOnly ? "" : null,
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
                    {!readOnly && (
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(r)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium border ${darkMode ? "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200" : "border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700"}`}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => toggleActivo(r)}
                            disabled={r.activo && Number(r.stock || 0) > 0}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-opacity disabled:opacity-50 disabled:cursor-not-allowed ${
                              r.activo
                                ? darkMode ? "border-zinc-700 text-zinc-400 hover:border-red-800 hover:text-red-400" : "border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500"
                                : darkMode ? "border-zinc-700 text-zinc-400 hover:border-emerald-800 hover:text-emerald-400" : "border-gray-200 text-gray-500 hover:border-emerald-300 hover:text-emerald-600"
                            }`}
                            title={r.activo && Number(r.stock || 0) > 0 ? "No puedes desactivar una refaccion con inventario" : ""}
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
                {!readOnly && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(r)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium border ${darkMode ? "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200" : "border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700"}`}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => toggleActivo(r)}
                      disabled={r.activo && Number(r.stock || 0) > 0}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-opacity disabled:opacity-50 disabled:cursor-not-allowed ${
                        r.activo
                          ? darkMode ? "border-zinc-700 text-zinc-400 hover:border-red-800 hover:text-red-400" : "border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500"
                          : darkMode ? "border-zinc-700 text-zinc-400 hover:border-emerald-800 hover:text-emerald-400" : "border-gray-200 text-gray-500 hover:border-emerald-300 hover:text-emerald-600"
                      }`}
                      title={r.activo && Number(r.stock || 0) > 0 ? "No puedes desactivar una refaccion con inventario" : ""}
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
    </div>
  );
}
