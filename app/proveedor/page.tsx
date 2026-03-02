"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client-browser";
import HeaderAuth from "@/app/components/HeaderAuth";
import { localidades } from "@/app/lib/localidades-larioja";
import MPConnectSection from "@/app/components/MPConnectSection";

const COLORS = {
    green: "#4E6B3A",
    orange: "#D07A2D",
    bg: "#F3EEE6",
    border: "#e7e2da",
};

const categories = [
    { id: "aventura", label: "Aventura" },
    { id: "naturaleza", label: "Naturaleza" },
    { id: "bienestar", label: "Bienestar" },
    { id: "urbano", label: "Urbano" },
    { id: "sabores", label: "Sabores" },
    { id: "cultura", label: "Cultura" },
];

const formatARS = (n: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

const formatDate = (d: string) =>
    new Date(d + "T12:00:00").toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });

type Experience = {
    id: string; title: string; description: string; location: string;
    price_from: number; duration_minutes: number; category: string;
    is_published: boolean; cover_image_url: string | null;
    gallery_urls: string[] | null; video_url: string | null;
    meeting_point_address: string | null;
    meeting_point_lat: number | null;
    meeting_point_lng: number | null;
};

type Slot = {
    id: string; experience_id: string; date: string;
    time: string; capacity: number; booked_count: number;
};

type Booking = {
    id: string; user_name: string; user_email: string;
    people: number; total_price: number; status: string; created_at: string;
    slot: { date: string; time: string } | null;
    experience: { title: string } | null;
};

type Tab = "experiencias" | "slots" | "reservas";

function LocationPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const [input, setInput] = useState(value);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => { setInput(value); }, [value]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleInput = (val: string) => {
        setInput(val);
        onChange(val);
        if (!val.trim()) { setSuggestions([]); setOpen(false); return; }
        const q = val.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const matches = localidades.filter((l) =>
            l.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(q)
        );
        setSuggestions(matches);
        setOpen(true);
    };

    const handleSelect = (loc: string) => {
        setInput(loc);
        onChange(loc);
        setSuggestions([]);
        setOpen(false);
    };

    const isValid = localidades.includes(input);

    return (
        <div ref={ref} style={{ position: "relative" }}>
            <div style={{ position: "relative" }}>
                <input
                    value={input}
                    onChange={(e) => handleInput(e.target.value)}
                    onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
                    placeholder="Ej: Chilecito, Anillaco..."
                    autoComplete="off"
                    style={{
                        width: "100%", boxSizing: "border-box" as const,
                        borderRadius: 12,
                        border: `1px solid ${isValid ? COLORS.green : COLORS.border}`,
                        padding: "10px 36px 10px 14px",
                        fontSize: 14, backgroundColor: "#fff", outline: "none", marginTop: 4,
                    }}
                />
                {input && (
                    <button type="button" onClick={() => { setInput(""); onChange(""); setSuggestions([]); }}
                        style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#bbb", fontSize: 18, padding: 0 }}>
                        ×
                    </button>
                )}
            </div>

            {open && (
                <div style={{
                    position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 9999,
                    backgroundColor: "#fff", border: `1px solid ${COLORS.border}`,
                    borderRadius: 14, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                    maxHeight: 220, overflowY: "auto",
                }}>
                    {suggestions.length > 0 ? suggestions.map((loc) => (
                        <button key={loc} type="button" onClick={() => handleSelect(loc)}
                            style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 14px", background: "none", border: "none", borderBottom: `1px solid #f0ece6`, cursor: "pointer", fontSize: 13, color: "#333" }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f5f0ea")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                            📍 {loc}
                        </button>
                    )) : (
                        <div style={{ padding: "12px 14px", fontSize: 13, color: "#888" }}>
                            "{input}" no está en la lista — se guardará igual
                        </div>
                    )}
                </div>
            )}

            {isValid && (
                <div style={{ fontSize: 11, color: COLORS.green, marginTop: 4, fontWeight: 600 }}>
                    ✓ Localidad reconocida — aparecerá en el buscador
                </div>
            )}
        </div>
    );
}

