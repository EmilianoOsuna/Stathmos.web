import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabaseClient'
import Login from './Login'

// ── SUPABASE REST HELPER ───────────────────────────────────
async function sbFetch(path, method = 'GET', body = null) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) throw new Error('Sin sesión activa')

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
  const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

  const opts = {
    method,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${token}`,
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

// Adaptado a los valores del CHECK(estado) de tu tabla proyectos
const BADGE = {
  activo:              'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  en_progreso:         'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  pendiente_refaccion: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  terminado:           'bg-purple-500/15 text-purple-400 border border-purple-500/30',
  entregado:           'bg-neutral-500/15 text-neutral-400 border border-neutral-500/30',
  cancelado:           'bg-red-500/15 text-red-400 border border-red-500/30',
}

const ESTADOS_PROYECTO = ['activo', 'en_progreso', 'pendiente_refaccion', 'terminado', 'entregado', 'cancelado']

// ── ICONS ─────────────────────────────────────────────────
const Icons = {
  users:   () => <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  clip:    () => <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>,
  plug:    () => <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22v-5M9 8V2M15 8V2M18 8H6a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2z"/></svg>,
  plus:    () => <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  refresh: () => <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  search:  () => <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  edit:    () => <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash:   () => <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  x:       () => <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  check:   () => <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  warn:    () => <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  spin:    () => <svg className="w-4 h-4 shrink-0 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>,
  logout:  () => <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  menu:    () => <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
}

const inputCls = "w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-neutral-100 text-sm focus:outline-none focus:border-amber-500 placeholder-neutral-600 transition-colors"

// ── BUTTONS ───────────────────────────────────────────────
const BtnPrimary   = ({ children, className = '', ...p }) => <button {...p} className={`inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm uppercase tracking-wide rounded transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`}>{children}</button>
const BtnSecondary = ({ children, className = '', ...p }) => <button {...p} className={`inline-flex items-center justify-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-neutral-100 border border-neutral-700 font-bold text-sm uppercase tracking-wide rounded transition-colors cursor-pointer ${className}`}>{children}</button>
const BtnDanger    = ({ children, className = '', ...p }) => <button {...p} className={`inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-transparent hover:bg-red-500 text-red-500 hover:text-white border border-red-500 font-bold text-xs uppercase tracking-wide rounded transition-colors cursor-pointer ${className}`}>{children}</button>
const BtnIcon      = ({ children, className = '', ...p }) => <button {...p} className={`inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-neutral-100 border border-neutral-700 text-xs rounded transition-colors cursor-pointer ${className}`}>{children}</button>

// ── NOTIFICATION & MODAL ──────────────────────────────────
function Notification({ notif }) {
  if (!notif) return null
  return (
    <div className={`fixed top-16 right-4 sm:right-6 z-50 flex items-center gap-2 min-w-[240px] px-4 py-3 rounded text-sm bg-neutral-800 border border-neutral-700 shadow-xl ${notif.err ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-emerald-500'}`}>
      {notif.err ? <Icons.warn /> : <Icons.check />}
      <span className="text-neutral-200">{notif.msg}</span>
    </div>
  )
}

