import { notFound } from "next/navigation";
import ReservaWidget from "./ReservaWidget";
import GaleriaViewer from "./GaleriaViewer";
import MeetingPointMap from "./MeetingPointMap";

export const dynamic = "force-dynamic";

type PageProps = {
    params: Promise<{ id?: string }>;
};

const COLORS = {
    orange: "#D07A2D",
    green: "#4E6B3A",
    bg: "#F3EEE6",
    border: "#e7e2da",
};

const formatARS = (n: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

function getEmbedUrl(url: string): string | null {
    if (!url) return null;
    const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
    const vi = url.match(/vimeo\.com\/(\d+)/);
    if (vi) return `https://player.vimeo.com/video/${vi[1]}`;
    return null;
}

function Star({ fill, size = 20 }: { fill: "full" | "half" | "empty"; size?: number }) {
    const id = `sg-${Math.random().toString(36).slice(2, 8)}`;
    const path = "M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z";
    if (fill === "full") return <svg width={size} height={size} viewBox="0 0 24 24" fill="#D07A2D"><path d={path} /></svg>;
    if (fill === "empty") return <svg width={size} height={size} viewBox="0 0 24 24" fill="#E5DED5"><path d={path} /></svg>;
    return (
        <svg width={size} height={size} viewBox="0 0 24 24">
            <defs><linearGradient id={id}><stop offset="50%" stopColor="#D07A2D" /><stop offset="50%" stopColor="#E5DED5" /></linearGradient></defs>
            <path d={path} fill={`url(#${id})`} />
        </svg>
    );
}

function StarRating({ rating, count, size = 20 }: { rating: number; count: number; size?: number }) {
    const full = Math.floor(rating);
    const half = rating - full >= 0.3 && rating - full < 0.8;
    const nearFull = rating - full >= 0.8;
    const totalFull = nearFull ? full + 1 : full;
    const empty = 5 - totalFull - (half ? 1 : 0);
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                {Array.from({ length: totalFull }).map((_, i) => <Star key={`f${i}`} fill="full" size={size} />)}
                {half && <Star fill="half" size={size} />}
                {Array.from({ length: empty }).map((_, i) => <Star key={`e${i}`} fill="empty" size={size} />)}
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#444" }}>{rating.toFixed(1)}</span>
            <span style={{ fontSize: 14, color: "#999" }}>· {count} {count === 1 ? "reseña" : "reseñas"}</span>
        </div>
    );
}

