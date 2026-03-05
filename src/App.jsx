import { useState, useEffect, useCallback } from 'react'

// ── SUPABASE CONFIG ────────────────────────────────────────
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

async function sbFetch(path, method = 'GET', body = null) {
  if (!SUPABASE_URL || !SUPABASE_KEY)
    throw new Error('Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu .env')
  const opts = {
    method,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: method === 'POST' || method === 'PATCH' ? 'return=representation' : '',
    },
  }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, opts)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Error ${res.status}`)
  }
  if (res.status === 204) return null
  return res.json()
}

// ── HELPERS ───────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

const BADGE = {
  Activo:     'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  Pendiente:  'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  Finalizado: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  Cerrado:    'bg-neutral-500/15 text-neutral-500 border border-neutral-500/30',
}

// ── ICONS (inline SVG) ────────────────────────────────────
const Icons = {
  users:   () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  clip:    () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>,
  plug:    () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22v-5M9 8V2M15 8V2M18 8H6a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2z"/></svg>,
  plus:    () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  refresh: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  search:  () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  edit:    () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash:   () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  x:       () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  check:   () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  warn:    () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  spin:    () => <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>,
}

// ── SHARED INPUT CLASS ─────────────────────────────────────
const inputCls = "w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-neutral-100 text-sm focus:outline-none focus:border-amber-500 placeholder-neutral-600 transition-colors"

// ── BUTTONS ───────────────────────────────────────────────
const BtnPrimary   = ({ children, ...p }) => <button {...p} className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm uppercase tracking-wide rounded transition-colors cursor-pointer">{children}</button>
const BtnSecondary = ({ children, ...p }) => <button {...p} className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-neutral-100 border border-neutral-700 font-bold text-sm uppercase tracking-wide rounded transition-colors cursor-pointer">{children}</button>
const BtnDanger    = ({ children, ...p }) => <button {...p} className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-transparent hover:bg-red-500 text-red-500 hover:text-white border border-red-500 font-bold text-xs uppercase tracking-wide rounded transition-colors cursor-pointer">{children}</button>
const BtnIcon      = ({ children, ...p }) => <button {...p} className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-neutral-100 border border-neutral-700 text-xs rounded transition-colors cursor-pointer">{children}</button>

// ── NOTIFICATION ──────────────────────────────────────────
function Notification({ notif }) {
  if (!notif) return null
  return (
    <div className={`fixed top-16 right-6 z-50 flex items-center gap-2 min-w-60 px-4 py-3 rounded text-sm bg-neutral-800 border border-neutral-700 shadow-xl ${notif.err ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-emerald-500'}`}>
      {notif.err ? <Icons.warn /> : <Icons.check />}
      <span className="text-neutral-200">{notif.msg}</span>
    </div>
  )
}

// ── MODAL ─────────────────────────────────────────────────
function Modal({ open, title, onClose, footer, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-neutral-900 border border-neutral-700 border-t-2 border-t-amber-500 rounded w-[540px] max-w-[95vw] max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <h2 className="font-bold text-lg uppercase tracking-wide text-neutral-100">{title}</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-200 transition-colors cursor-pointer"><Icons.x /></button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-3 px-6 py-4 border-t border-neutral-800">{footer}</div>}
      </div>
    </div>
  )
}

// ── FORM FIELD ────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-medium text-neutral-500 uppercase tracking-widest mb-1.5 font-mono">{label}</label>
      {children}
    </div>
  )
}

// ── EMPTY STATE ───────────────────────────────────────────
function Empty({ Icon, text }) {
  return (
    <tr><td colSpan={99}>
      <div className="flex flex-col items-center justify-center py-16 text-neutral-600">
        <Icon /><span className="mt-3 text-sm">{text}</span>
      </div>
    </td></tr>
  )
}

// ── CONFIRM MODAL ─────────────────────────────────────────
function ConfirmModal({ confirm, onClose }) {
  return (
    <Modal open={!!confirm} title="Confirmar eliminación" onClose={onClose}
      footer={<><BtnSecondary onClick={onClose}>Cancelar</BtnSecondary><BtnDanger onClick={confirm?.fn}>Eliminar</BtnDanger></>}>
      <p className="text-neutral-400 text-sm leading-relaxed">
        ¿Eliminar <strong className="text-neutral-100">{confirm?.label}</strong>? Esta acción no se puede deshacer.
      </p>
    </Modal>
  )
}

