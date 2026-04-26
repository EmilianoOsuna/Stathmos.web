import { useEffect, useState } from "react";
import supabase from "../supabase";
import useSupabaseRealtime from "../hooks/useSupabaseRealtime";
import { Icon, Input, Select, Textarea, Button } from "./UIPrimitives";

const C_BLUE = "#60aebb";

export default function ProveedoresModule({ darkMode }) {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [editTarget, setEditTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    correo: "",
    direccion: "",
    rfc: "",
    activo: true,
  });

  const fetchAll = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("proveedores")
      .select("id, nombre, telefono, correo, direccion, rfc, activo")
      .order("nombre");
    setProveedores(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const [rtTick, setRtTick] = useState(0);
  useSupabaseRealtime("proveedores", () => setRtTick(t => t + 1));
  useEffect(() => { fetchAll(); }, [rtTick]);

  const showStatus = (type, message) => setStatus({ type, message });

  const openCreate = () => {
    setEditTarget(null);
    setShowForm(true);
    setForm({
      nombre: "",
      telefono: "",
      correo: "",
      direccion: "",
      rfc: "",
      activo: true,
    });
  };

  const openEdit = (item) => {
    setEditTarget(item);
    setShowForm(true);
    setForm({
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
    if (!form.nombre) {
      showStatus("error", "Nombre es requerido en proveedores.");
      return;
    }

    const payload = {
      nombre: form.nombre,
      telefono: form.telefono || null,
      correo: form.correo || null,
      direccion: form.direccion || null,
      rfc: form.rfc || null,
      activo: Boolean(form.activo),
      updated_at: new Date().toISOString(),
    };

    setSaving(true);
    try {
      if (editTarget?.id) {
        const { error } = await supabase.from("proveedores").update(payload).eq("id", editTarget.id);
        if (error) throw error;
        showStatus("success", "Proveedor actualizado.");
      } else {
        const { error } = await supabase.from("proveedores").insert([payload]);
        if (error) throw error;
        showStatus("success", "Proveedor creado.");
      }

      await fetchAll();
      openCreate();
    } catch (err) {
      showStatus("error", err?.message || "Error al guardar proveedor.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActivo = async (item) => {
    if (!item?.id) return;
    try {
      await supabase.from("proveedores").update({ activo: !item.activo, updated_at: new Date().toISOString() }).eq("id", item.id);
      await fetchAll();
    } catch (err) {
      showStatus("error", err?.message || "Error al actualizar proveedor.");
    }
  };

  const t = darkMode ? "text-zinc-100" : "text-gray-800";
  const st = darkMode ? "text-zinc-500" : "text-gray-400";
  const divider = darkMode ? "divide-zinc-800" : "divide-gray-100";
  const rowH = darkMode ? "hover:bg-[#25252f]" : "hover:bg-gray-50";
  const headTxt = darkMode ? "text-zinc-500 border-zinc-800" : "text-gray-400 border-gray-100";

  const filtered = proveedores.filter((p) =>
    p.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    p.correo?.toLowerCase().includes(search.toLowerCase()) ||
    p.rfc?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`flex-1 p-4 md:p-6 min-h-full page-enter ${darkMode ? "bg-[#16161e]" : "bg-gray-50"}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className={`text-lg font-semibold ${t}`}>Proveedores</h2>
          <p className={`text-xs ${st} mt-0.5`}>{proveedores.length} proveedores</p>
        </div>
        <Button
          onClick={openCreate}
          variant="secondary"
        >
          + Agregar proveedor
        </Button>
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

      {showForm && (
        <div className={`rounded-xl border p-4 mb-5 ${darkMode ? "bg-[#1e1e28] border-zinc-800" : "bg-white border-gray-200"}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={`text-sm font-semibold ${t}`}>{editTarget ? "Editar Proveedor" : "Nuevo Proveedor"}</h3>
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
            <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>Nombre</label>
            <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} darkMode={darkMode} />
          </div>
          <div>
            <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>Telefono</label>
            <Input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} darkMode={darkMode} />
          </div>
          <div>
            <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>Correo</label>
            <Input type="email" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} darkMode={darkMode} />
          </div>
          <div>
            <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>RFC</label>
            <Input className="font-mono" value={form.rfc} onChange={(e) => setForm({ ...form, rfc: e.target.value.toUpperCase() })} darkMode={darkMode} />
          </div>
          <div className="md:col-span-2">
            <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>Direccion</label>
            <Textarea rows={2} value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} darkMode={darkMode} />
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
          onClick={saveProveedor}
          disabled={saving}
          className="mt-4 px-4 py-2"
          variant="primary"
        >
          {saving ? "Guardando..." : editTarget ? "Actualizar" : "Crear"}
        </Button>
      </div>
      )}

      <div className="mb-4">
        <Input
          placeholder="Buscar por nombre, correo o RFC..."
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
                {filtered.map((p) => (
                  <tr key={p.id} className={`transition-colors ${rowH}`}>
                    <td className={`px-5 py-3 font-medium ${t}`}>{p.nombre}</td>
                    <td className={`px-5 py-3 ${st}`}>{p.telefono || "—"}</td>
                    <td className={`px-5 py-3 ${st}`}>{p.correo || "—"}</td>
                    <td className={`px-5 py-3 font-mono text-xs ${st}`}>{p.rfc || "—"}</td>
                    <td className={`px-5 py-3 ${st}`}>{p.activo ? "Activo" : "Inactivo"}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          onClick={() => openEdit(p)}
                          variant="secondary"
                        >
                          Editar
                        </Button>
                        <Button
                          onClick={() => toggleActivo(p)}
                          variant={p.activo ? "destructive" : "primary"}
                        >
                          {p.activo ? "Desactivar" : "Activar"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className={`md:hidden divide-y ${divider}`}>
            {filtered.map((p) => (
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
                  <Button
                    onClick={() => openEdit(p)}
                    variant="secondary"
                  >
                    Editar
                  </Button>
                  <Button
                    onClick={() => toggleActivo(p)}
                    variant={p.activo ? "destructive" : "primary"}
                  >
                    {p.activo ? "Desactivar" : "Activar"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
