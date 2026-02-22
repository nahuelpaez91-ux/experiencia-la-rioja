import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Page() {
  const COLORS = {
    bg: "bg-[#F3EEE6]",
    card: "bg-[#FAF6F0]",
    ring: "ring-1 ring-stone-200",
    orange: "#D07A2D",
    green: "#4E6B3A",
  };

  const nav = [
    { id: "inicio", label: "Inicio", href: "#inicio" },
    { id: "experiencias", label: "Experiencias", href: "#experiencias" },
    { id: "categorias", label: "Categorías", href: "#categorias" },
    { id: "ayuda", label: "Ayuda", href: "#ayuda" },
  ];

  const categories = [
    { id: "aventura", title: "Aventura", desc: "Descubrí experiencias en aventura." },
    { id: "naturaleza", title: "Naturaleza", desc: "Descubrí experiencias en naturaleza." },
    { id: "bienestar", title: "Bienestar", desc: "Descubrí experiencias en bienestar." },
    { id: "urbano", title: "Urbano", desc: "Descubrí experiencias en urbano." },
    { id: "sabores", title: "Sabores", desc: "Descubrí experiencias en sabores." },
    { id: "cultura", title: "Cultura", desc: "Descubrí experiencias en cultura." },
  ];

  // ✅ Traemos experiencias reales desde Supabase
  let featured: Array<{
    id: string;
    title: string;
    location: string;
    price_from: number;
    duration_minutes: number;
  }> = [];

  let featuredError: string | null = null;

  try {
    const { supabaseAdmin } = await import("@/lib/supabase/server");

    const { data, error } = await supabaseAdmin
      .from("experiences")
      .select("id, title, location, price_from, duration_minutes")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(8);

    if (error) featuredError = error.message;

    featured = (data ?? []).map((x: any) => ({
      id: x.id,
      title: x.title,
      location: x.location ?? "La Rioja",
      price_from: Number(x.price_from ?? 0),
      duration_minutes: Number(x.duration_minutes ?? 0),
    }));
  } catch (e: any) {
    featuredError = e?.message ?? "Error desconocido leyendo Supabase";
  }

  const steps = [
    { id: "buscar", title: "Buscá experiencias", desc: "Explorar por lugar, fecha y personas.", icon: "🔎" },
    { id: "elegir", title: "Elegí la experiencia", desc: "Mirá detalle y disponibilidad.", icon: "⭐" },
    { id: "pagar", title: "Reservá y pagá", desc: "Pago seguro y confirmación automática.", icon: "💳" },
    { id: "vivir", title: "Viví la experiencia", desc: "Asistí y dejá tu reseña.", icon: "🏞️" },
  ];

  const benefits = [
    { id: "seguro", title: "Pago seguro", desc: "Reserva online con confirmación automática.", icon: "🔒" },
    { id: "reales", title: "Lugares reales", desc: "Experiencias en puntos únicos de La Rioja.", icon: "🗺️" },
    { id: "locales", title: "Proveedores locales", desc: "Prestadores de la provincia, cerca tuyo.", icon: "🤝" },
  ];

  const formatARS = (n: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

  const durationLabel = (mins: number) => {
    if (!mins || mins <= 0) return "—";
    if (mins < 60) return `${mins} min`;
    const h = Math.round((mins / 60) * 10) / 10;
    return `${h} h`;
  };

  return (
    <div className={`${COLORS.bg} min-h-screen text-stone-900`} id="inicio">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-stone-200/70 bg-[#F3EEE6]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white shadow-sm ring-1 ring-stone-200" />
            <div className="leading-tight">
              <div className="font-semibold" style={{ color: COLORS.green, transform: "translateY(2px)" }}>
                Experiencia
              </div>
              <div className="text-lg font-extrabold" style={{ color: COLORS.orange }}>
                LA RIOJA
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="hidden items-center gap-8 text-sm text-stone-700 md:flex">
            {nav.map((n) => (
              <a key={n.id} href={n.href} className="font-medium hover:text-stone-900">
                {n.label}
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              className="rounded-full px-5 py-2 text-sm font-semibold shadow-sm ring-1 ring-stone-200 hover:opacity-95"
              style={{ backgroundColor: COLORS.green, color: "white" }}
            >
              Ingresar
            </button>
            <button
              className="rounded-full px-5 py-2 text-sm font-semibold shadow-sm hover:opacity-95"
              style={{ backgroundColor: COLORS.orange, color: "white" }}
            >
              Ofrecer experiencia
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-10">
        {/* HERO */}
        <section
          className={`relative overflow-hidden rounded-3xl ${COLORS.ring} bg-gradient-to-b from-stone-300 to-stone-500`}
          style={{ height: "560px" }}
        >
          <div className="absolute inset-0 opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-black/20" />

          <div className="relative flex h-full items-end">
            <div className="w-full p-8 md:p-10">
              <div className="mx-auto max-w-4xl text-center">
                <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl">
                  Viví experiencias únicas en La Rioja
                </h1>
                <p className="mt-3 text-base text-white/90 md:text-lg">
                  Descubrí la provincia a través de aventuras, sabores y paisajes inolvidables.
                </p>

                <div
                  className={`mx-auto mt-10 flex w-full flex-col gap-3 rounded-2xl ${COLORS.card} p-3 shadow-sm ${COLORS.ring} md:flex-row md:items-center`}
                >
                  <div className="flex flex-1 items-center gap-2 rounded-xl bg-white px-4 py-3 ring-1 ring-stone-200">
                    <span className="text-sm">📍</span>
                    <input
                      placeholder="¿A dónde?"
                      className="w-full bg-transparent text-sm outline-none placeholder:text-stone-500"
                    />
                  </div>

                  <div className="flex flex-1 items-center gap-2 rounded-xl bg-white px-4 py-3 ring-1 ring-stone-200">
                    <span className="text-sm">📅</span>
                    <input
                      placeholder="Fechas"
                      className="w-full bg-transparent text-sm outline-none placeholder:text-stone-500"
                    />
                  </div>

                  <div className="flex flex-1 items-center gap-2 rounded-xl bg-white px-4 py-3 ring-1 ring-stone-200">
                    <span className="text-sm">👤</span>
                    <input
                      placeholder="Personas"
                      className="w-full bg-transparent text-sm outline-none placeholder:text-stone-500"
                    />
                  </div>

                  <button
                    className="rounded-xl px-6 py-3 text-sm font-semibold shadow-sm hover:opacity-95"
                    style={{ backgroundColor: COLORS.orange, color: "white" }}
                  >
                    Buscar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categorías */}
        <section className="mt-12" id="categorias">
          <h2 className="text-2xl font-extrabold">Categorías</h2>
          <p className="mt-1 text-sm text-stone-600">
            Explorar La Rioja por tipo de experiencia. Elegí una categoría y descubrí las propuestas disponibles.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
            {categories.map((c) => (
              <div key={c.id} className={`overflow-hidden rounded-2xl ${COLORS.card} shadow-sm ${COLORS.ring}`}>
                <div className="h-28 bg-stone-200" />
                <div className="p-5">
                  <h3 className="text-base font-extrabold">{c.title}</h3>
                  <p className="mt-1 text-sm text-stone-600">{c.desc}</p>

                  <button
                    className="mt-4 w-full rounded-xl py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-95"
                    style={{ backgroundColor: COLORS.green }}
                  >
                    Ver experiencias
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Experiencias destacadas */}
        <section className="mt-12" id="experiencias">
          <h2 className="text-2xl font-extrabold">Experiencias destacadas</h2>
          <p className="mt-1 text-sm text-stone-600">Una selección recomendada por la plataforma.</p>

          {featuredError ? (
            <div className={`mt-6 rounded-2xl bg-white p-4 text-sm text-red-700 ${COLORS.ring}`}>
              Error leyendo experiencias: <span className="font-mono">{featuredError}</span>
            </div>
          ) : featured.length === 0 ? (
            <div className={`mt-6 rounded-2xl bg-white p-4 text-sm text-stone-700 ${COLORS.ring}`}>
              Todavía no hay experiencias publicadas. (is_published = true)
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-4">
              {featured.map((x) => (
                <div
                  key={x.id}
                  className={`relative overflow-hidden rounded-2xl ${COLORS.card} shadow-sm ${COLORS.ring}`}
                >
                  <div className="relative h-40 bg-stone-200">
                    <div className="absolute left-3 top-3 flex items-center gap-2">
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold ring-1 ring-stone-200">
                        📌 Destacada
                      </span>
                    </div>
                    <div className="absolute right-3 top-3">
                      <span className="rounded-full bg-stone-900/85 px-2.5 py-1 text-xs font-semibold text-white">
                        ⏱ {durationLabel(x.duration_minutes)}
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="text-base font-extrabold leading-snug">{x.title}</h3>

                    <div className="mt-3 space-y-1 text-sm text-stone-700">
                      <div className="flex items-center gap-2">
                        <span>📍</span>
                        <span>{x.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>💵</span>
                        <span>Desde {formatARS(x.price_from)}</span>
                      </div>
                    </div>

                    {/* ✅ Link real al detalle + ancla disponibilidad */}
                    <Link
                      href={`/experiencias/${x.id}#disponibilidad`}
                      className="mt-4 block w-full rounded-xl py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:opacity-95"
                      style={{ backgroundColor: COLORS.green }}
                    >
                      Ver disponibilidad
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Cómo funciona */}
        <section className="mt-14">
          <h2 className="text-center text-2xl font-extrabold">Cómo funciona</h2>

          <div className="mt-8 flex flex-col items-stretch justify-center gap-4 md:flex-row md:items-center">
            {steps.map((s, idx) => (
              <div key={s.id} className="flex items-center gap-4">
                <div className={`w-full rounded-2xl bg-white p-5 shadow-sm ${COLORS.ring} md:w-56`}>
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-stone-50 ring-1 ring-stone-200">
                      <span className="text-lg">{s.icon}</span>
                    </div>
                    <div>
                      <div className="text-sm font-extrabold">{s.title}</div>
                      <div className="mt-0.5 text-xs text-stone-600">{s.desc}</div>
                    </div>
                  </div>
                </div>

                {idx < steps.length - 1 && (
                  <div className="hidden select-none items-center md:flex">
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-white shadow-sm ring-1 ring-stone-200">
                      <span className="text-xl font-black text-stone-700">➜</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {benefits.map((b) => (
              <div key={b.id} className={`rounded-2xl bg-white p-5 shadow-sm ${COLORS.ring}`}>
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-stone-50 ring-1 ring-stone-200">
                    <span className="text-lg">{b.icon}</span>
                  </div>
                  <div>
                    <div className="text-sm font-extrabold">{b.title}</div>
                    <div className="mt-0.5 text-xs text-stone-600">{b.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <div className={`rounded-2xl bg-white p-5 shadow-sm ${COLORS.ring}`}>
            <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
              <div>
                <div className="text-base font-extrabold">¿Ofrecés experiencias en La Rioja?</div>
                <div className="mt-1 text-sm text-stone-600">
                  Publicá tu actividad, gestioná cupos y recibí reservas online.
                </div>
              </div>

              <button
                className="rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-95"
                style={{ backgroundColor: COLORS.orange }}
              >
                Ofrecer una experiencia
              </button>
            </div>
          </div>
        </section>

        <footer className="mt-14 border-t border-stone-200/70 pt-10">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            <div>
              <div className="text-sm font-extrabold">Experiencia La Rioja</div>
              <p className="mt-2 text-sm text-stone-600">Descubrí experiencias reales con proveedores verificados.</p>
            </div>

            <div>
              <div className="text-sm font-extrabold">Enlaces</div>
              <ul className="mt-2 space-y-1 text-sm text-stone-600">
                <li>
                  <a className="hover:text-stone-900" href="#categorias">
                    Categorías
                  </a>
                </li>
                <li>
                  <a className="hover:text-stone-900" href="#experiencias">
                    Experiencias
                  </a>
                </li>
                <li>
                  <a className="hover:text-stone-900" href="#ayuda">
                    Ayuda
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <div className="text-sm font-extrabold">Redes</div>
              <div className="mt-3 flex gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-white shadow-sm ring-1 ring-stone-200">
                  <span>📘</span>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-white shadow-sm ring-1 ring-stone-200">
                  <span>📸</span>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-white shadow-sm ring-1 ring-stone-200">
                  <span>🐦</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 pb-10 text-xs text-stone-500">
            © {new Date().getFullYear()} Experiencia La Rioja — Todos los derechos reservados.
          </div>
        </footer>
      </main>
    </div>
  );
}