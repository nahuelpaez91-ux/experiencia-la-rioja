export const dynamic = "force-dynamic";

type PageProps = {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const COLORS = {
    bg: "bg-[#F3EEE6]",
    card: "bg-[#FAF6F0]",
    ring: "ring-1 ring-stone-200",
    orange: "#D07A2D",
    green: "#4E6B3A",
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

function getOne(sp: Record<string, any>, key: string): string {
    const v = sp?.[key];
    if (Array.isArray(v)) return v[0] ?? "";
    return (v ?? "") as string;
}

export default async function ExperienciasPage({ searchParams }: PageProps) {
    const sp = (await searchParams) ?? {};

    const q = getOne(sp, "q");
    const category = getOne(sp, "category");
    const location = getOne(sp, "location");
    const sort = getOne(sp, "sort") || "recent"; // recent | price_asc | price_desc | duration_asc | duration_desc

    const { supabaseAdmin } = await import("@/lib/supabase/server");

    let query = supabaseAdmin
        .from("experiences")
        .select("id, title, location, price_from, duration_minutes, category, created_at")
        .eq("is_published", true);

    if (category) query = query.eq("category", category);
    if (location) query = query.ilike("location", `%${location}%`);
    if (q) query = query.ilike("title", `%${q}%`);

    if (sort === "price_asc") query = query.order("price_from", { ascending: true });
    else if (sort === "price_desc") query = query.order("price_from", { ascending: false });
    else if (sort === "duration_asc") query = query.order("duration_minutes", { ascending: true });
    else if (sort === "duration_desc") query = query.order("duration_minutes", { ascending: false });
    else query = query.order("created_at", { ascending: false });

    const { data, error } = await query.limit(48);

    return (
        <div className={`${COLORS.bg} min-h-screen text-stone-900`}>
            <header className="sticky top-0 z-50 border-b border-stone-200/70 bg-[#F3EEE6]/90 backdrop-blur">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
                    <a href="/" className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-white shadow-sm ring-1 ring-stone-200" />
                        <div className="leading-tight">
                            <div className="font-semibold" style={{ color: COLORS.green, transform: "translateY(2px)" }}>
                                Experiencia
                            </div>
                            <div className="text-lg font-extrabold" style={{ color: COLORS.orange }}>
                                LA RIOJA
                            </div>
                        </div>
                    </a>

                    <div className="text-sm font-semibold text-stone-700">Experiencias</div>
                </div>
            </header>

            <main className="mx-auto max-w-6xl px-4 pb-20 pt-10">
                <div className="flex flex-col gap-8 lg:flex-row">
                    {/* Sidebar filtros */}
                    <aside className="lg:w-72">
                        <div className={`rounded-3xl bg-white p-5 shadow-sm ${COLORS.ring}`}>
                            <div className="text-sm font-extrabold">Filtros</div>

                            <form className="mt-4 space-y-4" action="/experiencias" method="get">
                                <div>
                                    <div className="text-xs font-semibold text-stone-500">Buscar</div>
                                    <input
                                        name="q"
                                        defaultValue={q}
                                        placeholder="Ej: Cabalgata, Talampaya..."
                                        className="mt-2 w-full rounded-2xl bg-stone-50 px-4 py-3 text-sm ring-1 ring-stone-200 outline-none"
                                    />
                                </div>

                                <div>
                                    <div className="text-xs font-semibold text-stone-500">Ubicación</div>
                                    <input
                                        name="location"
                                        defaultValue={location}
                                        placeholder="Ej: Chilecito, Famatina..."
                                        className="mt-2 w-full rounded-2xl bg-stone-50 px-4 py-3 text-sm ring-1 ring-stone-200 outline-none"
                                    />
                                </div>

                                <div>
                                    <div className="text-xs font-semibold text-stone-500">Categoría</div>
                                    <select
                                        name="category"
                                        defaultValue={category}
                                        className="mt-2 w-full rounded-2xl bg-stone-50 px-4 py-3 text-sm ring-1 ring-stone-200 outline-none"
                                    >
                                        <option value="">Todas</option>
                                        {categories.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <div className="text-xs font-semibold text-stone-500">Ordenar</div>
                                    <select
                                        name="sort"
                                        defaultValue={sort}
                                        className="mt-2 w-full rounded-2xl bg-stone-50 px-4 py-3 text-sm ring-1 ring-stone-200 outline-none"
                                    >
                                        <option value="recent">Más recientes</option>
                                        <option value="price_asc">Precio (menor a mayor)</option>
                                        <option value="price_desc">Precio (mayor a menor)</option>
                                        <option value="duration_asc">Duración (menor a mayor)</option>
                                        <option value="duration_desc">Duración (mayor a menor)</option>
                                    </select>
                                </div>

                                <button
                                    className="w-full rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-95"
                                    style={{ backgroundColor: COLORS.green }}
                                >
                                    Aplicar
                                </button>

                                <a
                                    href="/experiencias"
                                    className="block w-full rounded-2xl px-5 py-3 text-center text-sm font-semibold shadow-sm ring-1 ring-stone-200 hover:opacity-95"
                                >
                                    Limpiar
                                </a>
                            </form>
                        </div>
                    </aside>

                    {/* Lista */}
                    <section className="flex-1">
                        <h1 className="text-2xl font-extrabold">Explorá experiencias</h1>
                        <p className="mt-1 text-sm text-stone-600">
                            Filtrá por categoría, ubicación, precio o duración. Estilo Booking, simple y premium.
                        </p>

                        {error ? (
                            <div className={`mt-6 rounded-2xl bg-white p-4 text-sm text-red-700 ${COLORS.ring}`}>
                                Error leyendo experiencias: <span className="font-mono">{error.message}</span>
                            </div>
                        ) : !data || data.length === 0 ? (
                            <div className={`mt-6 rounded-2xl bg-white p-4 text-sm text-stone-700 ${COLORS.ring}`}>
                                No hay resultados con esos filtros.
                            </div>
                        ) : (
                            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                                {data.map((x: any) => (
                                    <div
                                        key={x.id}
                                        className={`relative overflow-hidden rounded-3xl ${COLORS.card} shadow-sm ${COLORS.ring}`}
                                    >
                                        <div className="h-44 bg-stone-200" />

                                        <div className="p-5">
                                            <div className="flex items-start justify-between gap-4">
                                                <h3 className="text-base font-extrabold leading-snug">{x.title}</h3>

                                                <div className="text-right">
                                                    <div className="text-xs font-semibold text-stone-500">Precio</div>
                                                    <div className="text-sm font-extrabold">
                                                        {formatARS(Number(x.price_from ?? 0))}
                                                        <span className="text-xs font-semibold text-stone-500"> / persona</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-3 space-y-1 text-sm text-stone-700">
                                                <div className="flex items-center gap-2">
                                                    <span>📍</span>
                                                    <span>{x.location ?? "La Rioja"}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span>⏱</span>
                                                    <span>{durationLabel(Number(x.duration_minutes ?? 0))}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span>🏷️</span>
                                                    <span className="capitalize">{x.category ?? "—"}</span>
                                                </div>
                                            </div>

                                            <a
                                                href={`/experiencias/${x.id}`}
                                                className="mt-4 block w-full rounded-2xl py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:opacity-95"
                                                style={{ backgroundColor: COLORS.green }}
                                            >
                                                Ver disponibilidad
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}