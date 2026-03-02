// app/pago/fallido/page.tsx

const COLORS = { green: "#4E6B3A", orange: "#D07A2D", bg: "#F3EEE6", border: "#e7e2da" };

export default function PagoFallidoPage({
    searchParams,
}: {
    searchParams: { booking_id?: string };
}) {
    return (
        <div style={{ minHeight: "100vh", backgroundColor: COLORS.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div style={{ maxWidth: 440, width: "100%", backgroundColor: "#fff", borderRadius: 28, padding: 40, border: `1px solid ${COLORS.border}`, textAlign: "center", boxShadow: "0 8px 40px rgba(0,0,0,0.07)" }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>😕</div>
                <h1 style={{ fontSize: 24, fontWeight: 900, margin: "0 0 8px", color: "#222" }}>El pago no se completó</h1>
                <p style={{ color: "#777", fontSize: 15, margin: "0 0 28px" }}>
                    No se realizó ningún cobro. Podés intentarlo de nuevo o elegir otro método de pago.
                </p>

                <div style={{ backgroundColor: "#fdecea", borderRadius: 14, padding: "14px 18px", fontSize: 13, color: "#c0392b", marginBottom: 24, textAlign: "left" }}>
                    <strong>¿Qué pudo pasar?</strong>
                    <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
                        <li>Tarjeta sin fondos suficientes</li>
                        <li>Datos de tarjeta incorrectos</li>
                        <li>El banco rechazó la transacción</li>
                        <li>La sesión expiró (30 minutos)</li>
                    </ul>
                </div>

                <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                    <a href="javascript:history.back()" style={{ backgroundColor: COLORS.green, color: "#fff", textDecoration: "none", borderRadius: 12, padding: "11px 24px", fontSize: 14, fontWeight: 700 }}>
                        Intentar de nuevo
                    </a>
                    <a href="/experiencias" style={{ backgroundColor: "#fff", color: "#666", textDecoration: "none", borderRadius: 12, padding: "11px 24px", fontSize: 14, fontWeight: 600, border: `1px solid ${COLORS.border}` }}>
                        Ver experiencias
                    </a>
                </div>
            </div>
        </div>
    );
}