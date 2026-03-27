import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "./supabase";

// ─── Logo (reutilizado del Login) ─────────────────────────────────────────────
const Logo = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 6000 3375" xmlns="http://www.w3.org/2000/svg"
    style={{ fillRule:"evenodd", clipRule:"evenodd", strokeLinecap:"round", strokeLinejoin:"round", strokeMiterlimit:"22.926" }}
  >
    <path d="M1577.067,1787.012c-41.243,48.193 -29.069,158.236 92.22,221.712c121.305,63.46 351.725,80.355 582.682,73.161c230.957,-7.178 462.419,-38.444 626.383,-135.352c163.981,-96.891 260.465,-259.424 230.111,-306.413c-30.339,-46.973 -187.533,21.598 -425.472,61.865c-237.939,40.251 -556.657,52.181 -763.33,51.318c-206.689,-0.846 -301.351,-14.486 -342.594,33.708" style={{fill:"#db3c1c"}}/>
    <path d="M3876.888,1411.263c-87.044,-27.832 -283.398,-79.297 -556.299,-56.999c-272.917,22.298 -622.428,118.359 -967.546,176.042c-345.117,57.682 -685.856,77.002 -787.549,113.737c-101.709,36.719 35.645,90.853 242.139,122.054c206.494,31.201 482.145,39.469 786.768,-5.99c304.59,-45.459 638.151,-144.629 863.818,-205.697c225.684,-61.051 343.506,-84.001 413.509,-97.575c70.003,-13.558 92.22,-17.757 5.16,-45.573" style={{fill:"#60aebb"}}/>
  </svg>
);