function MeetingPointPicker({ lat, lng, onMove }: { lat: number; lng: number; onMove: (lat: number, lng: number) => void }) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markerRef = useRef<any>(null);

    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);

        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.onload = () => {
            const L = (window as any).L;
            const map = L.map(mapRef.current).setView([lat, lng], 14);
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: "© OpenStreetMap"
            }).addTo(map);

            const icon = L.divIcon({
                html: `<div style="background:${COLORS.green};width:22px;height:22px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
                iconSize: [22, 22], iconAnchor: [11, 11], className: ""
            });

            const marker = L.marker([lat, lng], { draggable: true, icon }).addTo(map);
            marker.on("dragend", (e: any) => {
                const pos = e.target.getLatLng();
                onMove(pos.lat, pos.lng);
            });

            mapInstanceRef.current = map;
            markerRef.current = marker;
        };
        document.head.appendChild(script);

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
                markerRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (markerRef.current && mapInstanceRef.current) {
            markerRef.current.setLatLng([lat, lng]);
            mapInstanceRef.current.setView([lat, lng], mapInstanceRef.current.getZoom());
        }
    }, [lat, lng]);

    return (
        <div ref={mapRef} style={{ width: "100%", height: 260, borderRadius: 14, overflow: "hidden", border: `1px solid ${COLORS.border}`, marginTop: 8 }} />
    );
}

export default function ProveedorPanel() {
    const [tab, setTab] = useState<Tab>("experiencias");
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [experiences, setExperiences] = useState<Experience[]>([]);
    const [slots, setSlots] = useState<Slot[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [showExpForm, setShowExpForm] = useState(false);
    const [expForm, setExpForm] = useState({
        title: "", description: "", location: "", price_from: "",
        duration_minutes: "", category: "aventura", video_url: "",
        meeting_point_address: "",
    });
    const [expLoading, setExpLoading] = useState(false);
    const [editingExp, setEditingExp] = useState<Experience | null>(null);
    const [uploadingCover, setUploadingCover] = useState(false);
    const [uploadingGallery, setUploadingGallery] = useState(false);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
    const coverRef = useRef<HTMLInputElement>(null);
    const galleryRef = useRef<HTMLInputElement>(null);

    const [mapLat, setMapLat] = useState(-29.4);
    const [mapLng, setMapLng] = useState(-66.85);
    const [showMap, setShowMap] = useState(false);
    const [geocoding, setGeocoding] = useState(false);

    const [showSlotForm, setShowSlotForm] = useState(false);
    const [slotForm, setSlotForm] = useState({ experience_id: "", date: "", time: "", capacity: "10" });
    const [slotLoading, setSlotLoading] = useState(false);
    const [slotFilter, setSlotFilter] = useState<string>("all");

    const supabase = createClient();

    useEffect(() => { loadAll(); }, []);

    async function loadAll() {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { window.location.href = "/auth/login"; return; }
        setUser(user);
        const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        setProfile(prof);
        if (prof?.role !== "provider" && prof?.role !== "admin") {
            setError("No tenés permisos de proveedor. Contactá al administrador.");
            setLoading(false);
            return;
        }
        await Promise.all([loadExperiences(user.id), loadBookings(user.id)]);
        setLoading(false);
    }

    async function loadExperiences(userId: string) {
        const { data } = await supabase.from("experiences").select("*").eq("provider_id", userId).order("created_at", { ascending: false });
        setExperiences(data ?? []);
        if (data && data.length > 0) {
            const ids = data.map((e: Experience) => e.id);
            const { data: slotsData } = await supabase.from("availability_slots").select("*").in("experience_id", ids).order("date", { ascending: true }).order("time", { ascending: true });
            setSlots(slotsData ?? []);
        }
    }

    async function loadBookings(userId: string) {
        const { data: exps } = await supabase.from("experiences").select("id").eq("provider_id", userId);
        if (!exps || exps.length === 0) { setBookings([]); return; }
        const { data } = await supabase.from("bookings")
            .select("id, user_name, user_email, people, total_price, status, created_at, slot:slot_id(date, time), experience:experience_id(title)")
            .in("experience_id", exps.map((e: any) => e.id))
            .order("created_at", { ascending: false });
        setBookings((data as any) ?? []);
    }

    async function uploadFile(file: File, path: string): Promise<string | null> {
        const { data, error } = await supabase.storage.from("experiences").upload(path, file, { upsert: true });
        if (error) { alert("Error subiendo archivo: " + error.message); return null; }
        return supabase.storage.from("experiences").getPublicUrl(data.path).data.publicUrl;
    }

    async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingCover(true);
        const url = await uploadFile(file, `covers/${user.id}/${Date.now()}-${file.name}`);
        if (url) setCoverPreview(url);
        setUploadingCover(false);
    }

    async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files ?? []);
        if (!files.length) return;
        setUploadingGallery(true);
        const urls: string[] = [];
        for (const file of files) {
            const url = await uploadFile(file, `gallery/${user.id}/${Date.now()}-${file.name}`);
            if (url) urls.push(url);
        }
        setGalleryPreviews((prev) => [...prev, ...urls]);
        setUploadingGallery(false);
    }

    async function geocodeAddress() {
        if (!expForm.meeting_point_address.trim()) return;
        setGeocoding(true);
        try {
            const q = encodeURIComponent(expForm.meeting_point_address + ", La Rioja, Argentina");
            const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`);
            const data = await res.json();
            if (data && data.length > 0) {
                setMapLat(parseFloat(data[0].lat));
                setMapLng(parseFloat(data[0].lon));
                setShowMap(true);
            } else {
                alert("No se encontró la dirección. Podés mover el pin manualmente.");
                setShowMap(true);
            }
        } catch {
            alert("Error buscando la dirección. Podés mover el pin manualmente.");
            setShowMap(true);
        }
        setGeocoding(false);
    }

    async function handleSaveExp() {
        if (!expForm.title || !expForm.location || !expForm.price_from) return;
        setExpLoading(true);
        const payload: any = {
            title: expForm.title, description: expForm.description,
            location: expForm.location, price_from: Number(expForm.price_from),
            duration_minutes: Number(expForm.duration_minutes) || null,
            category: expForm.category, provider_id: user.id,
            is_published: editingExp?.is_published ?? false,
            video_url: expForm.video_url || null,
            cover_image_url: coverPreview || null,
            gallery_urls: galleryPreviews.length > 0 ? galleryPreviews : [],
            meeting_point_address: expForm.meeting_point_address || null,
            meeting_point_lat: showMap ? mapLat : null,
            meeting_point_lng: showMap ? mapLng : null,
        };
        if (editingExp) {
            await supabase.from("experiences").update(payload).eq("id", editingExp.id);
        } else {
            await supabase.from("experiences").insert(payload);
        }
        resetExpForm();
        await loadExperiences(user.id);
        setExpLoading(false);
    }

    function resetExpForm() {
        setExpForm({ title: "", description: "", location: "", price_from: "", duration_minutes: "", category: "aventura", video_url: "", meeting_point_address: "" });
        setCoverPreview(null); setGalleryPreviews([]);
        setShowExpForm(false); setEditingExp(null);
        setShowMap(false); setMapLat(-29.4); setMapLng(-66.85);
    }

    function startEditExp(exp: Experience) {
        setExpForm({
            title: exp.title, description: exp.description ?? "",
            location: exp.location ?? "", price_from: String(exp.price_from),
            duration_minutes: String(exp.duration_minutes ?? ""),
            category: exp.category ?? "aventura", video_url: exp.video_url ?? "",
            meeting_point_address: exp.meeting_point_address ?? "",
        });
        setCoverPreview(exp.cover_image_url ?? null);
        setGalleryPreviews(exp.gallery_urls ?? []);
        if (exp.meeting_point_lat && exp.meeting_point_lng) {
            setMapLat(exp.meeting_point_lat);
            setMapLng(exp.meeting_point_lng);
            setShowMap(true);
        } else {
            setShowMap(false);
        }
        setEditingExp(exp); setShowExpForm(true); setTab("experiencias");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    async function handleTogglePublish(exp: Experience) {
        await supabase.from("experiences").update({ is_published: !exp.is_published }).eq("id", exp.id);
        await loadExperiences(user.id);
    }

    async function handleDeleteExp(id: string) {
        if (!confirm("¿Seguro que querés eliminar esta experiencia?")) return;
        await supabase.from("experiences").delete().eq("id", id);
        await loadExperiences(user.id);
    }

    async function handleSaveSlot() {
        if (!slotForm.experience_id || !slotForm.date || !slotForm.time) return;
        setSlotLoading(true);
        await supabase.from("availability_slots").insert({ experience_id: slotForm.experience_id, date: slotForm.date, time: slotForm.time, capacity: Number(slotForm.capacity), booked_count: 0 });
        setSlotForm({ ...slotForm, date: "", time: "" });
        await loadExperiences(user.id);
        setSlotLoading(false);
    }

    async function handleDeleteSlot(id: string) {
        await supabase.from("availability_slots").delete().eq("id", id);
        await loadExperiences(user.id);
    }

    const inp: React.CSSProperties = { width: "100%", boxSizing: "border-box", borderRadius: 12, border: `1px solid ${COLORS.border}`, padding: "10px 14px", fontSize: 14, backgroundColor: "#fff", outline: "none", marginTop: 4 };
    const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "#777", display: "block" };
    const filteredSlots = slotFilter === "all" ? slots : slots.filter((s) => s.experience_id === slotFilter);

    if (loading) return <div style={{ minHeight: "100vh", backgroundColor: COLORS.bg, display: "flex", alignItems: "center", justifyContent: "center" }}><p style={{ color: "#888" }}>Cargando panel...</p></div>;
    if (error) return <div style={{ minHeight: "100vh", backgroundColor: COLORS.bg, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ backgroundColor: "#fdecea", borderRadius: 16, padding: 28, textAlign: "center" }}><p style={{ color: "#c0392b", fontWeight: 600 }}>{error}</p><a href="/" style={{ color: COLORS.green, fontSize: 14, display: "block", marginTop: 12 }}>Volver al inicio</a></div></div>;

    return (
        <div style={{ minHeight: "100vh", backgroundColor: COLORS.bg }}>
            <header style={{ backgroundColor: "rgba(243,238,230,0.95)", backdropFilter: "blur(8px)", borderBottom: `1px solid ${COLORS.border}`, padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <a href="/" style={{ textDecoration: "none" }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.green }}>Experiencia </span>
                        <span style={{ fontSize: 15, fontWeight: 800, color: COLORS.orange }}>LA RIOJA</span>
                    </a>
                    <span style={{ color: "#ccc" }}>|</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#555" }}>Panel Proveedor</span>
                </div>
                <HeaderAuth />
            </header>

            <div style={{ maxWidth: 960, margin: "0 auto", padding: "28px 24px" }}>

                {/* ── MERCADO PAGO ── */}
                <MPConnectSection />

                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
                    {[
                        { label: "Experiencias", value: experiences.length, color: COLORS.green, icon: "🗺️" },
                        { label: "Turnos activos", value: slots.filter((s) => new Date(s.date) >= new Date()).length, color: COLORS.orange, icon: "📅" },
                        { label: "Reservas totales", value: bookings.length, color: "#6B8FB5", icon: "🎫" },
                    ].map((stat) => (
                        <div key={stat.label} style={{ backgroundColor: "#fff", borderRadius: 18, padding: "18px 22px", border: `1px solid ${COLORS.border}` }}>
                            <div style={{ fontSize: 24, marginBottom: 6 }}>{stat.icon}</div>
                            <div style={{ fontSize: 30, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                            <div style={{ fontSize: 13, color: "#888" }}>{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div style={{ display: "flex", gap: 6, marginBottom: 24, backgroundColor: "#fff", borderRadius: 16, padding: 6, border: `1px solid ${COLORS.border}`, width: "fit-content" }}>
                    {([{ key: "experiencias", label: "🗺️ Experiencias" }, { key: "slots", label: "📅 Disponibilidad" }, { key: "reservas", label: "🎫 Reservas" }] as { key: Tab; label: string }[]).map((t) => (
                        <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: "9px 20px", borderRadius: 12, border: "none", backgroundColor: tab === t.key ? COLORS.green : "transparent", color: tab === t.key ? "#fff" : "#666", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* ===== EXPERIENCIAS ===== */}
                {tab === "experiencias" && (
                    <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Mis experiencias</h2>
                            <button onClick={() => { resetExpForm(); setShowExpForm(!showExpForm); }} style={{ backgroundColor: showExpForm ? "#eee" : COLORS.green, color: showExpForm ? "#555" : "#fff", border: "none", borderRadius: 12, padding: "9px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                                {showExpForm ? "✕ Cancelar" : "+ Nueva experiencia"}
                            </button>
                        </div>

                        {showExpForm && (
                            <div style={{ backgroundColor: "#fff", borderRadius: 24, padding: 28, border: `1px solid ${COLORS.border}`, marginBottom: 24 }}>
                                <h3 style={{ margin: "0 0 20px", fontSize: 17, fontWeight: 800 }}>{editingExp ? "✏️ Editar experiencia" : "✨ Nueva experiencia"}</h3>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                                    <div style={{ gridColumn: "1 / -1" }}>
                                        <label style={lbl}>Título *</label>
                                        <input style={inp} value={expForm.title} onChange={(e) => setExpForm({ ...expForm, title: e.target.value })} placeholder="Ej: Cabalgata al atardecer en Anillaco" />
                                    </div>
                                    <div style={{ gridColumn: "1 / -1" }}>
                                        <label style={lbl}>Descripción</label>
                                        <textarea style={{ ...inp, height: 90, resize: "vertical" }} value={expForm.description} onChange={(e) => setExpForm({ ...expForm, description: e.target.value })} placeholder="Contá de qué se trata la experiencia..." />
                                    </div>
                                    <div>
                                        <label style={lbl}>Localidad *</label>
                                        <LocationPicker value={expForm.location} onChange={(v) => setExpForm({ ...expForm, location: v })} />
                                        <p style={{ fontSize: 11, color: "#aaa", margin: "4px 0 0" }}>Seleccioná del listado para que aparezca correctamente en el buscador.</p>
                                    </div>
                                    <div>
                                        <label style={lbl}>Categoría</label>
                                        <select style={inp} value={expForm.category} onChange={(e) => setExpForm({ ...expForm, category: e.target.value })}>
                                            {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={lbl}>Precio por persona (ARS) *</label>
                                        <input style={inp} type="number" value={expForm.price_from} onChange={(e) => setExpForm({ ...expForm, price_from: e.target.value })} placeholder="35000" />
                                    </div>
                                    <div>
                                        <label style={lbl}>Duración (minutos)</label>
                                        <input style={inp} type="number" value={expForm.duration_minutes} onChange={(e) => setExpForm({ ...expForm, duration_minutes: e.target.value })} placeholder="120" />
                                    </div>

                                    {/* Cover */}
                                    <div style={{ gridColumn: "1 / -1" }}>
                                        <label style={lbl}>📸 Foto de portada</label>
                                        <div style={{ marginTop: 8, display: "flex", gap: 14, alignItems: "flex-start" }}>
                                            <div onClick={() => coverRef.current?.click()} style={{ width: 150, height: 110, borderRadius: 14, border: `2px dashed ${COLORS.border}`, backgroundColor: "#f9f7f4", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", flexShrink: 0 }}>
                                                {coverPreview ? <img src={coverPreview} alt="cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 12, color: "#aaa", textAlign: "center", padding: 8 }}>{uploadingCover ? "Subiendo..." : "📸 Click para subir"}</span>}
                                            </div>
                                            <div style={{ fontSize: 12, color: "#999", paddingTop: 6 }}>
                                                JPG, PNG o WebP · Máx. 5MB<br />Se muestra como portada en el listado y detalle.
                                                {coverPreview && <button onClick={() => setCoverPreview(null)} style={{ display: "block", marginTop: 8, color: "#c0392b", background: "none", border: "none", cursor: "pointer", fontSize: 12 }}>× Quitar foto</button>}
                                            </div>
                                        </div>
                                        <input ref={coverRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleCoverUpload} />
                                    </div>

                                    {/* Galería */}
                                    <div style={{ gridColumn: "1 / -1" }}>
                                        <label style={lbl}>🖼️ Galería de fotos (hasta 8)</label>
                                        <div style={{ marginTop: 8, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                                            {galleryPreviews.map((url, i) => (
                                                <div key={i} style={{ position: "relative", width: 90, height: 70, borderRadius: 10, overflow: "hidden" }}>
                                                    <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                    <button onClick={() => setGalleryPreviews(galleryPreviews.filter((_, j) => j !== i))} style={{ position: "absolute", top: 2, right: 2, background: "rgba(0,0,0,0.55)", color: "#fff", border: "none", borderRadius: "50%", width: 18, height: 18, fontSize: 10, cursor: "pointer" }}>×</button>
                                                </div>
                                            ))}
                                            {galleryPreviews.length < 8 && (
                                                <div onClick={() => galleryRef.current?.click()} style={{ width: 90, height: 70, borderRadius: 10, border: `2px dashed ${COLORS.border}`, backgroundColor: "#f9f7f4", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                                                    <span style={{ fontSize: 24, color: "#ccc" }}>{uploadingGallery ? "..." : "+"}</span>
                                                </div>
                                            )}
                                        </div>
                                        <input ref={galleryRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleGalleryUpload} />
                                    </div>

                                    {/* Video */}
                                    <div style={{ gridColumn: "1 / -1" }}>
                                        <label style={lbl}>🎥 Video descriptivo (URL de YouTube o Vimeo)</label>
                                        <input style={inp} value={expForm.video_url} onChange={(e) => setExpForm({ ...expForm, video_url: e.target.value })} placeholder="https://youtube.com/watch?v=..." />
                                        <p style={{ fontSize: 11, color: "#aaa", margin: "4px 0 0" }}>Se mostrará embebido en el detalle de la experiencia.</p>
                                    </div>

                                    {/* Punto de encuentro */}
                                    <div style={{ gridColumn: "1 / -1", backgroundColor: "#f9f7f4", borderRadius: 16, padding: 18, border: `1px solid ${COLORS.border}` }}>
                                        <label style={{ ...lbl, fontSize: 13, color: "#555", marginBottom: 6 }}>📍 Punto de encuentro</label>
                                        <p style={{ fontSize: 12, color: "#aaa", margin: "0 0 12px" }}>Escribí la dirección y hacé clic en "Buscar en mapa". Luego podés arrastrar el pin para ajustar el punto exacto.</p>
                                        <div style={{ display: "flex", gap: 8 }}>
                                            <input
                                                style={{ ...inp, marginTop: 0, flex: 1 }}
                                                value={expForm.meeting_point_address}
                                                onChange={(e) => setExpForm({ ...expForm, meeting_point_address: e.target.value })}
                                                placeholder="Ej: Ruta Provincial 7, Anillaco, La Rioja"
                                                onKeyDown={(e) => e.key === "Enter" && geocodeAddress()}
                                            />
                                            <button onClick={geocodeAddress} disabled={geocoding || !expForm.meeting_point_address.trim()}
                                                style={{ flexShrink: 0, backgroundColor: COLORS.green, color: "#fff", border: "none", borderRadius: 12, padding: "0 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: (!expForm.meeting_point_address.trim() || geocoding) ? 0.5 : 1 }}>
                                                {geocoding ? "Buscando..." : "Buscar en mapa"}
                                            </button>
                                        </div>
                                        {!showMap && (
                                            <button onClick={() => setShowMap(true)} style={{ marginTop: 10, background: "none", border: `1px dashed ${COLORS.border}`, borderRadius: 10, padding: "8px 16px", fontSize: 12, color: "#888", cursor: "pointer", width: "100%" }}>
                                                📌 O hacé clic aquí para ubicar el pin directamente en el mapa
                                            </button>
                                        )}
                                        {showMap && (
                                            <>
                                                <MeetingPointPicker lat={mapLat} lng={mapLng} onMove={(lat, lng) => { setMapLat(lat); setMapLng(lng); }} />
                                                <p style={{ fontSize: 11, color: "#aaa", marginTop: 6 }}>Pin en: {mapLat.toFixed(5)}, {mapLng.toFixed(5)} · Arrastralo para ajustar el punto exacto.</p>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                                    <button onClick={handleSaveExp} disabled={expLoading || !expForm.title || !expForm.location || !expForm.price_from}
                                        style={{ backgroundColor: (!expForm.title || !expForm.location || !expForm.price_from) ? "#ccc" : COLORS.green, color: "#fff", border: "none", borderRadius: 12, padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                                        {expLoading ? "Guardando..." : editingExp ? "Guardar cambios" : "Crear experiencia"}
                                    </button>
                                    <button onClick={resetExpForm} style={{ backgroundColor: "#eee", color: "#555", border: "none", borderRadius: 12, padding: "12px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
                                </div>
                                <p style={{ fontSize: 11, color: "#aaa", marginTop: 8 }}>* Las experiencias nuevas quedan en borrador. Publicalas cuando estén listas.</p>
                            </div>
                        )}

                        {experiences.length === 0 ? (
                            <div style={{ backgroundColor: "#fff", borderRadius: 16, padding: 48, textAlign: "center", border: `1px solid ${COLORS.border}` }}>
                                <div style={{ fontSize: 40, marginBottom: 12 }}>🗺️</div>
                                <p style={{ color: "#bbb", fontSize: 14 }}>Todavía no cargaste ninguna experiencia.</p>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                {experiences.map((exp) => (
                                    <div key={exp.id} style={{ backgroundColor: "#fff", borderRadius: 18, border: `1px solid ${COLORS.border}`, overflow: "hidden", display: "flex" }}>
                                        <div style={{ width: 120, flexShrink: 0, backgroundColor: "#e8e2da" }}>
                                            {exp.cover_image_url ? <img src={exp.cover_image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", minHeight: 100, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>🖼️</div>}
                                        </div>
                                        <div style={{ flex: 1, padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                                    <span style={{ fontWeight: 800, fontSize: 15 }}>{exp.title}</span>
                                                    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999, backgroundColor: exp.is_published ? "#e8f5e9" : "#fff3e0", color: exp.is_published ? "#2e7d32" : "#e65100" }}>
                                                        {exp.is_published ? "✓ Publicada" : "Borrador"}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: 13, color: "#888" }}>📍 {exp.location} · $ {Number(exp.price_from).toLocaleString("es-AR")}/persona · {exp.category}</div>
                                                <div style={{ fontSize: 12, color: "#bbb", marginTop: 3 }}>
                                                    {exp.gallery_urls?.length ? `${exp.gallery_urls.length} fotos` : "Sin galería"} · {exp.video_url ? "Con video ▶" : "Sin video"} · {exp.meeting_point_address ? "📍 Con punto de encuentro" : "Sin punto de encuentro"}
                                                </div>
                                            </div>
                                            <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                                                <button onClick={() => startEditExp(exp)} style={{ padding: "7px 14px", borderRadius: 10, border: `1px solid ${COLORS.border}`, backgroundColor: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>✏️ Editar</button>
                                                <button onClick={() => handleTogglePublish(exp)} style={{ padding: "7px 14px", borderRadius: 10, border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer", backgroundColor: exp.is_published ? "#fff3e0" : COLORS.green, color: exp.is_published ? "#e65100" : "#fff" }}>
                                                    {exp.is_published ? "Despublicar" : "Publicar"}
                                                </button>
                                                <button onClick={() => handleDeleteExp(exp.id)} style={{ padding: "7px 14px", borderRadius: 10, border: "none", backgroundColor: "#fdecea", color: "#c0392b", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Eliminar</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ===== SLOTS ===== */}
                {tab === "slots" && (
                    <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>📅 Disponibilidad</h2>
                            {experiences.length > 0 && (
                                <button onClick={() => setShowSlotForm(!showSlotForm)} style={{ backgroundColor: showSlotForm ? "#eee" : COLORS.orange, color: showSlotForm ? "#555" : "#fff", border: "none", borderRadius: 12, padding: "9px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                                    {showSlotForm ? "✕ Cancelar" : "+ Agregar turno"}
                                </button>
                            )}
                        </div>

                        {experiences.length === 0 && <div style={{ backgroundColor: "#fff3e0", borderRadius: 14, padding: 16, fontSize: 14, color: "#e65100", marginBottom: 16 }}>Primero creá al menos una experiencia para agregar turnos.</div>}

                        {showSlotForm && (
                            <div style={{ backgroundColor: "#fff", borderRadius: 20, padding: 24, border: `1px solid ${COLORS.border}`, marginBottom: 20 }}>
                                <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 800 }}>Nuevo turno</h3>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                    <div style={{ gridColumn: "1 / -1" }}>
                                        <label style={lbl}>Experiencia *</label>
                                        <select style={inp} value={slotForm.experience_id} onChange={(e) => setSlotForm({ ...slotForm, experience_id: e.target.value })}>
                                            <option value="">Seleccioná una experiencia</option>
                                            {experiences.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={lbl}>Fecha *</label>
                                        <input style={inp} type="date" value={slotForm.date} onChange={(e) => setSlotForm({ ...slotForm, date: e.target.value })} />
                                    </div>
                                    <div>
                                        <label style={lbl}>Horario *</label>
                                        <input style={inp} type="time" value={slotForm.time} onChange={(e) => setSlotForm({ ...slotForm, time: e.target.value })} />
                                    </div>
                                    <div>
                                        <label style={lbl}>Capacidad máxima</label>
                                        <input style={inp} type="number" value={slotForm.capacity} onChange={(e) => setSlotForm({ ...slotForm, capacity: e.target.value })} />
                                    </div>
                                </div>
                                <button onClick={handleSaveSlot} disabled={slotLoading} style={{ marginTop: 16, backgroundColor: COLORS.orange, color: "#fff", border: "none", borderRadius: 12, padding: "11px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                                    {slotLoading ? "Guardando..." : "Agregar turno"}
                                </button>
                            </div>
                        )}

                        {experiences.length > 1 && (
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                                {[{ id: "all", title: "Todas" }, ...experiences].map((exp) => (
                                    <button key={exp.id} onClick={() => setSlotFilter(exp.id)}
                                        style={{ padding: "6px 14px", borderRadius: 10, border: `1px solid ${COLORS.border}`, backgroundColor: slotFilter === exp.id ? COLORS.green : "#fff", color: slotFilter === exp.id ? "#fff" : "#555", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                                        {exp.title}
                                    </button>
                                ))}
                            </div>
                        )}

                        {filteredSlots.length === 0 ? (
                            <div style={{ backgroundColor: "#fff", borderRadius: 16, padding: 48, textAlign: "center", border: `1px solid ${COLORS.border}` }}>
                                <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
                                <p style={{ color: "#bbb", fontSize: 14 }}>No hay turnos cargados aún.</p>
                            </div>
                        ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
                                {filteredSlots.map((slot) => {
                                    const exp = experiences.find((e) => e.id === slot.experience_id);
                                    const disponibles = slot.capacity - slot.booked_count;
                                    const pct = Math.round((slot.booked_count / slot.capacity) * 100);
                                    const isPast = new Date(slot.date) < new Date();
                                    const isFull = disponibles <= 0;
                                    return (
                                        <div key={slot.id} style={{ backgroundColor: isPast ? "#f5f3f0" : "#fff", borderRadius: 18, padding: 20, border: `2px solid ${isFull ? "#ffd6d6" : isPast ? COLORS.border : "#c8ddb8"}`, opacity: isPast ? 0.75 : 1 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                                                <div>
                                                    <div style={{ fontSize: 12, fontWeight: 700, color: "#999", marginBottom: 2 }}>{exp?.title ?? "—"}</div>
                                                    <div style={{ fontSize: 22, fontWeight: 800, color: isPast ? "#aaa" : COLORS.green }}>{formatDate(slot.date)}</div>
                                                    <div style={{ fontSize: 17, fontWeight: 700, color: "#555", marginTop: 2 }}>🕐 {slot.time.slice(0, 5)}</div>
                                                </div>
                                                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999, backgroundColor: isPast ? "#eee" : isFull ? "#fdecea" : "#e8f5e9", color: isPast ? "#aaa" : isFull ? "#c0392b" : "#2e7d32" }}>
                                                    {isPast ? "Pasado" : isFull ? "Agotado" : `${disponibles} libre${disponibles !== 1 ? "s" : ""}`}
                                                </span>
                                            </div>
                                            <div style={{ marginBottom: 14 }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#aaa", marginBottom: 4 }}>
                                                    <span>Ocupación</span><span>{slot.booked_count}/{slot.capacity} personas</span>
                                                </div>
                                                <div style={{ backgroundColor: "#f0ece6", borderRadius: 999, height: 8 }}>
                                                    <div style={{ width: `${pct}%`, height: "100%", borderRadius: 999, backgroundColor: pct >= 100 ? "#e74c3c" : pct >= 70 ? COLORS.orange : COLORS.green }} />
                                                </div>
                                            </div>
                                            <button onClick={() => handleDeleteSlot(slot.id)} style={{ width: "100%", padding: "8px 0", borderRadius: 10, border: "none", backgroundColor: "#fdecea", color: "#c0392b", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                                                Eliminar turno
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ===== RESERVAS ===== */}
                {tab === "reservas" && (
                    <div>
                        <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 16px" }}>🎫 Reservas recibidas</h2>
                        {bookings.length === 0 ? (
                            <div style={{ backgroundColor: "#fff", borderRadius: 16, padding: 48, textAlign: "center", border: `1px solid ${COLORS.border}` }}>
                                <div style={{ fontSize: 40, marginBottom: 12 }}>🎫</div>
                                <p style={{ color: "#bbb", fontSize: 14 }}>Todavía no recibiste reservas.</p>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                {bookings.map((b) => (
                                    <div key={b.id} style={{ backgroundColor: "#fff", borderRadius: 16, padding: "18px 22px", border: `1px solid ${COLORS.border}` }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>{b.experience?.title ?? "—"}</div>
                                                <div style={{ fontSize: 13, color: "#555" }}>👤 {b.user_name} · ✉️ {b.user_email}</div>
                                                <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>📅 {b.slot?.date ?? "—"} · ⏰ {b.slot?.time?.slice(0, 5) ?? "—"} · 👥 {b.people} {b.people === 1 ? "persona" : "personas"}</div>
                                            </div>
                                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                                                <div style={{ fontWeight: 800, fontSize: 18, color: COLORS.green }}>{formatARS(b.total_price)}</div>
                                                <div style={{ fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 999, marginTop: 4, backgroundColor: "#e8f5e9", color: "#2e7d32", display: "inline-block" }}>✓ {b.status}</div>
                                            </div>
                                        </div>
                                        <div style={{ fontSize: 11, color: "#ccc", marginTop: 10, borderTop: `1px solid ${COLORS.border}`, paddingTop: 8 }}>
                                            Código: <strong style={{ color: "#888" }}>{b.id.slice(0, 8).toUpperCase()}</strong> · {new Date(b.created_at).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}