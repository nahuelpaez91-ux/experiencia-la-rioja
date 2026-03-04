"use client";

import { useState } from "react";

const COLORS = {
    green: "#4E6B3A",
    orange: "#D07A2D",
    bg: "#F3EEE6",
    border: "#e7e2da",
    red: "#DC2626",
    purple: "#7C3AED",
};

const formatARS = (n: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });

type Tab = "resumen" | "proveedores" | "usuarios" | "experiencias" | "reservas" | "reseñas" | "finanzas";

type User = { id: string; email: string; full_name: string | null; role: string; created_at: string; suspended?: boolean; };
type PendingProvider = { id: string; email: string; full_name: string | null; phone: string | null; departamento: string | null; localidad: string | null; address: string | null; avatar_url: string | null; dni_url: string | null; dni_dorso_url: string | null; habilitacion_url: string | null; provider_status: string | null; terms_accepted: boolean | null; created_at: string; };
type Experience = { id: string; title: string; location: string | null; category: string | null; price_from: number | null; is_published: boolean; is_featured: boolean; created_at: string; provider_id: string | null; };
type Booking = { id: string; experience_id: string; user_id: string | null; status: string; people: number | null; created_at: string; slot_id: string | null; total_price?: number | null; user_name?: string | null; user_email?: string | null; };
type Review = { id: string; experience_id: string; user_name: string; rating: number; comment: string | null; created_at: string; };
type Stats = { users: number; experiences: number; bookings: number; reviews: number; publishedExperiences: number; pendingExperiences: number; providers: number; admins: number; pendingProviders?: number; };

const roleColors: Record<string, string> = { admin: "#7C3AED", provider: "#4E6B3A", user: "#64748B" };
const statusColors: Record<string, { bg: string; color: string; label: string }> = {
    confirmed: { bg: "#DCFCE7", color: "#4E6B3A", label: "Confirmada" },
    pending: { bg: "#FEF3C7", color: "#D07A2D", label: "Pendiente" },
    cancelled: { bg: "#FEE2E2", color: "#DC2626", label: "Cancelada" },
    completed: { bg: "#E0F2FE", color: "#0891B2", label: "Completada" },
};