function Modal({ open, title, onClose, footer, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-neutral-900 border border-neutral-700 border-t-2 border-t-amber-500 rounded w-full sm:w-[540px] max-w-full max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-neutral-800 shrink-0">
          <h2 className="font-bold text-lg uppercase tracking-wide text-neutral-100 truncate pr-2">{title}</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-200 transition-colors cursor-pointer p-1"><Icons.x /></button>
        </div>
        <div className="px-4 sm:px-6 py-5 overflow-y-auto">{children}</div>
        {footer && <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 px-4 sm:px-6 py-4 border-t border-neutral-800 shrink-0">{footer}</div>}
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-medium text-neutral-500 uppercase tracking-widest mb-1.5 font-mono">{label}</label>
      {children}
    </div>
  )
}

function Empty({ Icon, text }) {
  return (
    <tr><td colSpan={99}>
      <div className="flex flex-col items-center justify-center py-16 text-neutral-600 px-4 text-center">
        <Icon /><span className="mt-3 text-sm">{text}</span>
      </div>
    </td></tr>
  )
}

function ConfirmModal({ confirm, onClose }) {
  return (
    <Modal open={!!confirm} title="Confirmar eliminación" onClose={onClose}
      footer={<><BtnSecondary onClick={onClose} className="w-full sm:w-auto">Cancelar</BtnSecondary><BtnDanger onClick={confirm?.fn} className="w-full sm:w-auto py-2 sm:py-1.5">Eliminar</BtnDanger></>}>
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
  const [form, setForm]         = useState({ id: '', nombre: '', telefono: '', correo: '', direccion: '' })

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
  function openNew()   { setForm({ id: '', nombre: '', telefono: '', correo: '', direccion: '' }); setModal(true) }
  function openEdit(c) { setForm({ id: c.id, nombre: c.nombre||'', telefono: c.telefono||'', correo: c.correo||'', direccion: c.direccion||'' }); setModal(true) }

  async function save() {
    if (!form.nombre || !form.telefono) return notify('Nombre y teléfono son obligatorios', true)
    const payload = { nombre: form.nombre, telefono: form.telefono, correo: form.correo, direccion: form.direccion }
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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wide text-neutral-100">Gestión de Clientes</h1>
        </div>
        <BtnPrimary onClick={openNew} className="w-full sm:w-auto"><Icons.plus /> Nuevo Cliente</BtnPrimary>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"><Icons.search /></span>
          <input className={`${inputCls} pl-9`} placeholder="Buscar por nombre, teléfono o correo…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <BtnSecondary onClick={load} className="w-full sm:w-auto">{loading ? <Icons.spin /> : <Icons.refresh />} Recargar</BtnSecondary>
      </div>
      <div className="bg-neutral-900 border border-neutral-800 rounded overflow-x-auto">
        <table className="w-full border-collapse min-w-[600px]">
          <thead className="bg-neutral-800/60">
            <tr>{['Nombre','Teléfono','Correo','Registrado','Acciones'].map(h =>
              <th key={h} className="px-4 py-3 text-left font-mono text-[0.65rem] text-neutral-500 uppercase tracking-widest border-b border-neutral-800 whitespace-nowrap">{h}</th>
            )}</tr>
          </thead>
          <tbody>
            {loading          ? <Empty Icon={Icons.spin}  text="Cargando…" /> :
             !filtered.length ? <Empty Icon={Icons.users} text="No hay clientes registrados" /> :
             filtered.map((c) => (
              <tr key={c.id} className="border-b border-neutral-800 last:border-0 hover:bg-neutral-800/40 transition-colors">
                <td className="px-4 py-3 font-medium text-neutral-100 whitespace-nowrap">{c.nombre}</td>
                <td className="px-4 py-3 text-sm text-neutral-400 whitespace-nowrap">{c.telefono || '—'}</td>
                <td className="px-4 py-3 text-sm text-neutral-400">{c.correo || '—'}</td>
                <td className="px-4 py-3 font-mono text-xs text-neutral-600 whitespace-nowrap">{fmtDate(c.created_at)}</td>
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
        footer={<><BtnSecondary onClick={() => setModal(false)} className="w-full sm:w-auto">Cancelar</BtnSecondary><BtnPrimary onClick={save} className="w-full sm:w-auto">Guardar</BtnPrimary></>}>
        <Field label="Nombre completo *">
          <input className={inputCls} placeholder="Ej. Juan Pérez García" value={form.nombre} onChange={e => setF('nombre', e.target.value)} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Teléfono *">
            <input className={inputCls} placeholder="Ej. 3111234567" value={form.telefono} onChange={e => setF('telefono', e.target.value)} />
          </Field>
          <Field label="Correo electrónico">
            <input className={inputCls} type="email" placeholder="correo@ejemplo.com" value={form.correo} onChange={e => setF('correo', e.target.value)} />
          </Field>
        </div>
        <Field label="Dirección">
          <input className={inputCls} placeholder="Calle, Número, Colonia..." value={form.direccion} onChange={e => setF('direccion', e.target.value)} />
        </Field>
      </Modal>
      <ConfirmModal confirm={confirm} onClose={() => setConfirm(null)} />
    </>
  )
}

// ══════════════════════════════════════════════════════════
//  PROYECTOS PAGE (ACTUALIZADO AL ESQUEMA REAL)
// ══════════════════════════════════════════════════════════
function ProyectosPage({ notify }) {
  const [rows, setRows]           = useState([])
  const [clientes, setClientes]   = useState([])
  const [vehiculos, setVehiculos] = useState([])
  const [empleados, setEmpleados] = useState([])
  
  const [filtered, setFiltered]   = useState([])
  const [loading, setLoading]     = useState(false)
  const [search, setSearch]       = useState('')
  const [estFilter, setEstFilter] = useState('')
  const [modal, setModal]         = useState(false)
  const [confirm, setConfirm]     = useState(null)
  
  // Ahora incluye vehiculo_id y mecanico_id (llaves foráneas)
  const [form, setForm]           = useState({ id: '', titulo: '', cliente_id: '', vehiculo_id: '', mecanico_id: '', estado: 'activo', descripcion: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // Cargamos todas las relaciones necesarias
      const [p, c, v, e] = await Promise.all([
        sbFetch('proyectos?order=created_at.desc'),
        sbFetch('clientes?select=id,nombre&order=nombre'),
        sbFetch('vehiculos?select=id,marca,modelo,placas,cliente_id'),
        sbFetch('empleados?select=id,nombre&order=nombre')
      ])
      setRows(p || []); setClientes(c || []); setVehiculos(v || []); setEmpleados(e || []); setFiltered(p || [])
    } catch (err) { notify(err.message, true) }
    finally { setLoading(false) }
  }, [notify])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const q = search.toLowerCase()
    const getN = id => (clientes.find(c => String(c.id) === String(id))?.nombre || '').toLowerCase()
    const getV = id => {
        const v = vehiculos.find(v => String(v.id) === String(id))
        return v ? `${v.marca} ${v.modelo} ${v.placas}`.toLowerCase() : ''
    }
    
    let f = rows.filter(p =>
      (p.titulo || '').toLowerCase().includes(q) ||
      getN(p.cliente_id).includes(q) ||
      getV(p.vehiculo_id).includes(q)
    )
    if (estFilter) f = f.filter(p => p.estado === estFilter)
    setFiltered(f)
  }, [search, estFilter, rows, clientes, vehiculos])

  const clienteNombre = id => clientes.find(c => String(c.id) === String(id))?.nombre || '—'
  const empleadoNombre = id => empleados.find(e => String(e.id) === String(id))?.nombre || '—'
  const vehiculoInfo = id => {
      const v = vehiculos.find(v => String(v.id) === String(id))
      return v ? `${v.marca} ${v.modelo} (${v.placas})` : '—'
  }

  const setF = (k, v) => {
    setForm(p => {
      const next = { ...p, [k]: v }
      // Si cambian de cliente, resetear el vehículo seleccionado porque ya no le pertenece
      if (k === 'cliente_id') next.vehiculo_id = ''
      return next
    })
  }

  function openNew()   { setForm({ id: '', titulo: '', cliente_id: '', vehiculo_id: '', mecanico_id: '', estado: 'activo', descripcion: '' }); setModal(true) }
  function openEdit(p) { setForm({ id: p.id, titulo: p.titulo||'', cliente_id: p.cliente_id||'', vehiculo_id: p.vehiculo_id||'', mecanico_id: p.mecanico_id||'', estado: p.estado||'activo', descripcion: p.descripcion||'' }); setModal(true) }

  async function save() {
    if (!form.titulo || !form.cliente_id || !form.vehiculo_id) return notify('Título, cliente y vehículo son obligatorios', true)
    
    const payload = { 
        titulo: form.titulo, 
        cliente_id: form.cliente_id, 
        vehiculo_id: form.vehiculo_id,
        mecanico_id: form.mecanico_id || null, // Puede ser null
        estado: form.estado, 
        descripcion: form.descripcion 
    }
    
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

  // Filtrar vehículos disponibles para el cliente seleccionado
  const vehiculosDelCliente = vehiculos.filter(v => String(v.cliente_id) === String(form.cliente_id))

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wide text-neutral-100">Gestión de Proyectos</h1>
        </div>
        <BtnPrimary onClick={openNew} className="w-full sm:w-auto"><Icons.plus /> Nuevo Proyecto</BtnPrimary>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"><Icons.search /></span>
          <input className={`${inputCls} pl-9`} placeholder="Buscar por título, cliente o vehículo…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className={`${inputCls} w-full sm:w-48`} value={estFilter} onChange={e => setEstFilter(e.target.value)}>
          <option value="">Todos los estados</option>
          {ESTADOS_PROYECTO.map(e => <option key={e} value={e}>{e.replace('_', ' ')}</option>)}
        </select>
        <BtnSecondary onClick={load} className="w-full sm:w-auto">{loading ? <Icons.spin /> : <Icons.refresh />} Recargar</BtnSecondary>
      </div>
      <div className="bg-neutral-900 border border-neutral-800 rounded overflow-x-auto">
        <table className="w-full border-collapse min-w-[900px]">
          <thead className="bg-neutral-800/60">
            <tr>{['Título','Cliente','Vehículo', 'Mecánico', 'Estado','Fecha','Acciones'].map(h =>
              <th key={h} className="px-4 py-3 text-left font-mono text-[0.65rem] text-neutral-500 uppercase tracking-widest border-b border-neutral-800 whitespace-nowrap">{h}</th>
            )}</tr>
          </thead>
          <tbody>
            {loading          ? <Empty Icon={Icons.spin} text="Cargando…" /> :
             !filtered.length ? <Empty Icon={Icons.clip} text="No hay proyectos registrados" /> :
             filtered.map((p) => (
              <tr key={p.id} className="border-b border-neutral-800 last:border-0 hover:bg-neutral-800/40 transition-colors">
                <td className="px-4 py-3 font-medium text-neutral-100 whitespace-nowrap">{p.titulo}</td>
                <td className="px-4 py-3 text-sm text-neutral-400 whitespace-nowrap">{clienteNombre(p.cliente_id)}</td>
                <td className="px-4 py-3 text-sm text-neutral-400 whitespace-nowrap">{vehiculoInfo(p.vehiculo_id)}</td>
                <td className="px-4 py-3 text-sm text-neutral-400 whitespace-nowrap">{empleadoNombre(p.mecanico_id)}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[0.65rem] font-mono font-medium uppercase tracking-wide ${BADGE[p.estado] || BADGE.cancelado}`}>
                    {(p.estado || '—').replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-neutral-600 whitespace-nowrap">{fmtDate(p.created_at)}</td>
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
        footer={<><BtnSecondary onClick={() => setModal(false)} className="w-full sm:w-auto">Cancelar</BtnSecondary><BtnPrimary onClick={save} className="w-full sm:w-auto">Guardar</BtnPrimary></>}>
        <Field label="Título del proyecto *">
          <input className={inputCls} placeholder="Ej. Reparación de frenos" value={form.titulo} onChange={e => setF('titulo', e.target.value)} />
        </Field>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Cliente *">
            <select className={inputCls} value={form.cliente_id} onChange={e => setF('cliente_id', e.target.value)}>
              <option value="">— Seleccionar Cliente —</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </Field>
          
          <Field label="Vehículo *">
            <select className={inputCls} value={form.vehiculo_id} onChange={e => setF('vehiculo_id', e.target.value)} disabled={!form.cliente_id}>
              <option value="">— Seleccionar Vehículo —</option>
              {vehiculosDelCliente.map(v => <option key={v.id} value={v.id}>{v.marca} {v.modelo} ({v.placas})</option>)}
            </select>
            {form.cliente_id && vehiculosDelCliente.length === 0 && (
                <p className="text-red-400 text-xs mt-1">Este cliente no tiene vehículos registrados.</p>
            )}
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Mecánico asignado">
                <select className={inputCls} value={form.mecanico_id} onChange={e => setF('mecanico_id', e.target.value)}>
                <option value="">— Sin Asignar —</option>
                {empleados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
            </Field>

            <Field label="Estado del proyecto">
            <select className={inputCls} value={form.estado} onChange={e => setF('estado', e.target.value)}>
                {ESTADOS_PROYECTO.map(e => <option key={e} value={e}>{e.replace('_', ' ').toUpperCase()}</option>)}
            </select>
            </Field>
        </div>

        <Field label="Descripción / Diagnóstico">
          <textarea className={inputCls} rows={3} placeholder="Descripción del servicio o diagnóstico inicial…" value={form.descripcion} onChange={e => setF('descripcion', e.target.value)} style={{ resize: 'vertical' }} />
        </Field>
      </Modal>
      <ConfirmModal confirm={confirm} onClose={() => setConfirm(null)} />
    </>
  )
}

// ── APP ROOT & MENU (Mismo que el anterior pero con ConfigPage simplificada) ──
function ConfigPage() {
    return (
      <>
        <div className="mb-7">
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wide text-neutral-100">Conexión Supabase</h1>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 border-l-2 border-l-amber-500 rounded p-5 mb-6">
          <p className="text-neutral-400 text-sm leading-relaxed mb-4">
            Asegúrate de tener tus políticas de RLS (Row Level Security) configuradas o desactivadas para desarrollo.
          </p>
          <pre className="bg-neutral-800 border border-neutral-700 rounded p-4 font-mono text-xs sm:text-sm text-neutral-300 leading-relaxed overflow-x-auto">{`VITE_SUPABASE_URL=https://xxxx.supabase.co\nVITE_SUPABASE_ANON_KEY=eyJhbGci...`}</pre>
        </div>
      </>
    )
  }

export default function App() {
  const [session, setSession] = useState(undefined)
  const [page, setPage]       = useState('clientes')
  const [notif, setNotif]     = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  const notify = useCallback((msg, err = false) => {
    setNotif({ msg, err })
    setTimeout(() => setNotif(null), 3500)
  }, [])

  async function handleLogout() { await supabase.auth.signOut() }

  if (session === undefined) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-neutral-500 font-mono text-sm"><Icons.spin /> Cargando…</div>
      </div>
    )
  }

  if (!session) return <Login />

  const navItems = [
    { id: 'clientes',  label: 'Clientes',  Icon: Icons.users },
    { id: 'proyectos', label: 'Proyectos', Icon: Icons.clip  },
  ]

  const changePage = (id) => {
    setPage(id);
    setMobileMenuOpen(false);
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-neutral-950 text-neutral-100 overflow-hidden">
      <Notification notif={notif} />
      <header className="flex items-center justify-between px-4 sm:px-6 h-14 bg-neutral-900 border-b-2 border-amber-500 shrink-0 relative z-20">
        <div className="flex items-center gap-3">
          <button className="md:hidden text-neutral-400 hover:text-white transition-colors" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <Icons.x /> : <Icons.menu />}
          </button>
          <div className="font-black text-xl sm:text-2xl uppercase tracking-widest text-amber-500 truncate">
            Stathmos <span className="hidden sm:inline text-neutral-500 font-normal text-sm tracking-widest">// Gestión de Taller</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs text-neutral-500 hidden md:block">{session.user.email}</span>
          <button onClick={handleLogout} className="inline-flex items-center gap-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 border border-neutral-700 text-xs font-bold uppercase rounded transition-colors">
            <Icons.logout /> <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <nav className={`absolute md:static inset-y-0 left-0 z-10 w-64 md:w-52 bg-neutral-900 border-r border-neutral-800 py-5 shrink-0 transform transition-transform duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
          <div className="md:hidden px-5 mb-4 font-mono text-xs text-neutral-400 break-all">{session.user.email}</div>
          <p className="px-4 mb-1 font-mono text-[0.6rem] text-neutral-600 uppercase tracking-widest">Módulos</p>
          {navItems.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => changePage(id)} className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors border-l-[3px] ${page === id ? 'bg-neutral-800 text-amber-500 border-l-amber-500' : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50 border-l-transparent'}`}>
              <Icon /> {label}
            </button>
          ))}
          <div className="mx-4 my-3 h-px bg-neutral-800" />
          <p className="px-4 mb-1 font-mono text-[0.6rem] text-neutral-600 uppercase tracking-widest">Config</p>
          <button onClick={() => changePage('config')} className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors border-l-[3px] ${page === 'config' ? 'bg-neutral-800 text-amber-500 border-l-amber-500' : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50 border-l-transparent'}`}>
            <Icons.plug /> Conexión BD
          </button>
        </nav>

        {mobileMenuOpen && <div className="absolute inset-0 bg-black/50 z-0 md:hidden" onClick={() => setMobileMenuOpen(false)} />}

        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-neutral-950 w-full">
          {page === 'clientes'  && <ClientesPage  notify={notify} />}
          {page === 'proyectos' && <ProyectosPage notify={notify} />}
          {page === 'config'    && <ConfigPage />}
        </main>
      </div>
    </div>
  )
}