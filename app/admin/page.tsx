"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client-browser";
import AdminClient from "./AdminClient";

export default function AdminPage() {
    const [ready, setReady] = useState(false);
    const [denied, setDenied] = useState(false);
    const [data, setData] = useState<any>(null);
    const supabase = createClient();

    useEffect(() => {
        load();
    }, []);

    async function load() {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            window.location.href = "/";
            return;
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();

        if (profile?.role !== "admin") {
            setDenied(true);
            return;
        }

        // Cargar datos via API route
        const res = await fetch("/api/admin/data");
        if (!res.ok) {
            setDenied(true);
            return;
        }
        const json = await res.json();
        setData(json);
        setReady(true);
    }

    if (denied) {
        return (
            <div style={{ minHeight: "100vh", backgroundColor: "#F3EEE6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ backgroundColor: "#fdecea", borderRadius: 16, padding: 32, textAlign: "center" }}>
                    <p style={{ color: "#c0392b", fontWeight: 700, fontSize: 16 }}>Sin permisos de administrador</p>
                    <a href="/" style={{ display: "block", marginTop: 12, color: "#4E6B3A", fontSize: 14 }}>Volver al inicio</a>
                </div>
            </div>
        );
    }

    if (!ready) {
        return (
            <div style={{ minHeight: "100vh", backgroundColor: "#F3EEE6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <p style={{ color: "#888" }}>Cargando panel admin...</p>
            </div>
        );
    }

    return (
        <AdminClient
            stats={data.stats}
            users={data.users}
            experiences={data.experiences}
            bookings={data.bookings}
            reviews={data.reviews}
        />
    );
}