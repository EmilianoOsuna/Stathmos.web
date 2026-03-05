import { useState, useEffect, useCallback } from 'react'

// ── SUPABASE CONFIG ────────────────────────────────────────
// Reemplaza estos valores con los de tu proyecto Supabase
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

async function sbFetch(path, method = 'GET', body = null) {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu .env')
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

// ── STYLES (CSS-in-JS via <style> tag injected once) ──────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;900&family=IBM+Plex+Mono:wght@400;500&family=Barlow:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0f0f0f; --surface: #161616; --surface2: #1e1e1e; --surface3: #252525;
    --border: #2e2e2e; --border2: #3a3a3a;
    --accent: #e8a020; --accent2: #ffbe4d;
    --danger: #e05252; --success: #4caf78;
    --text: #e8e8e8; --text2: #a0a0a0; --text3: #666;
  }

  body { background: var(--bg); color: var(--text); font-family: 'Barlow', sans-serif; }

  .st-app { display: flex; flex-direction: column; min-height: 100vh; }

  /* HEADER */
  .st-header {
    background: var(--surface); border-bottom: 2px solid var(--accent);
    padding: 0 2rem; display: flex; align-items: center;
    justify-content: space-between; height: 56px;
    position: sticky; top: 0; z-index: 100;
  }
  .st-logo {
    font-family: 'Barlow Condensed', sans-serif; font-weight: 900;
    font-size: 1.6rem; letter-spacing: 0.08em; color: var(--accent); text-transform: uppercase;
  }
  .st-logo span { color: var(--text2); font-weight: 400; font-size: 0.85rem; margin-left: 0.6rem; letter-spacing: 0.2em; }
  .st-status { font-family: 'IBM Plex Mono', monospace; font-size: 0.68rem; display: flex; align-items: center; gap: 0.4rem; }
  .st-dot { width: 6px; height: 6px; border-radius: 50%; animation: stPulse 2s infinite; }
  .st-dot.ok { background: var(--success); color: var(--success); }
  .st-dot.err { background: var(--danger); color: var(--danger); }
  @keyframes stPulse { 0%,100%{opacity:1} 50%{opacity:0.3} }

  /* LAYOUT */
  .st-body { display: flex; flex: 1; height: calc(100vh - 56px); }

  /* NAV */
  .st-nav { width: 210px; background: var(--surface); border-right: 1px solid var(--border); padding: 1.5rem 0; flex-shrink: 0; }
  .st-nav-section { padding: 0 1rem 0.5rem; font-family: 'IBM Plex Mono', monospace; font-size: 0.62rem; color: var(--text3); letter-spacing: 0.18em; text-transform: uppercase; }
  .st-nav-item {
    display: flex; align-items: center; gap: 0.75rem; padding: 0.65rem 1.25rem;
    cursor: pointer; color: var(--text2); font-size: 0.9rem; font-weight: 500;
    border-left: 3px solid transparent; transition: all 0.15s; user-select: none;
  }
  .st-nav-item:hover { background: var(--surface2); color: var(--text); }
  .st-nav-item.active { background: var(--surface2); color: var(--accent); border-left-color: var(--accent); }
  .st-divider { height: 1px; background: var(--border); margin: 0.75rem 1rem; }

  /* MAIN */
  .st-main { flex: 1; overflow-y: auto; padding: 2rem; background: var(--bg); }

  /* PAGE HEADER */
  .st-page-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 1.75rem; }
  .st-page-title { font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 2rem; text-transform: uppercase; letter-spacing: 0.05em; line-height: 1; }
  .st-page-title span { display: block; font-family: 'IBM Plex Mono', monospace; font-size: 0.68rem; font-weight: 400; color: var(--text3); letter-spacing: 0.2em; margin-bottom: 0.3rem; }

  /* BUTTONS */
  .st-btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1.2rem; border: none; border-radius: 3px; cursor: pointer; font-family: 'Barlow Condensed', sans-serif; font-weight: 600; font-size: 0.95rem; letter-spacing: 0.05em; text-transform: uppercase; transition: all 0.15s; }
  .st-btn-primary { background: var(--accent); color: #000; }
  .st-btn-primary:hover { background: var(--accent2); }
  .st-btn-secondary { background: var(--surface3); color: var(--text2); border: 1px solid var(--border2); }
  .st-btn-secondary:hover { background: var(--border); color: var(--text); }
  .st-btn-danger { background: transparent; color: var(--danger); border: 1px solid var(--danger); }
  .st-btn-danger:hover { background: var(--danger); color: #fff; }
  .st-btn-sm { padding: 0.32rem 0.7rem; font-size: 0.78rem; }

  /* TOOLBAR */
  .st-toolbar { display: flex; gap: 0.75rem; margin-bottom: 1.5rem; align-items: center; }
  .st-search-wrap { flex: 1; position: relative; }
  .st-search-wrap svg { position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%); color: var(--text3); width: 14px; height: 14px; }
  .st-search { width: 100%; background: var(--surface); border: 1px solid var(--border2); border-radius: 3px; padding: 0.6rem 1rem 0.6rem 2.4rem; color: var(--text); font-family: 'Barlow', sans-serif; font-size: 0.9rem; transition: border-color 0.2s; }
  .st-search:focus { outline: none; border-color: var(--accent); }
  .st-search::placeholder { color: var(--text3); }

  /* TABLE */
  .st-table-wrap { background: var(--surface); border: 1px solid var(--border); border-radius: 4px; overflow: hidden; }
  .st-table { width: 100%; border-collapse: collapse; }
  .st-table thead { background: var(--surface3); }
  .st-table th { padding: 0.75rem 1rem; text-align: left; font-family: 'IBM Plex Mono', monospace; font-size: 0.65rem; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text3); border-bottom: 1px solid var(--border2); white-space: nowrap; }
  .st-table td { padding: 0.8rem 1rem; font-size: 0.88rem; border-bottom: 1px solid var(--border); color: var(--text2); vertical-align: middle; }
  .st-table tr:last-child td { border-bottom: none; }
  .st-table tbody tr:hover td { background: var(--surface2); color: var(--text); }
  .td-primary { color: var(--text) !important; font-weight: 500; }
  .td-mono { font-family: 'IBM Plex Mono', monospace !important; font-size: 0.76rem !important; color: var(--text3) !important; }

  /* BADGE */
  .st-badge { display: inline-flex; align-items: center; padding: 0.18rem 0.55rem; border-radius: 2px; font-family: 'IBM Plex Mono', monospace; font-size: 0.65rem; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; }
  .badge-active  { background: rgba(76,175,120,.15); color: var(--success); border: 1px solid rgba(76,175,120,.3); }
  .badge-pending { background: rgba(232,160,32,.15); color: var(--accent);  border: 1px solid rgba(232,160,32,.3); }
  .badge-done    { background: rgba(76,175,120,.15); color: var(--success); border: 1px solid rgba(76,175,120,.3); }
  .badge-closed  { background: rgba(102,102,102,.15); color: var(--text3); border: 1px solid rgba(102,102,102,.3); }

  /* ROW ACTIONS */
  .st-actions { display: flex; gap: 0.4rem; }

  /* EMPTY */
  .st-empty { text-align: center; padding: 3rem; color: var(--text3); }
  .st-empty svg { width: 36px; height: 36px; margin: 0 auto 1rem; display: block; opacity: 0.3; }

  /* MODAL */
  .st-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,.75); z-index: 200; backdrop-filter: blur(2px); align-items: center; justify-content: center; }
  .st-overlay.open { display: flex; }
  .st-modal { background: var(--surface); border: 1px solid var(--border2); border-top: 3px solid var(--accent); border-radius: 4px; width: 540px; max-width: 95vw; max-height: 90vh; overflow-y: auto; animation: stSlide 0.2s ease; }
  @keyframes stSlide { from{transform:translateY(-10px);opacity:0} to{transform:none;opacity:1} }
  .st-modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1.2rem 1.5rem; border-bottom: 1px solid var(--border); }
  .st-modal-title { font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 1.15rem; text-transform: uppercase; letter-spacing: 0.05em; }
  .st-modal-close { background: none; border: none; color: var(--text3); cursor: pointer; font-size: 1.1rem; line-height: 1; padding: 0.2rem; }
  .st-modal-close:hover { color: var(--text); }
  .st-modal-body { padding: 1.5rem; }
  .st-modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; padding: 1rem 1.5rem; border-top: 1px solid var(--border); }

  /* FORM */
  .st-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .st-form-group { margin-bottom: 1rem; }
  .st-label { display: block; font-family: 'IBM Plex Mono', monospace; font-size: 0.65rem; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text3); margin-bottom: 0.4rem; }
  .st-input { width: 100%; background: var(--surface2); border: 1px solid var(--border2); border-radius: 3px; padding: 0.6rem 0.85rem; color: var(--text); font-family: 'Barlow', sans-serif; font-size: 0.9rem; transition: border-color 0.2s; }
  .st-input:focus { outline: none; border-color: var(--accent); }
  .st-input::placeholder { color: var(--text3); }
  select.st-input option { background: var(--surface2); }
  textarea.st-input { resize: vertical; }

  /* NOTIFICATION */
  .st-notif { position: fixed; top: 68px; right: 1.5rem; background: var(--surface2); border: 1px solid var(--border2); border-radius: 3px; padding: 0.75rem 1.2rem; font-size: 0.88rem; z-index: 999; display: flex; gap: 0.5rem; align-items: center; min-width: 240px; animation: stSlide 0.2s ease; }
  .st-notif.ok { border-left: 4px solid var(--success); }
  .st-notif.err { border-left: 4px solid var(--danger); }

  /* CONFIG */
  .st-config-box { background: var(--surface); border: 1px solid var(--border); border-left: 3px solid var(--accent); border-radius: 3px; padding: 1.25rem 1.5rem; margin-bottom: 1.5rem; }
  .st-code { font-family: 'IBM Plex Mono', monospace; color: var(--accent); font-size: 0.85rem; }
  .st-schema-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem; }
  .st-schema-box { background: var(--surface); border: 1px solid var(--border); padding: 1rem; border-radius: 3px; }
  .st-schema-title { font-family: 'IBM Plex Mono', monospace; font-size: 0.68rem; color: var(--accent); margin-bottom: 0.75rem; letter-spacing: 0.1em; }
  .st-schema-body { font-family: 'IBM Plex Mono', monospace; font-size: 0.76rem; color: var(--text2); line-height: 1.9; }

  /* SPINNER */
  .st-spin { animation: stSpin 0.8s linear infinite; display: inline-block; }
  @keyframes stSpin { to { transform: rotate(360deg); } }