// ─── Indicador de fuerza de contraseña ───────────────────────────────────────
const PasswordStrength = ({ password, darkMode }) => {
  const checks = [
    { label: "8+ caracteres",        ok: password.length >= 8 },
    { label: "Letra mayúscula",       ok: /[A-Z]/.test(password) },
    { label: "Letra minúscula",       ok: /[a-z]/.test(password) },
    { label: "Número o símbolo",      ok: /[\d\W]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const bars  = [
    "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-emerald-500"
  ];
  const label = ["Muy débil", "Débil", "Regular", "Fuerte"];

  if (!password) return null;

  return (
    <div className="flex flex-col gap-2 mt-1">
      {/* Barra de fuerza */}
      <div className="flex gap-1">
        {[0,1,2,3].map((i) => (
          <div
            key={i}
            className={`flex-1 h-1 rounded-full transition-all duration-300 ${i < score ? bars[score - 1] : darkMode ? "bg-zinc-700" : "bg-gray-200"}`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <p className={`text-[10px] ${darkMode ? "text-zinc-500" : "text-gray-400"}`}>
          {label[score - 1] || "Muy débil"}
        </p>
        <div className="flex gap-3">
          {checks.map((c, i) => (
            <span key={i} className={`text-[10px] transition-colors ${c.ok ? "text-emerald-500" : darkMode ? "text-zinc-600" : "text-gray-300"}`}>
              {c.ok ? "✓" : "○"} {c.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Pantalla de éxito ────────────────────────────────────────────────────────
const SuccessScreen = ({ darkMode, nombre }) => (
  <div className="flex flex-col items-center gap-4 py-4 text-center">
    <div
      className="w-16 h-16 rounded-full flex items-center justify-center"
      style={{ backgroundColor: "rgba(96,174,187,0.12)", border: "1.5px solid rgba(96,174,187,0.3)" }}
    >
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#60aebb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    </div>
    <div>
      <h2 className={`text-lg font-semibold mb-1 ${darkMode ? "text-zinc-100" : "text-gray-800"}`}>
        ¡Bienvenido{nombre ? `, ${nombre}` : ""}!
      </h2>
      <p className={`text-sm ${darkMode ? "text-zinc-400" : "text-gray-500"}`}>
        Tu cuenta está lista. Redirigiendo al inicio de sesión…
      </p>
    </div>
    <div className="w-5 h-5 rounded-full border-2 border-zinc-800 animate-spin" style={{ borderTopColor: "#60aebb" }} />
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CompletarRegistro() {
  const navigate = useNavigate();

  const [phase,        setPhase]        = useState("loading"); // loading | form | success | error
  const [password,     setPassword]     = useState("");
  const [confirm,      setConfirm]      = useState("");
  const [showPass,     setShowPass]     = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState("");
  const [clienteNombre, setClienteNombre] = useState("");
  const [sessionReady, setSessionReady] = useState(false);

  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true;
  const [darkMode]  = useState(prefersDark);

  // ── Verificar que existe sesión activa (del magic link) ───────────────────
  useEffect(() => {
    const init = async () => {
      // 1. Leer el token del hash de la URL antes de cualquier otra cosa
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.replace("#", ""));
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const type = params.get("type"); // "invite" o "recovery"

      if (accessToken && (type === "invite" || type === "signup")) {
        // 2. Cerrar sesión del admin sin tocar la URL
        await supabase.auth.signOut();

        // 3. Establecer la sesión del cliente con el token del link
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error || !data.session) {
          setPhase("error");
          return;
        }

        await loadClienteNombre(data.session);
        setSessionReady(true);
        setPhase("form");

        // 4. Limpiar el hash de la URL para que no se reutilice
        window.history.replaceState(null, "", window.location.pathname);
        return;
      }

      // Si no hay token en la URL, verificar si ya hay sesión activa
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadClienteNombre(session);
        setSessionReady(true);
        setPhase("form");
      } else {
        setPhase("error");
      }
    };

    init();
  }, []);

  const loadClienteNombre = async (session) => {
    // Buscar el nombre del cliente por correo
    const { data } = await supabase
      .from("clientes")
      .select("nombre")
      .eq("correo", session.user.email)
      .maybeSingle();
    if (data?.nombre) setClienteNombre(data.nombre.split(" ")[0]); // Solo primer nombre
  };

  // ── Guardar contraseña y completar registro ───────────────────────────────
  const handleSubmit = async () => {
    setError("");

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres."); return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden."); return;
    }

    setSaving(true);

    // 1. Actualizar contraseña en Supabase Auth
    const { error: passError } = await supabase.auth.updateUser({ password });
    if (passError) {
      setError("No se pudo actualizar la contraseña. Intenta de nuevo.");
      setSaving(false); return;
    }

    // 2. Vincular cliente con usuario via RPC
    const { error: rpcError } = await supabase.rpc("fn_completar_registro_cliente");
    if (rpcError) {
      // No bloquear si el RPC falla (puede que ya esté vinculado)
      console.warn("fn_completar_registro_cliente:", rpcError.message);
    }

    setPhase("success");
    setTimeout(() => navigate("/login", { replace: true }), 2200);
  };

  const handleKey = (e) => { if (e.key === "Enter") handleSubmit(); };

  // ── Estilos ───────────────────────────────────────────────────────────────
  const bg    = darkMode ? "bg-[#18181f]"                         : "bg-gray-100";
  const card  = darkMode ? "bg-[#1e1e27] border-zinc-800"         : "bg-white border-gray-200";
  const label = darkMode ? "text-zinc-500"                        : "text-gray-400";
  const inputBase = darkMode
    ? "border-zinc-700 text-zinc-200 placeholder-zinc-600 focus:border-[#60aebb]"
    : "border-gray-300 text-gray-800 placeholder-gray-400 focus:border-[#60aebb]";

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center ${bg} transition-colors duration-300`}>
      <style>{`
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .reg-card { animation: cardIn 0.45s cubic-bezier(0.22,1,0.36,1) both; }
        .reg-input {
          width: 100%;
          background: transparent;
          border-bottom-width: 1px;
          border-bottom-style: solid;
          padding: 8px 0;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.2s;
        }
      `}</style>

      <div
        className={`reg-card w-full max-w-sm mx-4 rounded-xl border ${card} p-8 flex flex-col items-center gap-6`}
        style={{ boxShadow: darkMode ? "0 8px 32px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.04) inset" : "0 4px 24px rgba(0,0,0,0.10)" }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-1">
          <Logo className="w-44 h-auto" />
          <p className={`text-[10px] tracking-[0.3em] uppercase font-medium mt-1 ${label}`}>
            Kentro Software
          </p>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: "#60aebb" }}>
            Stathmos
          </h1>
        </div>

        {/* ── Loading ── */}
        {phase === "loading" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-5 h-5 rounded-full border-2 border-zinc-800 animate-spin" style={{ borderTopColor: "#60aebb" }} />
            <p className={`text-sm ${label}`}>Verificando invitación…</p>
          </div>
        )}

        {/* ── Error de sesión ── */}
        {phase === "error" && (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "rgba(219,60,28,0.1)", border: "1.5px solid rgba(219,60,28,0.25)" }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#db3c1c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div>
              <h2 className={`text-base font-semibold mb-1 ${darkMode ? "text-zinc-100" : "text-gray-800"}`}>
                Enlace inválido o expirado
              </h2>
              <p className={`text-sm ${label}`}>
                Este enlace de invitación ya no es válido. Contacta al taller para solicitar uno nuevo.
              </p>
            </div>
            <button
              onClick={() => navigate("/login", { replace: true })}
              className={`text-xs underline ${label} hover:opacity-70 transition-opacity`}
            >
              Ir al inicio de sesión
            </button>
          </div>
        )}

        {/* ── Formulario ── */}
        {phase === "form" && (
          <div className="w-full flex flex-col gap-5">
            <div className="text-center">
              <p className={`text-sm font-medium ${darkMode ? "text-zinc-200" : "text-gray-700"}`}>
                {clienteNombre ? `Hola, ${clienteNombre}` : "Bienvenido"} 👋
              </p>
              <p className={`text-xs mt-1 ${label}`}>
                Elige una contraseña para acceder a tu portal
              </p>
            </div>

            {/* Contraseña */}
            <div className="flex flex-col gap-1.5">
              <label className={`text-[10px] font-semibold uppercase tracking-widest ${label}`}>
                Nueva contraseña
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="••••••••"
                  className={`reg-input pr-8 ${inputBase}`}
                  style={{ borderBottomColor: darkMode ? "#3f3f46" : "#d1d5db" }}
                  onFocus={(e) => (e.target.style.borderBottomColor = "#60aebb")}
                  onBlur={(e)  => (e.target.style.borderBottomColor = darkMode ? "#3f3f46" : "#d1d5db")}
                />
                <button
                  onClick={() => setShowPass(!showPass)}
                  className={`absolute right-0 bottom-2 text-xs ${label} hover:opacity-70`}
                  tabIndex={-1}
                >
                  {showPass ? "Ocultar" : "Ver"}
                </button>
              </div>
              <PasswordStrength password={password} darkMode={darkMode} />
            </div>

            {/* Confirmar */}
            <div className="flex flex-col gap-1.5">
              <label className={`text-[10px] font-semibold uppercase tracking-widest ${label}`}>
                Confirmar contraseña
              </label>
              <input
                type={showPass ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                onKeyDown={handleKey}
                placeholder="••••••••"
                className={`reg-input ${inputBase}`}
                style={{
                  borderBottomColor: confirm && password !== confirm
                    ? "#db3c1c"
                    : confirm && password === confirm
                    ? "#10b981"
                    : darkMode ? "#3f3f46" : "#d1d5db"
                }}
                onFocus={(e) => {
                  if (!confirm || password === confirm) e.target.style.borderBottomColor = "#60aebb";
                }}
                onBlur={(e) => {
                  e.target.style.borderBottomColor = confirm && password !== confirm
                    ? "#db3c1c" : confirm && password === confirm
                    ? "#10b981" : darkMode ? "#3f3f46" : "#d1d5db";
                }}
              />
              {confirm && password !== confirm && (
                <p className="text-[10px]" style={{ color: "#db3c1c" }}>Las contraseñas no coinciden</p>
              )}
              {confirm && password === confirm && password.length >= 8 && (
                <p className="text-[10px] text-emerald-500">✓ Las contraseñas coinciden</p>
              )}
            </div>

            {error && (
              <p className="text-xs text-center" style={{ color: "#db3c1c" }}>{error}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={saving || !password || !confirm}
              className="w-full mt-1 py-2.5 rounded-lg text-white font-semibold text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              style={{ backgroundColor: "#60aebb", boxShadow: "0 2px 10px rgba(96,174,187,0.25)" }}
              onMouseEnter={(e) => !saving && (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              {saving ? "Guardando…" : "Activar mi cuenta"}
            </button>
          </div>
        )}

        {/* ── Éxito ── */}
        {phase === "success" && (
          <SuccessScreen darkMode={darkMode} nombre={clienteNombre} />
        )}

        <p className={`text-xs -mt-1 ${label}`}>Taller Mecánico Don Elías © 2026</p>
      </div>
    </div>
  );
}