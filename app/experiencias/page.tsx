export const dynamic = "force-dynamic";

import LocationSearch from "@/app/components/LocationSearch";
import { getCercanas } from "@/app/lib/localidades-larioja";

type PageProps = {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const COLORS = {
    bg: "#F3EEE6",
    green: "#4E6B3A",
    orange: "#D07A2D",
    border: "#e7e2da",
};

const categories = [
    { id: "aventura", label: "🏕️ Aventura" },
    { id: "naturaleza", label: "🌿 Naturaleza" },
    { id: "bienestar", label: "🧘 Bienestar" },
    { id: "urbano", label: "🏙️ Urbano" },
    { id: "sabores", label: "🍷 Sabores" },
    { id: "cultura", label: "🎭 Cultura" },
];

const formatARS = (n: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

const durationLabel = (mins: number) => {
    if (!mins || mins <= 0) return null;
    if (mins < 60) return `${mins} min`;
    return `${Math.round((mins / 60) * 10) / 10} hs`;
};

function getOne(sp: Record<string, any>, key: string): string {
    const v = sp?.[key];
    if (Array.isArray(v)) return v[0] ?? "";
    return (v ?? "") as string;
}

function Star({ fill }: { fill: "full" | "half" | "empty" }) {
    const id = `s-${Math.random().toString(36).slice(2, 7)}`;
    if (fill === "full") return <svg width="15" height="15" viewBox="0 0 24 24" fill="#D07A2D"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>;
    if (fill === "empty") return <svg width="15" height="15" viewBox="0 0 24 24" fill="#E5DED5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>;
    return <svg width="15" height="15" viewBox="0 0 24 24"><defs><linearGradient id={id}><stop offset="50%" stopColor="#D07A2D" /><stop offset="50%" stopColor="#E5DED5" /></linearGradient></defs><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z" fill={`url(#${id})`} /></svg>;
}

function StarRating({ rating, count }: { rating: number | null; count: number | null }) {
    if (!rating || !count) return <span style={{ fontSize: 12, color: "#bbb" }}>Sin reseñas</span>;
    const full = Math.floor(rating);
    const half = rating - full >= 0.3 && rating - full < 0.8;
    const nearFull = rating - full >= 0.8;
    const totalFull = nearFull ? full + 1 : full;
    const empty = 5 - totalFull - (half ? 1 : 0);
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ display: "flex", gap: 1 }}>
                {Array.from({ length: totalFull }).map((_, i) => <Star key={`f${i}`} fill="full" />)}
                {half && <Star fill="half" />}
                {Array.from({ length: Math.max(0, empty) }).map((_, i) => <Star key={`e${i}`} fill="empty" />)}
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#555" }}>{rating.toFixed(1)}</span>
            <span style={{ fontSize: 11, color: "#aaa" }}>({count})</span>
        </div>
    );
}

type RatingsMap = Record<string, { rating_avg: number; reviews_count: number }>;

