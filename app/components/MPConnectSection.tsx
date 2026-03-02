"use client";

// app/components/MPConnectSection.tsx
// El proveedor pega su Access Token de MP — sin OAuth, simple y directo

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client-browser";

const COLORS = { green: "#4E6B3A", orange: "#D07A2D", bg: "#F3EEE6", border: "#e7e2da" };

export default function MPConnectSection() {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const supabase = createClient();

    useEffect(() => { loadProfile(); }, []);

    async function loadProfile() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
            .from("profiles")
            .select("id, mp_access_token, mp_user_id, mp_connected_at")
            .eq("id", user.id)
            .single();
        setProfile(data);
        setLoading(false);
    }

    async function handleSaveToken() {
        if (!token.trim() || !profile?.id) return;
        setSaving(true);
        setError(null);
        try {
            const res = await fetch("/api/mp/save-token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: profile.id, access_token: token.trim() }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error);
            } else {
                setToken("");
                setShowForm(false);
                await loadProfile();
            }
        } catch {
            setError("Error de conexión. Intentá de nuevo.");
        }
        setSaving(false);
    }

    if (loading) return null;

    const isConnected = !!profile?.mp_access_token;
    const connectedDate = profile?.mp_connected_at
        ? new Date(profile.mp_connected_at).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })
        : null;

    return (
        <div style={{
            backgroundColor: isConnected ? "#f0f7eb" : "#fffbf2",
            borderRadius: 20, padding: 24,
            border: `2px solid ${isConnected ? "#c8ddb8" : "#f0d8a0"}`,
            marginBottom: 24,
        }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <div style={{ backgroundColor: "#009ee3", borderRadius: 8, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <span style={{ color: "#fff", fontWeight: 900, fontSize: 14 }}>MP</span>
                        </div>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: 15 }}>Mercado Pago</div>
                            <div style={{ fontSize: 12, color: isConnected ? "#5a8a3a" : "#b87d2a" }}>
                                {isConnected ? `✓ Conectado el ${connectedDate}` : "⚠️ No conectado — necesario para recibir pagos"}
                            </div>
                        </div>
                    </div>
                    <p style={{ fontSize: 13, color: "#777", margin: 0 }}>
                        {isConnected
                            ? "Los pagos llegan directo a tu cuenta de Mercado Pago. La plataforma retiene el 15%."
                            : "Pegá tu Access Token de MP para habilitar los pagos en tus experiencias."}
                    </p>
                </div>

                <div style={{ flexShrink: 0 }}>
                    {isConnected ? (
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <span style={{ backgroundColor: "#e8f5e9", color: "#2e7d32", borderRadius: 999, padding: "6px 14px", fontSize: 12, fontWeight: 700 }}>✓ Activo</span>
                            <button onClick={() => setShowForm(!showForm)}
                                style={{ backgroundColor: "#fff", color: "#666", borderRadius: 10, padding: "6px 14px", fontSize: 12, fontWeight: 600, border: `1px solid ${COLORS.border}`, cursor: "pointer" }}>
                                Actualizar
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => setShowForm(!showForm)}
                            style={{ backgroundColor: "#009ee3", color: "#fff", borderRadius: 12, padding: "10px 20px", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer" }}>
                            {showForm ? "Cancelar" : "Conectar →"}
                        </button>
                    )}
                </div>
            </div>

            {/* Formulario para pegar el token */}
            {showForm && (
                <div style={{ marginTop: 18, backgroundColor: "#fff", borderRadius: 14, padding: 18, border: `1px solid ${COLORS.border}` }}>
                    <p style={{ fontSize: 13, color: "#555", margin: "0 0 12px" }}>
                        <strong>¿Dónde encontrar tu Access Token?</strong><br />
                        Entrá a <a href="https://www.mercadopago.com.ar/developers/panel" target="_blank" rel="noopener noreferrer" style={{ color: "#009ee3" }}>mercadopago.com.ar/developers</a> → tu app → Credenciales de prueba → <strong>Access Token</strong>
                    </p>

                    <label style={{ fontSize: 12, fontWeight: 600, color: "#777", display: "block", marginBottom: 4 }}>
                        Access Token de Mercado Pago
                    </label>
                    <input
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="APP_USR-... o TEST-..."
                        style={{
                            width: "100%", boxSizing: "border-box" as const,
                            borderRadius: 10, border: `1px solid ${COLORS.border}`,
                            padding: "10px 14px", fontSize: 13,
                            backgroundColor: "#f9f7f4", outline: "none", marginBottom: 10,
                            fontFamily: "monospace",
                        }}
                    />

                    {error && (
                        <div style={{ backgroundColor: "#fdecea", color: "#c0392b", borderRadius: 10, padding: "8px 12px", fontSize: 13, marginBottom: 10 }}>
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleSaveToken}
                        disabled={saving || !token.trim()}
                        style={{
                            backgroundColor: !token.trim() ? "#ccc" : COLORS.green,
                            color: "#fff", border: "none", borderRadius: 10,
                            padding: "10px 24px", fontSize: 14, fontWeight: 700,
                            cursor: !token.trim() ? "not-allowed" : "pointer",
                        }}
                    >
                        {saving ? "Verificando..." : "Guardar y conectar"}
                    </button>

                    <p style={{ fontSize: 11, color: "#aaa", marginTop: 8, margin: "8px 0 0" }}>
                        🔒 Tu token se guarda de forma segura y nunca se muestra completo.
                    </p>
                </div>
            )}

            {/* Stats si está conectado */}
            {isConnected && !showForm && (
                <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    {[
                        { label: "Comisión plataforma", value: "15%", icon: "🏦" },
                        { label: "Tu ganancia", value: "85%", icon: "💰" },
                        { label: "Pago", value: "Automático", icon: "⚡" },
                    ].map((item) => (
                        <div key={item.label} style={{ backgroundColor: "#fff", borderRadius: 12, padding: "10px 14px", border: `1px solid ${COLORS.border}`, textAlign: "center" }}>
                            <div style={{ fontSize: 20, marginBottom: 4 }}>{item.icon}</div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.green }}>{item.value}</div>
                            <div style={{ fontSize: 11, color: "#aaa" }}>{item.label}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}