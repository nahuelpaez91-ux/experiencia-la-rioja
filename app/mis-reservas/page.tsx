"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client-browser";
import Link from "next/link";

const COLORS = {
    green: "#4E6B3A",
    orange: "#D07A2D",
    bg: "#F3EEE6",
    border: "#e7e2da",
};

const formatARS = (n: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    confirmed: { label: "Confirmada", color: "#166534", bg: "#dcfce7" },
    pending: { label: "Pendiente", color: "#92400e", bg: "#fef3c7" },
    cancelled: { label: "Cancelada", color: "#991b1b", bg: "#fee2e2" },
};

type Booking = {
    id: string;
    experience_id: string;
    slot_id: string;
    user_name: string;
    user_email: string;
    people: number;
    total_price: number;
    status: string;
    created_at: string;
    experience_title?: string;
    experience_cover?: string;
    experience_location?: string;
    slot_date?: string;
    slot_time?: string;
};

export default function MisReservasPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);
    const supabase = createClient();

    useEffect(() => {
        loadBookings();
    }, []);

    async function loadBookings() {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }
        setUser(user);

        const { data: rawBookings, error: bErr } = await supabase
            .from("bookings")
            .select("*")
            .eq("user_email", user.email)
            .order("created_at", { ascending: false });

        if (bErr) { setError(bErr.message); setLoading(false); return; }
        if (!rawBookings || rawBookings.length === 0) { setBookings([]); setLoading(false); return; }

        const expIds = [...new Set(rawBookings.map((b: any) => b.experience_id).filter(Boolean))];
        const slotIds = [...new Set(rawBookings.map((b: any) => b.slot_id).filter(Boolean))];

        const [{ data: exps }, { data: slots }] = await Promise.all([
            supabase.from("experiences").select("id, title, cover_image_url, location").in("id", expIds),
            supabase.from("availability_slots").select("id, date, time").in("id", slotIds),
        ]);

        const expMap: Record<string, any> = {};
        for (const e of exps ?? []) expMap[e.id] = e;
        const slotMap: Record<string, any> = {};
        for (const s of slots ?? []) slotMap[s.id] = s;

        const enriched: Booking[] = rawBookings.map((b: any) => ({
            ...b,
            experience_title: expMap[b.experience_id]?.title ?? "Experiencia",
            experience_cover: expMap[b.experience_id]?.cover_image_url ?? null,
            experience_location: expMap[b.experience_id]?.location ?? "",
            slot_date: slotMap[b.slot_id]?.date ?? null,
            slot_time: slotMap[b.slot_id]?.time ?? null,
        }));

        setBookings(enriched);
        setLoading(false);
    }

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

    const formatTime = (t: string) => t?.slice(0, 5) ?? "";

    return (
        <div style={{ backgroundColor: COLORS.bg, minHeight: "100vh" }}>
            <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px 80px" }}>
                <div style={{ marginBottom: 32 }}>
                    <h1 style={{ fontSize: 28, fontWeight: 900, margin: "0 0 6px" }}>🎫 Mis reservas</h1>
                    <p style={{ color: "#888", fontSize: 14, margin: 0 }}>Todas tus reservas en un solo lugar.</p>
                </div>

                {!loading && !user && (
                    <div style={{ backgroundColor: "#fff", borderRadius: 20, padding: 40, textAlign: "center", border: `1px solid ${COLORS.border}` }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
                        <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 8px" }}>Iniciá sesión para ver tus reservas</h2>
                        <p style={{ color: "#888", fontSize: 14, marginBottom: 24 }}>Necesitás estar logueado para acceder a esta sección.</p>
                        <Link href="/auth/login" style={{ backgroundColor: COLORS.green, color: "#fff", borderRadius: 12, padding: "12px 28px", fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
                            Iniciar sesión
                        </Link>
                    </div>
                )}

                {loading && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {[1, 2, 3].map((i) => (
                            <div key={i} style={{ backgroundColor: "#fff", borderRadius: 18, height: 120, border: `1px solid ${COLORS.border}`, opacity: 0.5 }} />
                        ))}
                    </div>
                )}

                {error && (
                    <div style={{ backgroundColor: "#fee2e2", borderRadius: 16, padding: 20, color: "#991b1b", fontSize: 14 }}>
                        Error: {error}
                    </div>
                )}

                {!loading && user && !error && bookings.length === 0 && (
                    <div style={{ backgroundColor: "#fff", borderRadius: 20, padding: 48, textAlign: "center", border: `1px solid ${COLORS.border}` }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>🗓️</div>
                        <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 8px" }}>Todavía no tenés reservas</h2>
                        <p style={{ color: "#888", fontSize: 14, marginBottom: 24 }}>Explorá las experiencias disponibles y hacé tu primera reserva.</p>
                        <Link href="/experiencias" style={{ backgroundColor: COLORS.green, color: "#fff", borderRadius: 12, padding: "12px 28px", fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
                            Explorar experiencias
                        </Link>
                    </div>
                )}

                {!loading && bookings.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {bookings.map((b) => {
                            const status = STATUS_CONFIG[b.status] ?? { label: b.status, color: "#555", bg: "#f0f0f0" };
                            const isPast = b.slot_date ? new Date(b.slot_date) < new Date() : false;

                            return (
                                <div key={b.id} style={{ backgroundColor: "#fff", borderRadius: 20, border: `1px solid ${COLORS.border}`, overflow: "hidden", opacity: isPast ? 0.8 : 1 }}>
                                    <div style={{ display: "flex", flexWrap: "wrap" }}>
                                        <div style={{ width: 140, minHeight: 120, backgroundColor: "#D9D3CB", flexShrink: 0, position: "relative", overflow: "hidden" }}>
                                            {b.experience_cover ? (
                                                <img src={b.experience_cover} alt={b.experience_title} style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
                                            ) : (
                                                <div style={{ width: "100%", height: "100%", minHeight: 120, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>🏔️</div>
                                            )}
                                        </div>

                                        <div style={{ flex: 1, padding: "18px 20px", minWidth: 0 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                                                <div>
                                                    <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 4px", lineHeight: 1.3 }}>{b.experience_title}</h3>
                                                    {b.experience_location && (
                                                        <div style={{ fontSize: 13, color: "#888" }}>📍 {b.experience_location}</div>
                                                    )}
                                                </div>
                                                <span style={{ backgroundColor: status.bg, color: status.color, borderRadius: 999, padding: "4px 12px", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>
                                                    {status.label}
                                                </span>
                                            </div>

                                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 20px", marginTop: 12, fontSize: 13, color: "#555" }}>
                                                {b.slot_date && <span>📅 <strong>{formatDate(b.slot_date)}</strong></span>}
                                                {b.slot_time && <span>🕐 {formatTime(b.slot_time)}</span>}
                                                <span>👤 {b.people} {b.people === 1 ? "persona" : "personas"}</span>
                                                <span>💵 <strong style={{ color: COLORS.green }}>{formatARS(Number(b.total_price))}</strong></span>
                                            </div>

                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, flexWrap: "wrap", gap: 8 }}>
                                                <span style={{ fontSize: 11, color: "#bbb", fontFamily: "monospace" }}>
                                                    # {b.id.slice(0, 8).toUpperCase()}
                                                </span>
                                                <Link href={`/experiencias/${b.experience_id}`} style={{ fontSize: 12, fontWeight: 700, color: COLORS.green, textDecoration: "none" }}>
                                                    Ver experiencia →
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}