`

// ── INJECT STYLES ONCE ────────────────────────────────────
let stylesInjected = false
function injectStyles() {
  if (stylesInjected) return
  const el = document.createElement('style')
  el.textContent = CSS
  document.head.appendChild(el)
  stylesInjected = true
}

// ── ICONS (inline SVG) ────────────────────────────────────
const Icon = {
  users:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  clip:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>,
  plug:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8H6a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2z"/></svg>,
  plus:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  refresh: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  search:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  edit:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  x:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  check:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  warn:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  spin:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="st-spin"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>,
}

// ── HELPERS ───────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}
const badgeClass = { Activo: 'badge-active', Pendiente: 'badge-pending', Finalizado: 'badge-done', Cerrado: 'badge-closed' }

// ── NOTIFICATION ──────────────────────────────────────────
function Notification({ notif }) {
  if (!notif) return null
  return (
    <div className={`st-notif ${notif.err ? 'err' : 'ok'}`}>
      {notif.err ? Icon.warn : Icon.check}
      <span>{notif.msg}</span>
    </div>
  )
}

// ── MODAL ─────────────────────────────────────────────────
function Modal({ open, title, onClose, footer, children }) {
  if (!open) return null
  return (
    <div className="st-overlay open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="st-modal">
        <div className="st-modal-header">
          <div className="st-modal-title">{title}</div>
          <button className="st-modal-close" onClick={onClose}>{Icon.x}</button>
        </div>
        <div className="st-modal-body">{children}</div>
        {footer && <div className="st-modal-footer">{footer}</div>}
      </div>
    </div>
  )
}

// ── CLIENTES PAGE ─────────────────────────────────────────
function ClientesPage({ notify }) {
  const [rows, setRows]       = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch]   = useState('')
  const [modal, setModal]     = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [form, setForm]       = useState({ id: '', nombre: '', telefono: '', correo: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await sbFetch('clientes?order=created_at.desc')
      setRows(data || [])
      setFiltered(data || [])
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

  function openNew() { setForm({ id: '', nombre: '', telefono: '', correo: '' }); setModal(true) }
  function openEdit(c) { setForm({ id: c.id, nombre: c.nombre || '', telefono: c.telefono || '', correo: c.correo || '' }); setModal(true) }

  async function save() {
    if (!form.nombre || !form.telefono || !form.correo) return notify('Completa todos los campos', true)
    const payload = { nombre: form.nombre, telefono: form.telefono, correo: form.correo }
    try {
      if (form.id) { await sbFetch(`clientes?id=eq.${form.id}`, 'PATCH', payload); notify('Cliente actualizado') }
      else         { await sbFetch('clientes', 'POST', payload); notify('Cliente registrado') }
      setModal(false); load()
    } catch (e) { notify(e.message, true) }
  }

  async function remove(id) {
    try { await sbFetch(`clientes?id=eq.${id}`, 'DELETE'); notify('Cliente eliminado'); setConfirm(null); load() }
    catch (e) { notify(e.message, true) }
  }

  const F = ({ label, id, ...props }) => (
    <div className="st-form-group">
      <label className="st-label" htmlFor={id}>{label}</label>
      <input id={id} className="st-input" value={form[id] || ''} onChange={e => setForm(p => ({ ...p, [id]: e.target.value }))} {...props} />
    </div>
  )

  return (
    <>
      <div className="st-page-header">
        <div className="st-page-title"><span>// RF-001 · RF-004</span>Gestión de Clientes</div>
        <button className="st-btn st-btn-primary" onClick={openNew}>{Icon.plus} Nuevo Cliente</button>
      </div>

      <div className="st-toolbar">
        <div className="st-search-wrap">{Icon.search}<input className="st-search" placeholder="Buscar por nombre, teléfono o correo…" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <button className="st-btn st-btn-secondary" onClick={load}>{loading ? Icon.spin : Icon.refresh} Recargar</button>
      </div>

      <div className="st-table-wrap">
        <table className="st-table">
          <thead><tr><th>#</th><th>Nombre</th><th>Teléfono</th><th>Correo</th><th>Registrado</th><th>Acciones</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}><div className="st-empty">{Icon.spin}<br />Cargando…</div></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6}><div className="st-empty">{Icon.users}<br />No hay clientes registrados</div></td></tr>
            ) : filtered.map((c, i) => (
              <tr key={c.id}>
                <td className="td-mono">{i + 1}</td>
                <td className="td-primary">{c.nombre}</td>
                <td>{c.telefono || '—'}</td>
                <td>{c.correo || '—'}</td>
                <td className="td-mono">{fmtDate(c.created_at)}</td>
                <td>
                  <div className="st-actions">
                    <button className="st-btn st-btn-secondary st-btn-sm" onClick={() => openEdit(c)}>{Icon.edit}</button>
                    <button className="st-btn st-btn-danger st-btn-sm" onClick={() => setConfirm({ id: c.id, label: c.nombre, fn: () => remove(c.id) })}>{Icon.trash}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FORM MODAL */}
      <Modal open={modal} title={form.id ? 'Editar Cliente' : 'Nuevo Cliente'} onClose={() => setModal(false)}
        footer={<><button className="st-btn st-btn-secondary" onClick={() => setModal(false)}>Cancelar</button><button className="st-btn st-btn-primary" onClick={save}>Guardar</button></>}>
        <F label="Nombre completo *" id="nombre" placeholder="Ej. Juan Pérez García" />
        <div className="st-form-row">
          <F label="Teléfono *" id="telefono" placeholder="Ej. 3111234567" />
          <F label="Correo electrónico *" id="correo" type="email" placeholder="correo@ejemplo.com" />
        </div>
      </Modal>

      {/* CONFIRM MODAL */}
      <Modal open={!!confirm} title="Confirmar eliminación" onClose={() => setConfirm(null)}
        footer={<><button className="st-btn st-btn-secondary" onClick={() => setConfirm(null)}>Cancelar</button><button className="st-btn st-btn-danger" onClick={confirm?.fn}>Eliminar</button></>}>
        <p style={{ color: 'var(--text2)', lineHeight: 1.6 }}>¿Eliminar a <strong style={{ color: 'var(--text)' }}>{confirm?.label}</strong>? Esta acción no se puede deshacer.</p>
      </Modal>
    </>
  )
}

// ── PROYECTOS PAGE ────────────────────────────────────────
function ProyectosPage({ notify }) {
  const [rows, setRows]         = useState([])
  const [clientes, setClientes] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading]   = useState(false)
  const [search, setSearch]     = useState('')
  const [estFilter, setEstFilter] = useState('')
  const [modal, setModal]       = useState(false)
  const [confirm, setConfirm]   = useState(null)
  const [form, setForm]         = useState({ id: '', titulo: '', cliente_id: '', mecanico: '', estado: 'Activo', descripcion: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [p, c] = await Promise.all([
        sbFetch('proyectos?order=created_at.desc'),
        sbFetch('clientes?select=id,nombre&order=nombre'),
      ])
      setRows(p || []); setClientes(c || [])
      setFiltered(p || [])
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

  function clienteNombre(id) { return clientes.find(c => String(c.id) === String(id))?.nombre || '—' }

  function openNew() { setForm({ id: '', titulo: '', cliente_id: '', mecanico: '', estado: 'Activo', descripcion: '' }); setModal(true) }
  function openEdit(p) { setForm({ id: p.id, titulo: p.titulo || '', cliente_id: p.cliente_id || '', mecanico: p.mecanico || '', estado: p.estado || 'Activo', descripcion: p.descripcion || '' }); setModal(true) }

  async function save() {
    if (!form.titulo || !form.cliente_id || !form.mecanico) return notify('Completa todos los campos obligatorios', true)
    const payload = { titulo: form.titulo, cliente_id: form.cliente_id, mecanico: form.mecanico, estado: form.estado, descripcion: form.descripcion }
    try {
      if (form.id) { await sbFetch(`proyectos?id=eq.${form.id}`, 'PATCH', payload); notify('Proyecto actualizado') }
      else         { await sbFetch('proyectos', 'POST', payload); notify('Proyecto registrado') }
      setModal(false); load()
    } catch (e) { notify(e.message, true) }
  }

  async function remove(id) {
    try { await sbFetch(`proyectos?id=eq.${id}`, 'DELETE'); notify('Proyecto eliminado'); setConfirm(null); load() }
    catch (e) { notify(e.message, true) }
  }

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <>
      <div className="st-page-header">
        <div className="st-page-title"><span>// RF-027 · RF-007</span>Gestión de Proyectos</div>
        <button className="st-btn st-btn-primary" onClick={openNew}>{Icon.plus} Nuevo Proyecto</button>
      </div>

      <div className="st-toolbar">
        <div className="st-search-wrap">{Icon.search}<input className="st-search" placeholder="Buscar por título, cliente o mecánico…" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <select className="st-input" style={{ width: 160 }} value={estFilter} onChange={e => setEstFilter(e.target.value)}>
          <option value="">Todos los estados</option>
          {['Activo', 'Pendiente', 'Finalizado', 'Cerrado'].map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <button className="st-btn st-btn-secondary" onClick={load}>{loading ? Icon.spin : Icon.refresh} Recargar</button>
      </div>

      <div className="st-table-wrap">
        <table className="st-table">
          <thead><tr><th>#</th><th>Título</th><th>Cliente</th><th>Mecánico</th><th>Estado</th><th>Fecha</th><th>Acciones</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7}><div className="st-empty">{Icon.spin}<br />Cargando…</div></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7}><div className="st-empty">{Icon.clip}<br />No hay proyectos registrados</div></td></tr>
            ) : filtered.map((p, i) => (
              <tr key={p.id}>
                <td className="td-mono">{i + 1}</td>
                <td className="td-primary">{p.titulo}</td>
                <td>{clienteNombre(p.cliente_id)}</td>
                <td>{p.mecanico || '—'}</td>
                <td><span className={`st-badge ${badgeClass[p.estado] || 'badge-closed'}`}>{p.estado || '—'}</span></td>
                <td className="td-mono">{fmtDate(p.created_at)}</td>
                <td>
                  <div className="st-actions">
                    <button className="st-btn st-btn-secondary st-btn-sm" onClick={() => openEdit(p)}>{Icon.edit}</button>
                    <button className="st-btn st-btn-danger st-btn-sm" onClick={() => setConfirm({ id: p.id, label: p.titulo, fn: () => remove(p.id) })}>{Icon.trash}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FORM MODAL */}
      <Modal open={modal} title={form.id ? 'Editar Proyecto' : 'Nuevo Proyecto'} onClose={() => setModal(false)}
        footer={<><button className="st-btn st-btn-secondary" onClick={() => setModal(false)}>Cancelar</button><button className="st-btn st-btn-primary" onClick={save}>Guardar</button></>}>
        <div className="st-form-group">
          <label className="st-label">Título del proyecto *</label>
          <input className="st-input" placeholder="Ej. Reparación motor Honda Civic 2020" value={form.titulo} onChange={e => setF('titulo', e.target.value)} />
        </div>
        <div className="st-form-row" style={{ marginBottom: '1rem' }}>
          <div className="st-form-group" style={{ marginBottom: 0 }}>
            <label className="st-label">Cliente *</label>
            <select className="st-input" value={form.cliente_id} onChange={e => setF('cliente_id', e.target.value)}>
              <option value="">— Seleccionar —</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div className="st-form-group" style={{ marginBottom: 0 }}>
            <label className="st-label">Mecánico asignado *</label>
            <input className="st-input" placeholder="Nombre del mecánico" value={form.mecanico} onChange={e => setF('mecanico', e.target.value)} />
          </div>
        </div>
        <div className="st-form-group">
          <label className="st-label">Estado</label>
          <select className="st-input" value={form.estado} onChange={e => setF('estado', e.target.value)}>
            {['Activo', 'Pendiente', 'Finalizado', 'Cerrado'].map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        <div className="st-form-group" style={{ marginBottom: 0 }}>
          <label className="st-label">Descripción / Diagnóstico</label>
          <textarea className="st-input" rows={3} placeholder="Descripción del servicio o diagnóstico inicial…" value={form.descripcion} onChange={e => setF('descripcion', e.target.value)} />
        </div>
      </Modal>

      {/* CONFIRM MODAL */}
      <Modal open={!!confirm} title="Confirmar eliminación" onClose={() => setConfirm(null)}
        footer={<><button className="st-btn st-btn-secondary" onClick={() => setConfirm(null)}>Cancelar</button><button className="st-btn st-btn-danger" onClick={confirm?.fn}>Eliminar</button></>}>
        <p style={{ color: 'var(--text2)', lineHeight: 1.6 }}>¿Eliminar <strong style={{ color: 'var(--text)' }}>{confirm?.label}</strong>? Esta acción no se puede deshacer.</p>
      </Modal>
    </>
  )
}

// ── CONFIG PAGE ───────────────────────────────────────────
function ConfigPage({ notify }) {
  return (
    <>
      <div className="st-page-header">
        <div className="st-page-title"><span>// sistema</span>Conexión Supabase</div>
      </div>
      <div className="st-config-box">
        <p style={{ color: 'var(--text2)', fontSize: '0.9rem', lineHeight: 1.7 }}>
          Configura las variables de entorno en tu archivo <span className="st-code">.env</span>:
        </p>
        <pre style={{ marginTop: '1rem', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 3, padding: '1rem', fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.82rem', color: 'var(--text2)', lineHeight: 1.8 }}>
{`VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiI...`}
        </pre>
      </div>
      <p style={{ color: 'var(--text3)', fontSize: '0.88rem', lineHeight: 1.7, marginBottom: '0.5rem' }}>
        <strong style={{ color: 'var(--text2)' }}>Estructura esperada en Supabase:</strong>
      </p>
      <div className="st-schema-grid">
        <div className="st-schema-box">
          <div className="st-schema-title">TABLE: clientes</div>
          <div className="st-schema-body">id (uuid / serial)<br />nombre (text)<br />telefono (text)<br />correo (text, unique)<br />created_at (timestamp)</div>
        </div>
        <div className="st-schema-box">
          <div className="st-schema-title">TABLE: proyectos</div>
          <div className="st-schema-body">id (uuid / serial)<br />titulo (text)<br />cliente_id (fk → clientes)<br />mecanico (text)<br />estado (text)<br />descripcion (text)<br />created_at (timestamp)</div>
        </div>
      </div>
    </>
  )
}

// ── APP ROOT ──────────────────────────────────────────────
export default function App() {
  injectStyles()
  const [page, setPage]   = useState('clientes')
  const [notif, setNotif] = useState(null)

  const notify = useCallback((msg, err = false) => {
    setNotif({ msg, err })
    setTimeout(() => setNotif(null), 3500)
  }, [])

  const connected = !!SUPABASE_URL && !!SUPABASE_KEY

  const navItems = [
    { id: 'clientes',  label: 'Clientes',    icon: Icon.users },
    { id: 'proyectos', label: 'Proyectos',   icon: Icon.clip  },
    { id: 'config',    label: 'Conexión BD', icon: Icon.plug  },
  ]

  return (
    <div className="st-app">
      <Notification notif={notif} />

      <header className="st-header">
        <div className="st-logo">Stathmos<span>// Gestión de Taller</span></div>
        <div className="st-status">
          <div className={`st-dot ${connected ? 'ok' : 'err'}`} />
          <span style={{ color: connected ? 'var(--success)' : 'var(--danger)' }}>
            {connected ? 'ENV CONFIGURADO' : 'SIN CONFIGURAR'}
          </span>
        </div>
      </header>

      <div className="st-body">
        <nav className="st-nav">
          <div className="st-nav-section">Módulos</div>
          {navItems.slice(0, 2).map(n => (
            <div key={n.id} className={`st-nav-item ${page === n.id ? 'active' : ''}`} onClick={() => setPage(n.id)}>
              <span style={{ width: 16, display: 'flex', alignItems: 'center' }}>{n.icon}</span> {n.label}
            </div>
          ))}
          <div className="st-divider" />
          <div className="st-nav-section">Config</div>
          <div className={`st-nav-item ${page === 'config' ? 'active' : ''}`} onClick={() => setPage('config')}>
            <span style={{ width: 16, display: 'flex', alignItems: 'center' }}>{Icon.plug}</span> Conexión BD
          </div>
        </nav>

        <main className="st-main">
          {page === 'clientes'  && <ClientesPage  notify={notify} />}
          {page === 'proyectos' && <ProyectosPage notify={notify} />}
          {page === 'config'    && <ConfigPage    notify={notify} />}
        </main>
      </div>
    </div>
  )
}