export default async function ExperienciaDetailPage({ params }: PageProps) {
    const { id } = await params;
    if (!id) return notFound();

    try {
        const { supabaseAdmin } = await import("@/lib/supabase/server");

        const [{ data: exp, error }, { data: reviews }, { data: slots }] = await Promise.all([
            supabaseAdmin
                .from("experiences")
                .select("id, title, description, location, price_from, duration_minutes, category, cover_image_url, gallery_urls, video_url, meeting_point_address, meeting_point_lat, meeting_point_lng, provider_id")
                .eq("id", id)
                .maybeSingle(),
            supabaseAdmin
                .from("reviews")
                .select("id, user_name, rating, comment, created_at")
                .eq("experience_id", id)
                .order("created_at", { ascending: false })
                .limit(20),
            supabaseAdmin
                .from("availability_slots")
                .select("id, date, time, capacity, booked_count")
                .eq("experience_id", id)
                .gte("date", new Date().toISOString().split("T")[0])
                .order("date", { ascending: true })
                .order("time", { ascending: true }),
        ]);

        if (error) return <main style={{ padding: 24 }}><h1>Error</h1><pre>{JSON.stringify(error, null, 2)}</pre></main>;
        if (!exp) return notFound();

        // ── Verificar si el proveedor tiene MP conectado ──
        const { data: provider } = await supabaseAdmin
            .from("profiles")
            .select("mp_access_token")
            .eq("id", exp.provider_id)
            .single();
        const providerHasMP = !!provider?.mp_access_token;

        const reviewList = reviews ?? [];
        const avgRating = reviewList.length
            ? Math.round((reviewList.reduce((acc, r) => acc + r.rating, 0) / reviewList.length) * 10) / 10
            : null;

        const embedUrl = exp.video_url ? getEmbedUrl(exp.video_url) : null;
        const gallery: string[] = exp.gallery_urls ?? [];
        const allImages = [exp.cover_image_url, ...gallery].filter(Boolean) as string[];
        const hasMeetingPoint = exp.meeting_point_lat && exp.meeting_point_lng;

        return (
            <main style={{ backgroundColor: COLORS.bg, minHeight: "100vh", paddingBottom: 60 }}>
                <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px 0" }}>
                    {allImages.length > 0 ? (
                        <GaleriaViewer images={allImages} title={exp.title} />
                    ) : (
                        <div style={{ height: 320, borderRadius: 24, backgroundColor: "#D9D3CB", marginBottom: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ fontSize: 48 }}>🏔️</span>
                        </div>
                    )}

                    <div style={{ display: "flex", gap: 32, alignItems: "flex-start", flexWrap: "wrap" }}>
                        <div style={{ flex: "1 1 420px", minWidth: 0 }}>
                            <h1 style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.2, margin: "0 0 12px" }}>{exp.title}</h1>

                            {avgRating !== null && (
                                <div style={{ marginBottom: 16 }}>
                                    <StarRating rating={avgRating} count={reviewList.length} size={22} />
                                </div>
                            )}

                            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
                                {[
                                    { icon: "📍", text: exp.location },
                                    { icon: "⏱", text: exp.duration_minutes ? `${exp.duration_minutes} min (aprox.)` : null },
                                    { icon: "🏷️", text: exp.category },
                                    { icon: "$", text: `${formatARS(Number(exp.price_from ?? 0))} / persona` },
                                ].filter((i) => i.text).map((item, i) => (
                                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, backgroundColor: "#FAF6F0", padding: "8px 16px", borderRadius: 999, fontSize: 14, color: "#444", border: `1px solid ${COLORS.border}` }}>
                                        <span style={{ fontWeight: item.icon === "$" ? 800 : "normal" }}>{item.icon}</span>
                                        <span style={{ textTransform: "capitalize" }}>{item.text}</span>
                                    </div>
                                ))}
                            </div>

                            <p style={{ color: "#555", lineHeight: 1.8, fontSize: 15, marginBottom: 32 }}>{exp.description}</p>

                            {hasMeetingPoint && (
                                <section style={{ marginBottom: 36 }}>
                                    <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 6px" }}>📍 Punto de encuentro</h2>
                                    {exp.meeting_point_address && (
                                        <p style={{ fontSize: 14, color: "#666", margin: "0 0 12px", lineHeight: 1.5 }}>
                                            {exp.meeting_point_address}
                                        </p>
                                    )}
                                    <MeetingPointMap
                                        lat={exp.meeting_point_lat!}
                                        lng={exp.meeting_point_lng!}
                                        label={exp.meeting_point_address ?? exp.title}
                                    />
                                    <p style={{ fontSize: 12, color: "#aaa", marginTop: 8 }}>
                                        El pin indica el punto exacto de encuentro. Hacé zoom para ver mejor la zona.
                                    </p>
                                </section>
                            )}

                            {embedUrl && (
                                <section style={{ marginBottom: 36 }}>
                                    <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 14px" }}>🎥 Video de la experiencia</h2>
                                    <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, borderRadius: 18, overflow: "hidden", border: `1px solid ${COLORS.border}` }}>
                                        <iframe src={embedUrl} title="Video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }} />
                                    </div>
                                </section>
                            )}

                            <section>
                                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                                    <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Reseñas</h2>
                                    {avgRating !== null && (
                                        <span style={{ backgroundColor: COLORS.orange, color: "#fff", borderRadius: 999, padding: "3px 12px", fontSize: 13, fontWeight: 700 }}>
                                            {avgRating.toFixed(1)} ★
                                        </span>
                                    )}
                                </div>
                                {reviewList.length === 0 ? (
                                    <p style={{ color: "#bbb", fontSize: 14 }}>Sin reseñas aún.</p>
                                ) : (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                        {reviewList.map((r: any) => (
                                            <div key={r.id} style={{ backgroundColor: "#FAF6F0", borderRadius: 16, padding: "16px 20px", border: `1px solid ${COLORS.border}` }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                                    <span style={{ fontWeight: 700, fontSize: 14 }}>{r.user_name}</span>
                                                    <StarRating rating={r.rating} count={0} size={15} />
                                                </div>
                                                {r.comment && <p style={{ margin: 0, fontSize: 14, color: "#555", lineHeight: 1.6 }}>{r.comment}</p>}
                                                <div style={{ marginTop: 8, fontSize: 12, color: "#bbb" }}>
                                                    {new Date(r.created_at).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>
                        </div>

                        {/* Widget de reserva con MP */}
                        <div style={{ flex: "0 0 340px", position: "sticky", top: 80 }}>
                            <ReservaWidget
                                experienceId={exp.id}
                                pricePerPerson={Number(exp.price_from ?? 0)}
                                slots={slots ?? []}
                                providerHasMP={providerHasMP}
                            />
                        </div>
                    </div>
                </div>
            </main>
        );
    } catch (e: any) {
        return <main style={{ padding: 24 }}><h1>Error interno</h1><pre>{String(e?.message ?? e)}</pre></main>;
    }
}