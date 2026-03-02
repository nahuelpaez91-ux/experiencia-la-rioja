"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { localidades } from "@/app/lib/localidades-larioja";

const COLORS = {
  bg: "bg-[#F3EEE6]",
  card: "bg-[#FAF6F0]",
  ring: "ring-1 ring-stone-200",
  orange: "#D07A2D",
  green: "#4E6B3A",
};

const categories = [
  { id: "aventura", title: "Aventura", desc: "Descubrí experiencias en aventura.", emoji: "🧗" },
  { id: "naturaleza", title: "Naturaleza", desc: "Descubrí experiencias en naturaleza.", emoji: "🌿" },
  { id: "bienestar", title: "Bienestar", desc: "Descubrí experiencias en bienestar.", emoji: "🧘" },
  { id: "urbano", title: "Urbano", desc: "Descubrí experiencias en urbano.", emoji: "🏙️" },
  { id: "sabores", title: "Sabores", desc: "Descubrí experiencias en sabores.", emoji: "🍷" },
  { id: "cultura", title: "Cultura", desc: "Descubrí experiencias en cultura.", emoji: "🎭" },
];

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
  return `${Math.round((mins / 60) * 10) / 10} h`;
};

function StarRow({ rating, count }: { rating: number; count: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.3 && rating - full < 0.8;
  const nearFull = rating - full >= 0.8;
  const totalFull = nearFull ? full + 1 : full;
  const empty = 5 - totalFull - (half ? 1 : 0);
  const path = "M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <div style={{ display: "flex", gap: 1 }}>
        {Array.from({ length: totalFull }).map((_, i) => (
          <svg key={`f${i}`} width="13" height="13" viewBox="0 0 24 24" fill="#D07A2D"><path d={path} /></svg>
        ))}
        {half && (
          <svg width="13" height="13" viewBox="0 0 24 24">
            <defs><linearGradient id="hh"><stop offset="50%" stopColor="#D07A2D" /><stop offset="50%" stopColor="#E5DED5" /></linearGradient></defs>
            <path d={path} fill="url(#hh)" />
          </svg>
        )}
        {Array.from({ length: Math.max(0, empty) }).map((_, i) => (
          <svg key={`e${i}`} width="13" height="13" viewBox="0 0 24 24" fill="#E5DED5"><path d={path} /></svg>
        ))}
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: "#666" }}>{rating.toFixed(1)}</span>
      {count > 0 && <span style={{ fontSize: 10, color: "#aaa" }}>({count})</span>}
    </div>
  );
}

