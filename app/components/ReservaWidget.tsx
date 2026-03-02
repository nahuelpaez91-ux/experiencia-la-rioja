"use client";

import { useState } from "react";

const COLORS = {
    orange: "#D07A2D",
    green: "#4E6B3A",
    bg: "#FAF6F0",
    border: "#e7e2da",
};

type Slot = {
    id: string;
    date: string;
    time: string;
    capacity: number;
    booked_count: number;
};

type Props = {
    experienceId: string;
    pricePerPerson: number;
    slots: Slot[];
    providerHasMP: boolean;
};

const formatARS = (n: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

const formatDate = (d: string) =>
    new Date(d + "T12:00:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });

const formatTime = (t: string) => {
    const [h, m] = t.split(":");
    return `${parseInt(h)}:${m}hs`;
};

export default function ReservaWidget({ experienceId, pricePerPerson, slots, providerHasMP }: Props) {
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
    const [people, setPeople] = useState(1);
    const [step, setStep] = useState<"slots" | "form">("slots");
    const [userName, setUserName] = useState("");
    const [userEmail, setUserEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const today = new Date().toISOString().split("T")[0];
    const slotsByDate: Record<string, Slot[]> = {};
    for (const slot of slots) {
        if (slot.date < today) continue;
        if (!slotsByDate[slot.date]) slotsByDate[slot.date] = [];
        slotsByDate[slot.date].push(slot);
    }
    const dates = Object.keys(slotsByDate).sort();
    const slotsForDate = selectedDate ? slotsByDate[selectedDate] ?? [] : [];
    const maxPeople = selectedSlot ? selectedSlot.capacity - selectedSlot.booked_count : 1;
    const total = pricePerPerson * people;

    const inp: React.CSSProperties = {
        width: "100%", boxSizing: "border-box" as const,
        borderRadius: 12, border: `1px solid ${COLORS.border}`,
        padding: "10px 14px", fontSize: 14, backgroundColor: "#fff", outline: "none",
    };

    const handlePagar = async () => {
        if (!selectedSlot || !userName || !userEmail) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/payment/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    experience_id: experienceId,
                    slot_id: selectedSlot.id,
                    people,
                    user_name: userName,
                    user_email: userEmail,
                }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error ?? "Error al iniciar el pago."); setLoading(false); return; }
            // En testing usar sandbox_init_point, en producción init_point
            const url = data.sandbox_init_point ?? data.init_point;
            window.location.href = url;
        } catch {
            setError("Error de conexión. Intentá de nuevo.");
            setLoading(false);
        }
    };

    // Proveedor sin MP conectado
    if (!providerHasMP) {
        return (
            <div style={{ backgroundColor: COLORS.bg, borderRadius: 20, padding: 28, border: `1px solid ${COLORS.border}`, textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>⚙️</div>
                <p style={{ fontSize: 14, color: "#888", margin: 0 }}>Esta experiencia aún no tiene pagos online.<br />Contactá al proveedor directamente.</p>
            </div>
        );
    }

    // Paso 2: datos del usuario
    if (step === "form") {
        return (
            <div style={{ backgroundColor: COLORS.bg, borderRadius: 20, padding: 24, border: `1px solid ${COLORS.border}` }}>
                <button onClick={() => setStep("slots")} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.green, fontWeight: 600, fontSize: 13, padding: 0, marginBottom: 16 }}>
                    ← Cambiar turno
                </button>
                <h3 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 4px" }}>Tus datos</h3>
                <p style={{ fontSize: 13, color: "#999", margin: "0 0 16px" }}>
                    {selectedDate ? formatDate(selectedDate) : ""} · {selectedSlot ? formatTime(selectedSlot.time) : ""} · {people} {people === 1 ? "persona" : "personas"}
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "#777", display: "block", marginBottom: 4 }}>Nombre completo</label>
                        <input style={inp} value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Ej: Juan García" />
                    </div>
                    <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "#777", display: "block", marginBottom: 4 }}>Email</label>
                        <input style={inp} type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="Ej: juan@email.com" />
                    </div>
                </div>

                {error && <div style={{ marginTop: 12, color: "#c0392b", fontSize: 13, backgroundColor: "#fdecea", borderRadius: 10, padding: "8px 14px" }}>{error}</div>}

                {/* Resumen */}
                <div style={{ marginTop: 16, backgroundColor: "#fff", borderRadius: 14, padding: "14px 18px", border: `1px solid ${COLORS.border}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 4 }}>
                        <span style={{ color: "#888" }}>{formatARS(pricePerPerson)} × {people} {people === 1 ? "persona" : "personas"}</span>
                        <span style={{ fontWeight: 600 }}>{formatARS(total)}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#bbb", marginBottom: 10 }}>Pago seguro · Factura incluida</div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 16, borderTop: `1px solid ${COLORS.border}`, paddingTop: 10 }}>
                        <span>Total</span>
                        <span style={{ color: COLORS.green }}>{formatARS(total)}</span>
                    </div>
                </div>

                {/* Política de cancelación */}
                <div style={{ marginTop: 12, backgroundColor: "#fffbf5", borderRadius: 12, padding: "12px 14px", fontSize: 12, color: "#888", border: `1px solid #f0e8d8` }}>
                    <strong style={{ color: "#666" }}>📋 Política de cancelación</strong>
                    <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 3 }}>
                        <span>✓ Más de 7 días antes → reembolso completo</span>
                        <span>~ Entre 7 días y 48hs → reembolso del 50%</span>
                        <span>✗ Menos de 48hs → sin reembolso</span>
                    </div>
                </div>

                {/* Botón MP */}
                <button
                    onClick={handlePagar}
                    disabled={loading || !userName || !userEmail}
                    style={{
                        marginTop: 16, width: "100%",
                        backgroundColor: (!userName || !userEmail) ? "#aaa" : "#009ee3",
                        color: "#fff", border: "none", borderRadius: 14,
                        padding: "14px 0", fontSize: 15, fontWeight: 700,
                        cursor: (!userName || !userEmail) ? "not-allowed" : "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                    }}
                >
                    {loading ? "Redirigiendo..." : `🔒 Pagar ${formatARS(total)} con Mercado Pago`}
                </button>
                <p style={{ textAlign: "center", fontSize: 11, color: "#bbb", marginTop: 8 }}>Pago 100% seguro procesado por Mercado Pago</p>
            </div>
        );
    }

    // Paso 1: selección de turno
    return (
        <div style={{ backgroundColor: COLORS.bg, borderRadius: 20, padding: 24, border: `1px solid ${COLORS.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>Reservá tu lugar</h3>
                <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.green }}>
                    {formatARS(pricePerPerson)}<span style={{ fontSize: 12, fontWeight: 400, color: "#999" }}>/persona</span>
                </div>
            </div>

            {dates.length === 0 ? (
                <p style={{ color: "#bbb", fontSize: 14 }}>No hay turnos disponibles por el momento.</p>
            ) : (
                <>
                    {/* Fechas */}
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#777", marginBottom: 8 }}>Elegí una fecha</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {dates.map((date) => {
                                const totalCupos = slotsByDate[date].reduce((acc, s) => acc + (s.capacity - s.booked_count), 0);
                                const isSelected = selectedDate === date;
                                return (
                                    <button key={date} onClick={() => { setSelectedDate(date); setSelectedSlot(null); }}
                                        style={{ backgroundColor: isSelected ? COLORS.green : "#fff", color: isSelected ? "#fff" : "#333", border: `1px solid ${isSelected ? COLORS.green : COLORS.border}`, borderRadius: 12, padding: "10px 14px", fontSize: 14, fontWeight: 600, cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span style={{ textTransform: "capitalize" }}>{formatDate(date)}</span>
                                        <span style={{ fontSize: 12, opacity: 0.8 }}>{totalCupos} lugar{totalCupos !== 1 ? "es" : ""}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Horarios */}
                    {selectedDate && (
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "#777", marginBottom: 8 }}>Elegí un horario</div>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                {slotsForDate.map((slot) => {
                                    const disponibles = slot.capacity - slot.booked_count;
                                    const isSelected = selectedSlot?.id === slot.id;
                                    const agotado = disponibles <= 0;
                                    return (
                                        <button key={slot.id} onClick={() => !agotado && setSelectedSlot(slot)} disabled={agotado}
                                            style={{ backgroundColor: agotado ? "#f0ece6" : isSelected ? COLORS.orange : "#fff", color: agotado ? "#bbb" : isSelected ? "#fff" : "#333", border: `1px solid ${agotado ? "#e0d8cf" : isSelected ? COLORS.orange : COLORS.border}`, borderRadius: 10, padding: "9px 16px", fontSize: 14, fontWeight: 600, cursor: agotado ? "not-allowed" : "pointer", minWidth: 90 }}>
                                            {formatTime(slot.time)}
                                            {agotado && <span style={{ display: "block", fontSize: 10, fontWeight: 400 }}>Agotado</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Personas */}
                    {selectedSlot && (
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "#777", marginBottom: 8 }}>
                                Personas <span style={{ fontWeight: 400, color: "#aaa" }}>(máx. {maxPeople})</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <button onClick={() => setPeople(Math.max(1, people - 1))} style={{ width: 36, height: 36, borderRadius: "50%", border: `1px solid ${COLORS.border}`, backgroundColor: "#fff", cursor: "pointer", fontSize: 18, fontWeight: 700, color: "#444" }}>−</button>
                                <span style={{ fontSize: 18, fontWeight: 800, minWidth: 24, textAlign: "center" }}>{people}</span>
                                <button onClick={() => setPeople(Math.min(maxPeople, people + 1))} style={{ width: 36, height: 36, borderRadius: "50%", border: `1px solid ${COLORS.border}`, backgroundColor: "#fff", cursor: "pointer", fontSize: 18, fontWeight: 700, color: "#444" }}>+</button>
                                <span style={{ fontSize: 14, color: "#888", marginLeft: 4 }}>{formatARS(total)}</span>
                            </div>
                        </div>
                    )}

                    {selectedSlot && (
                        <button onClick={() => setStep("form")} style={{ width: "100%", backgroundColor: COLORS.green, color: "#fff", border: "none", borderRadius: 14, padding: "13px 0", fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 4 }}>
                            Continuar → {formatARS(total)}
                        </button>
                    )}
                </>
            )}
        </div>
    );
}