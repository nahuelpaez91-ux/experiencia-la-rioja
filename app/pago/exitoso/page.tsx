// app/pago/exitoso/page.tsx
// MP redirige acá cuando el pago fue aprobado

import { supabaseAdmin } from "@/lib/supabase/server";

const COLORS = { green: "#4E6B3A", orange: "#D07A2D", bg: "#F3EEE6", border: "#e7e2da" };

const formatARS = (n: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

export default async function PagoExitosoPage({
    searchParams,
}: {
    searchParams: { booking_id?: string; payment_id?: string; status?: string };
}) {
    const bookingId = searchParams.booking_id;

    let booking: any = null;
    if (bookingId) {
        const { data } = await supabaseAdmin
            .from("bookings")
            .select(`
        id, user_name, user_email, people, total_price, status, payment_status,
        slot:slot_id (date, time),
        experience:experience_id (title, location)
      `)
            .eq("id", bookingId)
            .single();
        booking = data;
    }

    const formatDate = (d: string) =>
        new Date(d + "T12:00:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

    return (
        <div style={{ minHeight: "100vh", backgroundColor: COLORS.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div style={{ maxWidth: 480, width: "100%", backgroundColor: "#fff", borderRadius: 28, padding: 40, border: `1px solid ${COLORS.border}`, textAlign: "center", boxShadow: "0 8px 40px rgba(0,0,0,0.07)" }}>

                <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
                <h1 style={{ fontSize: 26, fontWeight: 900, margin: "0 0 8px", color: "#222" }}>¡Pago exitoso!</h1>
                <p style={{ color: "#777", fontSize: 15, margin: "0 0 28px" }}>
                    Tu reserva está confirmada. Te mandamos los detalles a <strong>{booking?.user_email}</strong>
                </p>

                {booking && (
                    <div style={{ backgroundColor: COLORS.bg, borderRadius: 18, padding: 22, border: `1px solid ${COLORS.border}`, textAlign: "left", marginBottom: 24 }}>
                        <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 14, color: "#222" }}>
                            {booking.experience?.title}
                        </div>

                        {[
                            { label: "📍 Lugar", value: booking.experience?.location },
                            { label: "📅 Fecha", value: booking.slot?.date ? formatDate(booking.slot.date) : "—" },
                            { label: "⏰ Horario", value: booking.slot?.time?.slice(0, 5) + "hs" },
                            { label: "👥 Personas", value: `${booking.people} ${booking.people === 1 ? "persona" : "personas"}` },
                        ].map(({ label, value }) => (
                            <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 8 }}>
                                <span style={{ color: "#888" }}>{label}</span>
                                <span style={{ fontWeight: 600 }}>{value}</span>
                            </div>
                        ))}

                        <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 12, marginTop: 4, display: "flex", justifyContent: "space-between" }}>
                            <span style={{ fontWeight: 800 }}>Total pagado</span>
                            <span style={{ fontWeight: 900, fontSize: 18, color: COLORS.green }}>{formatARS(booking.total_price)}</span>
                        </div>
                    </div>
                )}

                {bookingId && (
                    <div style={{ backgroundColor: "#f0f7eb", borderRadius: 12, padding: "10px 16px", fontSize: 13, color: "#555", marginBottom: 20, border: `1px solid #c8ddb8` }}>
                        Código de reserva: <strong style={{ color: COLORS.green, letterSpacing: 1 }}>{bookingId.slice(0, 8).toUpperCase()}</strong>
                    </div>
                )}

                <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                    <a href="/experiencias" style={{ backgroundColor: COLORS.green, color: "#fff", textDecoration: "none", borderRadius: 12, padding: "11px 24px", fontSize: 14, fontWeight: 700 }}>
                        Ver más experiencias
                    </a>
                    <a href="/mis-reservas" style={{ backgroundColor: "#fff", color: COLORS.green, textDecoration: "none", borderRadius: 12, padding: "11px 24px", fontSize: 14, fontWeight: 600, border: `1px solid ${COLORS.border}` }}>
                        Mis reservas
                    </a>
                </div>

                <p style={{ fontSize: 12, color: "#bbb", marginTop: 20 }}>
                    ¿Necesitás cancelar? Revisá la política de cancelación en <a href="/ayuda" style={{ color: COLORS.green }}>Ayuda</a>
                </p>
            </div>
        </div>
    );
}