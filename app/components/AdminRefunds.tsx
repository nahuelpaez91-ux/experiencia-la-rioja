"use client";

// app/components/AdminRefunds.tsx
// Sección del panel admin para gestionar solicitudes de reembolso

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client-browser";

const COLORS = { green: "#4E6B3A", orange: "#D07A2D", bg: "#F3EEE6", border: "#e7e2da" };

const formatARS = (n: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

type RefundRequest = {
    id: string;
    reason: string;
    status: string;
    created_at: string;
    evidence_url: string | null;
    booking: {
        id: string;
        user_name: string;
        user_email: string;
        total_price: number;
        experience: { title: string } | null;
    } | null;
};

export default function AdminRefunds() {
    const [requests, setRequests] = useState<RefundRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [notes, setNotes] = useState<Record<string, string>>({});
    const [pcts, setPcts] = useState<Record<string, number>>({});
    const supabase = createClient();

    useEffect(() => { loadRequests(); }, []);

    async function loadRequests() {
        setLoading(true);
        const { data } = await supabase
            .from("refund_requests")
            .select(`
        id, reason, status, created_at, evidence_url,
        booking:booking_id (
          id, user_name, user_email, total_price,
          experience:experience_id (title)
        )
      `)
            .order("created_at", { ascending: false });
        setRequests((data as any) ?? []);
        setLoading(false);
    }

    async function handleResolve(id: string, action: "approve" | "reject") {
        setProcessingId(id);
        const res = await fetch("/api/admin/refund-resolve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                refund_request_id: id,
                action,
                admin_note: notes[id] ?? "",
                refund_pct: pcts[id] ?? 100,
            }),
        });
        const data = await res.json();
        if (data.ok) {
            await loadRequests();
        } else {
            alert("Error: " + data.error);
        }
        setProcessingId(null);
    }

    const pending = requests.filter((r) => r.status === "pending");
    const resolved = requests.filter((r) => r.status !== "pending");

    if (loading) return <p style={{ color: "#aaa", fontSize: 14 }}>Cargando solicitudes...</p>;

    return (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 20px" }}>💸 Solicitudes de reembolso</h2>

            {pending.length === 0 && (
                <div style={{ backgroundColor: "#fff", borderRadius: 16, padding: 36, textAlign: "center", border: `1px solid ${COLORS.border}`, marginBottom: 24 }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
                    <p style={{ color: "#bbb", fontSize: 14, margin: 0 }}>No hay solicitudes pendientes</p>
                </div>
            )}

            {pending.length > 0 && (
                <div style={{ marginBottom: 32 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e65100", margin: "0 0 12px" }}>
                        ⏳ Pendientes ({pending.length})
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {pending.map((req) => {
                            const booking = req.booking;
                            const isProcessing = processingId === req.id;
                            const refundPct = pcts[req.id] ?? 100;
                            const refundAmount = booking ? Math.round((booking.total_price * refundPct) / 100) : 0;

                            return (
                                <div key={req.id} style={{ backgroundColor: "#fff", borderRadius: 18, padding: 22, border: `2px solid #f0d8a0` }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                                        <div>
                                            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 2 }}>
                                                {booking?.experience?.title ?? "Experiencia desconocida"}
                                            </div>
                                            <div style={{ fontSize: 13, color: "#666" }}>
                                                👤 {booking?.user_name} · ✉️ {booking?.user_email}
                                            </div>
                                            <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>
                                                Reserva {booking?.id?.slice(0, 8).toUpperCase()} · Total pagado: {booking ? formatARS(booking.total_price) : "—"}
                                            </div>
                                        </div>
                                        <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 999, backgroundColor: "#fff3e0", color: "#e65100" }}>
                                            Pendiente
                                        </span>
                                    </div>

                                    <div style={{ backgroundColor: "#fffbf2", borderRadius: 12, padding: "12px 14px", marginBottom: 14, fontSize: 13, color: "#555" }}>
                                        <strong>Motivo:</strong> {req.reason}
                                        {req.evidence_url && (
                                            <a href={req.evidence_url} target="_blank" rel="noopener noreferrer"
                                                style={{ display: "block", marginTop: 6, color: COLORS.green, fontSize: 12 }}>
                                                📎 Ver evidencia adjunta
                                            </a>
                                        )}
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                                        <div>
                                            <label style={{ fontSize: 12, fontWeight: 600, color: "#777", display: "block", marginBottom: 4 }}>% a reembolsar</label>
                                            <select
                                                value={refundPct}
                                                onChange={(e) => setPcts({ ...pcts, [req.id]: Number(e.target.value) })}
                                                style={{ width: "100%", borderRadius: 10, border: `1px solid ${COLORS.border}`, padding: "8px 12px", fontSize: 14, backgroundColor: "#fff" }}
                                            >
                                                <option value={100}>100% — {booking ? formatARS(booking.total_price) : "—"}</option>
                                                <option value={50}>50% — {booking ? formatARS(Math.round(booking.total_price * 0.5)) : "—"}</option>
                                                <option value={0}>0% — Sin reembolso</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: 12, fontWeight: 600, color: "#777", display: "block", marginBottom: 4 }}>Nota interna (opcional)</label>
                                            <input
                                                value={notes[req.id] ?? ""}
                                                onChange={(e) => setNotes({ ...notes, [req.id]: e.target.value })}
                                                placeholder="Motivo de la decisión..."
                                                style={{ width: "100%", boxSizing: "border-box" as const, borderRadius: 10, border: `1px solid ${COLORS.border}`, padding: "8px 12px", fontSize: 14, backgroundColor: "#fff", outline: "none" }}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", gap: 10 }}>
                                        <button
                                            onClick={() => handleResolve(req.id, "approve")}
                                            disabled={isProcessing}
                                            style={{ flex: 1, backgroundColor: COLORS.green, color: "#fff", border: "none", borderRadius: 12, padding: "11px 0", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
                                        >
                                            {isProcessing ? "Procesando..." : `✓ Aprobar reembolso ${refundPct}%`}
                                        </button>
                                        <button
                                            onClick={() => handleResolve(req.id, "reject")}
                                            disabled={isProcessing}
                                            style={{ backgroundColor: "#fdecea", color: "#c0392b", border: "none", borderRadius: 12, padding: "11px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
                                        >
                                            Rechazar
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Historial */}
            {resolved.length > 0 && (
                <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#888", margin: "0 0 12px" }}>Historial</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {resolved.map((req) => (
                            <div key={req.id} style={{ backgroundColor: "#fff", borderRadius: 14, padding: 16, border: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", opacity: 0.8 }}>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 14 }}>{req.booking?.experience?.title ?? "—"}</div>
                                    <div style={{ fontSize: 12, color: "#aaa" }}>{req.booking?.user_name} · {new Date(req.created_at).toLocaleDateString("es-AR")}</div>
                                </div>
                                <span style={{
                                    fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 999,
                                    backgroundColor: req.status === "approved" ? "#e8f5e9" : "#fdecea",
                                    color: req.status === "approved" ? "#2e7d32" : "#c0392b",
                                }}>
                                    {req.status === "approved" ? "✓ Aprobado" : "✗ Rechazado"}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}