// ── Buscador del hero ──
function HeroSearch() {
  const router = useRouter();
  const [locationInput, setLocationInput] = useState("");
  const [locationSelected, setLocationSelected] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [fecha, setFecha] = useState("");
  const [personas, setPersonas] = useState("");
  const locRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (locRef.current && !locRef.current.contains(e.target as Node)) setShowSuggestions(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLocationInput = (val: string) => {
    setLocationInput(val);
    setLocationSelected("");
    if (!val.trim()) { setSuggestions([]); setShowSuggestions(false); return; }
    const q = val.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const matches = localidades.filter((l) => {
      const norm = l.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return norm.includes(q);
    });
    setSuggestions(matches);
    setShowSuggestions(true);
  };

  const handleSelect = (loc: string) => {
    setLocationInput(loc);
    setLocationSelected(loc);
    setShowSuggestions(false);
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    const loc = locationSelected || locationInput;
    if (loc) params.set("location", loc);
    if (fecha) params.set("fecha", fecha);
    if (personas) params.set("personas", personas);
    router.push(`/experiencias${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const fieldStyle = (active: boolean): React.CSSProperties => ({
    display: "flex", alignItems: "center", gap: 8,
    backgroundColor: "#fff", borderRadius: 12, padding: "10px 14px",
    border: active ? `1.5px solid ${COLORS.green}` : "1px solid #e7e2da",
    transition: "border-color 0.15s",
  });

  return (
    <div style={{
      margin: "0 auto", marginTop: 28, width: "100%", maxWidth: 860,
      backgroundColor: "rgba(250,246,240,0.97)", borderRadius: 20,
      padding: "10px 12px", display: "flex", gap: 8, alignItems: "center",
      boxShadow: "0 4px 24px rgba(0,0,0,0.12)", flexWrap: "wrap",
    }}>
      {/* Localidad con autocompletado */}
      <div ref={locRef} style={{ flex: "1 1 200px", position: "relative" }}>
        <div style={fieldStyle(!!locationSelected)}>
          <span style={{ fontSize: 14, flexShrink: 0 }}>📍</span>
          <input
            value={locationInput}
            onChange={(e) => handleLocationInput(e.target.value)}
            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
            placeholder="¿A dónde?"
            autoComplete="off"
            style={{ width: "100%", background: "none", border: "none", outline: "none", fontSize: 13, color: "#333" }}
          />
          {locationInput && (
            <button type="button" onClick={() => { setLocationInput(""); setLocationSelected(""); setSuggestions([]); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#bbb", fontSize: 18, padding: 0, lineHeight: 1, flexShrink: 0 }}>×</button>
          )}
        </div>

        {/* Dropdown — posición fixed para no ser cortado */}
        {showSuggestions && (
          <div style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
            backgroundColor: "#fff", border: "1px solid #e7e2da", borderRadius: 14,
            boxShadow: "0 8px 32px rgba(0,0,0,0.14)", zIndex: 9999,
            maxHeight: 220, overflowY: "auto",
          }}>
            {suggestions.length > 0 ? suggestions.map((loc) => (
              <button key={loc} type="button" onClick={() => handleSelect(loc)}
                style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 14px", background: "none", border: "none", borderBottom: "1px solid #f0ece6", cursor: "pointer", fontSize: 13, color: "#333" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f5f0ea")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                📍 {loc}
              </button>
            )) : (
              <div style={{ padding: "12px 14px", fontSize: 13, color: "#888" }}>
                No encontramos "{locationInput}" en La Rioja
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fecha */}
      <div style={{ flex: "1 1 160px", ...fieldStyle(!!fecha) }}>
        <span style={{ fontSize: 14, flexShrink: 0 }}>📅</span>
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
          min={new Date().toISOString().split("T")[0]}
          style={{ width: "100%", background: "none", border: "none", outline: "none", fontSize: 13, color: fecha ? "#333" : "#888", cursor: "pointer" }} />
      </div>

      {/* Personas */}
      <div style={{ flex: "1 1 130px", ...fieldStyle(!!personas) }}>
        <span style={{ fontSize: 14, flexShrink: 0 }}>👤</span>
        <input type="number" min="1" max="99" value={personas} onChange={(e) => setPersonas(e.target.value)}
          placeholder="Personas"
          style={{ width: "100%", background: "none", border: "none", outline: "none", fontSize: 13, color: "#333" }} />
      </div>

      {/* Botón */}
      <button onClick={handleSearch} style={{
        flexShrink: 0, backgroundColor: COLORS.orange, color: "#fff", border: "none",
        borderRadius: 12, padding: "11px 24px", fontSize: 14, fontWeight: 700,
        cursor: "pointer", whiteSpace: "nowrap",
      }}>
        Buscar
      </button>
    </div>
  );
}

function FeaturedSlider({ items }: { items: any[] }) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setCurrent((c) => (c + 1) % items.length), 3500);
  };

  useEffect(() => {
    if (items.length < 2) return;
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [items.length]);

  if (items.length === 0) return (
    <div className="mt-6 rounded-2xl bg-white p-4 text-sm text-stone-700 ring-1 ring-stone-200">Todavía no hay experiencias publicadas.</div>
  );

  const visibleCount = Math.min(4, items.length);
  const visible = Array.from({ length: visibleCount }, (_, i) => items[(current + i) % items.length]);

  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", gap: 16, marginTop: 20, overflowX: "auto", paddingBottom: 4 }}>
        {visible.map((x, idx) => (
          <div key={`${x.id}-${idx}`} style={{ flex: "0 0 260px", backgroundColor: "#FAF6F0", borderRadius: 18, border: "1px solid #e7e2da", overflow: "hidden", opacity: idx === 0 ? 1 : 0.9, transition: "opacity 0.4s" }}>
            <div style={{ height: 160, backgroundColor: "#D9D3CB", position: "relative", overflow: "hidden" }}>
              {x.cover_image_url
                ? <img src={x.cover_image_url} alt={x.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>🏔️</div>
              }
              <span style={{ position: "absolute", top: 10, left: 10, backgroundColor: "rgba(255,255,255,0.95)", borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>📌 Destacada</span>
              <span style={{ position: "absolute", top: 10, right: 10, backgroundColor: "rgba(0,0,0,0.65)", borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 600, color: "#fff" }}>⏱ {durationLabel(x.duration_minutes)}</span>
            </div>
            <div style={{ padding: "14px 16px" }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, margin: "0 0 6px", lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{x.title}</h3>
              {x.rating_avg
                ? <div style={{ marginBottom: 8 }}><StarRow rating={x.rating_avg} count={x.rating_count ?? 0} /></div>
                : <div style={{ fontSize: 10, color: "#bbb", marginBottom: 8 }}>Sin reseñas aún</div>
              }
              <div style={{ fontSize: 12, color: "#777", marginBottom: 12 }}>
                <div>📍 {x.location}</div>
                <div style={{ marginTop: 3, fontWeight: 700, color: COLORS.green }}>Desde {formatARS(x.price_from)}</div>
              </div>
              <Link href={`/experiencias/${x.id}`} style={{ display: "block", borderRadius: 10, padding: "9px 0", textAlign: "center", fontSize: 13, fontWeight: 700, color: "#fff", backgroundColor: COLORS.green, textDecoration: "none" }}>
                Ver disponibilidad
              </Link>
            </div>
          </div>
        ))}
      </div>
      {items.length > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 14 }}>
          {items.map((_, i) => (
            <button key={i} onClick={() => { setCurrent(i); startTimer(); }}
              style={{ width: i === current ? 20 : 8, height: 8, borderRadius: 999, border: "none", cursor: "pointer", backgroundColor: i === current ? COLORS.orange : "#D9D3CB", transition: "all 0.3s", padding: 0 }} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Page() {
  const [featured, setFeatured] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/featured")
      .then((r) => r.json())
      .then((d) => { setFeatured(d.data ?? []); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  return (
    <div className={`${COLORS.bg} min-h-screen text-stone-900`} id="inicio">
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-10">

        {/* HERO */}
        <section className={`relative overflow-hidden rounded-3xl ${COLORS.ring} bg-gradient-to-b from-stone-300 to-stone-500`} style={{ height: "520px" }}>
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
                <HeroSearch />
              </div>
            </div>
          </div>
        </section>

        {/* EXPERIENCIAS DESTACADAS */}
        <section className="mt-12" id="experiencias-destacadas">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h2 className="text-2xl font-extrabold">Experiencias destacadas</h2>
              <p className="mt-1 text-sm text-stone-600">Una selección recomendada por la plataforma.</p>
            </div>
            <Link href="/experiencias" style={{ backgroundColor: "#fff", color: COLORS.green, border: `1.5px solid ${COLORS.green}`, borderRadius: 12, padding: "9px 20px", fontSize: 13, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}>
              Ver todas las experiencias →
            </Link>
          </div>
          {!loaded ? (
            <div className="mt-6 text-sm text-stone-400">Cargando...</div>
          ) : (
            <FeaturedSlider items={featured} />
          )}
        </section>

        {/* CATEGORÍAS */}
        <section className="mt-14" id="categorias">
          <h2 className="text-2xl font-extrabold">Categorías</h2>
          <p className="mt-1 text-sm text-stone-600">Explorá La Rioja por tipo de experiencia.</p>
          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
            {categories.map((c) => (
              <div key={c.id} className={`overflow-hidden rounded-2xl ${COLORS.card} shadow-sm ${COLORS.ring}`}>
                <div className="h-28 bg-stone-200 flex items-center justify-center" style={{ fontSize: 40 }}>{c.emoji}</div>
                <div className="p-5">
                  <h3 className="text-base font-extrabold">{c.title}</h3>
                  <p className="mt-1 text-sm text-stone-600">{c.desc}</p>
                  <Link href={`/experiencias?category=${c.id}`} className="mt-4 block w-full rounded-xl py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:opacity-95"
                    style={{ backgroundColor: COLORS.green, textDecoration: "none" }}>
                    Ver experiencias
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CÓMO FUNCIONA */}
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

        {/* CTA PROVEEDOR */}
        <section className="mt-10">
          <div className={`rounded-2xl bg-white p-5 shadow-sm ${COLORS.ring}`}>
            <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
              <div>
                <div className="text-base font-extrabold">¿Ofrecés experiencias en La Rioja?</div>
                <div className="mt-1 text-sm text-stone-600">Publicá tu actividad, gestioná cupos y recibí reservas online.</div>
              </div>
              <Link href="/auth/login" className="rounded-xl font-semibold text-white shadow-sm hover:opacity-95"
                style={{ backgroundColor: COLORS.orange, padding: "12px 24px", fontSize: 14, textDecoration: "none" }}>
                Ofrecer una experiencia
              </Link>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="mt-14 border-t border-stone-200/70 pt-12">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
            <div className="md:col-span-1">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: COLORS.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🏔️</div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.green }}>Experiencia</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.orange }}>LA RIOJA</div>
                </div>
              </div>
              <p className="text-sm text-stone-500" style={{ lineHeight: 1.6 }}>Plataforma de experiencias turísticas locales en La Rioja, Argentina.</p>
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                {["📘", "📸", "🐦"].map((icon, i) => (
                  <div key={i} className="grid h-9 w-9 place-items-center rounded-xl bg-white shadow-sm ring-1 ring-stone-200 cursor-pointer hover:opacity-80">
                    <span style={{ fontSize: 15 }}>{icon}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-sm font-extrabold mb-3">Explorar</div>
              <ul className="space-y-2 text-sm text-stone-500">
                <li><Link href="/experiencias" style={{ textDecoration: "none", color: "inherit" }}>Todas las experiencias</Link></li>
                <li><Link href="/#categorias" style={{ textDecoration: "none", color: "inherit" }}>Categorías</Link></li>
                <li><Link href="/experiencias?category=aventura" style={{ textDecoration: "none", color: "inherit" }}>Aventura</Link></li>
                <li><Link href="/experiencias?category=naturaleza" style={{ textDecoration: "none", color: "inherit" }}>Naturaleza</Link></li>
                <li><Link href="/experiencias?category=sabores" style={{ textDecoration: "none", color: "inherit" }}>Sabores</Link></li>
              </ul>
            </div>
            <div>
              <div className="text-sm font-extrabold mb-3">Tu cuenta</div>
              <ul className="space-y-2 text-sm text-stone-500">
                <li><Link href="/auth/login" style={{ textDecoration: "none", color: "inherit" }}>Iniciar sesión</Link></li>
                <li><Link href="/auth/login" style={{ textDecoration: "none", color: "inherit" }}>Registrarse</Link></li>
                <li><Link href="/mis-reservas" style={{ textDecoration: "none", color: "inherit" }}>Mis reservas</Link></li>
                <li><Link href="/proveedor" style={{ textDecoration: "none", color: "inherit" }}>Panel proveedor</Link></li>
              </ul>
            </div>
            <div>
              <div className="text-sm font-extrabold mb-3">Ayuda</div>
              <ul className="space-y-2 text-sm text-stone-500">
                <li><Link href="/ayuda" style={{ textDecoration: "none", color: "inherit" }}>Centro de ayuda</Link></li>
                <li><Link href="/ayuda#seccion-0" style={{ textDecoration: "none", color: "inherit" }}>Guía para usuarios</Link></li>
                <li><Link href="/ayuda#seccion-1" style={{ textDecoration: "none", color: "inherit" }}>Guía para proveedores</Link></li>
                <li><Link href="/ayuda#seccion-2" style={{ textDecoration: "none", color: "inherit" }}>Términos y condiciones</Link></li>
              </ul>
            </div>
          </div>
          <div style={{ marginTop: 40, paddingTop: 20, borderTop: "1px solid #e7e2da", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <p className="text-xs text-stone-400">© {new Date().getFullYear()} Experiencia La Rioja. Plataforma de intermediación turística.</p>
            <div style={{ display: "flex", gap: 16 }}>
              <Link href="/ayuda#seccion-2" style={{ fontSize: 12, color: "#aaa", textDecoration: "none" }}>Términos</Link>
              <Link href="/ayuda#seccion-2" style={{ fontSize: 12, color: "#aaa", textDecoration: "none" }}>Privacidad</Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}