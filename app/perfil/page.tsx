"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client-browser";

const COLORS = { green: "#4E6B3A", orange: "#D07A2D", bg: "#F3EEE6", border: "#e7e2da" };

const ROLE_CONFIG = {
    admin: { label: "Administrador", bg: "#6B4FBB", icon: "⚙️" },
    provider: { label: "Proveedor", bg: "#D07A2D", icon: "🗺️" },
    user: { label: "Usuario", bg: "#4E6B3A", icon: "👤" },
};

const inp: React.CSSProperties = { width: "100%", boxSizing: "border-box", borderRadius: 12, border: `1px solid #e7e2da`, padding: "11px 14px", fontSize: 14, backgroundColor: "#fff", outline: "none", marginTop: 4 };
const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "#777", display: "block", marginTop: 14 };

export default function PerfilPage() {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [form, setForm] = useState({ full_name: "", phone: "" });
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const avatarRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    useEffect(() => { loadProfile(); }, []);

    async function loadProfile() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            window.location.href = "/auth/login";
            return;
        }
        setUser(user);
        const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        setProfile(data);
        setForm({ full_name: data?.full_name ?? "", phone: data?.phone ?? "" });
        setAvatarPreview(data?.avatar_url ?? null);
        setLoading(false);
    }

    async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file || !user) return;
        setUploadingAvatar(true);
        const path = `avatars/${user.id}/${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage.from("experiences").upload(path, file, { upsert: true });
        if (!error && data) {
            const url = supabase.storage.from("experiences").getPublicUrl(data.path).data.publicUrl;
            setAvatarPreview(url);
        }
        setUploadingAvatar(false);
    }

    async function handleSave() {
        if (!user) return;
        setSaving(true);
        await supabase.from("profiles").update({
            full_name: form.full_name,
            phone: form.phone,
            avatar_url: avatarPreview,
        }).eq("id", user.id);
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    }

    const role = (profile?.role ?? "user") as keyof typeof ROLE_CONFIG;
    const roleConf = ROLE_CONFIG[role] ?? ROLE_CONFIG.user;
    const initials = (form.full_name || user?.email || "U").slice(0, 2).toUpperCase();

    if (loading) return (
        <div style={{ minHeight: "100vh", backgroundColor: COLORS.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p style={{ color: "#aaa" }}>Cargando perfil...</p>
        </div>
    );

    return (
        <div style={{ backgroundColor: COLORS.bg, minHeight: "100vh", paddingBottom: 80 }}>
            <div style={{ maxWidth: 620, margin: "0 auto", padding: "40px 24px" }}>

                {/* Título */}
                <div style={{ marginBottom: 28 }}>
                    <h1 style={{ fontSize: 26, fontWeight: 900, margin: "0 0 4px" }}>👤 Mi perfil</h1>
                    <p style={{ color: "#aaa", fontSize: 14, margin: 0 }}>Editá tus datos personales.</p>
                </div>

                {/* Card principal */}
                <div style={{ backgroundColor: "#fff", borderRadius: 24, padding: 32, border: `1px solid ${COLORS.border}`, marginBottom: 16 }}>

                    {/* Avatar */}
                    <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28 }}>
                        <div style={{ position: "relative", flexShrink: 0 }}>
                            <div
                                onClick={() => avatarRef.current?.click()}
                                style={{ width: 80, height: 80, borderRadius: "50%", backgroundColor: roleConf.bg, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 800, overflow: "hidden", cursor: "pointer", border: "3px solid #fff", boxShadow: "0 2px 12px rgba(0,0,0,0.12)" }}
                            >
                                {avatarPreview
                                    ? <img src={avatarPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    : initials
                                }
                            </div>
                            <div
                                onClick={() => avatarRef.current?.click()}
                                style={{ position: "absolute", bottom: 0, right: 0, width: 26, height: 26, borderRadius: "50%", backgroundColor: COLORS.green, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, cursor: "pointer", border: "2px solid #fff" }}
                            >
                                {uploadingAvatar ? "..." : "📷"}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: "#222" }}>{form.full_name || user?.email?.split("@")[0]}</div>
                            <div style={{ fontSize: 13, color: "#aaa", marginTop: 2 }}>{user?.email}</div>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 8, backgroundColor: roleConf.bg, borderRadius: 999, padding: "3px 10px" }}>
                                <span style={{ fontSize: 11 }}>{roleConf.icon}</span>
                                <span style={{ fontSize: 11, fontWeight: 800, color: "#fff" }}>{roleConf.label}</span>
                            </div>
                        </div>
                    </div>
                    <input ref={avatarRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarUpload} />

                    {/* Formulario */}
                    <label style={lbl}>Nombre completo</label>
                    <input style={inp} value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="Tu nombre y apellido" />

                    <label style={lbl}>Teléfono / WhatsApp</label>
                    <input style={inp} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+54 9 380 000-0000" />

                    <label style={lbl}>Email</label>
                    <input style={{ ...inp, backgroundColor: "#f9f7f4", color: "#aaa" }} value={user?.email ?? ""} disabled />
                    <p style={{ fontSize: 11, color: "#bbb", margin: "4px 0 0" }}>El email no se puede cambiar desde aquí.</p>

                    <label style={lbl}>Rol en la plataforma</label>
                    <div style={{ marginTop: 4, padding: "10px 14px", borderRadius: 12, backgroundColor: "#f9f7f4", border: `1px solid ${COLORS.border}`, fontSize: 14, color: "#666", display: "flex", alignItems: "center", gap: 8 }}>
                        <span>{roleConf.icon}</span>
                        <span>{roleConf.label}</span>
                        {role === "user" && (
                            <a href="/convertirme-en-proveedor" style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: COLORS.orange, textDecoration: "none" }}>
                                Convertirme en proveedor →
                            </a>
                        )}
                    </div>

                    {/* Botón guardar */}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        style={{ marginTop: 24, width: "100%", backgroundColor: saved ? "#2e7d32" : COLORS.green, color: "#fff", border: "none", borderRadius: 14, padding: "13px 0", fontSize: 15, fontWeight: 700, cursor: "pointer", transition: "background 0.3s" }}
                    >
                        {saving ? "Guardando..." : saved ? "✓ Cambios guardados" : "Guardar cambios"}
                    </button>
                </div>

                {/* Card cambio de contraseña */}
                <div style={{ backgroundColor: "#fff", borderRadius: 24, padding: 24, border: `1px solid ${COLORS.border}` }}>
                    <h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 6px" }}>🔐 Contraseña</h3>
                    <p style={{ fontSize: 13, color: "#aaa", margin: "0 0 14px" }}>
                        Si querés cambiar tu contraseña, te enviamos un email con el link para hacerlo.
                    </p>
                    <ResetPasswordBtn email={user?.email} />
                </div>
            </div>
        </div>
    );
}

function ResetPasswordBtn({ email }: { email: string }) {
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    async function handleReset() {
        setLoading(true);
        await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/reset-password`,
        });
        setLoading(false);
        setSent(true);
    }

    return (
        <button
            onClick={handleReset}
            disabled={loading || sent}
            style={{ backgroundColor: sent ? "#f0f0f0" : "#f9f7f4", color: sent ? "#aaa" : "#555", border: `1px solid #e7e2da`, borderRadius: 12, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: sent ? "default" : "pointer" }}
        >
            {loading ? "Enviando..." : sent ? "✓ Email enviado, revisá tu bandeja" : "Enviar email para cambiar contraseña"}
        </button>
    );
}