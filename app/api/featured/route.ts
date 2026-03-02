import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const { supabaseAdmin } = await import("@/lib/supabase/server");

        const [{ data: exps, error }, { data: rawRatings }] = await Promise.all([
            supabaseAdmin
                .from("experiences")
                .select("id, title, location, price_from, duration_minutes, cover_image_url")
                .eq("is_published", true)
                .order("created_at", { ascending: false })
                .limit(8),
            supabaseAdmin.from("reviews").select("experience_id, rating"),
        ]);

        if (error) return NextResponse.json({ error: error.message });

        // Calcular ratings
        const ratingsMap: Record<string, { avg: number; count: number }> = {};
        for (const r of rawRatings ?? []) {
            if (!ratingsMap[r.experience_id]) ratingsMap[r.experience_id] = { avg: 0, count: 0 };
            ratingsMap[r.experience_id].count += 1;
            ratingsMap[r.experience_id].avg += r.rating;
        }
        for (const key of Object.keys(ratingsMap)) {
            ratingsMap[key].avg = Math.round((ratingsMap[key].avg / ratingsMap[key].count) * 10) / 10;
        }

        const data = (exps ?? []).map((x: any) => ({
            id: x.id,
            title: x.title,
            location: x.location ?? "La Rioja",
            price_from: Number(x.price_from ?? 0),
            duration_minutes: Number(x.duration_minutes ?? 0),
            cover_image_url: x.cover_image_url ?? null,
            rating: ratingsMap[x.id]?.avg ?? null,
            rating_count: ratingsMap[x.id]?.count ?? 0,
        }));

        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message ?? "Error desconocido" });
    }
}