function ExperienciaCard({ x, ratingsMap }: { x: any; ratingsMap: RatingsMap }) {
    const r = ratingsMap[x.id] ?? null;
    return (
        <div style={{ backgroundColor: "#fff", borderRadius: 20, border: `1px solid ${COLORS.border}`, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ height: 175, backgroundColor: "#e8e2da", overflow: "hidden", position: "relative" }}>
                {x.cover_image_url
                    ? <img src={x.cover_image_url} alt={x.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>🗺️</div>
                }
                {x.is_featured && (
                    <div style={{ position: "absolute", top: 10, left: 10, backgroundColor: COLORS.orange, color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999 }}>★ Destacada</div>
                )}
                {x.category && (
                    <div style={{ position: "absolute", top: 10, right: 10, backgroundColor: "rgba(0,0,0,0.4)", color: "#fff", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999, backdropFilter: "blur(4px)" }}>
                        {categories.find((c) => c.id === x.category)?.label ?? x.category}
                    </div>
                )}
            </div>
            <div style={{ padding: "14px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.3, margin: 0 }}>{x.title}</h3>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.green }}>{formatARS(Number(x.price_from ?? 0))}</div>
                        <div style={{ fontSize: 11, color: "#aaa" }}>/ persona</div>
                    </div>
                </div>
                <StarRating rating={r?.rating_avg ?? null} count={r?.reviews_count ?? null} />
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <div style={{ fontSize: 12, color: "#777" }}>📍 {x.location ?? "La Rioja"}</div>
                    {durationLabel(Number(x.duration_minutes)) && (
                        <div style={{ fontSize: 12, color: "#777" }}>⏱ {durationLabel(Number(x.duration_minutes))}</div>
                    )}
                </div>
                <a href={`/experiencias/${x.id}`} style={{ marginTop: "auto", display: "block", backgroundColor: COLORS.green, color: "#fff", borderRadius: 10, padding: "9px 0", textAlign: "center", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                    Ver disponibilidad →
                </a>
            </div>
        </div>
    );
}

export default async function ExperienciasPage({ searchParams }: PageProps) {
    const sp = (await searchParams) ?? {};
    const q = getOne(sp, "q");
    const category = getOne(sp, "category");
    const location = getOne(sp, "location");
    const sort = getOne(sp, "sort") || "recent";
    const priceMin = getOne(sp, "price_min");
    const priceMax = getOne(sp, "price_max");
    const fecha = getOne(sp, "fecha");
    const personas = getOne(sp, "personas");

    const { supabaseAdmin } = await import("@/lib/supabase/server");

    // ── PASO 1: Primero buscar SIN filtros de fecha/personas para saber si la localidad existe ──
    let locationHasExperiences = false;
    if (location) {
        const { data: checkLoc } = await supabaseAdmin
            .from("experiences")
            .select("id")
            .eq("is_published", true)
            .ilike("location", `%${location}%`)
            .limit(1);
        locationHasExperiences = (checkLoc?.length ?? 0) > 0;
    }

    // ── PASO 2: Filtro por fecha y personas ──
    let availableIds: string[] | null = null;
    if (fecha || personas) {
        let slotsQ = supabaseAdmin.from("availability_slots").select("experience_id, capacity, booked_count");
        if (fecha) slotsQ = (slotsQ as any).eq("date", fecha);
        const { data: slots } = await slotsQ;
        if (slots) {
            const min = personas ? parseInt(personas) : 1;
            const ids = slots
                .filter((s: any) => (s.capacity - s.booked_count) >= min)
                .map((s: any) => s.experience_id as string);
            availableIds = [...new Set(ids)];
        }
    }

    // ── PASO 3: Query principal ──
    let query = supabaseAdmin
        .from("experiences")
        .select("id, title, location, price_from, duration_minutes, category, created_at, cover_image_url, is_featured")
        .eq("is_published", true);

    if (category) query = query.eq("category", category);
    if (location) query = query.ilike("location", `%${location}%`);
    if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
    if (priceMin) query = query.gte("price_from", parseInt(priceMin));
    if (priceMax) query = query.lte("price_from", parseInt(priceMax));
    if (availableIds !== null && availableIds.length > 0) query = query.in("id", availableIds);

    if (sort === "price_asc") query = query.order("price_from", { ascending: true });
    else if (sort === "price_desc") query = query.order("price_from", { ascending: false });
    else if (sort === "duration_asc") query = query.order("duration_minutes", { ascending: true });
    else if (sort === "duration_desc") query = query.order("duration_minutes", { ascending: false });
    else query = query.order("created_at", { ascending: false });

    const { data: rawData, error } = await query.limit(48);

    // ── Ratings ──
    const { data: rawRatings } = await supabaseAdmin.from("reviews").select("experience_id, rating");
    const ratingsMap: RatingsMap = {};
    for (const r of rawRatings ?? []) {
        if (!ratingsMap[r.experience_id]) ratingsMap[r.experience_id] = { rating_avg: 0, reviews_count: 0 };
        ratingsMap[r.experience_id].reviews_count += 1;
        ratingsMap[r.experience_id].rating_avg += r.rating;
    }
    for (const key of Object.keys(ratingsMap)) {
        ratingsMap[key].rating_avg = Math.round((ratingsMap[key].rating_avg / ratingsMap[key].reviews_count) * 10) / 10;
    }

    let results = (rawData ?? []) as any[];
    if (availableIds !== null && availableIds.length === 0 && (fecha || personas)) results = [];
    if (sort === "rating") results = [...results].sort((a, b) => (ratingsMap[b.id]?.rating_avg ?? 0) - (ratingsMap[a.id]?.rating_avg ?? 0));

    // ── PASO 4: Determinar tipo de "sin resultados" ──
    // Caso A: La localidad no existe en la BD → mostrar cercanas/destacadas
    const noExperienciasEnLocalidad = location && !locationHasExperiences;
    // Caso B: La localidad existe pero no hay disponibilidad para esa fecha/personas
    const sinDisponibilidad = location && locationHasExperiences && results.length === 0 && (fecha || personas);
    // Caso C: Sin resultados por otros filtros
    const sinResultadosGeneral = !location && results.length === 0;

    // ── PASO 5: Fallback si no hay experiencias en esa localidad ──
    let fallbackNearby: any[] = [];
    let fallbackFeatured: any[] = [];

    if (noExperienciasEnLocalidad) {
        const locsToTry = getCercanas(location);
        for (const loc of locsToTry) {
            const { data: nearby } = await supabaseAdmin
                .from("experiences")
                .select("id, title, location, price_from, duration_minutes, category, created_at, cover_image_url, is_featured")
                .eq("is_published", true)
                .ilike("location", `%${loc}%`)
                .limit(4);
            if (nearby && nearby.length > 0) {
                fallbackNearby = [...fallbackNearby, ...nearby];
                if (fallbackNearby.length >= 6) break;
            }
        }
        if (fallbackNearby.length === 0) {
            const { data: featured } = await supabaseAdmin
                .from("experiences")
                .select("id, title, location, price_from, duration_minutes, category, created_at, cover_image_url, is_featured")
                .eq("is_published", true)
                .eq("is_featured", true)
                .limit(6);
            fallbackFeatured = featured ?? [];
            if (fallbackFeatured.length === 0) {
                const { data: all } = await supabaseAdmin
                    .from("experiences")
                    .select("id, title, location, price_from, duration_minutes, category, created_at, cover_image_url, is_featured")
                    .eq("is_published", true)
                    .order("created_at", { ascending: false })
                    .limit(6);
                fallbackFeatured = all ?? [];
            }
        }
    }

    // ── Chips activos ──
    const activeFilters: { label: string; key: string }[] = [];
    if (q) activeFilters.push({ label: `"${q}"`, key: "q" });
    if (category) activeFilters.push({ label: categories.find((c) => c.id === category)?.label ?? category, key: "category" });
    if (location) activeFilters.push({ label: `📍 ${location}`, key: "location" });
    if (priceMin) activeFilters.push({ label: `Desde ${formatARS(parseInt(priceMin))}`, key: "price_min" });
    if (priceMax) activeFilters.push({ label: `Hasta ${formatARS(parseInt(priceMax))}`, key: "price_max" });
    if (fecha) activeFilters.push({ label: `📅 ${fecha}`, key: "fecha" });
    if (personas) activeFilters.push({ label: `👥 ${personas} personas`, key: "personas" });

    const buildUrl = (removeKey?: string) => {
        const p = new URLSearchParams();
        const keep = (k: string, v: string) => { if (v && k !== removeKey) p.set(k, v); };
        keep("q", q); keep("category", category); keep("location", location);
        if (sort !== "recent") keep("sort", sort);
        keep("price_min", priceMin); keep("price_max", priceMax);
        keep("fecha", fecha); keep("personas", personas);
        const s = p.toString();
        return `/experiencias${s ? `?${s}` : ""}`;
    };

    const addCategoryUrl = (cat: string) => {
        const p = new URLSearchParams();
        if (q) p.set("q", q);
        p.set("category", cat);
        if (location) p.set("location", location);
        if (sort !== "recent") p.set("sort", sort);
        if (priceMin) p.set("price_min", priceMin);
        if (priceMax) p.set("price_max", priceMax);
        if (fecha) p.set("fecha", fecha);
        if (personas) p.set("personas", personas);
        return `/experiencias?${p.toString()}`;
    };

    const inp: React.CSSProperties = { width: "100%", boxSizing: "border-box" as const, padding: "10px 14px", borderRadius: 12, border: `1px solid ${COLORS.border}`, fontSize: 13, backgroundColor: "#fafafa", outline: "none", marginTop: 6 };

    return (
        <div style={{ backgroundColor: COLORS.bg, minHeight: "100vh", color: "#1a1a1a" }}>
            <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 20px 60px" }}>
                <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>

                    {/* ── Sidebar ── */}
                    <aside style={{ width: 270, flexShrink: 0 }}>
                        <div style={{ backgroundColor: "#fff", borderRadius: 24, padding: 22, border: `1px solid ${COLORS.border}`, position: "sticky", top: 80 }}>
                            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 18 }}>🔍 Filtros</div>
                            <form action="/experiencias" method="get" style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Buscar</label>
                                    <input name="q" defaultValue={q} placeholder="Ej: Cabalgata, Talampaya..." style={inp} />
                                </div>

                                {/* Autocompletado de localidad */}
                                <LocationSearch defaultValue={location} />

                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Categoría</label>
                                    <select name="category" defaultValue={category} style={{ ...inp, cursor: "pointer" }}>
                                        <option value="">Todas</option>
                                        {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Precio / persona (ARS)</label>
                                    <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                                        <input name="price_min" type="number" defaultValue={priceMin} placeholder="Mín" style={{ flex: 1, padding: "10px 10px", borderRadius: 12, border: `1px solid ${COLORS.border}`, fontSize: 13, backgroundColor: "#fafafa", outline: "none", width: 0, boxSizing: "border-box" as const }} />
                                        <input name="price_max" type="number" defaultValue={priceMax} placeholder="Máx" style={{ flex: 1, padding: "10px 10px", borderRadius: 12, border: `1px solid ${COLORS.border}`, fontSize: 13, backgroundColor: "#fafafa", outline: "none", width: 0, boxSizing: "border-box" as const }} />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Fecha disponible</label>
                                    <input name="fecha" type="date" defaultValue={fecha} style={inp} />
                                </div>

                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Personas</label>
                                    <input name="personas" type="number" min="1" defaultValue={personas} placeholder="¿Cuántas?" style={inp} />
                                </div>

                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Ordenar por</label>
                                    <select name="sort" defaultValue={sort} style={{ ...inp, cursor: "pointer" }}>
                                        <option value="recent">Más recientes</option>
                                        <option value="rating">Mejor calificadas</option>
                                        <option value="price_asc">Precio: menor a mayor</option>
                                        <option value="price_desc">Precio: mayor a menor</option>
                                        <option value="duration_asc">Duración: menor a mayor</option>
                                        <option value="duration_desc">Duración: mayor a menor</option>
                                    </select>
                                </div>

                                <button type="submit" style={{ backgroundColor: COLORS.green, color: "#fff", border: "none", borderRadius: 12, padding: "11px 0", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                                    Buscar
                                </button>
                                <a href="/experiencias" style={{ display: "block", textAlign: "center", padding: "10px 0", borderRadius: 12, border: `1px solid ${COLORS.border}`, fontSize: 13, fontWeight: 600, color: "#666", textDecoration: "none" }}>
                                    Limpiar filtros
                                </a>
                            </form>
                        </div>
                    </aside>

                    {/* ── Resultados ── */}
                    <section style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ marginBottom: 16 }}>
                            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Explorá experiencias</h1>
                            <p style={{ fontSize: 13, color: "#888", margin: "4px 0 0" }}>
                                {noExperienciasEnLocalidad
                                    ? `Sin experiencias en ${location}`
                                    : sinDisponibilidad
                                        ? `Sin disponibilidad en ${location} para esa fecha o cantidad de personas`
                                        : results.length === 0
                                            ? "Sin resultados"
                                            : `${results.length} experiencia${results.length !== 1 ? "s" : ""} encontrada${results.length !== 1 ? "s" : ""}`
                                }
                            </p>
                        </div>

                        {/* Chips activos */}
                        {activeFilters.length > 0 && (
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                                {activeFilters.map((f) => (
                                    <a key={f.key} href={buildUrl(f.key)} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 999, backgroundColor: "#fff", border: `1px solid ${COLORS.border}`, fontSize: 12, fontWeight: 600, color: "#444", textDecoration: "none" }}>
                                        {f.label} <span style={{ color: "#aaa" }}>×</span>
                                    </a>
                                ))}
                                <a href="/experiencias" style={{ display: "inline-flex", alignItems: "center", padding: "5px 12px", borderRadius: 999, backgroundColor: "#FEE2E2", fontSize: 12, fontWeight: 600, color: "#DC2626", textDecoration: "none" }}>
                                    Limpiar todo
                                </a>
                            </div>
                        )}

                        {/* Pills categorías rápidas */}
                        {!category && (
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
                                {categories.map((c) => (
                                    <a key={c.id} href={addCategoryUrl(c.id)} style={{ padding: "6px 14px", borderRadius: 999, backgroundColor: "#fff", border: `1px solid ${COLORS.border}`, fontSize: 13, fontWeight: 600, color: "#555", textDecoration: "none", whiteSpace: "nowrap" as const }}>
                                        {c.label}
                                    </a>
                                ))}
                            </div>
                        )}

                        {error ? (
                            <div style={{ backgroundColor: "#FEE2E2", borderRadius: 16, padding: 16, fontSize: 14, color: "#DC2626" }}>Error: {error.message}</div>

                        ) : noExperienciasEnLocalidad ? (
                            /* ── Caso A: localidad sin experiencias → cercanas / destacadas ── */
                            <div>
                                <div style={{ backgroundColor: "#FEF3C7", borderRadius: 16, padding: "14px 18px", marginBottom: 24, border: "1px solid #FDE68A", display: "flex", alignItems: "center", gap: 10 }}>
                                    <span style={{ fontSize: 20 }}>📍</span>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: 14 }}>No hay experiencias en {location} todavía</div>
                                        <div style={{ fontSize: 13, color: "#92400E", marginTop: 2 }}>
                                            {fallbackNearby.length > 0
                                                ? "Te mostramos opciones en localidades cercanas que podrían interesarte"
                                                : "Te mostramos las experiencias más populares de La Rioja"}
                                        </div>
                                    </div>
                                </div>

                                {fallbackNearby.length > 0 && (
                                    <>
                                        <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 14, marginTop: 0 }}>📍 Cerca de {location}</h2>
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16, marginBottom: 32 }}>
                                            {fallbackNearby.map((x: any) => <ExperienciaCard key={x.id} x={x} ratingsMap={ratingsMap} />)}
                                        </div>
                                    </>
                                )}

                                {fallbackFeatured.length > 0 && (
                                    <>
                                        <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 14, marginTop: 0 }}>
                                            {fallbackNearby.length > 0 ? "★ También te puede interesar" : "★ Experiencias en La Rioja"}
                                        </h2>
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
                                            {fallbackFeatured.map((x: any) => <ExperienciaCard key={x.id} x={x} ratingsMap={ratingsMap} />)}
                                        </div>
                                    </>
                                )}
                            </div>

                        ) : sinDisponibilidad ? (
                            /* ── Caso B: localidad existe pero sin disponibilidad para esa fecha/personas ── */
                            <div>
                                <div style={{ backgroundColor: "#EFF6FF", borderRadius: 16, padding: "14px 18px", marginBottom: 24, border: "1px solid #BFDBFE", display: "flex", alignItems: "center", gap: 10 }}>
                                    <span style={{ fontSize: 20 }}>📅</span>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: 14, color: "#1E40AF" }}>Sin disponibilidad para esa fecha o cantidad de personas</div>
                                        <div style={{ fontSize: 13, color: "#3B82F6", marginTop: 2 }}>
                                            Probá otra fecha o menos personas. Igual te mostramos las experiencias de {location}.
                                        </div>
                                    </div>
                                </div>
                                {/* Mostrar las experiencias de esa localidad sin filtro de fecha */}
                                <SinDisponibilidadFallback location={location} ratingsMap={ratingsMap} />
                            </div>

                        ) : results.length === 0 ? (
                            <div style={{ backgroundColor: "#fff", borderRadius: 20, padding: 48, textAlign: "center", border: `1px solid ${COLORS.border}` }}>
                                <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                                <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No encontramos experiencias</p>
                                <p style={{ fontSize: 14, color: "#888", marginBottom: 20 }}>Probá con otros filtros o limpiá la búsqueda.</p>
                                <a href="/experiencias" style={{ display: "inline-block", backgroundColor: COLORS.green, color: "#fff", borderRadius: 12, padding: "10px 24px", fontSize: 14, fontWeight: 700, textDecoration: "none" }}>Ver todas</a>
                            </div>

                        ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
                                {results.map((x: any) => <ExperienciaCard key={x.id} x={x} ratingsMap={ratingsMap} />)}
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}

// Muestra las experiencias de esa localidad sin el filtro de disponibilidad
async function SinDisponibilidadFallback({ location, ratingsMap }: { location: string; ratingsMap: RatingsMap }) {
    const { supabaseAdmin } = await import("@/lib/supabase/server");
    const { data } = await supabaseAdmin
        .from("experiences")
        .select("id, title, location, price_from, duration_minutes, category, created_at, cover_image_url, is_featured")
        .eq("is_published", true)
        .ilike("location", `%${location}%`)
        .limit(12);

    if (!data || data.length === 0) return null;
    return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
            {data.map((x: any) => <ExperienciaCard key={x.id} x={x} ratingsMap={ratingsMap} />)}
        </div>
    );
}