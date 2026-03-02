"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client-browser";

const COLORS = { green: "#4E6B3A", orange: "#D07A2D", border: "#e7e2da" };

const ROLE_CONFIG = {
    admin: { label: "Administrador", bg: "#6B4FBB", icon: "⚙️", badge: "ADMIN" },
    provider: { label: "Proveedor", bg: "#D07A2D", icon: "🗺️", badge: "PROVEEDOR" },
    user: { label: "Usuario", bg: "#4E6B3A", icon: "👤", badge: "USUARIO" },
};

export default function HeaderAuth() {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [ready, setReady] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const sb = createClient();

        async function loadProfile(userId: string) {
            const { data } = await sb.from("profiles").select("full_name,role,avatar_url").eq("id", userId).single();
            setProfile(data);
        }

        // onAuthStateChange dispara INITIAL_SESSION al montar — cubre navegación entre páginas
        const { data: { subscription } } = sb.auth.onAuthStateChange((_event: any, session: any) => {
            if (session?.user) {
                setUser(session.user);
                loadProfile(session.user.id);
            } else {
                setUser(null);
                setProfile(null);
            }
            setReady(true);
        });

        return () => subscription.unsubscribe();
    }, []);

    async function logout() {
        await createClient().auth.signOut();
        window.location.href = "/";
    }

    if (!ready) return <div style={{ width: 80, height: 36 }} />;

    if (!user) return (
        <a href="/auth/login" style={{
            background: COLORS.green, color: "#fff", borderRadius: 12,
            padding: "8px 18px", fontSize: 13, fontWeight: 700, textDecoration: "none"
        }}>Iniciar sesión</a>
    );

    const name = profile?.full_name || user.email?.split("@")[0] || "Usuario";
    const initials = name.slice(0, 2).toUpperCase();
    const role = (profile?.role ?? "user") as keyof typeof ROLE_CONFIG;
    const rc = ROLE_CONFIG[role] ?? ROLE_CONFIG.user;

    return (
        <div style={{ position: "relative" }}>
            <button onClick={() => setOpen(!open)} style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "#fff", border: `1px solid ${COLORS.border}`,
                borderRadius: 999, padding: "5px 12px 5px 5px",
                cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.06)"
            }}>
                <Avatar src={profile?.avatar_url} initials={initials} bg={rc.bg} size={30} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "#444", maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
                <span style={{ fontSize: 9, fontWeight: 800, background: rc.bg, color: "#fff", borderRadius: 999, padding: "2px 7px", textTransform: "uppercase" as const }}>{rc.badge}</span>
                <span style={{ fontSize: 10, color: "#bbb" }}>{open ? "▲" : "▼"}</span>
            </button>

            {open && (
                <>
                    <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 99 }} />
                    <div style={{
                        position: "absolute", top: "calc(100% + 10px)", right: 0,
                        background: "#fff", borderRadius: 18, padding: 8,
                        border: `1px solid ${COLORS.border}`,
                        boxShadow: "0 12px 32px rgba(0,0,0,0.12)", minWidth: 230, zIndex: 100
                    }}>
                        <div style={{ padding: "10px 14px 12px", display: "flex", alignItems: "center", gap: 10 }}>
                            <Avatar src={profile?.avatar_url} initials={initials} bg={rc.bg} size={44} />
                            <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 14, fontWeight: 800, color: "#222" }}>{name}</div>
                                <div style={{ fontSize: 11, color: "#aaa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 5, background: rc.bg, borderRadius: 999, padding: "2px 9px" }}>
                                    <span style={{ fontSize: 10 }}>{rc.icon}</span>
                                    <span style={{ fontSize: 10, fontWeight: 800, color: "#fff" }}>{rc.label}</span>
                                </span>
                            </div>
                        </div>

                        <hr style={{ border: "none", borderTop: `1px solid ${COLORS.border}`, margin: "0 4px 4px" }} />

                        <Item href="/perfil" icon="👤" label="Mi perfil" close={() => setOpen(false)} />
                        <Item href="/mis-reservas" icon="🎫" label="Mis reservas" close={() => setOpen(false)} />

                        {(role === "provider" || role === "admin") && <>
                            <hr style={{ border: "none", borderTop: `1px solid ${COLORS.border}`, margin: "4px" }} />
                            <div style={{ padding: "4px 12px 2px", fontSize: 10, fontWeight: 700, color: "#bbb", textTransform: "uppercase" as const, letterSpacing: 0.5 }}>Proveedor</div>
                            <Item href="/proveedor" icon="🗺️" label="Panel proveedor" close={() => setOpen(false)} color={COLORS.orange} />
                        </>}

                        {role === "admin" && <>
                            <hr style={{ border: "none", borderTop: `1px solid ${COLORS.border}`, margin: "4px" }} />
                            <div style={{ padding: "4px 12px 2px", fontSize: 10, fontWeight: 700, color: "#bbb", textTransform: "uppercase" as const, letterSpacing: 0.5 }}>Admin</div>
                            <Item href="/admin" icon="⚙️" label="Panel admin" close={() => setOpen(false)} color="#6B4FBB" />
                        </>}

                        <hr style={{ border: "none", borderTop: `1px solid ${COLORS.border}`, margin: "4px 4px 0" }} />
                        <button onClick={logout} style={{
                            display: "flex", alignItems: "center", gap: 8, width: "100%",
                            padding: "9px 12px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                            color: "#c0392b", background: "none", border: "none", cursor: "pointer"
                        }}
                            onMouseEnter={e => (e.currentTarget.style.background = "#fdecea")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        >🚪 Cerrar sesión</button>
                    </div>
                </>
            )}
        </div>
    );
}

function Avatar({ src, initials, bg, size }: { src?: string | null, initials: string, bg: string, size: number }) {
    return (
        <div style={{
            width: size, height: size, borderRadius: "50%", background: bg, color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: size * 0.36, fontWeight: 800, overflow: "hidden", flexShrink: 0
        }}>
            {src ? <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
        </div>
    );
}

function Item({ href, icon, label, close, color }: { href: string, icon: string, label: string, close: () => void, color?: string }) {
    return (
        <a href={href} onClick={close} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "9px 12px",
            borderRadius: 10, fontSize: 13, fontWeight: 600,
            color: color ?? "#444", textDecoration: "none"
        }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f5f3f0")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
            <span>{icon}</span>{label}
        </a>
    );
}