// ══════════════════════════════════════════════════════════
//  CLIENTES PAGE
// ══════════════════════════════════════════════════════════
function ClientesPage({ notify }) {
  const [rows, setRows]         = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading]   = useState(false)
  const [search, setSearch]     = useState('')
  const [modal, setModal]       = useState(false)
  const [confirm, setConfirm]   = useState(null)
  const [form, setForm]         = useState({ id: '', nombre: '', telefono: '', correo: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await sbFetch('clientes?order=created_at.desc')
      setRows(data || []); setFiltered(data || [])
    } catch (e) { notify(e.message, true) }
    finally { setLoading(false) }
  }, [notify])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(rows.filter(c =>
      (c.nombre || '').toLowerCase().includes(q) ||
      (c.telefono || '').toLowerCase().includes(q) ||
      (c.correo || '').toLowerCase().includes(q)
    ))
  }, [search, rows])

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }))
  function openNew()   { setForm({ id: '', nombre: '', telefono: '', correo: '' }); setModal(true) }
  function openEdit(c) { setForm({ id: c.id, nombre: c.nombre||'', telefono: c.telefono||'', correo: c.correo||'' }); setModal(true) }

  async function save() {
    if (!form.nombre || !form.telefono || !form.correo) return notify('Completa todos los campos', true)
    const payload = { nombre: form.nombre, telefono: form.telefono, correo: form.correo }
    try {
      form.id ? await sbFetch(`clientes?id=eq.${form.id}`, 'PATCH', payload)
              : await sbFetch('clientes', 'POST', payload)
      notify(form.id ? 'Cliente actualizado' : 'Cliente registrado')
      setModal(false); load()
    } catch (e) { notify(e.message, true) }
  }

  async function remove(id) {
    try { await sbFetch(`clientes?id=eq.${id}`, 'DELETE'); notify('Cliente eliminado'); setConfirm(null); load() }
    catch (e) { notify(e.message, true) }
  }

  return (
    <>
      <div className="flex items-end justify-between mb-7">
        <div>
          <p className="font-mono text-xs text-neutral-600 tracking-widest mb-1">// RF-001 · RF-004</p>
          <h1 className="text-3xl font-black uppercase tracking-wide text-neutral-100">Gestión de Clientes</h1>
        </div>
        <BtnPrimary onClick={openNew}><Icons.plus /> Nuevo Cliente</BtnPrimary>
      </div>

      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"><Icons.search /></span>
          <input className={`${inputCls} pl-9`} placeholder="Buscar por nombre, teléfono o correo…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <BtnSecondary onClick={load}>{loading ? <Icons.spin /> : <Icons.refresh />} Recargar</BtnSecondary>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded overflow-hidden">
        <table className="w-full border-collapse">
          <thead className="bg-neutral-800/60">
            <tr>{['#','Nombre','Teléfono','Correo','Registrado','Acciones'].map(h =>
              <th key={h} className="px-4 py-3 text-left font-mono text-[0.65rem] text-neutral-500 uppercase tracking-widest border-b border-neutral-800 whitespace-nowrap">{h}</th>
            )}</tr>
          </thead>
          <tbody>
            {loading        ? <Empty Icon={Icons.spin}  text="Cargando…" /> :
             !filtered.length ? <Empty Icon={Icons.users} text="No hay clientes registrados" /> :
             filtered.map((c, i) => (
              <tr key={c.id} className="border-b border-neutral-800 last:border-0 hover:bg-neutral-800/40 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-neutral-600">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-neutral-100">{c.nombre}</td>
                <td className="px-4 py-3 text-sm text-neutral-400">{c.telefono || '—'}</td>
                <td className="px-4 py-3 text-sm text-neutral-400">{c.correo || '—'}</td>
                <td className="px-4 py-3 font-mono text-xs text-neutral-600">{fmtDate(c.created_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <BtnIcon onClick={() => openEdit(c)}><Icons.edit /></BtnIcon>
                    <BtnDanger onClick={() => setConfirm({ id: c.id, label: c.nombre, fn: () => remove(c.id) })}><Icons.trash /></BtnDanger>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal} title={form.id ? 'Editar Cliente' : 'Nuevo Cliente'} onClose={() => setModal(false)}
        footer={<><BtnSecondary onClick={() => setModal(false)}>Cancelar</BtnSecondary><BtnPrimary onClick={save}>Guardar</BtnPrimary></>}>
        <Field label="Nombre completo *">
          <input className={inputCls} placeholder="Ej. Juan Pérez García" value={form.nombre} onChange={e => setF('nombre', e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Teléfono *">
            <input className={inputCls} placeholder="Ej. 3111234567" value={form.telefono} onChange={e => setF('telefono', e.target.value)} />
          </Field>
          <Field label="Correo electrónico *">
            <input className={inputCls} type="email" placeholder="correo@ejemplo.com" value={form.correo} onChange={e => setF('correo', e.target.value)} />
          </Field>
        </div>
      </Modal>

      <ConfirmModal confirm={confirm} onClose={() => setConfirm(null)} />
    </>
  )
}

// ══════════════════════════════════════════════════════════
//  PROYECTOS PAGE
// ══════════════════════════════════════════════════════════
function ProyectosPage({ notify }) {
  const [rows, setRows]           = useState([])
  const [clientes, setClientes]   = useState([])
  const [filtered, setFiltered]   = useState([])
  const [loading, setLoading]     = useState(false)
  const [search, setSearch]       = useState('')
  const [estFilter, setEstFilter] = useState('')
  const [modal, setModal]         = useState(false)
  const [confirm, setConfirm]     = useState(null)
  const [form, setForm]           = useState({ id: '', titulo: '', cliente_id: '', mecanico: '', estado: 'Activo', descripcion: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [p, c] = await Promise.all([
        sbFetch('proyectos?order=created_at.desc'),
        sbFetch('clientes?select=id,nombre&order=nombre'),
      ])
      setRows(p || []); setClientes(c || []); setFiltered(p || [])
    } catch (e) { notify(e.message, true) }
    finally { setLoading(false) }
  }, [notify])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const q = search.toLowerCase()
    const getN = id => (clientes.find(c => String(c.id) === String(id))?.nombre || '').toLowerCase()
    let f = rows.filter(p =>
      (p.titulo || '').toLowerCase().includes(q) ||
      getN(p.cliente_id).includes(q) ||
      (p.mecanico || '').toLowerCase().includes(q)
    )
    if (estFilter) f = f.filter(p => p.estado === estFilter)
    setFiltered(f)
  }, [search, estFilter, rows, clientes])

  const clienteNombre = id => clientes.find(c => String(c.id) === String(id))?.nombre || '—'
  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }))
  function openNew()   { setForm({ id: '', titulo: '', cliente_id: '', mecanico: '', estado: 'Activo', descripcion: '' }); setModal(true) }
  function openEdit(p) { setForm({ id: p.id, titulo: p.titulo||'', cliente_id: p.cliente_id||'', mecanico: p.mecanico||'', estado: p.estado||'Activo', descripcion: p.descripcion||'' }); setModal(true) }

  async function save() {
    if (!form.titulo || !form.cliente_id || !form.mecanico) return notify('Completa todos los campos obligatorios', true)
    const payload = { titulo: form.titulo, cliente_id: form.cliente_id, mecanico: form.mecanico, estado: form.estado, descripcion: form.descripcion }
    try {
      form.id ? await sbFetch(`proyectos?id=eq.${form.id}`, 'PATCH', payload)
              : await sbFetch('proyectos', 'POST', payload)
      notify(form.id ? 'Proyecto actualizado' : 'Proyecto registrado')
      setModal(false); load()
    } catch (e) { notify(e.message, true) }
  }

  async function remove(id) {
    try { await sbFetch(`proyectos?id=eq.${id}`, 'DELETE'); notify('Proyecto eliminado'); setConfirm(null); load() }
    catch (e) { notify(e.message, true) }
  }

  return (
    <>
      <div className="flex items-end justify-between mb-7">
        <div>
          <p className="font-mono text-xs text-neutral-600 tracking-widest mb-1">// RF-027 · RF-007</p>
          <h1 className="text-3xl font-black uppercase tracking-wide text-neutral-100">Gestión de Proyectos</h1>
        </div>
        <BtnPrimary onClick={openNew}><Icons.plus /> Nuevo Proyecto</BtnPrimary>
      </div>

      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"><Icons.search /></span>
          <input className={`${inputCls} pl-9`} placeholder="Buscar por título, cliente o mecánico…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className={`${inputCls} w-44`} value={estFilter} onChange={e => setEstFilter(e.target.value)}>
          <option value="">Todos los estados</option>
          {['Activo','Pendiente','Finalizado','Cerrado'].map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <BtnSecondary onClick={load}>{loading ? <Icons.spin /> : <Icons.refresh />} Recargar</BtnSecondary>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded overflow-hidden">
        <table className="w-full border-collapse">
          <thead className="bg-neutral-800/60">
            <tr>{['#','Título','Cliente','Mecánico','Estado','Fecha','Acciones'].map(h =>
              <th key={h} className="px-4 py-3 text-left font-mono text-[0.65rem] text-neutral-500 uppercase tracking-widest border-b border-neutral-800 whitespace-nowrap">{h}</th>
            )}</tr>
          </thead>
          <tbody>
            {loading         ? <Empty Icon={Icons.spin} text="Cargando…" /> :
             !filtered.length ? <Empty Icon={Icons.clip} text="No hay proyectos registrados" /> :
             filtered.map((p, i) => (
              <tr key={p.id} className="border-b border-neutral-800 last:border-0 hover:bg-neutral-800/40 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-neutral-600">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-neutral-100">{p.titulo}</td>
                <td className="px-4 py-3 text-sm text-neutral-400">{clienteNombre(p.cliente_id)}</td>
                <td className="px-4 py-3 text-sm text-neutral-400">{p.mecanico || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[0.65rem] font-mono font-medium uppercase tracking-wide ${BADGE[p.estado] || BADGE.Cerrado}`}>
                    {p.estado || '—'}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-neutral-600">{fmtDate(p.created_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <BtnIcon onClick={() => openEdit(p)}><Icons.edit /></BtnIcon>
                    <BtnDanger onClick={() => setConfirm({ id: p.id, label: p.titulo, fn: () => remove(p.id) })}><Icons.trash /></BtnDanger>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal} title={form.id ? 'Editar Proyecto' : 'Nuevo Proyecto'} onClose={() => setModal(false)}
        footer={<><BtnSecondary onClick={() => setModal(false)}>Cancelar</BtnSecondary><BtnPrimary onClick={save}>Guardar</BtnPrimary></>}>
        <Field label="Título del proyecto *">
          <input className={inputCls} placeholder="Ej. Reparación motor Honda Civic 2020" value={form.titulo} onChange={e => setF('titulo', e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Cliente *">
            <select className={inputCls} value={form.cliente_id} onChange={e => setF('cliente_id', e.target.value)}>
              <option value="">— Seleccionar —</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </Field>
          <Field label="Mecánico asignado *">
            <input className={inputCls} placeholder="Nombre del mecánico" value={form.mecanico} onChange={e => setF('mecanico', e.target.value)} />
          </Field>
        </div>
        <Field label="Estado">
          <select className={inputCls} value={form.estado} onChange={e => setF('estado', e.target.value)}>
            {['Activo','Pendiente','Finalizado','Cerrado'].map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </Field>
        <Field label="Descripción / Diagnóstico">
          <textarea className={inputCls} rows={3} placeholder="Descripción del servicio o diagnóstico inicial…" value={form.descripcion} onChange={e => setF('descripcion', e.target.value)} style={{ resize: 'vertical' }} />
        </Field>
      </Modal>

      <ConfirmModal confirm={confirm} onClose={() => setConfirm(null)} />
    </>
  )
}

// ── CONFIG PAGE ───────────────────────────────────────────
function ConfigPage() {
  return (
    <>
      <div className="mb-7">
        <p className="font-mono text-xs text-neutral-600 tracking-widest mb-1">// sistema</p>
        <h1 className="text-3xl font-black uppercase tracking-wide text-neutral-100">Conexión Supabase</h1>
      </div>
      <div className="bg-neutral-900 border border-neutral-800 border-l-2 border-l-amber-500 rounded p-5 mb-6">
        <p className="text-neutral-400 text-sm leading-relaxed mb-4">
          Configura las variables en tu <code className="text-amber-400 font-mono">.env</code> (local) y en <strong className="text-neutral-200">Vercel → Settings → Environment Variables</strong>:
        </p>
        <pre className="bg-neutral-800 border border-neutral-700 rounded p-4 font-mono text-sm text-neutral-300 leading-relaxed overflow-x-auto">{`VITE_SUPABASE_URL=https://xxxx.supabase.co\nVITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiI...`}</pre>
      </div>
      <p className="text-neutral-500 text-sm font-medium mb-3">Estructura esperada en Supabase:</p>
      <div className="grid grid-cols-2 gap-4">
        {[
          { name: 'clientes',  fields: ['id (uuid / serial)', 'nombre (text)', 'telefono (text)', 'correo (text, unique)', 'created_at (timestamp)'] },
          { name: 'proyectos', fields: ['id (uuid / serial)', 'titulo (text)', 'cliente_id (fk → clientes)', 'mecanico (text)', 'estado (text)', 'descripcion (text)', 'created_at (timestamp)'] },
        ].map(t => (
          <div key={t.name} className="bg-neutral-900 border border-neutral-800 rounded p-4">
            <p className="font-mono text-xs text-amber-500 tracking-widest mb-3">TABLE: {t.name}</p>
            <div className="font-mono text-xs text-neutral-400 leading-7">{t.fields.map(f => <div key={f}>{f}</div>)}</div>
          </div>
        ))}
      </div>
    </>
  )
}

// ── APP ROOT ──────────────────────────────────────────────
export default function App() {
  const [page, setPage]   = useState('clientes')
  const [notif, setNotif] = useState(null)

  const notify = useCallback((msg, err = false) => {
    setNotif({ msg, err })
    setTimeout(() => setNotif(null), 3500)
  }, [])

  const connected = !!SUPABASE_URL && !!SUPABASE_KEY

  const navItems = [
    { id: 'clientes',  label: 'Clientes',  Icon: Icons.users },
    { id: 'proyectos', label: 'Proyectos', Icon: Icons.clip  },
  ]

  return (
    <div className="flex flex-col h-screen bg-neutral-950 text-neutral-100">
      <Notification notif={notif} />

      {/* HEADER */}
      <header className="flex items-center justify-between px-6 h-14 bg-neutral-900 border-b-2 border-amber-500 shrink-0">
        <div className="font-black text-2xl uppercase tracking-widest text-amber-500">
          Stathmos <span className="text-neutral-500 font-normal text-sm tracking-widest">// Gestión de Taller</span>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${connected ? 'bg-emerald-400' : 'bg-red-500'}`} />
          <span className={connected ? 'text-emerald-400' : 'text-red-400'}>
            {connected ? 'ENV CONFIGURADO' : 'SIN CONFIGURAR'}
          </span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <nav className="w-52 bg-neutral-900 border-r border-neutral-800 py-5 shrink-0">
          <p className="px-4 mb-1 font-mono text-[0.6rem] text-neutral-600 uppercase tracking-widest">Módulos</p>
          {navItems.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setPage(id)}
              className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors cursor-pointer border-l-[3px] ${
                page === id
                  ? 'bg-neutral-800 text-amber-500 border-l-amber-500'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50 border-l-transparent'
              }`}>
              <Icon /> {label}
            </button>
          ))}
          <div className="mx-4 my-3 h-px bg-neutral-800" />
          <p className="px-4 mb-1 font-mono text-[0.6rem] text-neutral-600 uppercase tracking-widest">Config</p>
          <button onClick={() => setPage('config')}
            className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors cursor-pointer border-l-[3px] ${
              page === 'config'
                ? 'bg-neutral-800 text-amber-500 border-l-amber-500'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50 border-l-transparent'
            }`}>
            <Icons.plug /> Conexión BD
          </button>
        </nav>

        {/* MAIN */}
        <main className="flex-1 overflow-y-auto p-8 bg-neutral-950">
          {page === 'clientes'  && <ClientesPage  notify={notify} />}
          {page === 'proyectos' && <ProyectosPage notify={notify} />}
          {page === 'config'    && <ConfigPage />}
        </main>
      </div>
    </div>
  )
}