"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client-browser";

const COLORS = {
    green: "#4E6B3A",
    orange: "#D07A2D",
    bg: "#F3EEE6",
    border: "#e7e2da",
};

export default function MPConnectSection() {
    const [userId, setUserId] = useState<string | null>(null);
    const [connected, setConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        load();
        // Detectar retorno del OAuth
        const params = new URLSearchParams(window.location.search);
        if (params.get("mp_success") === "1") {
            setSuccess(true);
            window.history.replaceState({}, "", "/proveedor");
        }
        if (params.get("mp_error")) {
            setError("Hubo un error al conectar con MercadoPago. Intentá de nuevo.");
            window.history.replaceState({}, "", "/proveedor");
        }
    }, []);

    async function load() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUserId(user.id);
        const { data } = await supabase
            .from("profiles")
            .select("mp_connected")
            .eq("id", user.id)
            .single();
        setConnected(data?.mp_connected === true);
        setLoading(false);
    }

    function handleConnect() {
        if (!userId) return;
        window.location.href = `/api/mp/connect?state=${userId}`;
    }

    async function handleDisconnect() {
        if (!userId) return;
        await supabase.from("profiles").update({
            mp_access_token: null,
            mp_user_id: null,
            mp_connected: false,
        }).eq("id", userId);
        setConnected(false);
    }

    if (loading) return null;

    return (
        <div style={{
            backgroundColor: connected ? "#f0f7eb" : "#fffbf0",
            border: `1px solid ${connected ? COLORS.green : "#FCD34D"}`,
            borderRadius: 16,
            padding: "20px 24px",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    backgroundColor: "#009EE3",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 900, color: "#fff", fontSize: 14, flexShrink: 0,
                }}>MP</div>
                <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#222" }}>Mercado Pago</div>
                    {connected
                        ? <div style={{ fontSize: 13, color: COLORS.green, marginTop: 2 }}>✅ Cuenta conectada — listo para recibir pagos</div>
                        : <div style={{ fontSize: 13, color: "#D07A2D", marginTop: 2 }}>⚠️ No conectado — necesario para recibir pagos</div>
                    }
                    {success && <div style={{ fontSize: 12, color: COLORS.green, marginTop: 4 }}>🎉 ¡Conectado exitosamente!</div>}
                    {error && <div style={{ fontSize: 12, color: "#c0392b", marginTop: 4 }}>{error}</div>}
                </div>
            </div>

            {connected ? (
                <button onClick={handleDisconnect} style={{
                    backgroundColor: "#FEE2E2", color: "#DC2626",
                    border: "none", borderRadius: 10,
                    padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer",
                }}>
                    Desconectar
                </button>
            ) : (
                <button onClick={handleConnect} style={{
                    backgroundColor: "#009EE3", color: "#fff",
                    border: "none", borderRadius: 10,
                    padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 8,
                }}>
                    Conectar con MercadoPago →
                </button>
            )}
        </div>
    );
}