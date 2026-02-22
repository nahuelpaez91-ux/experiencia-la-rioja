import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
    params: Promise<{ id?: string }>;
};

const COLORS = {
    bg: "bg-[#F3EEE6]",
    card: "bg-[#FAF6F0]",
    ring: "ring-1 ring-stone-200",
    orange: "#D07A2D",
    green: "#4E6B3A",
};

const formatARS = (n: number) =>
    new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
    }).format(n);

const durationLabel = (mins: number) => {
    if (!mins || mins <= 0) return "—";
    if (mins < 60) return `${mins} min (aprox.)`;
    const h = Math.round((mins / 60) * 10) / 10;
    return `${h} h (aprox.)`;
};

export default async function ExperienciaDetailPage({ params }: PageProps) {
    const { id } = await params; // ✅ Next 16 + Turbopack

    if (!id) return notFound();

    const { supabaseAdmin } = await import("@/lib/supabase/server");

    const { data: exp, error } = await supabaseAdmin
        .from("experiences")
        .select("id, title, description, location, price_from, duration_minutes, category, is_published")
        .eq("id", id)
        .maybeSingle();

    if (error) {
        return (
            <div className={`${COLORS.bg} min-h-screen text-stone-900`}>
                <main className="mx-auto max-w-4xl px-4 py-10">
                    <div className={`rounded-2xl bg-white p-5 shadow-sm ${COLORS.ring}`}>
                        <h1 className="text-xl font-extrabold text-red-700">Error leyendo Supabase</h1>
                        <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-stone-50 p-3 text-xs ring-1 ring-stone-200">
                            {JSON.stringify({ message: error.message, details: (error as any).details }, null, 2)}
                        </pre>
                        <div className="mt-3 text-sm text-stone-700">
                            ID: <span className="font-mono">{id}</span>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    if (!exp || exp.is_published === false) return notFound();

    return (
        <div className={`${COLORS.bg} min-h-screen text-stone-900`}>
            <main className="mx-auto max-w-6xl px-4 pb-16 pt-10">
                {/* Breadcrumb simple */}
                <div className="text-sm text-stone-600">
                    <a className="hover:text-stone-900" href="/">
                        Inicio
                    </a>{" "}
                    <span className="mx-2">/</span>
                    <a className="hover:text-stone-900" href="/experiencias">
                        Experiencias
                    </a>{" "}
                    <span className="mx-2">/</span>
                    <span className="text-stone-900 font-semibold">Detalle</span>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Col principal */}
                    <section className="lg:col-span-2">
                        <div className={`overflow-hidden rounded-3xl ${COLORS.card} shadow-sm ${COLORS.ring}`}>
                            {/* Media (placeholder para video/galería) */}
                            <div className="relative h-64 bg-stone-200">
                                <div className="absolute left-4 top-4 rounded-full bg-white px-3 py-1 text-xs font-semibold ring-1 ring-stone-200">
                                    🏷️ {exp.category ?? "Experiencia"}
                                </div>
                            </div>

                            <div className="p-6">
                                <h1 className="text-3xl font-extrabold tracking-tight">{exp.title}</h1>
                                {exp.description ? (
                                    <p className="mt-3 text-sm leading-relaxed text-stone-700">{exp.description}</p>
                                ) : (
                                    <p className="mt-3 text-sm text-stone-600">
                                        (Descripción pendiente. Después la completamos con más detalle.)
                                    </p>
                                )}

                                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    <div className={`rounded-2xl bg-white p-4 shadow-sm ${COLORS.ring}`}>
                                        <div className="text-xs font-semibold text-stone-500">Ubicación</div>
                                        <div className="mt-1 text-sm font-extrabold">📍 {exp.location ?? "La Rioja"}</div>
                                    </div>

                                    <div className={`rounded-2xl bg-white p-4 shadow-sm ${COLORS.ring}`}>
                                        <div className="text-xs font-semibold text-stone-500">Duración</div>
                                        <div className="mt-1 text-sm font-extrabold">⏱ {durationLabel(Number(exp.duration_minutes ?? 0))}</div>
                                    </div>

                                    <div className={`rounded-2xl bg-white p-4 shadow-sm ${COLORS.ring}`}>
                                        <div className="text-xs font-semibold text-stone-500">Precio</div>
                                        <div className="mt-1 text-sm font-extrabold">
                                            💵 {formatARS(Number(exp.price_from ?? 0))}{" "}
                                            <span className="text-xs font-semibold text-stone-500">/ persona</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Disponibilidad (mock MVP) */}
                        <div className={`mt-6 rounded-3xl bg-white p-6 shadow-sm ${COLORS.ring}`} id="disponibilidad">
                            <h2 className="text-xl font-extrabold">Disponibilidad</h2>
                            <p className="mt-2 text-sm text-stone-600">
                                (MVP) Acá después conectamos: calendario, cupos, horarios y bloqueo de turnos.
                            </p>

                            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div className="rounded-2xl bg-stone-50 p-4 ring-1 ring-stone-200">
                                    <div className="text-sm font-semibold">📅 Fecha</div>
                                    <div className="mt-2 text-xs text-stone-600">Selector calendario (próximo paso)</div>
                                </div>
                                <div className="rounded-2xl bg-stone-50 p-4 ring-1 ring-stone-200">
                                    <div className="text-sm font-semibold">🕒 Horarios</div>
                                    <div className="mt-2 text-xs text-stone-600">Slots disponibles (próximo paso)</div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Col lateral (reserva) */}
                    <aside className="lg:col-span-1">
                        <div className={`sticky top-24 rounded-3xl bg-white p-6 shadow-sm ${COLORS.ring}`}>
                            <div className="text-sm font-extrabold">Reserva rápida</div>
                            <div className="mt-2 text-sm text-stone-600">
                                Precio por persona. Ajustamos total cuando elijas cantidad.
                            </div>

                            <div className="mt-5 space-y-3">
                                <div className="rounded-2xl bg-stone-50 p-4 ring-1 ring-stone-200">
                                    <div className="text-xs font-semibold text-stone-500">Personas</div>
                                    <div className="mt-1 text-sm font-extrabold">👤 1</div>
                                </div>

                                <div className="rounded-2xl bg-stone-50 p-4 ring-1 ring-stone-200">
                                    <div className="text-xs font-semibold text-stone-500">Total estimado</div>
                                    <div className="mt-1 text-sm font-extrabold">
                                        {formatARS(Number(exp.price_from ?? 0))}
                                    </div>
                                </div>

                                <button
                                    className="w-full rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-95"
                                    style={{ backgroundColor: COLORS.orange }}
                                >
                                    Reservar y pagar
                                </button>

                                <div className="text-xs text-stone-500">
                                    🔒 Pago seguro (Mercado Pago lo conectamos después).
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
}