export default function AdminClient({ stats, users: initialUsers, experiences: initialExperiences, bookings: initialBookings, reviews: initialReviews, pendingProviders: initialPending = [] }: { stats: Stats; users: User[]; experiences: Experience[]; bookings: Booking[]; reviews: Review[]; pendingProviders?: PendingProvider[]; }) {
    const [tab, setTab] = useState<Tab>("resumen");
    const [users, setUsers] = useState(initialUsers);
    const [experiences, setExperiences] = useState(initialExperiences);
    const [bookings, setBookings] = useState(initialBookings);
    const [reviews, setReviews] = useState(initialReviews);
    const [pendingProviders, setPendingProviders] = useState<PendingProvider[]>(initialPending);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
    const [searchUser, setSearchUser] = useState("");
    const [searchExp, setSearchExp] = useState("");
    const [filterRole, setFilterRole] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterCategory, setFilterCategory] = useState("all");
    const [confirmModal, setConfirmModal] = useState<{ msg: string; action: () => void } | null>(null);
    const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState<{ id: string; reason: string } | null>(null);

    const showToast = (msg: string, type: "ok" | "err" = "ok") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
    const confirm = (msg: string, action: () => void) => setConfirmModal({ msg, action });

    const handleSetRole = async (userId: string, newRole: string) => {
        setLoadingId(userId);
        const res = await fetch("/api/admin/set-role", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, role: newRole }) });
        if (res.ok) { setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))); showToast("Rol actualizado ✓"); }
        else showToast("Error al cambiar rol", "err");
        setLoadingId(null);
    };

    const handleToggle = async (expId: string, field: "is_published" | "is_featured", value: boolean) => {
        setLoadingId(expId);
        const res = await fetch("/api/admin/toggle-experience", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ expId, field, value }) });
        if (res.ok) { setExperiences((prev) => prev.map((e) => (e.id === expId ? { ...e, [field]: value } : e))); showToast(field === "is_published" ? (value ? "Publicada ✓" : "Despublicada ✓") : (value ? "Destacada ✓" : "Quitada ✓")); }
        else showToast("Error al actualizar", "err");
        setLoadingId(null);
    };

    const handleDeleteReview = (reviewId: string) => confirm("¿Eliminar esta reseña? No se puede deshacer.", async () => {
        setLoadingId(reviewId);
        const res = await fetch("/api/admin/delete-review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reviewId }) });
        if (res.ok) { setReviews((prev) => prev.filter((r) => r.id !== reviewId)); showToast("Reseña eliminada ✓"); }
        else showToast("Error al eliminar", "err");
        setLoadingId(null); setConfirmModal(null);
    });

    const handleCancelBooking = (bookingId: string) => confirm("¿Cancelar esta reserva?", async () => {
        setLoadingId(bookingId);
        const res = await fetch("/api/admin/cancel-booking", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookingId }) });
        if (res.ok) { setBookings((prev) => prev.map((b) => b.id === bookingId ? { ...b, status: "cancelled" } : b)); showToast("Reserva cancelada ✓"); }
        else showToast("Error al cancelar", "err");
        setLoadingId(null); setConfirmModal(null);
    });

    const handleApproveProvider = async (providerId: string) => {
        setLoadingId(providerId);
        const res = await fetch("/api/admin/approve-provider", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: providerId, action: "approve" }) });
        if (res.ok) {
            setPendingProviders((prev) => prev.filter((p) => p.id !== providerId));
            setUsers((prev) => prev.map((u) => u.id === providerId ? { ...u, role: "provider" } : u));
            showToast("Proveedor aprobado ✓");
        } else showToast("Error al aprobar", "err");
        setLoadingId(null);
    };

    const handleRejectProvider = async (providerId: string, reason: string) => {
        setLoadingId(providerId);
        const res = await fetch("/api/admin/approve-provider", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: providerId, action: "reject", reason }) });
        if (res.ok) {
            setPendingProviders((prev) => prev.filter((p) => p.id !== providerId));
            showToast("Solicitud rechazada ✓");
        } else showToast("Error al rechazar", "err");
        setLoadingId(null);
        setRejectReason(null);
    };

    const filteredUsers = users.filter((u) => {
        const q = searchUser.toLowerCase();
        return (q === "" || u.email.toLowerCase().includes(q) || (u.full_name ?? "").toLowerCase().includes(q)) && (filterRole === "all" || u.role === filterRole);
    });

    const filteredExps = experiences.filter((e) => {
        const q = searchExp.toLowerCase();
        const matchQ = q === "" || e.title.toLowerCase().includes(q) || (e.location ?? "").toLowerCase().includes(q);
        if (filterCategory === "__published__") return matchQ && e.is_published;
        if (filterCategory === "__draft__") return matchQ && !e.is_published;
        if (filterCategory === "__featured__") return matchQ && e.is_featured;
        return matchQ && (filterCategory === "all" || e.category === filterCategory);
    });

    const filteredBookings = filterStatus === "all" ? bookings : bookings.filter((b) => b.status === filterStatus);
    const totalRevenue = bookings.filter((b) => b.status === "confirmed" || b.status === "completed").reduce((acc, b) => acc + (b.total_price ?? 0), 0);
    const avgRating = reviews.length > 0 ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : "—";
    const categories = [...new Set(experiences.map((e) => e.category).filter(Boolean))];

    const tabs: { id: Tab; label: string; icon: string; badge?: number }[] = [
        { id: "resumen", label: "Resumen", icon: "📊" },
        { id: "proveedores", label: "Proveedores", icon: "🏪", badge: pendingProviders.length },
        { id: "usuarios", label: "Usuarios", icon: "👥" },
        { id: "experiencias", label: "Experiencias", icon: "🗺️" },
        { id: "reservas", label: "Reservas", icon: "📅" },
        { id: "reseñas", label: "Reseñas", icon: "⭐" },
        { id: "finanzas", label: "Finanzas", icon: "💰" },
    ];

    const inp: React.CSSProperties = { padding: "8px 14px", borderRadius: 10, border: `1px solid ${COLORS.border}`, fontSize: 13, backgroundColor: "#fff", outline: "none" };

    return (
        <div style={{ backgroundColor: COLORS.bg, minHeight: "100vh", paddingBottom: 60 }}>

            {/* Toast */}
            {toast && (
                <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, backgroundColor: toast.type === "ok" ? "#1C1917" : COLORS.red, color: "#fff", borderRadius: 12, padding: "12px 20px", fontSize: 14, fontWeight: 600, boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
                    {toast.msg}
                </div>
            )}

            {/* Confirm Modal */}
            {confirmModal && (
                <div style={{ position: "fixed", inset: 0, zIndex: 9998, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ backgroundColor: "#fff", borderRadius: 20, padding: 32, maxWidth: 400, width: "90%", textAlign: "center" }}>
                        <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 24 }}>{confirmModal.msg}</p>
                        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                            <button onClick={() => setConfirmModal(null)} style={{ padding: "9px 20px", borderRadius: 10, border: `1px solid ${COLORS.border}`, background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
                            <button onClick={confirmModal.action} style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: COLORS.red, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Confirmar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal ver documento */}
            {selectedDoc && (
                <div onClick={() => setSelectedDoc(null)} style={{ position: "fixed", inset: 0, zIndex: 9999, backgroundColor: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
                    <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: 800, width: "100%", position: "relative" }}>
                        <button onClick={() => setSelectedDoc(null)} style={{ position: "absolute", top: -40, right: 0, background: "none", border: "none", color: "#fff", fontSize: 24, cursor: "pointer" }}>✕</button>
                        <img src={selectedDoc} alt="Documento" style={{ width: "100%", borderRadius: 16, maxHeight: "80vh", objectFit: "contain" }} />
                    </div>
                </div>
            )}

            {/* Modal rechazar */}
            {rejectReason && (
                <div style={{ position: "fixed", inset: 0, zIndex: 9998, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ backgroundColor: "#fff", borderRadius: 20, padding: 32, maxWidth: 440, width: "90%" }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px" }}>Motivo del rechazo</h3>
                        <textarea value={rejectReason.reason} onChange={(e) => setRejectReason({ ...rejectReason, reason: e.target.value })} placeholder="Explicá al proveedor por qué fue rechazada su solicitud..." style={{ width: "100%", boxSizing: "border-box", borderRadius: 12, border: `1px solid ${COLORS.border}`, padding: 14, fontSize: 14, height: 100, resize: "vertical", outline: "none" }} />
                        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                            <button onClick={() => setRejectReason(null)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${COLORS.border}`, background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
                            <button onClick={() => handleRejectProvider(rejectReason.id, rejectReason.reason)} disabled={!rejectReason.reason.trim() || loadingId === rejectReason.id} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: COLORS.red, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: !rejectReason.reason.trim() ? 0.5 : 1 }}>
                                {loadingId === rejectReason.id ? "..." : "Rechazar solicitud"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header style={{ position: "sticky", top: 0, zIndex: 50, backgroundColor: "rgba(243,238,230,0.95)", backdropFilter: "blur(8px)", borderBottom: `1px solid ${COLORS.border}`, padding: "16px 24px", display: "flex", alignItems: "center", gap: 12 }}>
                <a href="/" style={{ fontSize: 13, color: "#888", textDecoration: "none" }}>← Inicio</a>
                <span style={{ color: "#ccc" }}>|</span>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: COLORS.purple, backgroundColor: "#EDE9FE", padding: "2px 8px", borderRadius: 999 }}>Admin</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: COLORS.green }}>Panel de administración</span>
            </header>

            <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 24px 0" }}>

                {/* Tabs */}
                <div style={{ display: "flex", gap: 4, backgroundColor: "#fff", borderRadius: 16, padding: 5, border: `1px solid ${COLORS.border}`, width: "fit-content", marginBottom: 28, flexWrap: "wrap" }}>
                    {tabs.map((t) => (
                        <button key={t.id} onClick={() => setTab(t.id)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", backgroundColor: tab === t.id ? COLORS.green : "transparent", color: tab === t.id ? "#fff" : "#666", position: "relative" }}>
                            <span>{t.icon}</span>{t.label}
                            {t.badge != null && t.badge > 0 && (
                                <span style={{ backgroundColor: COLORS.red, color: "#fff", borderRadius: 999, fontSize: 10, fontWeight: 800, padding: "1px 6px", marginLeft: 2 }}>{t.badge}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ── PROVEEDORES ── */}
                {tab === "proveedores" && (
                    <div>
                        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, marginTop: 0 }}>Solicitudes de proveedores</h2>
                        <p style={{ fontSize: 14, color: "#888", marginBottom: 24 }}>Revisá la documentación y aprobá o rechazá cada solicitud.</p>

                        {pendingProviders.length === 0 ? (
                            <div style={{ backgroundColor: "#fff", borderRadius: 20, padding: 48, textAlign: "center", border: `1px solid ${COLORS.border}` }}>
                                <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                                <p style={{ color: "#bbb", fontSize: 15 }}>No hay solicitudes pendientes.</p>
                            </div>
                        ) : pendingProviders.map((p) => (
                            <div key={p.id} style={{ backgroundColor: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 20, padding: 28, marginBottom: 16 }}>
                                <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>

                                    {/* Foto */}
                                    <div style={{ flexShrink: 0 }}>
                                        {p.avatar_url
                                            ? <img src={p.avatar_url} alt="foto" style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: `2px solid ${COLORS.border}` }} />
                                            : <div style={{ width: 72, height: 72, borderRadius: "50%", backgroundColor: COLORS.bg, border: `2px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>👤</div>
                                        }
                                    </div>

                                    {/* Datos */}
                                    <div style={{ flex: 1, minWidth: 200 }}>
                                        <div style={{ fontSize: 18, fontWeight: 800, color: "#222" }}>{p.full_name || "Sin nombre"}</div>
                                        <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>{p.email}</div>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 20px", marginTop: 12 }}>
                                            {[
                                                { label: "📱 Teléfono", value: p.phone },
                                                { label: "📍 Departamento", value: p.departamento },
                                                { label: "🏘️ Localidad", value: p.localidad },
                                                { label: "🏠 Domicilio", value: p.address },
                                                { label: "📅 Solicitó", value: p.created_at ? formatDate(p.created_at) : "—" },
                                                { label: "✅ T&C", value: p.terms_accepted ? "Aceptados" : "No aceptados" },
                                            ].map((item) => item.value ? (
                                                <div key={item.label}>
                                                    <span style={{ fontSize: 11, color: "#aaa", display: "block" }}>{item.label}</span>
                                                    <span style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>{item.value}</span>
                                                </div>
                                            ) : null)}
                                        </div>
                                    </div>

                                    {/* Acciones */}
                                    <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
                                        <button onClick={() => handleApproveProvider(p.id)} disabled={loadingId === p.id} style={{ backgroundColor: COLORS.green, color: "#fff", border: "none", borderRadius: 12, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: loadingId === p.id ? 0.6 : 1 }}>
                                            {loadingId === p.id ? "..." : "✓ Aprobar"}
                                        </button>
                                        <button onClick={() => setRejectReason({ id: p.id, reason: "" })} disabled={loadingId === p.id} style={{ backgroundColor: "#FEE2E2", color: COLORS.red, border: "none", borderRadius: 12, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                                            ✕ Rechazar
                                        </button>
                                    </div>
                                </div>

                                {/* Documentos */}
                                <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${COLORS.border}` }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: "#555", marginBottom: 12 }}>📄 Documentación</div>
                                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                                        {[
                                            { label: "DNI frente", url: p.dni_url },
                                            { label: "DNI dorso", url: p.dni_dorso_url },
                                            { label: "Habilitación", url: p.habilitacion_url },
                                        ].map((doc) => (
                                            <div key={doc.label} onClick={() => doc.url && setSelectedDoc(doc.url)}
                                                style={{ border: `2px dashed ${doc.url ? COLORS.green : COLORS.border}`, borderRadius: 12, padding: "12px 20px", textAlign: "center", cursor: doc.url ? "pointer" : "default", backgroundColor: doc.url ? "#f0f7eb" : "#f9f7f4", minWidth: 120 }}>
                                                <div style={{ fontSize: 22, marginBottom: 4 }}>{doc.url ? "✅" : "❌"}</div>
                                                <div style={{ fontSize: 12, fontWeight: 700, color: doc.url ? COLORS.green : "#aaa" }}>{doc.label}</div>
                                                {doc.url && <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>Click para ver</div>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── RESUMEN ── */}
                {tab === "resumen" && (
                    <div>
                        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20, marginTop: 0 }}>Resumen general</h2>

                        {/* Alerta proveedores pendientes */}
                        {pendingProviders.length > 0 && (
                            <div onClick={() => setTab("proveedores")} style={{ backgroundColor: "#FEF3C7", border: `1px solid #FCD34D`, borderRadius: 16, padding: "14px 20px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <span style={{ fontSize: 20 }}>⚠️</span>
                                    <span style={{ fontSize: 14, fontWeight: 700, color: "#92400E" }}>Tenés {pendingProviders.length} solicitud{pendingProviders.length > 1 ? "es" : ""} de proveedor pendiente{pendingProviders.length > 1 ? "s" : ""}</span>
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.orange }}>Revisar →</span>
                            </div>
                        )}

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 28 }}>
                            {[
                                { label: "Usuarios", value: stats.users, icon: "👥", sub: `${stats.providers} proveedores · ${stats.admins} admins`, color: "#64748B" },
                                { label: "Experiencias", value: stats.experiences, icon: "🗺️", sub: `${stats.publishedExperiences} publicadas · ${stats.pendingExperiences} pendientes`, color: COLORS.green },
                                { label: "Reservas", value: stats.bookings, icon: "📅", sub: "Total histórico", color: COLORS.orange },
                                { label: "Reseñas", value: stats.reviews, icon: "⭐", sub: `Rating promedio: ${avgRating}`, color: "#D97706" },
                                { label: "Ingresos totales", value: formatARS(totalRevenue), icon: "💰", sub: "Reservas confirmadas + completadas", color: COLORS.green },
                            ].map((s) => (
                                <div key={s.label} style={{ backgroundColor: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 20, padding: "20px 22px" }}>
                                    <div style={{ fontSize: 26, marginBottom: 4 }}>{s.icon}</div>
                                    <div style={{ fontSize: typeof s.value === "string" ? 18 : 34, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: "#333", marginTop: 4 }}>{s.label}</div>
                                    <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>{s.sub}</div>
                                </div>
                            ))}
                        </div>

                        <div style={{ backgroundColor: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 20, padding: 24, marginBottom: 20 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>⚠️ Experiencias pendientes de publicar</h3>
                                <button onClick={() => setTab("experiencias")} style={{ fontSize: 12, fontWeight: 600, color: COLORS.green, background: "none", border: "none", cursor: "pointer" }}>Ver todas →</button>
                            </div>
                            {experiences.filter((e) => !e.is_published).length === 0 ? (
                                <p style={{ fontSize: 14, color: "#bbb", margin: 0 }}>No hay experiencias pendientes.</p>
                            ) : experiences.filter((e) => !e.is_published).slice(0, 5).map((e) => (
                                <div key={e.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", backgroundColor: COLORS.bg, borderRadius: 12, border: `1px solid ${COLORS.border}`, marginBottom: 8 }}>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 600 }}>{e.title}</div>
                                        <div style={{ fontSize: 12, color: "#999" }}>{e.location} · {e.category}</div>
                                    </div>
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <a href={`/experiencias/${e.id}`} target="_blank" style={{ fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 8, border: `1px solid ${COLORS.border}`, color: "#555", textDecoration: "none" }}>Ver</a>
                                        <button onClick={() => handleToggle(e.id, "is_published", true)} disabled={loadingId === e.id} style={{ backgroundColor: COLORS.green, color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: loadingId === e.id ? 0.6 : 1 }}>
                                            {loadingId === e.id ? "..." : "Publicar"}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ backgroundColor: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 20, padding: 24, marginBottom: 20 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>📅 Últimas reservas</h3>
                                <button onClick={() => setTab("reservas")} style={{ fontSize: 12, fontWeight: 600, color: COLORS.green, background: "none", border: "none", cursor: "pointer" }}>Ver todas →</button>
                            </div>
                            {bookings.slice(0, 5).map((b) => {
                                const sc = statusColors[b.status] ?? { bg: "#f1f5f9", color: "#666", label: b.status };
                                return (
                                    <div key={b.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 600 }}>{b.user_name ?? b.user_id?.slice(0, 8) ?? "—"}</div>
                                            <div style={{ fontSize: 12, color: "#999" }}>{formatDate(b.created_at)}</div>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                            {b.total_price ? <span style={{ fontWeight: 700, color: COLORS.green }}>{formatARS(b.total_price)}</span> : null}
                                            <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 999, backgroundColor: sc.bg, color: sc.color }}>{sc.label}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div style={{ backgroundColor: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 20, padding: 24 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px" }}>⭐ Últimas reseñas</h3>
                            {reviews.slice(0, 5).map((r) => (
                                <div key={r.id} style={{ padding: "12px 16px", backgroundColor: COLORS.bg, borderRadius: 12, border: `1px solid ${COLORS.border}`, marginBottom: 8 }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                        <span style={{ fontSize: 13, fontWeight: 700 }}>{r.user_name}</span>
                                        <span style={{ color: COLORS.orange }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                                    </div>
                                    {r.comment && <p style={{ fontSize: 13, color: "#666", margin: "6px 0 0", lineHeight: 1.5 }}>{r.comment}</p>}
                                    <div style={{ fontSize: 11, color: "#bbb", marginTop: 4 }}>{formatDate(r.created_at)}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── USUARIOS ── */}
                {tab === "usuarios" && (
                    <div>
                        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16, marginTop: 0 }}>Gestión de usuarios</h2>
                        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
                            <input style={{ ...inp, minWidth: 220 }} placeholder="Buscar por nombre o email..." value={searchUser} onChange={(e) => setSearchUser(e.target.value)} />
                            <select style={{ ...inp, cursor: "pointer" }} value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                                <option value="all">Todos los roles</option>
                                <option value="user">Usuario</option>
                                <option value="provider">Proveedor</option>
                                <option value="admin">Admin</option>
                            </select>
                            <span style={{ fontSize: 13, color: "#888" }}>{filteredUsers.length} usuarios</span>
                        </div>
                        <div style={{ backgroundColor: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 20, overflow: "hidden" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                    <tr style={{ backgroundColor: COLORS.bg }}>
                                        {["Usuario", "Email", "Rol", "Registrado", "Cambiar rol", "Acciones"].map((h) => (
                                            <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `1px solid ${COLORS.border}` }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.length === 0 ? (
                                        <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: "#bbb", fontSize: 14 }}>No hay usuarios.</td></tr>
                                    ) : filteredUsers.map((u, i) => (
                                        <tr key={u.id} style={{ borderBottom: i < filteredUsers.length - 1 ? `1px solid ${COLORS.border}` : "none", opacity: u.suspended ? 0.5 : 1, backgroundColor: u.suspended ? "#fafafa" : "transparent" }}>
                                            <td style={{ padding: "14px 16px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                    <div style={{ width: 34, height: 34, borderRadius: "50%", backgroundColor: roleColors[u.role] ?? "#ccc", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                                                        {(u.full_name || u.email || "?")[0].toUpperCase()}
                                                    </div>
                                                    <div style={{ fontSize: 14, fontWeight: 600 }}>{u.full_name || "Sin nombre"}</div>
                                                </div>
                                            </td>
                                            <td style={{ padding: "14px 16px" }}><span style={{ fontSize: 13, color: "#555" }}>{u.email}</span></td>
                                            <td style={{ padding: "14px 16px" }}>
                                                <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 999, backgroundColor: u.role === "admin" ? "#EDE9FE" : u.role === "provider" ? "#DCFCE7" : "#F1F5F9", color: roleColors[u.role] ?? "#666" }}>{u.role}</span>
                                            </td>
                                            <td style={{ padding: "14px 16px" }}><span style={{ fontSize: 12, color: "#aaa" }}>{formatDate(u.created_at)}</span></td>
                                            <td style={{ padding: "14px 16px" }}>
                                                <select value={u.role} disabled={loadingId === u.id} onChange={(e) => handleSetRole(u.id, e.target.value)} style={{ ...inp, cursor: "pointer", opacity: loadingId === u.id ? 0.5 : 1 }}>
                                                    <option value="user">user</option>
                                                    <option value="provider">provider</option>
                                                    <option value="admin">admin</option>
                                                </select>
                                            </td>
                                            <td style={{ padding: "14px 16px" }}>
                                                <button onClick={() => confirm(`¿${u.suspended ? "Reactivar" : "Suspender"} a ${u.full_name || u.email}?`, () => {
                                                    setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, suspended: !x.suspended } : x));
                                                    showToast(u.suspended ? "Usuario reactivado ✓" : "Usuario suspendido ✓");
                                                    setConfirmModal(null);
                                                })} style={{ fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 8, border: "none", cursor: "pointer", backgroundColor: u.suspended ? "#DCFCE7" : "#FEF3C7", color: u.suspended ? COLORS.green : COLORS.orange }}>
                                                    {u.suspended ? "Reactivar" : "Suspender"}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ── EXPERIENCIAS ── */}
                {tab === "experiencias" && (
                    <div>
                        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16, marginTop: 0 }}>Gestión de experiencias</h2>
                        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
                            <input style={{ ...inp, minWidth: 220 }} placeholder="Buscar por título o ubicación..." value={searchExp} onChange={(e) => setSearchExp(e.target.value)} />
                            <select style={{ ...inp, cursor: "pointer" }} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                                <option value="all">Todas las categorías</option>
                                <option value="__published__">✓ Publicadas</option>
                                <option value="__draft__">Borradores</option>
                                <option value="__featured__">★ Destacadas</option>
                                {categories.map((c) => <option key={c!} value={c!}>{c}</option>)}
                            </select>
                            <span style={{ fontSize: 13, color: "#888" }}>{filteredExps.length} experiencias</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {filteredExps.length === 0 ? (
                                <div style={{ backgroundColor: "#fff", borderRadius: 16, padding: 48, textAlign: "center", border: `1px solid ${COLORS.border}` }}><p style={{ color: "#bbb" }}>No hay experiencias.</p></div>
                            ) : filteredExps.map((e) => (
                                <div key={e.id} style={{ backgroundColor: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, opacity: e.is_published ? 1 : 0.8 }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                            <span style={{ fontSize: 15, fontWeight: 700 }}>{e.title}</span>
                                            {e.is_featured && <span style={{ fontSize: 11, fontWeight: 700, backgroundColor: "#FEF3C7", color: COLORS.orange, padding: "2px 8px", borderRadius: 999 }}>★ Destacada</span>}
                                            {!e.is_published && <span style={{ fontSize: 11, fontWeight: 700, backgroundColor: "#FEE2E2", color: COLORS.red, padding: "2px 8px", borderRadius: 999 }}>Borrador</span>}
                                        </div>
                                        <div style={{ fontSize: 12, color: "#999", marginTop: 3 }}>📍 {e.location} · {e.category} · {e.price_from ? `${formatARS(Number(e.price_from))}/persona` : "Sin precio"}</div>
                                        <div style={{ fontSize: 11, color: "#bbb", marginTop: 2 }}>Creada: {formatDate(e.created_at)}</div>
                                    </div>
                                    <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
                                        <button onClick={() => handleToggle(e.id, "is_published", !e.is_published)} disabled={loadingId === e.id} style={{ fontSize: 12, fontWeight: 700, padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", opacity: loadingId === e.id ? 0.5 : 1, backgroundColor: e.is_published ? "#FEE2E2" : "#DCFCE7", color: e.is_published ? COLORS.red : COLORS.green }}>
                                            {loadingId === e.id ? "..." : e.is_published ? "Despublicar" : "Publicar"}
                                        </button>
                                        <button onClick={() => handleToggle(e.id, "is_featured", !e.is_featured)} disabled={loadingId === e.id} style={{ fontSize: 12, fontWeight: 700, padding: "7px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`, cursor: "pointer", opacity: loadingId === e.id ? 0.5 : 1, backgroundColor: e.is_featured ? "#FEF3C7" : "#fff", color: e.is_featured ? COLORS.orange : "#666" }}>
                                            {e.is_featured ? "★ Quitar" : "☆ Destacar"}
                                        </button>
                                        <a href={`/experiencias/${e.id}`} target="_blank" style={{ fontSize: 12, fontWeight: 600, padding: "7px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`, color: "#555", textDecoration: "none", display: "flex", alignItems: "center" }}>Ver →</a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── RESERVAS ── */}
                {tab === "reservas" && (
                    <div>
                        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16, marginTop: 0 }}>Todas las reservas</h2>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 20 }}>
                            {Object.entries(statusColors).map(([status, sc]) => (
                                <div key={status} style={{ backgroundColor: "#fff", borderRadius: 14, padding: "14px 18px", border: `1px solid ${COLORS.border}` }}>
                                    <div style={{ fontSize: 24, fontWeight: 800, color: sc.color }}>{bookings.filter((b) => b.status === status).length}</div>
                                    <div style={{ fontSize: 12, color: "#888" }}>{sc.label}</div>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
                            {["all", "confirmed", "pending", "completed", "cancelled"].map((s) => (
                                <button key={s} onClick={() => setFilterStatus(s)} style={{ fontSize: 12, fontWeight: 600, padding: "7px 14px", borderRadius: 8, border: filterStatus === s ? "none" : `1px solid ${COLORS.border}`, cursor: "pointer", backgroundColor: filterStatus === s ? COLORS.green : "#fff", color: filterStatus === s ? "#fff" : "#555" }}>
                                    {s === "all" ? "Todas" : statusColors[s]?.label ?? s}
                                </button>
                            ))}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {filteredBookings.length === 0 ? (
                                <div style={{ backgroundColor: "#fff", borderRadius: 16, padding: 48, textAlign: "center", border: `1px solid ${COLORS.border}` }}><p style={{ color: "#bbb" }}>No hay reservas.</p></div>
                            ) : filteredBookings.map((b) => {
                                const sc = statusColors[b.status] ?? { bg: "#f1f5f9", color: "#666", label: b.status };
                                return (
                                    <div key={b.id} style={{ backgroundColor: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                                                <span style={{ fontFamily: "monospace", fontSize: 12, color: "#aaa" }}>#{b.id.slice(0, 8).toUpperCase()}</span>
                                                <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 10px", borderRadius: 999, backgroundColor: sc.bg, color: sc.color }}>{sc.label}</span>
                                            </div>
                                            <div style={{ fontSize: 14, fontWeight: 600 }}>{b.user_name ?? "Usuario"}</div>
                                            <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>👥 {b.people ?? 1} persona{(b.people ?? 1) !== 1 ? "s" : ""} · 📅 {formatDate(b.created_at)}</div>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                                            {b.total_price ? <span style={{ fontWeight: 800, fontSize: 16, color: COLORS.green }}>{formatARS(b.total_price)}</span> : null}
                                            {b.status !== "cancelled" && b.status !== "completed" && (
                                                <button onClick={() => handleCancelBooking(b.id)} disabled={loadingId === b.id} style={{ fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer", backgroundColor: "#FEE2E2", color: COLORS.red, opacity: loadingId === b.id ? 0.5 : 1 }}>
                                                    {loadingId === b.id ? "..." : "Cancelar"}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── RESEÑAS ── */}
                {tab === "reseñas" && (
                    <div>
                        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16, marginTop: 0 }}>Moderación de reseñas</h2>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 20 }}>
                            {[5, 4, 3, 2, 1].map((star) => {
                                const count = reviews.filter((r) => r.rating === star).length;
                                const pct = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
                                return (
                                    <div key={star} style={{ backgroundColor: "#fff", borderRadius: 14, padding: "14px 16px", border: `1px solid ${COLORS.border}`, textAlign: "center" }}>
                                        <div style={{ fontSize: 16, color: COLORS.orange }}>{"★".repeat(star)}</div>
                                        <div style={{ fontSize: 24, fontWeight: 800, color: "#333" }}>{count}</div>
                                        <div style={{ fontSize: 12, color: "#aaa" }}>{pct}%</div>
                                    </div>
                                );
                            })}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {reviews.length === 0 ? (
                                <div style={{ backgroundColor: "#fff", borderRadius: 16, padding: 48, textAlign: "center", border: `1px solid ${COLORS.border}` }}><p style={{ color: "#bbb" }}>Sin reseñas aún.</p></div>
                            ) : reviews.map((r) => (
                                <div key={r.id} style={{ backgroundColor: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: "16px 20px" }}>
                                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                                                <span style={{ fontWeight: 700, fontSize: 14 }}>{r.user_name}</span>
                                                <span style={{ color: COLORS.orange }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                                                <span style={{ fontSize: 11, color: "#bbb" }}>{formatDate(r.created_at)}</span>
                                            </div>
                                            {r.comment && <p style={{ fontSize: 13, color: "#555", margin: 0, lineHeight: 1.6 }}>{r.comment}</p>}
                                        </div>
                                        <button onClick={() => handleDeleteReview(r.id)} disabled={loadingId === r.id} style={{ fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer", backgroundColor: "#FEE2E2", color: COLORS.red, flexShrink: 0, opacity: loadingId === r.id ? 0.5 : 1 }}>
                                            {loadingId === r.id ? "..." : "Eliminar"}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── FINANZAS ── */}
                {tab === "finanzas" && (
                    <div>
                        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20, marginTop: 0 }}>Resumen financiero</h2>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14, marginBottom: 28 }}>
                            {[
                                { label: "Ingresos totales", value: formatARS(totalRevenue), icon: "💰", color: COLORS.green, sub: "Confirmadas + completadas" },
                                { label: "Reservas activas", value: bookings.filter((b) => b.status === "confirmed").length, icon: "✅", color: COLORS.green, sub: "Estado: confirmada" },
                                { label: "Completadas", value: bookings.filter((b) => b.status === "completed").length, icon: "🏁", color: "#0891B2", sub: "Estado: completada" },
                                { label: "Canceladas", value: bookings.filter((b) => b.status === "cancelled").length, icon: "❌", color: COLORS.red, sub: "Estado: cancelada" },
                                { label: "Ticket promedio", value: bookings.filter((b) => b.total_price && (b.status === "confirmed" || b.status === "completed")).length > 0 ? formatARS(totalRevenue / bookings.filter((b) => b.total_price && (b.status === "confirmed" || b.status === "completed")).length) : "—", icon: "🎫", color: COLORS.orange, sub: "Por reserva activa" },
                            ].map((s) => (
                                <div key={s.label} style={{ backgroundColor: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 20, padding: "20px 22px" }}>
                                    <div style={{ fontSize: 26, marginBottom: 4 }}>{s.icon}</div>
                                    <div style={{ fontSize: typeof s.value === "string" ? 18 : 34, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: "#333", marginTop: 4 }}>{s.label}</div>
                                    <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>{s.sub}</div>
                                </div>
                            ))}
                        </div>
                        <div style={{ backgroundColor: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 20, overflow: "hidden" }}>
                            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${COLORS.border}`, fontWeight: 700, fontSize: 15 }}>Detalle por reserva</div>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                    <tr style={{ backgroundColor: COLORS.bg }}>
                                        {["Reserva", "Usuario", "Personas", "Monto", "Estado", "Fecha"].map((h) => (
                                            <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `1px solid ${COLORS.border}` }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {bookings.filter((b) => b.total_price).length === 0 ? (
                                        <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: "#bbb", fontSize: 14 }}>Sin datos de ingresos aún.</td></tr>
                                    ) : bookings.filter((b) => b.total_price).map((b, i) => {
                                        const sc = statusColors[b.status] ?? { bg: "#f1f5f9", color: "#666", label: b.status };
                                        return (
                                            <tr key={b.id} style={{ borderBottom: i < bookings.length - 1 ? `1px solid ${COLORS.border}` : "none" }}>
                                                <td style={{ padding: "12px 16px" }}><span style={{ fontFamily: "monospace", fontSize: 12, color: "#aaa" }}>#{b.id.slice(0, 8).toUpperCase()}</span></td>
                                                <td style={{ padding: "12px 16px" }}><span style={{ fontSize: 13 }}>{b.user_name ?? "—"}</span></td>
                                                <td style={{ padding: "12px 16px" }}><span style={{ fontSize: 13 }}>{b.people ?? 1}</span></td>
                                                <td style={{ padding: "12px 16px" }}><span style={{ fontSize: 13, fontWeight: 700, color: COLORS.green }}>{formatARS(b.total_price ?? 0)}</span></td>
                                                <td style={{ padding: "12px 16px" }}><span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 999, backgroundColor: sc.bg, color: sc.color }}>{sc.label}</span></td>
                                                <td style={{ padding: "12px 16px" }}><span style={{ fontSize: 12, color: "#aaa" }}>{formatDate(b.created_at)}</span></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}