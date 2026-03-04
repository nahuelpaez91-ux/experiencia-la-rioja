"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client-browser";

const COLORS = {
    green: "#4E6B3A",
    orange: "#D07A2D",
    bg: "#F3EEE6",
    border: "#e7e2da",
};

const inp: React.CSSProperties = {
    width: "100%", boxSizing: "border-box" as const,
    borderRadius: 12, border: `1px solid #e7e2da`,
    padding: "11px 14px", fontSize: 14,
    backgroundColor: "#fff", outline: "none", marginTop: 4,
};

const lbl: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: "#777", display: "block",
};

export default function RegistroProveedorPage() {
    const supabase = createClient();
    const [step, setStep] = useState<"auth" | "form" | "success">("auth");
    const [authMode, setAuthMode] = useState<"login" | "register">("register");
    const [user, setUser] = useState<any>(null);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);

    const [form, setForm] = useState({
        full_name: "",
        phone: "",
        location: "",
        address: "",
    });

    const [profileUrl, setProfileUrl] = useState<string | null>(null);
    const [dniUrl, setDniUrl] = useState<string | null>(null);
    const [habilitacionUrl, setHabilitacionUrl] = useState<string | null>(null);
    const [uploadingProfile, setUploadingProfile] = useState(false);
    const [uploadingDni, setUploadingDni] = useState(false);
    const [uploadingHab, setUploadingHab] = useState(false);
    const profileRef = useRef<HTMLInputElement>(null);
    const dniRef = useRef<HTMLInputElement>(null);
    const habRef = useRef<HTMLInputElement>(null);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    async function handleAuth() {
        setAuthLoading(true);
        setAuthError(null);
        if (authMode === "register") {
            const { data, error } = await supabase.auth.signUp({
                email, password,
                options: { data: { full_name: fullName } },
            });
            if (error) { setAuthError(error.message); setAuthLoading(false); return; }
            if (data.user) { setUser(data.user); setStep("form"); }
            else setAuthError("Revisá tu email para confirmar la cuenta y volvé acá.");
        } else {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) { setAuthError("Email o contraseña incorrectos."); setAuthLoading(false); return; }
            const { data: prof } = await supabase.from("profiles").select("role, provider_status, full_name").eq("id", data.user.id).single();
            if (prof?.role === "provider") { window.location.href = "/proveedor"; return; }
            if (prof?.provider_status === "pending") { setStep("success"); setAuthLoading(false); return; }
            // Pre-llenar nombre si ya lo tiene
            if (prof?.full_name) setForm(f => ({ ...f, full_name: prof.full_name }));
            setUser(data.user);
            setStep("form");
        }
        setAuthLoading(false);
    }

    async function handleGoogle() {
        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: `${window.location.origin}/auth/callback` },
        });
    }

    async function uploadFile(file: File, type: "profile" | "dni" | "habilitacion") {
        const { data: { user: u } } = await supabase.auth.getUser();
        if (!u) return;
        if (type === "profile") setUploadingProfile(true);
        else if (type === "dni") setUploadingDni(true);
        else setUploadingHab(true);

        const path = `docs/${u.id}/${type}-${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage.from("experiences").upload(path, file, { upsert: true });
        if (error) { alert("Error subiendo archivo: " + error.message); return; }
        const url = supabase.storage.from("experiences").getPublicUrl(data.path).data.publicUrl;

        if (type === "profile") { setProfileUrl(url); setUploadingProfile(false); }
        else if (type === "dni") { setDniUrl(url); setUploadingDni(false); }
        else { setHabilitacionUrl(url); setUploadingHab(false); }
    }

    async function handleSubmit() {
        if (!form.full_name || !form.phone) {
            setFormError("Completá los campos obligatorios: nombre completo y teléfono.");
            return;
        }
        if (!acceptedTerms) {
            setFormError("Debés aceptar los términos y condiciones para continuar.");
            return;
        }
        setFormLoading(true);
        setFormError(null);
        const { data: { user: u } } = await supabase.auth.getUser();
        const userId = u?.id || user?.id;
        if (!userId) { setFormError("Error de sesión."); setFormLoading(false); return; }

        const { error } = await supabase.from("profiles").update({
            full_name: form.full_name,
            phone: form.phone,
            whatsapp: form.phone,
            location: form.location,
            address: form.address,
            avatar_url: profileUrl,
            dni_url: dniUrl,
            habilitacion_url: habilitacionUrl,
            provider_status: "pending",
            role: "pending_provider",
            terms_accepted: true,
            terms_accepted_at: new Date().toISOString(),
        }).eq("id", userId);

        if (error) { setFormError("Error al guardar: " + error.message); setFormLoading(false); return; }
        setStep("success");
        setFormLoading(false);
    }

    // ── PANTALLA 1: AUTH ──
    if (step === "auth") return (
        <div style={{ minHeight: "100vh", backgroundColor: COLORS.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div style={{ width: "100%", maxWidth: 440, backgroundColor: "#FAF6F0", borderRadius: 24, padding: 36, border: `1px solid ${COLORS.border}`, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                    <a href="/" style={{ textDecoration: "none" }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.green }}>Experiencia</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.orange }}>LA RIOJA</div>
                    </a>
                    <div style={{ marginTop: 12, fontSize: 18, fontWeight: 800, color: "#222" }}>Registrate como proveedor</div>
                    <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>Ofrecé tus experiencias en La Rioja</div>
                </div>

                <div style={{ display: "flex", backgroundColor: "#fff", borderRadius: 14, padding: 4, border: `1px solid ${COLORS.border}`, marginBottom: 20 }}>
                    {(["register", "login"] as const).map((m) => (
                        <button key={m} onClick={() => { setAuthMode(m); setAuthError(null); }}
                            style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "none", backgroundColor: authMode === m ? COLORS.green : "transparent", color: authMode === m ? "#fff" : "#888", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                            {m === "register" ? "Crear cuenta" : "Ya tengo cuenta"}
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

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {authMode === "register" && (
                        <div><label style={lbl}>Nombre completo *</label><input style={inp} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ej: Juan Pérez" /></div>
                    )}
                    <div><label style={lbl}>Email *</label><input style={inp} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" /></div>
                    <div><label style={lbl}>Contraseña *</label><input style={inp} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" /></div>
                </div>

                {authError && <div style={{ marginTop: 12, color: "#c0392b", fontSize: 13, backgroundColor: "#fdecea", borderRadius: 10, padding: "8px 14px" }}>{authError}</div>}

                <button onClick={handleAuth} disabled={authLoading}
                    style={{ marginTop: 18, width: "100%", backgroundColor: COLORS.green, color: "#fff", border: "none", borderRadius: 14, padding: "13px 0", fontSize: 15, fontWeight: 700, cursor: "pointer", opacity: authLoading ? 0.7 : 1 }}>
                    {authLoading ? "..." : authMode === "register" ? "Crear cuenta y continuar →" : "Ingresar →"}
                </button>
                <p style={{ fontSize: 12, color: "#aaa", textAlign: "center", marginTop: 16 }}>
                    ¿Solo querés explorar? <a href="/auth/login" style={{ color: COLORS.green }}>Registrate como usuario</a>
                </p>
            </div>
        </div>
    );

    // ── PANTALLA 2: FORMULARIO ──
    if (step === "form") return (
        <div style={{ minHeight: "100vh", backgroundColor: COLORS.bg, padding: "32px 24px" }}>
            <div style={{ maxWidth: 640, margin: "0 auto" }}>
                <div style={{ textAlign: "center", marginBottom: 32 }}>
                    <a href="/" style={{ textDecoration: "none" }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.green }}>Experiencia</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.orange }}>LA RIOJA</div>
                    </a>
                    <div style={{ marginTop: 16, fontSize: 22, fontWeight: 800, color: "#222" }}>Completá tu perfil de proveedor</div>
                    <div style={{ fontSize: 13, color: "#888", marginTop: 6 }}>Tu solicitud será revisada en 24-48hs antes de activarse</div>
                </div>

                <div style={{ backgroundColor: "#fff", borderRadius: 24, padding: 32, border: `1px solid ${COLORS.border}` }}>

                    {/* Foto de perfil */}
                    <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 16px", color: "#222" }}>📸 Foto de perfil</h3>
                    <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28 }}>
                        <div onClick={() => profileRef.current?.click()} style={{ width: 90, height: 90, borderRadius: "50%", border: `2px dashed ${profileUrl ? COLORS.green : COLORS.border}`, backgroundColor: profileUrl ? "#f0f7eb" : "#f9f7f4", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", flexShrink: 0 }}>
                            {profileUrl
                                ? <img src={profileUrl} alt="perfil" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                : <span style={{ fontSize: 32 }}>{uploadingProfile ? "⏳" : "👤"}</span>
                            }
                        </div>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#555" }}>{profileUrl ? "✅ Foto cargada" : "Subí una foto de perfil"}</div>
                            <div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>JPG o PNG · Se mostrará en tu perfil público</div>
                            {profileUrl && <button onClick={() => setProfileUrl(null)} style={{ marginTop: 6, background: "none", border: "none", color: "#c0392b", fontSize: 12, cursor: "pointer" }}>× Quitar foto</button>}
                        </div>
                    </div>
                    <input ref={profileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f, "profile"); }} />

                    {/* Datos personales */}
                    <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 20px", color: "#222" }}>📋 Datos personales</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        <div style={{ gridColumn: "1 / -1" }}>
                            <label style={lbl}>Nombre completo *</label>
                            <input style={inp} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Ej: Juan Pérez" />
                        </div>
                        <div>
                            <label style={lbl}>Teléfono / WhatsApp *</label>
                            <input style={inp} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="3804001234" />
                        </div>
                        <div>
                            <label style={lbl}>Localidad</label>
                            <input style={inp} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Ej: Chilecito" />
                        </div>
                        <div style={{ gridColumn: "1 / -1" }}>
                            <label style={lbl}>Domicilio actual</label>
                            <input style={inp} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Ej: Av. San Martín 456, Chilecito" />
                        </div>
                    </div>

                    {/* Documentación */}
                    <h3 style={{ fontSize: 16, fontWeight: 800, margin: "28px 0 8px", color: "#222" }}>📄 Documentación</h3>
                    <p style={{ fontSize: 13, color: "#888", margin: "0 0 16px" }}>Podés enviar los documentos ahora o después.</p>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        <div onClick={() => dniRef.current?.click()} style={{ border: `2px dashed ${dniUrl ? COLORS.green : COLORS.border}`, borderRadius: 14, padding: 20, textAlign: "center", cursor: "pointer", backgroundColor: dniUrl ? "#f0f7eb" : "#f9f7f4" }}>
                            <div style={{ fontSize: 28, marginBottom: 8 }}>{uploadingDni ? "⏳" : dniUrl ? "✅" : "🪪"}</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: dniUrl ? COLORS.green : "#666" }}>{uploadingDni ? "Subiendo..." : dniUrl ? "DNI cargado" : "Subir DNI"}</div>
                            <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>JPG, PNG o PDF</div>
                        </div>
                        <input ref={dniRef} type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f, "dni"); }} />

                        <div onClick={() => habRef.current?.click()} style={{ border: `2px dashed ${habilitacionUrl ? COLORS.green : COLORS.border}`, borderRadius: 14, padding: 20, textAlign: "center", cursor: "pointer", backgroundColor: habilitacionUrl ? "#f0f7eb" : "#f9f7f4" }}>
                            <div style={{ fontSize: 28, marginBottom: 8 }}>{uploadingHab ? "⏳" : habilitacionUrl ? "✅" : "📋"}</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: habilitacionUrl ? COLORS.green : "#666" }}>{uploadingHab ? "Subiendo..." : habilitacionUrl ? "Habilitación cargada" : "Habilitación municipal"}</div>
                            <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>JPG, PNG o PDF</div>
                        </div>
                        <input ref={habRef} type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f, "habilitacion"); }} />
                    </div>

                    {/* Términos y condiciones */}
                    <div style={{ marginTop: 24, padding: 16, backgroundColor: COLORS.bg, borderRadius: 14, border: `1px solid ${COLORS.border}` }}>
                        <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}>
                            <input
                                type="checkbox"
                                checked={acceptedTerms}
                                onChange={(e) => setAcceptedTerms(e.target.checked)}
                                style={{ marginTop: 2, width: 16, height: 16, cursor: "pointer", accentColor: COLORS.green }}
                            />
                            <span style={{ fontSize: 13, color: "#555", lineHeight: 1.5 }}>
                                Leí y acepto los{" "}
                                <a href="/terminos-y-condiciones" target="_blank" style={{ color: COLORS.green, fontWeight: 700 }}>
                                    Términos y Condiciones
                                </a>
                                {" "}de Experiencia La Rioja para proveedores.
                            </span>
                        </label>
                    </div>

                    {formError && <div style={{ marginTop: 16, color: "#c0392b", fontSize: 13, backgroundColor: "#fdecea", borderRadius: 10, padding: "10px 14px" }}>{formError}</div>}

                    <button onClick={handleSubmit} disabled={formLoading}
                        style={{ marginTop: 20, width: "100%", backgroundColor: acceptedTerms ? COLORS.green : "#ccc", color: "#fff", border: "none", borderRadius: 14, padding: "14px 0", fontSize: 15, fontWeight: 700, cursor: acceptedTerms ? "pointer" : "not-allowed", transition: "background 0.2s" }}>
                        {formLoading ? "Enviando solicitud..." : "Enviar solicitud →"}
                    </button>
                    <p style={{ fontSize: 11, color: "#aaa", textAlign: "center", marginTop: 10 }}>Tu solicitud será revisada en 24-48hs. Te avisamos por email cuando esté aprobada.</p>
                </div>
            </div>
        </div>
    );

    // ── PANTALLA 3: ÉXITO ──
    return (
        <div style={{ minHeight: "100vh", backgroundColor: COLORS.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div style={{ maxWidth: 480, width: "100%", backgroundColor: "#fff", borderRadius: 28, padding: 48, textAlign: "center", border: `1px solid ${COLORS.border}` }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
                <h1 style={{ fontSize: 24, fontWeight: 900, margin: "0 0 12px" }}>¡Solicitud enviada!</h1>
                <p style={{ color: "#777", fontSize: 15, margin: "0 0 24px" }}>
                    Revisaremos tu solicitud en las próximas <strong>24-48 horas</strong> y te notificaremos por email.
                </p>
                <div style={{ backgroundColor: COLORS.bg, borderRadius: 16, padding: 20, marginBottom: 24, border: `1px solid ${COLORS.border}` }}>
                    <div style={{ fontSize: 13, color: "#555", lineHeight: 2 }}>
                        ✅ Datos recibidos<br />
                        ⏳ En revisión por el equipo<br />
                        📧 Te avisamos cuando esté aprobado
                    </div>
                </div>
                <a href="/" style={{ display: "inline-block", backgroundColor: COLORS.green, color: "#fff", textDecoration: "none", borderRadius: 12, padding: "12px 28px", fontSize: 14, fontWeight: 700 }}>
                    Volver al inicio
                </a>
            </div>
        </div>
    );
}