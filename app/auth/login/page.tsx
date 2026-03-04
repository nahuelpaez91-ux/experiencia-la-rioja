"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client-browser";

const COLORS = {
    green: "#4E6B3A",
    orange: "#D07A2D",
    bg: "#F3EEE6",
    border: "#e7e2da",
};

const DEPARTAMENTOS = [
    "Arauco", "Capital", "Castro Barros", "Chamical", "Chilecito",
    "Coronel Felipe Varela", "Famatina", "General Ángel Vicente Peñaloza",
    "General Belgrano", "General Juan Facundo Quiroga", "General Lamadrid",
    "General Ocampo", "General San Martín", "Independencia",
    "Rosario Vera Peñaloza", "San Blas de los Sauces", "Sanagasta", "Vinchina"
];

const inp: React.CSSProperties = {
    width: "100%", boxSizing: "border-box" as const,
    borderRadius: 12, border: `1px solid #e7e2da`,
    padding: "11px 14px", fontSize: 14,
    backgroundColor: "#fff", outline: "none", marginTop: 4,
};

const hint: React.CSSProperties = {
    fontSize: 11, color: "#aaa", marginTop: 4, display: "block",
};

export default function AuthPage() {
    const [mode, setMode] = useState<"login" | "register">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [departamento, setDepartamento] = useState("");
    const [localidad, setLocalidad] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const supabase = createClient();

    const handleEmailAuth = async () => {
        setLoading(true);
        setError(null);
        setSuccess(null);

        if (mode === "register") {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { full_name: fullName } },
            });
            if (error) {
                setError(error.message);
            } else if (data.user) {
                await supabase.from("profiles").update({
                    departamento,
                    localidad,
                }).eq("id", data.user.id);
                setSuccess("¡Cuenta creada! Revisá tu email para confirmar tu dirección.");
            }
        } else {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                setError("Email o contraseña incorrectos.");
            } else {
                window.location.href = "/";
            }
        }
        setLoading(false);
    };

    const handleGoogle = async () => {
        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: `${window.location.origin}/auth/callback` },
        });
    };

    return (
        <div style={{ minHeight: "100vh", backgroundColor: COLORS.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div style={{ width: "100%", maxWidth: 420, backgroundColor: "#FAF6F0", borderRadius: 24, padding: 36, border: `1px solid ${COLORS.border}`, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>

                <div style={{ textAlign: "center", marginBottom: 28 }}>
                    <a href="/" style={{ textDecoration: "none" }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.green }}>Experiencia</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.orange }}>LA RIOJA</div>
                    </a>
                </div>

                <div style={{ display: "flex", backgroundColor: "#fff", borderRadius: 14, padding: 4, border: `1px solid ${COLORS.border}`, marginBottom: 24 }}>
                    {(["login", "register"] as const).map((m) => (
                        <button key={m} onClick={() => { setMode(m); setError(null); setSuccess(null); }}
                            style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "none", backgroundColor: mode === m ? COLORS.green : "transparent", color: mode === m ? "#fff" : "#888", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                            {m === "login" ? "Iniciar sesión" : "Registrarse"}
                        </button>
                    ))}
                </div>

                <button onClick={handleGoogle} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: "11px 0", fontSize: 14, fontWeight: 600, color: "#333", cursor: "pointer", marginBottom: 16 }}>
                    <svg width="18" height="18" viewBox="0 0 48 48">
                        <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z" />
                        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4c-7.7 0-14.4 4.4-17.7 10.7z" />
                        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.6 26.8 36 24 36c-5.2 0-9.7-3-11.4-7.2l-6.5 5C9.5 39.5 16.3 44 24 44z" />
                        <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.4-4.6 5.8l6.2 5.2C40.8 35.4 44 30.1 44 24c0-1.3-.1-2.7-.4-4z" />
                    </svg>
                    Continuar con Google
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <div style={{ flex: 1, height: 1, backgroundColor: COLORS.border }} />
                    <span style={{ fontSize: 12, color: "#bbb" }}>o con email</span>
                    <div style={{ flex: 1, height: 1, backgroundColor: COLORS.border }} />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {mode === "register" && (
                        <>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: "#777", display: "block" }}>Nombre completo *</label>
                                <input style={inp} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ej: María García" />
                                <span style={hint}>⚠️ Asegurate de escribir tu nombre y apellido correctamente.</span>
                            </div>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: "#777", display: "block" }}>Departamento *</label>
                                <select style={inp} value={departamento} onChange={(e) => setDepartamento(e.target.value)}>
                                    <option value="">Seleccioná tu departamento</option>
                                    {DEPARTAMENTOS.map((d) => <option key={d} value={d}>{d}</option>)}
                                </select>
                                <span style={hint}>⚠️ Seleccioná el departamento donde vivís.</span>
                            </div>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: "#777", display: "block" }}>Localidad *</label>
                                <input style={inp} value={localidad} onChange={(e) => setLocalidad(e.target.value)} placeholder="Ej: Anillaco" />
                                <span style={hint}>⚠️ Escribí la localidad donde vivís correctamente.</span>
                            </div>
                        </>
                    )}
                    <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "#777", display: "block" }}>Email *</label>
                        <input style={inp} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" />
                        <span style={hint}>⚠️ Usá un email al que tengas acceso — te enviaremos confirmación.</span>
                    </div>
                    <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "#777", display: "block" }}>Contraseña *</label>
                        <input style={inp} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
                        <span style={hint}>⚠️ Usá una contraseña segura y recordala bien.</span>
                    </div>
                </div>

                {error && <div style={{ marginTop: 12, color: "#c0392b", fontSize: 13, backgroundColor: "#fdecea", borderRadius: 10, padding: "8px 14px" }}>{error}</div>}
                {success && <div style={{ marginTop: 12, color: "#27ae60", fontSize: 13, backgroundColor: "#eafaf1", borderRadius: 10, padding: "8px 14px" }}>{success}</div>}

                <button onClick={handleEmailAuth} disabled={loading}
                    style={{ marginTop: 18, width: "100%", backgroundColor: COLORS.green, color: "#fff", border: "none", borderRadius: 14, padding: "13px 0", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
                    {loading ? "..." : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
                </button>
            </div>
        </div>
    );
}