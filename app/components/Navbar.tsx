"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import HeaderAuth from "@/app/components/HeaderAuth";

const COLORS = {
    green: "#4E6B3A",
    orange: "#D07A2D",
    border: "#e7e2da",
};

const HIDDEN_ROUTES = ["/admin", "/auth"];

export default function Navbar() {
    const pathname = usePathname();

    if (HIDDEN_ROUTES.some((r) => pathname?.startsWith(r))) return null;

    return (
        <header
            style={{
                position: "sticky",
                top: 0,
                zIndex: 50,
                backgroundColor: "rgba(243,238,230,0.95)",
                backdropFilter: "blur(10px)",
                borderBottom: `1px solid ${COLORS.border}`,
            }}
        >
            <div
                style={{
                    maxWidth: 1200,
                    margin: "0 auto",
                    padding: "0 24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    height: 52,
                }}
            >
                {/* Logo */}
                <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
                        🏔️
                    </div>
                    <div style={{ lineHeight: 1.2 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.green }}>Experiencia</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.orange }}>LA RIOJA</div>
                    </div>
                </Link>

                {/* Nav links */}
                <nav style={{ display: "flex", alignItems: "center", gap: 24 }}>
                    <Link href="/" style={{ fontSize: 13, fontWeight: 500, color: "#555", textDecoration: "none" }}>Inicio</Link>
                    <Link href="/experiencias" style={{ fontSize: 13, fontWeight: 500, color: "#555", textDecoration: "none" }}>Experiencias</Link>
                    <a href="/#categorias" style={{ fontSize: 13, fontWeight: 500, color: "#555", textDecoration: "none" }}>Categorías</a>
                    <Link href="/ayuda" style={{ fontSize: 13, fontWeight: 500, color: "#555", textDecoration: "none" }}>Ayuda</Link>
                </nav>

                {/* Auth + CTA */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <HeaderAuth />
                    <Link
                        href="/proveedor/registro"
                        style={{
                            backgroundColor: COLORS.orange,
                            color: "#fff",
                            borderRadius: 999,
                            padding: "6px 14px",
                            fontSize: 12,
                            fontWeight: 700,
                            textDecoration: "none",
                            whiteSpace: "nowrap",
                        }}
                    >
                        Ofrecer experiencia
                    </Link>
                </div>
            </div>
        </header>
    );
}