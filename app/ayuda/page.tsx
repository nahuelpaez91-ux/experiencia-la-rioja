import HeaderAuth from "@/app/components/HeaderAuth";

const COLORS = {
    green: "#4E6B3A",
    orange: "#D07A2D",
    bg: "#F3EEE6",
    border: "#e7e2da",
};

export default function AyudaPage() {
    return (
        <div style={{ backgroundColor: COLORS.bg, minHeight: "100vh" }}>
            {/* Header reutilizado */}
            <header style={{ position: "sticky", top: 0, zIndex: 50, backgroundColor: "rgba(243,238,230,0.95)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${COLORS.border}` }}>
                <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
                    <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: COLORS.green, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ fontSize: 15 }}>🏔️</span>
                        </div>
                        <div style={{ lineHeight: 1.2 }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: COLORS.green, letterSpacing: 1, textTransform: "uppercase" }}>Experiencia</div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: COLORS.orange }}>LA RIOJA</div>
                        </div>
                    </a>
                    <nav style={{ display: "flex", alignItems: "center", gap: 24 }}>
                        <a href="/" style={{ fontSize: 13, fontWeight: 600, color: "#555", textDecoration: "none" }}>Inicio</a>
                        <a href="/experiencias" style={{ fontSize: 13, fontWeight: 600, color: "#555", textDecoration: "none" }}>Experiencias</a>
                        <a href="/#categorias" style={{ fontSize: 13, fontWeight: 600, color: "#555", textDecoration: "none" }}>Categorías</a>
                        <a href="/ayuda" style={{ fontSize: 13, fontWeight: 700, color: COLORS.green, textDecoration: "none" }}>Ayuda</a>
                        <HeaderAuth />
                    </nav>
                </div>
            </header>

            <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 32px 80px" }}>
                <h1 style={{ fontSize: 34, fontWeight: 900, margin: "0 0 8px" }}>Centro de ayuda</h1>
                <p style={{ color: "#888", fontSize: 16, marginBottom: 48 }}>Todo lo que necesitás saber para usar la plataforma.</p>

                {/* Tabs visuales */}
                <div style={{ display: "flex", gap: 10, marginBottom: 40, flexWrap: "wrap" }}>
                    {["Para usuarios", "Para proveedores", "Términos y condiciones"].map((label, i) => (
                        <a key={label} href={`#seccion-${i}`} style={{ backgroundColor: i === 0 ? COLORS.green : "#fff", color: i === 0 ? "#fff" : "#555", borderRadius: 12, padding: "9px 20px", fontSize: 13, fontWeight: 700, textDecoration: "none", border: `1px solid ${COLORS.border}` }}>
                            {label}
                        </a>
                    ))}
                </div>

                {/* ===== PARA USUARIOS ===== */}
                <section id="seccion-0" style={{ marginBottom: 56 }}>
                    <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 20px", display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 24 }}>👤</span> Para usuarios
                    </h2>

                    {[
                        {
                            q: "¿Cómo reservo una experiencia?",
                            a: "1. Explorá las experiencias disponibles en la sección Experiencias.\n2. Hacé clic en la que te interese para ver todos los detalles.\n3. Elegí la fecha y horario disponible.\n4. Seleccioná la cantidad de personas.\n5. Iniciá sesión o registrate si aún no tenés cuenta.\n6. Confirmá la reserva. Recibirás un código de confirmación."
                        },
                        {
                            q: "¿Necesito cuenta para reservar?",
                            a: "Sí. Para completar una reserva necesitás estar registrado. El registro es gratuito y solo requiere tu email y contraseña (o podés ingresar con Google)."
                        },
                        {
                            q: "¿Cómo veo mis reservas?",
                            a: "Una vez logueado, hacé clic en tu nombre en la esquina superior derecha y seleccioná 'Mis reservas'. Ahí verás todas tus reservas con su estado y código de confirmación."
                        },
                        {
                            q: "¿Puedo cancelar una reserva?",
                            a: "La política de cancelación depende de cada proveedor. Contactate directamente con el proveedor de la experiencia a través de los datos de contacto que encontrarás en la confirmación."
                        },
                        {
                            q: "¿Es seguro pagar en la plataforma?",
                            a: "Actualmente la plataforma gestiona la reserva y el pago se coordina directamente con el proveedor. Siempre verificá los detalles antes de confirmar."
                        },
                    ].map((item, i) => (
                        <details key={i} style={{ backgroundColor: "#fff", borderRadius: 16, marginBottom: 10, border: `1px solid ${COLORS.border}`, overflow: "hidden" }}>
                            <summary style={{ padding: "16px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer", listStyle: "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                {item.q}
                                <span style={{ fontSize: 18, color: "#aaa" }}>+</span>
                            </summary>
                            <div style={{ padding: "0 20px 16px", fontSize: 14, color: "#555", lineHeight: 1.8, whiteSpace: "pre-line" }}>
                                {item.a}
                            </div>
                        </details>
                    ))}
                </section>

                {/* ===== PARA PROVEEDORES ===== */}
                <section id="seccion-1" style={{ marginBottom: 56 }}>
                    <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 20px", display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 24 }}>🗺️</span> Para proveedores
                    </h2>

                    {[
                        {
                            q: "¿Cómo publico mi experiencia?",
                            a: "1. Registrate o iniciá sesión.\n2. Contactá al administrador para que active tu rol de proveedor.\n3. Una vez activado, accedé al Panel Proveedor desde tu menú de usuario.\n4. Creá tu experiencia con título, descripción, fotos y precio.\n5. Agregá los turnos de disponibilidad.\n6. Publicala cuando esté lista."
                        },
                        {
                            q: "¿Cómo gestiono mis turnos y disponibilidad?",
                            a: "Desde el Panel Proveedor, en la pestaña 'Disponibilidad', podés agregar turnos con fecha, horario y capacidad máxima. La plataforma descuenta automáticamente los cupos cuando alguien reserva."
                        },
                        {
                            q: "¿Cómo veo las reservas que recibo?",
                            a: "En el Panel Proveedor, pestaña 'Reservas', verás todas las reservas con nombre del usuario, email, fecha del turno, cantidad de personas y monto total."
                        },
                        {
                            q: "¿Puedo subir fotos y videos?",
                            a: "Sí. Al crear o editar una experiencia podés subir una foto de portada, hasta 8 fotos de galería, y agregar un enlace de YouTube o Vimeo como video descriptivo."
                        },
                        {
                            q: "¿Cómo publico o despublico mi experiencia?",
                            a: "Desde el listado de experiencias en el Panel Proveedor, usá el botón 'Publicar' o 'Despublicar' para controlar si tu experiencia es visible al público."
                        },
                    ].map((item, i) => (
                        <details key={i} style={{ backgroundColor: "#fff", borderRadius: 16, marginBottom: 10, border: `1px solid ${COLORS.border}`, overflow: "hidden" }}>
                            <summary style={{ padding: "16px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer", listStyle: "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                {item.q}
                                <span style={{ fontSize: 18, color: "#aaa" }}>+</span>
                            </summary>
                            <div style={{ padding: "0 20px 16px", fontSize: 14, color: "#555", lineHeight: 1.8, whiteSpace: "pre-line" }}>
                                {item.a}
                            </div>
                        </details>
                    ))}
                </section>

                {/* ===== TÉRMINOS ===== */}
                <section id="seccion-2">
                    <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 20px", display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 24 }}>📋</span> Términos y condiciones
                    </h2>
                    <div style={{ backgroundColor: "#fff", borderRadius: 20, padding: "28px 32px", border: `1px solid ${COLORS.border}`, fontSize: 14, color: "#555", lineHeight: 1.9 }}>
                        <p><strong>Plataforma de intermediación</strong></p>
                        <p>Experiencia La Rioja es una plataforma digital que actúa exclusivamente como intermediaria entre usuarios que buscan experiencias turísticas y proveedores que las ofrecen en la provincia de La Rioja, Argentina.</p>

                        <p><strong>Responsabilidad limitada</strong></p>
                        <p>Experiencia La Rioja <strong>no es responsable</strong> de la calidad, seguridad, cumplimiento o cualquier aspecto relacionado con las experiencias ofrecidas por los proveedores. La plataforma facilita el contacto y la reserva, pero la relación contractual es directamente entre el usuario y el proveedor.</p>

                        <p><strong>Responsabilidad del proveedor</strong></p>
                        <p>Los proveedores son responsables de: contar con los seguros y habilitaciones necesarias, brindar la experiencia tal como fue publicada, gestionar las cancelaciones y reembolsos según su propia política.</p>

                        <p><strong>Responsabilidad del usuario</strong></p>
                        <p>Los usuarios son responsables de: leer los detalles de cada experiencia antes de reservar, llegar en las condiciones físicas requeridas, respetar las políticas del proveedor.</p>

                        <p><strong>Datos personales</strong></p>
                        <p>Los datos recopilados se usan únicamente para gestionar reservas y mejorar la plataforma. No se comparten con terceros fuera de los proveedores involucrados en cada reserva.</p>

                        <p style={{ fontSize: 12, color: "#aaa", marginTop: 24 }}>Última actualización: febrero 2025. Esta plataforma es un proyecto en desarrollo.</p>
                    </div>
                </section>
            </div>
        </div>
    );
}