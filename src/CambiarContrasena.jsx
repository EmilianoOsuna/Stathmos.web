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
const SuccessScreen = ({ darkMode }) => (
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
        ¡Contraseña actualizada!
      </h2>
      <p className={`text-sm ${darkMode ? "text-zinc-400" : "text-gray-500"}`}>
        Tu contraseña ha sido cambiada. Redirigiendo al inicio de sesión...
      </p>
    </div>
    <div className="w-5 h-5 rounded-full border-2 border-zinc-800 animate-spin" style={{ borderTopColor: "#60aebb" }} />
  </div>
);

export default function CambiarContrasena() {
  const navigate = useNavigate();

  const [phase,        setPhase]        = useState("loading"); // loading | form | success | error
  const [password,     setPassword]     = useState("");
  const [confirm,      setConfirm]      = useState("");
  const [showPass,     setShowPass]     = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState("");
  const [sessionReady, setSessionReady] = useState(false);

  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true;
  const [darkMode]  = useState(prefersDark);

  // ── Verificar la recuperación en la URL o sesión ───────────────────────────
  useEffect(() => {
    const init = async () => {
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.replace("#", ""));
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const type = params.get("type"); // recovery

      if (accessToken && type === "recovery") {
        // Establecer la sesión para cambiar la contraseña
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error || !data.session) {
          setPhase("error");
          return;
        }

        setSessionReady(true);
        setPhase("form");

        // Limpiar el hash de la URL
        window.history.replaceState(null, "", window.location.pathname);
        return;
      }

      // Si no hay params checkear sesion
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setSessionReady(true);
        setPhase("form");
      } else {
        setPhase("error");
      }
    };

    init();
  }, []);

  const handleSubmit = async () => {
    setError("");

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres."); return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden."); return;
    }

    setSaving(true);

    const { error: passError } = await supabase.auth.updateUser({ password });
    if (passError) {
      setError("No se pudo actualizar la contraseña. Intenta de nuevo.");
      setSaving(false); return;
    }

    // Cerrar sesión después de cambiar la contraseña por seguridad
    await supabase.auth.signOut();

    setPhase("success");
    setTimeout(() => navigate("/login", { replace: true }), 2200);
  };

  const handleKey = (e) => { if (e.key === "Enter") handleSubmit(); };

  const bg    = darkMode ? "bg-[#18181f]"                         : "bg-gray-100";
  const card  = darkMode ? "bg-[#1e1e27] border-zinc-800"         : "bg-white border-gray-200";
  const label = darkMode ? "text-zinc-500"                        : "text-gray-400";
  const inputBase = darkMode
    ? "border-zinc-700 text-zinc-200 placeholder-zinc-600 focus:border-[#60aebb]"
    : "border-gray-300 text-gray-800 placeholder-gray-400 focus:border-[#60aebb]";

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center ${bg} transition-colors duration-300`}>
      <div
        className={`w-full max-w-sm mx-4 rounded-xl border ${card} p-8 flex flex-col`}
        style={{
          boxShadow: darkMode ? "0 8px 32px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.04) inset" : "0 4px 24px rgba(0,0,0,0.10)",
          minHeight: "420px"
        }}
      >
        <div className="flex flex-col items-center gap-1 mb-8">
          <Logo className="w-44 h-auto" />
        </div>

        <div className="flex-1 flex flex-col justify-center">
          {phase === "loading" && (
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-zinc-800 animate-spin" style={{ borderTopColor: "#60aebb" }} />
              <p className={`text-sm ${darkMode ? "text-zinc-400" : "text-gray-500"}`}>Validando enlace de recuperación...</p>
            </div>
          )}

          {phase === "error" && (
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(219,60,28,0.1)", border: "1px solid rgba(219,60,28,0.2)" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#db3c1c" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <div>
                <h3 className={`font-semibold ${darkMode ? "text-zinc-200" : "text-gray-800"}`}>Enlace inválido o expirado</h3>
                <p className={`text-xs mt-1 leading-relaxed ${darkMode ? "text-zinc-400" : "text-gray-500"}`}>
                  El enlace para recuperar contraseña ya no es válido. Haz clic en "¿Olvidaste tu contraseña?" nuevamente en la página de inicio.
                </p>
              </div>
              <button
                onClick={() => navigate("/login", { replace: true })}
                className="mt-2 text-sm font-medium hover:underline" style={{ color: "#60aebb" }}
              >
                Volver al inicio
              </button>
            </div>
          )}

          {phase === "success" && <SuccessScreen darkMode={darkMode} />}

          {phase === "form" && sessionReady && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div className="text-center">
                <h2 className={`text-lg font-semibold ${darkMode ? "text-zinc-100" : "text-gray-800"}`}>
                  Nueva contraseña
                </h2>
                <p className={`text-xs mt-1 ${darkMode ? "text-zinc-400" : "text-gray-500"}`}>
                  Crea una contraseña segura para tu cuenta.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5 relative">
                  <label className={`text-[10px] font-semibold uppercase tracking-widest ${label}`}>
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={handleKey}
                      placeholder="••••••••"
                      className={`w-full bg-transparent border-b pb-2 pt-1 text-sm outline-none transition-colors ${inputBase}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className={`absolute right-0 top-1.5 text-xs font-semibold ${darkMode ? "text-zinc-500 hover:text-zinc-300" : "text-gray-400 hover:text-gray-600"}`}
                    >
                      {showPass ? "OCULTAR" : "VER"}
                    </button>
                  </div>
                  {password && <PasswordStrength password={password} darkMode={darkMode} />}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className={`text-[10px] font-semibold uppercase tracking-widest ${label}`}>
                    Confirmar Contraseña
                  </label>
                  <input
                    type="password"
                    value={confirm} onChange={(e) => setConfirm(e.target.value)} onKeyDown={handleKey}
                    placeholder="••••••••"
                    className={`w-full bg-transparent border-b pb-2 pt-1 text-sm outline-none transition-colors ${inputBase}`}
                  />
                </div>
              </div>

              {error && <p className="text-xs text-center" style={{ color: "#db3c1c" }}>{error}</p>}

              <button
                onClick={handleSubmit} disabled={saving}
                className="w-full py-2.5 rounded-lg text-white font-semibold text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:opacity-90"
                style={{ backgroundColor: "#db3c1c", boxShadow: "0 2px 10px rgba(219,60,28,0.25)" }}
              >
                {saving ? "Guardando..." : "Actualizar Contraseña"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}