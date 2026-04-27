import { useEffect, useMemo, useState, useCallback } from "react";
import supabase from "../supabase";
import useSupabaseRealtime from "../hooks/useSupabaseRealtime";
import { Icon, Input, Select, Textarea, Button } from "./UIPrimitives";

const C_BLUE = "#60aebb";

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
    proveedor_id: "",
  });
  const [editTarget, setEditTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingSave, setPendingSave] = useState(null);
  const [proveedores, setProveedores] = useState([]);

  const fetchRefacciones = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("refacciones").select("*").order("numero_parte");
    setRefacciones(data || []);
    setLoading(false);
  }, []);

  const fetchProveedores = useCallback(async () => {
    const { data } = await supabase.from("proveedores").select("id, nombre").eq("activo", true).order("nombre");
    setProveedores(data || []);
  }, []);

  useEffect(() => {
    fetchRefacciones();
    fetchProveedores();
  }, [fetchRefacciones, fetchProveedores]);

  useSupabaseRealtime("refacciones", fetchRefacciones);

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
      proveedor_id: "",
    });
    // Cargar proveedor principal de esta refaccion
    supabase
      .from("refaccion_proveedores")
      .select("proveedor_id")
      .eq("refaccion_id", item.id)
      .eq("es_principal", true)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.proveedor_id) setForm(prev => ({ ...prev, proveedor_id: data.proveedor_id }));
      });
  };

  const submitSave = async (payload) => {
    setSaving(true);
    try {
      let refaccionId = editTarget?.id;
      if (editTarget?.id) {
        const { error } = await supabase.from("refacciones").update(payload).eq("id", editTarget.id);
        if (error) throw error;
        showStatus("success", "Refaccion actualizada.");
      } else {
        const { data: nueva, error } = await supabase.from("refacciones").insert([payload]).select("id").maybeSingle();
        if (error) throw error;
        refaccionId = nueva?.id;
        showStatus("success", "Refaccion creada.");
      }
      // Guardar proveedor principal (upsert: quitar principal anterior y poner el nuevo)
      if (refaccionId && form.proveedor_id) {
        await supabase.from("refaccion_proveedores").update({ es_principal: false }).eq("refaccion_id", refaccionId);
        await supabase.from("refaccion_proveedores").upsert([
          { refaccion_id: refaccionId, proveedor_id: form.proveedor_id, es_principal: true, activo: true }
        ], { onConflict: "refaccion_id,proveedor_id" });
      }
      await fetchRefacciones();
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
        proveedor_id: "",
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

    // Validar campos obligatorios
    if (!form.numero_parte?.trim()) {
      showStatus("error", "El número de parte es requerido.");
      return;
    }
    if (form.precio_compra === "" || form.precio_compra === null) {
      showStatus("error", "El precio de compra es requerido.");
      return;
    }
    if (Number(form.precio_compra) < 0) {
      showStatus("error", "El precio de compra no puede ser negativo.");
      return;
    }
    if (form.precio_venta === "" || form.precio_venta === null) {
      showStatus("error", "El precio de venta es requerido.");
      return;
    }
    if (Number(form.precio_venta) < 0) {
      showStatus("error", "El precio de venta no puede ser negativo.");
      return;
    }
    if (form.stock === "" || form.stock === null) {
      showStatus("error", "El stock es requerido.");
      return;
    }
    if (form.stock_minimo === "" || form.stock_minimo === null) {
      showStatus("error", "El stock mínimo es requerido.");
      return;
    }
    // Validar nombre duplicado
    const { data: duplicados } = await supabase
      .from("refacciones")
      .select("id")
      .ilike("nombre", form.nombre.trim());
    const hayDuplicado = (duplicados || []).some(r => r.id !== editTarget?.id);
    if (hayDuplicado) {
      showStatus("error", `Ya existe una refacción con el nombre "${form.nombre.trim()}".`);
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
      await fetchRefacciones();
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
          <Button
            onClick={openCreate}
            variant="secondary"
          >
            + Agregar refaccion
          </Button>
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
            <Button
              onClick={() => { setShowForm(false); setEditTarget(null); }}
              variant="outline"
            >
              Cerrar
            </Button>
            {editTarget && (
              <Button
                onClick={openCreate}
                variant="outline"
              >
                Cancelar
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>Nombre <span className="text-red-500">*</span></label>
              <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} darkMode={darkMode} />
            </div>
            <div>
              <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>Numero de parte <span className="text-red-500">*</span></label>
              <Input value={form.numero_parte} onChange={(e) => setForm({ ...form, numero_parte: e.target.value })} darkMode={darkMode} />
            </div>
            <div>
              <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>Precio compra <span className="text-red-500">*</span></label>
              <Input type="number" min="0" step="0.01" value={form.precio_compra} onChange={(e) => setForm({ ...form, precio_compra: e.target.value })} darkMode={darkMode} />
            </div>
            <div>
              <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>Precio venta <span className="text-red-500">*</span></label>
              <Input type="number" min="0" step="0.01" value={form.precio_venta} onChange={(e) => setForm({ ...form, precio_venta: e.target.value })} darkMode={darkMode} />
            </div>
            <div>
              <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>Stock <span className="text-red-500">*</span></label>
              <Input type="number" min="0" step="1" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} darkMode={darkMode} />
            </div>
            <div>
              <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>Stock minimo <span className="text-red-500">*</span></label>
              <Input type="number" min="0" step="1" value={form.stock_minimo} onChange={(e) => setForm({ ...form, stock_minimo: e.target.value })} darkMode={darkMode} />
            </div>
            <div className="md:col-span-2">
              <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>Descripcion</label>
              <Textarea rows={2} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} darkMode={darkMode} />
            </div>
            <div>
              <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>Proveedor principal *</label>
              <Select value={form.proveedor_id} onChange={(e) => setForm({ ...form, proveedor_id: e.target.value })} darkMode={darkMode}>
                <option value="">Sin proveedor</option>
                {proveedores.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>Activo</label>
              <Select value={form.activo ? "true" : "false"} onChange={(e) => setForm({ ...form, activo: e.target.value === "true" })} darkMode={darkMode}>
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </Select>
            </div>
          </div>
          <Button
            onClick={saveRefaccion}
            disabled={saving}
            className="mt-4 px-4 py-2"
            variant="primary"
          >
            {saving ? "Guardando..." : editTarget ? "Actualizar" : "Crear"}
          </Button>
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
                <Button
                  onClick={() => { setConfirmOpen(false); setPendingSave(null); }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={async () => {
                    const payload = pendingSave;
                    setConfirmOpen(false);
                    setPendingSave(null);
                    if (payload) await submitSave(payload);
                  }}
                  variant="destructive"
                  className="flex-1"
                >
                  Confirmar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4">
        <Input
          placeholder="Buscar por nombre o numero de parte..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          darkMode={darkMode}
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
                          <Button
                            onClick={() => openEdit(r)}
                            variant="secondary"
                          >
                            Editar
                          </Button>
                          <Button
                            onClick={() => toggleActivo(r)}
                            disabled={r.activo && Number(r.stock || 0) > 0}
                            variant={r.activo ? "destructive" : "primary"}
                            title={r.activo && Number(r.stock || 0) > 0 ? "No puedes desactivar una refaccion con inventario" : ""}
                          >
                            {r.activo ? "Desactivar" : "Activar"}
                          </Button>
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
                    <Button
                      onClick={() => openEdit(r)}
                      variant="secondary"
                    >
                      Editar
                    </Button>
                    <Button
                      onClick={() => toggleActivo(r)}
                      disabled={r.activo && Number(r.stock || 0) > 0}
                      variant={r.activo ? "destructive" : "primary"}
                      title={r.activo && Number(r.stock || 0) > 0 ? "No puedes desactivar una refaccion con inventario" : ""}
                    >
                      {r.activo ? "Desactivar" : "Activar"}
                    </Button>
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
